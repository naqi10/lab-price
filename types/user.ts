// ---------------------------------------------------------------------------
// User, Auth & Session Types
// ---------------------------------------------------------------------------

export type UserRole = "ADMIN" | "USER";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLoginAt: Date | null;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
