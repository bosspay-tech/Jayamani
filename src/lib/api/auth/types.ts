export interface RegisterBody {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
}
