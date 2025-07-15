export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  code: string;
}

export interface SignupRequest {
  email: string;
  code: string;
  source?: string;
  educationLevel?: string;
} 