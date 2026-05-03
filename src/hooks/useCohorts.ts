import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserContext } from "./useUserContext";

export interface Cohort {
  id: string;
  workspace_id: string;
  name: string;
  invite_code: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CohortStudent {
  enrolled_at: string;
  students: {
    id: string;
    user_id: string;
    display_name: string | null;
  };
}

export function useCohorts() {
  const { activeWorkspace, isCoach } = useUserContext();
  return useQuery({
    queryKey: ["cohorts", activeWorkspace?.id],
    enabled: !!activeWorkspace && isCoach,
    queryFn: async (): Promise<Cohort[]> => {
      const { data, error } = await supabase
        .from("cohorts")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Cohort[];
    },
  });
}

export function useCohort(cohortId: string | undefined) {
  const cohortQuery = useQuery({
    queryKey: ["cohort", cohortId],
    enabled: !!cohortId,
    queryFn: async (): Promise<Cohort> => {
      const { data, error } = await supabase
        .from("cohorts")
        .select("*")
        .eq("id", cohortId!)
        .single();
      if (error) throw error;
      return data as Cohort;
    },
  });

  const studentsQuery = useQuery({
    queryKey: ["cohort-students", cohortId],
    enabled: !!cohortId,
    queryFn: async (): Promise<CohortStudent[]> => {
      const { data, error } = await supabase
        .from("cohort_students")
        .select("enrolled_at, students(id, user_id, display_name)")
        .eq("cohort_id", cohortId!)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CohortStudent[];
    },
  });

  return {
    cohort: cohortQuery.data,
    students: studentsQuery.data ?? [],
    loading: cohortQuery.isLoading || studentsQuery.isLoading,
    error: cohortQuery.error ?? studentsQuery.error,
    refetch: () => {
      cohortQuery.refetch();
      studentsQuery.refetch();
    },
  };
}
