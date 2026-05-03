import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

interface InvitePayload {
  cohort_id: string;
  emails: string[];
  modules: string[];
}

interface InviteResult {
  email: string;
  status: "invited" | "error";
  error?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "missing auth" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonResponse({ error: "invalid auth" }, 401);

    const body = (await req.json()) as InvitePayload;
    const { cohort_id, emails, modules } = body;

    if (!cohort_id || !Array.isArray(emails) || !Array.isArray(modules)) {
      return jsonResponse({ error: "invalid payload" }, 400);
    }

    // Verify caller is coach/admin of the cohort's workspace
    const { data: cohort, error: cohortErr } = await admin
      .from("cohorts")
      .select("workspace_id")
      .eq("id", cohort_id)
      .single();
    if (cohortErr || !cohort) return jsonResponse({ error: "cohort not found" }, 404);

    const { data: membership } = await admin
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", cohort.workspace_id)
      .eq("user_id", user.id)
      .single();
    if (
      !membership ||
      (membership.role !== "admin" && membership.role !== "coach")
    ) {
      return jsonResponse({ error: "not authorized" }, 403);
    }

    const origin = req.headers.get("origin") ?? "https://360bizthinker.vercel.app";
    const redirectTo = `${origin}/auth/callback`;

    const results: InviteResult[] = [];

    for (const raw of emails) {
      const email = String(raw).trim().toLowerCase();
      if (!email) continue;

      try {
        // Try invite (creates user if new)
        let userId: string | undefined;
        const { data: invited, error: inviteErr } = await admin.auth.admin
          .inviteUserByEmail(email, { redirectTo });

        if (invited?.user?.id) {
          userId = invited.user.id;
        } else {
          const errMsg = inviteErr?.message ?? "";
          // User exists → fall back to looking up by email + sending OTP
          if (/already.*registered|already.*exists|email_exists/i.test(errMsg)) {
            const { error: otpErr } = await admin.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
            });
            if (otpErr) throw otpErr;

            const { data: list } = await admin.auth.admin.listUsers({
              page: 1,
              perPage: 1000,
            });
            const existing = list?.users.find(
              (u) => u.email?.toLowerCase() === email,
            );
            if (!existing) throw new Error("could not find existing user");
            userId = existing.id;
          } else {
            throw new Error(errMsg || "invite failed");
          }
        }

        if (!userId) throw new Error("no user_id");

        // Resolve students.id (created by trigger)
        const { data: student, error: stuErr } = await admin
          .from("students")
          .select("id")
          .eq("user_id", userId)
          .single();
        if (stuErr || !student) throw new Error("students row missing");

        // Add to workspace as student (idempotent)
        await admin.from("workspace_members").upsert({
          workspace_id: cohort.workspace_id,
          user_id: userId,
          role: "student",
          invited_by: user.id,
        });

        // Add to cohort
        await admin.from("cohort_students").upsert({
          cohort_id,
          student_id: student.id,
        });

        // Grant module access
        if (modules.length > 0) {
          await admin.from("student_module_access").upsert(
            modules.map((m) => ({
              student_id: student.id,
              workspace_id: cohort.workspace_id,
              module_type: m,
              source: "cohort",
              source_ref: cohort_id,
              is_enabled: true,
            })),
            { onConflict: "student_id,workspace_id,module_type" },
          );
        }

        results.push({ email, status: "invited" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ email, status: "error", error: msg });
      }
    }

    return jsonResponse({ results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: msg }, 500);
  }
});
