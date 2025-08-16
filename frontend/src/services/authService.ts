import { apiRequest } from './api';
import { 
  LoginCredentials, 
  RegisterData, 
  User, 
  UpdateProfileData, 
  ChangePasswordData,
  WalletConnection,
  LoginResponse 
} from '../types/auth';

declare global {
  interface Window {
    ethereum?: any;
  }
}

class AuthService {
  // Authentication
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiRequest.post<LoginResponse>('/auth/login', credentials);
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    return apiRequest.post<LoginResponse>('/auth/register', userData);
  }

  async logout(): Promise<void> {
    try {
      await apiRequest.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, remove local token
      console.warn('Logout request failed:', error);
    } finally {
      localStorage.removeItem('token');
    }
  }

  async getCurrentUser(): Promise<User> {
    return apiRequest.get<User>('/auth/profile');
  }

  async refreshToken(): Promise<{ token: string; expiresIn: number }> {
    return apiRequest.post('/auth/refresh');
  }

  // Profile management
  async updateProfile(profileData: UpdateProfileData): Promise<User> {
    const formData = new FormData();
    
    Object.entries(profileData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'avatar' && value instanceof File) {
          formData.append('avatar', value);
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return apiRequest.upload<User>('/auth/profile', formData);
  }

  async changePassword(passwordData: ChangePasswordData): Promise<void> {
    return apiRequest.post('/auth/change-password', passwordData);
  }

  async forgotPassword(email: string): Promise<void> {
    return apiRequest.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    return apiRequest.post('/auth/reset-password', { token, password });
  }

  // Wallet integration
  async connectWallet(): Promise<WalletConnection> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      // Get network info
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      // Get balance
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest'],
      });

      // Convert balance from wei to ether
      const balanceInEther = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);

      const connection: WalletConnection = {
        address: accounts[0],
        network: this.getNetworkName(chainId),
        balance: balanceInEther,
        isConnected: true,
      };

      // Update user profile with wallet address
      try {
        await this.updateProfile({ walletAddress: accounts[0] });
      } catch (error) {
        console.warn('Failed to update profile with wallet address:', error);
      }

      return connection;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('Wallet connection was rejected by user.');
      } else if (error.code === -32002) {
        throw new Error('Wallet connection request is already pending. Please check MetaMask.');
      } else {
        throw new Error(`Failed to connect wallet: ${error.message}`);
      }
    }
  }

  async disconnectWallet(): Promise<void> {
    // Update user profile to remove wallet address
    try {
      await this.updateProfile({ walletAddress: undefined });
    } catch (error) {
      console.warn('Failed to remove wallet address from profile:', error);
    }
  }

  async switchNetwork(chainId: string): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed.');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to MetaMask
        throw new Error('Network not added to MetaMask. Please add it manually.');
      } else {
        throw new Error(`Failed to switch network: ${error.message}`);
      }
    }
  }

  async addNetwork(networkConfig: any): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed.');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });
    } catch (error: any) {
      throw new Error(`Failed to add network: ${error.message}`);
    }
  }

  // Utility methods
  private getNetworkName(chainId: string): string {
    const networks: Record<string, string> = {
      '0x1': 'Mainnet',
      '0x3': 'Ropsten',
      '0x4': 'Rinkeby',
      '0x5': 'Goerli',
      '0x539': 'Local',
      '0x89': 'Polygon',
      '0xa': 'Optimism',
      '0xa4b1': 'Arbitrum',
    };
    return networks[chainId] || `Unknown (${chainId})`;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }

  // Permission helpers
  hasPermission(resource: string, action: string, permissions: string[]): boolean {
    return permissions.some(permission => {
      const [res, actions] = permission.split(':');
      return res === resource && actions.split(',').includes(action);
    });
  }

  // Social authentication (future implementation)
  async loginWithGoogle(): Promise<LoginResponse> {
    throw new Error('Google authentication not implemented yet');
  }

  async loginWithGitHub(): Promise<LoginResponse> {
    throw new Error('GitHub authentication not implemented yet');
  }

  // Two-factor authentication (future implementation)
  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    return apiRequest.post('/auth/2fa/enable');
  }

  async disableTwoFactor(token: string): Promise<void> {
    return apiRequest.post('/auth/2fa/disable', { token });
  }

  async verifyTwoFactor(token: string): Promise<void> {
    return apiRequest.post('/auth/2fa/verify', { token });
  }

  // Session management
  async getSessions(): Promise<Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>> {
    return apiRequest.get('/auth/sessions');
  }

  async revokeSession(sessionId: string): Promise<void> {
    return apiRequest.delete(`/auth/sessions/${sessionId}`);
  }

  async revokeAllSessions(): Promise<void> {
    return apiRequest.delete('/auth/sessions');
  }
}

export const authService = new AuthService();
export default authService;