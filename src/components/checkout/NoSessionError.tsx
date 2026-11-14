import { ResultMessage } from "./ResultMessage";

export function NoSessionError() {
  return (
    <ResultMessage
      icon="alert"
      title="Nothing to show here"
      message="This page confirms a purchase after checkout. Your orders are all in one place."
      primary={{ href: "/orders", label: "Check orders" }}
      secondary={{ href: "/new-in", label: "Continue shopping" }}
    />
  );
}
