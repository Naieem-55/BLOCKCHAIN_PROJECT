import { PaginatedResponse } from './index';

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
  path?: string;
  timestamp: string;
  validationErrors?: Array<{
    field?: string;
    message?: string;
    msg?: string;
    param?: string;
    value?: any;
  }>;
}

// Pagination and filtering
export interface ApiPaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ApiFilter {
  [key: string]: any;
}

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: string;
  company?: string;
  location?: string;
  termsAccepted: boolean;
}

export interface AuthResponse {
  user: any;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Product API types
export interface CreateProductRequest {
  name: string;
  description: string;
  category: string;
  batchNumber: string;
  expiryDate: string;
  initialLocation: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  expiryDate?: string;
}

export interface TransferProductRequest {
  newOwner: string;
  newLocation: string;
  notes?: string;
}

export interface BatchTransferRequest {
  productIds: string[];
  newOwner: string;
  newLocation: string;
  newStage: number;
  notes?: string;
}

export interface QualityCheckRequest {
  checkType: string;
  passed: boolean;
  notes: string;
  parameters?: Array<{
    name: string;
    value: number;
    unit: string;
    expectedRange: {
      min: number;
      max: number;
    };
    passed: boolean;
  }>;
}

// Participant API types
export interface CreateParticipantRequest {
  name: string;
  role: string;
  email: string;
  company: string;
  location: string;
  contactPerson: string;
  phone: string;
  website?: string;
  walletAddress?: string;
}

export interface UpdateParticipantRequest {
  name?: string;
  company?: string;
  location?: string;
  contactPerson?: string;
  phone?: string;
  website?: string;
}

export interface InviteParticipantRequest {
  email: string;
  role: string;
  message?: string;
}

// IoT Sensor API types
export interface CreateSensorRequest {
  name: string;
  type: string;
  description: string;
  location: string;
  specifications: {
    range: {
      min: number;
      max: number;
      unit: string;
    };
    accuracy: number;
    resolution: number;
    operatingTemperature: {
      min: number;
      max: number;
    };
    powerRequirement: string;
    communicationProtocol: string[];
  };
  thresholds: Array<{
    parameter: string;
    minValue: number;
    maxValue: number;
    unit: string;
    alertLevel: string;
    description?: string;
  }>;
}

export interface RecordSensorDataRequest {
  sensorId: string;
  productId?: string;
  value: number;
  unit: string;
  additionalData?: Record<string, any>;
}

export interface BatchSensorDataRequest {
  sensorIds: string[];
  productIds: string[];
  values: number[];
  units: string[];
  additionalData: (Record<string, any> | null)[];
}

export interface UpdateSensorThresholdRequest {
  parameter: string;
  minValue: number;
  maxValue: number;
  unit: string;
  alertLevel: string;
  isActive: boolean;
}

export interface ResolveAlertRequest {
  alertId: string;
  resolution: string;
}

// Analytics API types
export interface DashboardStatsResponse {
  totalProducts: number;
  activeProducts: number;
  totalParticipants: number;
  activeSensors: number;
  recentTransactions: number;
  qualityScore: number;
  networkHealth: number;
  alertsToday: number;
}

export interface ProductAnalyticsRequest {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  groupBy?: 'day' | 'week' | 'month';
  metrics?: string[];
}

export interface ProductAnalyticsResponse {
  totalProducts: number;
  productsByStage: Record<string, number>;
  productsByCategory: Record<string, number>;
  transactionVolume: Array<{
    date: string;
    count: number;
    value?: number;
  }>;
  qualityMetrics: {
    totalChecks: number;
    passRate: number;
    failuresByType: Record<string, number>;
  };
  geographicalDistribution: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
}

export interface SensorAnalyticsRequest {
  sensorIds?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  metrics?: string[];
}

export interface SensorAnalyticsResponse {
  totalReadings: number;
  averageReadingFrequency: number;
  dataQualityScore: number;
  alertMetrics: {
    totalAlerts: number;
    criticalAlerts: number;
    resolvedAlerts: number;
    avgResolutionTime: number;
  };
  sensorPerformance: Array<{
    sensorId: string;
    name: string;
    uptime: number;
    accuracy: number;
    lastReading: string;
  }>;
  trendAnalysis: Array<{
    metric: string;
    trend: 'up' | 'down' | 'stable';
    changePercentage: number;
    period: string;
  }>;
}

export interface ParticipantAnalyticsResponse {
  totalParticipants: number;
  participantsByRole: Record<string, number>;
  participantsByLocation: Record<string, number>;
  networkMetrics: {
    connections: number;
    averageTrustScore: number;
    networkDensity: number;
  };
  activityMetrics: {
    dailyActiveUsers: number;
    avgSessionDuration: number;
    transactionsPerUser: number;
  };
  performanceRankings: Array<{
    participantId: string;
    name: string;
    score: number;
    rank: number;
    category: string;
  }>;
}

// File upload types
export interface FileUploadRequest {
  file: File;
  type: 'image' | 'document' | 'certificate';
  category?: string;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  fileId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
  timestamp: string;
  eventId?: string;
}

export enum WebSocketMessageType {
  PRODUCT_CREATED = 'product_created',
  PRODUCT_TRANSFERRED = 'product_transferred',
  PRODUCT_UPDATED = 'product_updated',
  SENSOR_DATA = 'sensor_data',
  ALERT_TRIGGERED = 'alert_triggered',
  ALERT_RESOLVED = 'alert_resolved',
  PARTICIPANT_REGISTERED = 'participant_registered',
  QUALITY_CHECK_ADDED = 'quality_check_added',
  BATCH_PROCESSED = 'batch_processed',
  SYSTEM_NOTIFICATION = 'system_notification',
  CONNECTION_STATUS = 'connection_status'
}

// Search and filtering
export interface SearchRequest {
  query: string;
  filters?: {
    type?: ('product' | 'participant' | 'sensor')[];
    category?: string[];
    location?: string[];
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  suggestions?: string[];
  facets?: SearchFacet[];
}

export interface SearchResult {
  id: string;
  type: 'product' | 'participant' | 'sensor';
  title: string;
  description: string;
  url: string;
  metadata: Record<string, any>;
  relevanceScore: number;
  highlightedFields?: Record<string, string>;
}

export interface SearchFacet {
  field: string;
  values: Array<{
    value: string;
    count: number;
    selected: boolean;
  }>;
}

// Blockchain integration types
export interface BlockchainTransactionRequest {
  operation: string;
  parameters: Record<string, any>;
  gasLimit?: number;
  gasPrice?: string;
}

export interface BlockchainTransactionResponse {
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: number;
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
}

export interface ContractCallRequest {
  contractName: string;
  methodName: string;
  parameters: any[];
  isReadOnly: boolean;
}

export interface ContractCallResponse {
  result: any;
  gasUsed?: number;
  transactionHash?: string;
  events?: ContractEvent[];
}

export interface ContractEvent {
  eventName: string;
  parameters: Record<string, any>;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

// Notification types
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  alerts: {
    productTransfers: boolean;
    qualityIssues: boolean;
    sensorAlerts: boolean;
    systemUpdates: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

export interface SendNotificationRequest {
  recipients: string[];
  type: 'email' | 'push' | 'sms';
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

// Export/Import types
export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  type: 'products' | 'participants' | 'sensors' | 'analytics';
  filters?: Record<string, any>;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  fields?: string[];
}

export interface ExportResponse {
  downloadUrl: string;
  filename: string;
  size: number;
  expiresAt: string;
  format: string;
}

export interface ImportRequest {
  file: File;
  type: 'products' | 'participants' | 'sensors';
  mapping: Record<string, string>;
  options: {
    skipDuplicates: boolean;
    validateData: boolean;
    dryRun: boolean;
  };
}

export interface ImportResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
}