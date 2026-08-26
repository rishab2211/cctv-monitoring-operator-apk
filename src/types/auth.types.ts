export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'franchise'
  | 'franchise_admin'
  | 'operator'
  | 'technician'
  | 'customer';

export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface OperatorDetails {
  shiftStart?: string;
  shiftEnd?: string;
  isOnShift?: boolean;
  assignedFranchise?: string; // MongoDB ObjectId
  assignedCameras?: string[]; // Array of camera ObjectIds
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string | null;
  address?: UserAddress | null;
  operatorDetails?: OperatorDetails;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface DeviceSession {
  _id: string;
  sessionId: string;
  deviceName?: string;
  deviceType?: 'android' | 'ios' | 'desktop' | 'web';
  os?: string;
  browser?: string;
  ipAddress?: string;
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface ForgotPasswordResponse {
  maskedEmail: string;
}

export interface VerifyOTPResponse {
  resetToken: string;
}
