// Main type exports for the supply chain traceability system
export * from './auth';
export * from './product';
export * from './participant';
export * from './iot';
export * from './api';

// Common types used throughout the application
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  validationErrors?: ValidationError[];
  timestamp?: string;
  path?: string;
}

export interface ValidationError {
  field?: string;
  message?: string;
  msg?: string;
  param?: string;
  value?: any;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  timestamp?: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface FilterOptions {
  dateRange?: DateRange;
  status?: string[];
  category?: string[];
  location?: string[];
  participant?: string[];
}

// Blockchain specific types
export interface BlockchainTransaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string;
  gasUsed: number;
  gasPrice: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface Web3Config {
  providerUrl: string;
  networkId: number;
  contractAddresses: {
    supplyChainTraceability: string;
    iotIntegration: string;
    accessControl: string;
  };
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: any;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}