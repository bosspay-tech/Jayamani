import type { LoginBody, RegisterBody } from "./types";

export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Invalid email address";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
}

export function validateRegisterBody(body: RegisterBody): string | null {
  if (!body.fullName?.trim()) return "Full name is required";
  const emailError = validateEmail(body.email);
  if (emailError) return emailError;
  return validatePassword(body.password);
}

export function validateLoginBody(body: LoginBody): string | null {
  const emailError = validateEmail(body.email);
  if (emailError) return emailError;
  return validatePassword(body.password);
}
