import { BaseEntity } from './index';

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  location?: string;
  walletAddress?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  permissions: Permission[];
  profileComplete: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  SUPPLIER = 'supplier',
  MANUFACTURER = 'manufacturer',
  DISTRIBUTOR = 'distributor',
  RETAILER = 'retailer',
  AUDITOR = 'auditor',
  CONSUMER = 'consumer',
  PRODUCER = 'producer'
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: UserRole;
  company?: string;
  location?: string;
  termsAccepted: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: Permission[];
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  token: string;
  expiresIn: number;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  name?: string;
  company?: string;
  location?: string;
  avatar?: File;
  walletAddress?: string | undefined;
}

export interface WalletConnection {
  address: string;
  network: string;
  balance: string;
  isConnected: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  connectWallet: () => Promise<WalletConnection>;
  disconnectWallet: () => void;
  hasPermission: (resource: string, action: string) => boolean;
}