import { BaseEntity } from './index';

export interface Sensor extends BaseEntity {
  sensorId: string;
  name: string;
  type: SensorType;
  description: string;
  owner: string;
  location: string;
  isActive: boolean;
  lastReading?: string;
  batteryLevel?: number;
  firmware: string;
  calibrationData: CalibrationData;
  thresholds: SensorThreshold[];
  blockchain: {
    contractAddress: string;
    registrationHash: string;
  };
  specifications: SensorSpecifications;
}

export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  PRESSURE = 'pressure',
  LOCATION = 'location',
  SHOCK = 'shock',
  LIGHT = 'light',
  PH = 'ph',
  OXYGEN = 'oxygen',
  CO2 = 'co2',
  MOTION = 'motion',
  CUSTOM = 'custom'
}

export interface CalibrationData {
  lastCalibrated: string;
  calibratedBy: string;
  calibrationCertificate?: string;
  nextCalibrationDue: string;
  calibrationMethod: string;
  accuracy: number;
  precision: number;
}

export interface SensorThreshold {
  id: string;
  parameter: string;
  minValue: number;
  maxValue: number;
  unit: string;
  alertLevel: AlertLevel;
  isActive: boolean;
  description?: string;
}

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency'
}

export interface SensorSpecifications {
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
  ipRating?: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
}

export interface SensorReading extends BaseEntity {
  sensorId: string;
  productId?: string;
  value: number;
  unit: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  additionalData?: Record<string, any>;
  quality: ReadingQuality;
  blockchain: {
    transactionHash: string;
    blockNumber: number;
  };
}

export enum ReadingQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  INVALID = 'invalid'
}

export interface SensorAlert extends BaseEntity {
  sensorId: string;
  productId?: string;
  alertType: AlertType;
  severity: AlertLevel;
  message: string;
  triggerValue: number;
  threshold: SensorThreshold;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  notificationsSent: NotificationRecord[];
}

export enum AlertType {
  THRESHOLD_VIOLATION = 'threshold_violation',
  SENSOR_OFFLINE = 'sensor_offline',
  BATTERY_LOW = 'battery_low',
  CALIBRATION_DUE = 'calibration_due',
  COMMUNICATION_ERROR = 'communication_error',
  TAMPERING_DETECTED = 'tampering_detected',
  DATA_ANOMALY = 'data_anomaly'
}

export interface NotificationRecord {
  method: NotificationMethod;
  recipient: string;
  sentAt: string;
  status: NotificationStatus;
  errorMessage?: string;
}

export enum NotificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  SLACK = 'slack'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced'
}

export interface SensorFormData {
  name: string;
  type: SensorType;
  description: string;
  location: string;
  specifications: Partial<SensorSpecifications>;
  thresholds: Omit<SensorThreshold, 'id'>[];
  calibrationData?: Partial<CalibrationData>;
}

export interface BatchSensorData {
  sensorIds: string[];
  productIds: string[];
  values: number[];
  units: string[];
  additionalData: (Record<string, any> | null)[];
}

export interface SensorFilter {
  type?: SensorType[];
  owner?: string[];
  location?: string[];
  isActive?: boolean;
  hasAlerts?: boolean;
  batteryLevel?: {
    min: number;
    max: number;
  };
  lastReadingRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface SensorAnalytics {
  totalSensors: number;
  activeSensors: number;
  sensorsByType: Record<SensorType, number>;
  alertsToday: number;
  averageReadingFrequency: number;
  dataQualityScore: number;
  networkHealth: NetworkHealth;
  performanceMetrics: SensorPerformanceMetrics;
}

export interface NetworkHealth {
  onlinePercentage: number;
  communicationQuality: number;
  batteryHealthAverage: number;
  calibrationCompliance: number;
  dataIntegrityScore: number;
}

export interface SensorPerformanceMetrics {
  uptimePercentage: number;
  avgResponseTime: number;
  dataAccuracy: number;
  falseAlertRate: number;
  maintenanceFrequency: number;
}

export interface SensorDashboard {
  realtimeReadings: RealtimeReading[];
  activeAlerts: SensorAlert[];
  networkStatus: NetworkStatus;
  trendingMetrics: TrendingMetric[];
  recommendations: SensorRecommendation[];
}

export interface RealtimeReading {
  sensorId: string;
  sensorName: string;
  type: SensorType;
  currentValue: number;
  unit: string;
  timestamp: string;
  status: SensorStatus;
  trend: 'up' | 'down' | 'stable';
}

export enum SensorStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  WARNING = 'warning',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export interface NetworkStatus {
  totalSensors: number;
  onlineSensors: number;
  offlineSensors: number;
  sensorsWithAlerts: number;
  networkLatency: number;
  dataIngestionRate: number;
}

export interface TrendingMetric {
  metric: string;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
}

export interface SensorRecommendation {
  id: string;
  type: IoTRecommendationType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  sensorIds: string[];
  actionRequired: string;
  estimatedSavings?: string;
}

export enum IoTRecommendationType {
  CALIBRATION = 'calibration',
  MAINTENANCE = 'maintenance',
  REPLACEMENT = 'replacement',
  OPTIMIZATION = 'optimization',
  RELOCATION = 'relocation',
  THRESHOLD_ADJUSTMENT = 'threshold_adjustment'
}

export interface SensorMap {
  sensors: SensorMapPoint[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  clusters: SensorCluster[];
}

export interface SensorMapPoint {
  sensorId: string;
  name: string;
  type: SensorType;
  latitude: number;
  longitude: number;
  status: SensorStatus;
  lastReading?: SensorReading;
  alertCount: number;
}

export interface SensorCluster {
  latitude: number;
  longitude: number;
  sensorCount: number;
  alertCount: number;
  avgStatus: SensorStatus;
}