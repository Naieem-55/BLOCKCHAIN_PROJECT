import { BaseEntity } from './index';
import { UserRole } from './auth';

export interface Participant extends BaseEntity {
  name: string;
  role: UserRole;
  walletAddress: string;
  email: string;
  company: string;
  location: string;
  contactPerson: string;
  phone: string;
  website?: string;
  isActive: boolean;
  isVerified: boolean;
  verificationDate?: string;
  certifications: Certification[];
  blockchain: {
    participantId: number;
    contractAddress: string;
    registrationHash: string;
  };
  stats: ParticipantStats;
}

export interface Certification {
  id: string;
  name: string;
  type: CertificationType;
  issuedBy: string;
  issuedDate: string;
  expiryDate?: string;
  certificateUrl?: string;
  verified: boolean;
  description?: string;
}

export enum CertificationType {
  ISO = 'iso',
  HACCP = 'haccp',
  ORGANIC = 'organic',
  FDA = 'fda',
  CE = 'ce',
  GMP = 'gmp',
  HALAL = 'halal',
  KOSHER = 'kosher',
  FAIR_TRADE = 'fair_trade',
  CUSTOM = 'custom'
}

export interface ParticipantStats {
  totalProducts: number;
  activeProducts: number;
  completedTransfers: number;
  qualityScore: number;
  avgResponseTime: number; // in minutes
  lastActivity: string;
  monthlyVolume: number;
  complianceRate: number;
}

export interface ParticipantFormData {
  name: string;
  role: UserRole;
  email: string;
  company: string;
  location: string;
  contactPerson: string;
  phone: string;
  website?: string;
  walletAddress?: string;
}

export interface ParticipantVerificationData {
  participantId: string;
  documents: File[];
  notes: string;
  verificationLevel: VerificationLevel;
}

export enum VerificationLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export interface ParticipantFilter {
  role?: UserRole[];
  location?: string[];
  isActive?: boolean;
  isVerified?: boolean;
  verificationLevel?: VerificationLevel[];
  registrationDateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface ParticipantNetwork {
  participants: ParticipantNode[];
  connections: ParticipantConnection[];
  metrics: NetworkMetrics;
}

export interface ParticipantNode {
  id: string;
  name: string;
  role: UserRole;
  location: string;
  transactionCount: number;
  trustScore: number;
  isActive: boolean;
}

export interface ParticipantConnection {
  from: string;
  to: string;
  weight: number;
  transactionCount: number;
  lastInteraction: string;
  relationshipType: RelationshipType;
}

export enum RelationshipType {
  SUPPLIER = 'supplier',
  CUSTOMER = 'customer',
  PARTNER = 'partner',
  SUBCONTRACTOR = 'subcontractor',
  DISTRIBUTOR = 'distributor'
}

export interface NetworkMetrics {
  totalParticipants: number;
  activeConnections: number;
  averageTrustScore: number;
  networkDensity: number;
  centralityMetrics: {
    mostConnected: string;
    mostTrusted: string;
    mostActive: string;
  };
}

export interface ParticipantActivity {
  id: string;
  participantId: string;
  activityType: ActivityType;
  description: string;
  timestamp: string;
  relatedEntityId?: string;
  relatedEntityType?: 'product' | 'participant' | 'sensor';
  metadata?: Record<string, any>;
}

export enum ActivityType {
  REGISTRATION = 'registration',
  PRODUCT_CREATED = 'product_created',
  PRODUCT_TRANSFERRED = 'product_transferred',
  QUALITY_CHECK = 'quality_check',
  SENSOR_REGISTERED = 'sensor_registered',
  CERTIFICATION_ADDED = 'certification_added',
  PROFILE_UPDATED = 'profile_updated',
  VERIFICATION_REQUEST = 'verification_request'
}

export interface ParticipantAnalytics {
  performanceMetrics: {
    transactionVolume: ChartData[];
    qualityScoreTrend: ChartData[];
    responseTimeTrend: ChartData[];
    complianceRate: ChartData[];
  };
  comparativeAnalysis: {
    industryAverage: number;
    peerRanking: number;
    totalPeers: number;
    strengths: string[];
    improvements: string[];
  };
  recommendations: Recommendation[];
}

export interface ChartData {
  label: string;
  value: number;
  timestamp: string;
}

export interface Recommendation {
  id: string;
  type: ParticipantRecommendationType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionItems: string[];
  estimatedImpact: string;
}

export enum ParticipantRecommendationType {
  PROCESS_IMPROVEMENT = 'process_improvement',
  QUALITY_ENHANCEMENT = 'quality_enhancement',
  COMPLIANCE = 'compliance',
  EFFICIENCY = 'efficiency',
  COST_REDUCTION = 'cost_reduction',
  SUSTAINABILITY = 'sustainability'
}

export interface ParticipantInvitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string;
  message?: string;
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}