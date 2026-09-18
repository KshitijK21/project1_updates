import apiClient from "./client";
import {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  PasswordResetRequestPayload,
  PasswordResetPayload,
  VerifyEmailPayload,
  VerifyEmailResponse,
} from "@/types/auth";

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function registerRequest(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>("/auth/register", payload);
  return data;
}

export async function requestPasswordReset(
  payload: PasswordResetRequestPayload
): Promise<{ message: string }> {
  const { data } = await apiClient.post("/auth/password-reset-request", payload);
  return data;
}

export async function resetPassword(payload: PasswordResetPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post("/auth/password-reset", payload);
  return data;
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<VerifyEmailResponse> {
  const { data } = await apiClient.post("/auth/verify-email", payload);
  return data;
}