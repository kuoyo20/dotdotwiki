import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "./useUserContext";

export interface Company {
  id: string;
  workspace_id: string;
  owner_student_id: string;
  name: string;
  industry: string | null;
  size_band: string | null;
  company_type: "own" | "client";
  client_of_company_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanies() {
  const { user, activeWorkspace } = useUserContext();
  return useQuery({
    queryKey: ["companies", user?.id, activeWorkspace?.id],
    enabled: !!user && !!activeWorkspace,
    queryFn: async (): Promise<Company[]> => {
      const { data, error } = await supabase
        .from("companies")
        .select(
          "id, workspace_id, owner_student_id, name, industry, size_band, company_type, client_of_company_id, description, created_at, updated_at",
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Company[];
    },
  });
}

export function useCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<Company> => {
      const { data, error } = await supabase
        .from("companies")
        .select(
          "id, workspace_id, owner_student_id, name, industry, size_band, company_type, client_of_company_id, description, created_at, updated_at",
        )
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data as Company;
    },
  });
}
