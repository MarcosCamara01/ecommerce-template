"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion } from "motion/react";
import { ReactNode, useState } from "react";

import { InputModality } from "@/components/ui/input-modality";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
        staleTime: 1000 * 60 * 5,
      },
    },
  });
}

const loadMotionFeatures = () =>
  import("@/lib/motion-features").then((module) => module.default);

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={loadMotionFeatures} strict>
        <InputModality />
        {children}
      </LazyMotion>
    </QueryClientProvider>
  );
}
