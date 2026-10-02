import { ResultMessage } from "./ResultMessage";

export function NoSessionError() {
  return (
    <ResultMessage
      icon="alert"
      title="No Session ID Found"
      message="Please make sure you accessed this page after completing a purchase."
      primary={{ href: "/orders", label: "Check orders" }}
      secondary={{ href: "/new-in", label: "Continue shopping" }}
    />
  );
}
