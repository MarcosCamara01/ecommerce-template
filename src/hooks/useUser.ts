"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

const USER_QUERY_KEY = ["user"] as const;

export const useUser = () => {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createClient(), []);

  const query = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      return session?.user ?? null;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(USER_QUERY_KEY, session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  return {
    user: query.data ?? null,
    loading: query.isLoading,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Error desconocido"
      : null,
    isAuthenticated: !!query.data,
    refetch: query.refetch,
  };
};
