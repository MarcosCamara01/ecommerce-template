import { ReactNode } from "react";

interface ResultCardProps {
  children: ReactNode;
  variant?: "default" | "tertiary";
}

export function ResultCard({ children, variant = "default" }: ResultCardProps) {
  const bg = variant === "tertiary" ? "bg-background-tertiary" : "bg-background-secondary";
  
  return (
    <div className={`p-4 border border-solid rounded-lg ${bg} border-border-primary`}>
      {children}
    </div>
  );
}

interface ResultCardHeaderProps {
  children: ReactNode;
  padded?: boolean;
}

export function ResultCardHeader({ children, padded }: ResultCardHeaderProps) {
  return (
    <div className={padded ? "p-6" : ""}>
      {children}
    </div>
  );
}
