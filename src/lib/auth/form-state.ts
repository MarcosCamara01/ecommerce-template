import { type AuthErrorCode, authErrorMessage } from "./form-errors.ts";

export type AuthFailure = Readonly<{ code: AuthErrorCode; message: string; attempt: number }>;

export type SignUpState =
  | Readonly<{ step: "form"; failure: AuthFailure | null; name: string; email: string }>
  | Readonly<{ step: "check-email"; email: string }>;

export const SIGN_UP_START: SignUpState = { step: "form", failure: null, name: "", email: "" };

export function nextFailure(previous: AuthFailure | null, code: AuthErrorCode): AuthFailure {
  return { code, message: authErrorMessage(code), attempt: (previous?.attempt ?? 0) + 1 };
}
