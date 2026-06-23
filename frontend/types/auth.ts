// Backend pode usar 'student' em vez de 'scholar', 'professor' em vez de 'teacher'
export type Role = 'scholar' | 'student' | 'teacher' | 'professor' | 'admin';

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  createdAt: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: Exclude<Role, 'admin'>;
}

export class AuthError extends Error {
  constructor(
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_CREDENTIALS' | 'USER_EXISTS',
    message: string
  ) {
    super(message);
  }
}
