export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  is_verified?: boolean;
}

export interface RegisterResponse {
  message: string;
  user_id: string;
  email: string;
  access_token: string;
  token_type: string;
  role: string;
  is_verified?: boolean;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetPayload {
  email: string;
  code: string;
  new_password: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  message: string;
  email: string;
  is_verified: boolean;
}

export interface ApiError {
  detail: string;
}