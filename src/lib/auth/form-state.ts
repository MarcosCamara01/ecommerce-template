import { type AuthErrorCode, authErrorMessage } from "./form-errors.ts";

export type AuthFailure = Readonly<{ code: AuthErrorCode; message: string; attempt: number }>;

export type SignUpState =
  | Readonly<{ step: "form"; failure: AuthFailure | null; name: string; email: string }>
  | Readonly<{ step: "check-email"; email: string }>;

export type ForgotPasswordState =
  | Readonly<{ step: "form"; failure: AuthFailure | null; email: string }>
  | Readonly<{ step: "sent"; email: string }>;

export type ResetPasswordState =
  | Readonly<{ step: "form"; failure: AuthFailure | null }>
  | Readonly<{ step: "expired" }>
  | Readonly<{ step: "done" }>;

export const SIGN_UP_START: SignUpState = { step: "form", failure: null, name: "", email: "" };
export const FORGOT_PASSWORD_START: ForgotPasswordState = { step: "form", failure: null, email: "" };
export const RESET_PASSWORD_START: ResetPasswordState = { step: "form", failure: null };

export function nextFailure(previous: AuthFailure | null, code: AuthErrorCode): AuthFailure {
  return { code, message: authErrorMessage(code), attempt: (previous?.attempt ?? 0) + 1 };
}
