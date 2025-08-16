import { BaseEntity, BlockchainTransaction } from './index';

export interface Product extends BaseEntity {
  name: string;
  description: string;
  category: ProductCategory;
  batchNumber: string;
  expiryDate: string;
  currentStage: ProductStage;
  currentOwner: string;
  currentLocation: string;
  isActive: boolean;
  parentProductId?: string;
  qrCode?: string;
  images: string[];
  documents: ProductDocument[];
  blockchain: {
    productId: number;
    contractAddress: string;
    transactionHash: string;
  };
}

export enum ProductStage {
  CREATED = 0,
  RAW_MATERIAL = 1,
  MANUFACTURING = 2,
  QUALITY_CONTROL = 3,
  PACKAGING = 4,
  DISTRIBUTION = 5,
  RETAIL = 6,
  SOLD = 7,
  RECALLED = 8
}

export enum ProductCategory {
  FOOD = 'food',
  PHARMACEUTICAL = 'pharmaceutical',
  ELECTRONICS = 'electronics',
  TEXTILES = 'textiles',
  AUTOMOTIVE = 'automotive',
  CHEMICALS = 'chemicals',
  OTHER = 'other'
}

export interface ProductDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  verified: boolean;
}

export enum DocumentType {
  CERTIFICATE = 'certificate',
  TEST_REPORT = 'test_report',
  COMPLIANCE = 'compliance',
  INVOICE = 'invoice',
  SHIPPING = 'shipping',
  OTHER = 'other'
}

export interface ProductHistory {
  id: string;
  productId: string;
  action: ProductAction;
  fromOwner?: string;
  toOwner?: string;
  fromLocation?: string;
  toLocation?: string;
  stage?: ProductStage;
  timestamp: string;
  transactionHash: string;
  notes?: string;
  performedBy: string;
}

export enum ProductAction {
  CREATED = 'created',
  TRANSFERRED = 'transferred',
  STAGE_UPDATED = 'stage_updated',
  QUALITY_CHECKED = 'quality_checked',
  RECALLED = 'recalled',
  EXPIRED = 'expired'
}

export interface QualityCheck {
  id: string;
  productId: string;
  checkType: QualityCheckType;
  passed: boolean;
  notes: string;
  inspector: string;
  timestamp: string;
  parameters?: QualityParameter[];
  documents?: string[];
}

export enum QualityCheckType {
  VISUAL_INSPECTION = 'visual_inspection',
  WEIGHT_CHECK = 'weight_check',
  TEMPERATURE_CHECK = 'temperature_check',
  CHEMICAL_ANALYSIS = 'chemical_analysis',
  MICROBIOLOGICAL = 'microbiological',
  COMPLIANCE_CHECK = 'compliance_check',
  PACKAGING_INTEGRITY = 'packaging_integrity',
  LABELING_CHECK = 'labeling_check'
}

export interface QualityParameter {
  name: string;
  value: number;
  unit: string;
  expectedRange: {
    min: number;
    max: number;
  };
  passed: boolean;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: ProductCategory;
  batchNumber: string;
  expiryDate: string;
  initialLocation: string;
  images?: File[];
  documents?: File[];
}

export interface TransferProductData {
  productId: string;
  newOwner: string;
  newLocation: string;
  notes?: string;
}

export interface BatchTransferData {
  productIds: string[];
  newOwner: string;
  newLocation: string;
  newStage: ProductStage;
  notes?: string;
}

export interface ProductFilter {
  category?: ProductCategory[];
  stage?: ProductStage[];
  owner?: string[];
  location?: string[];
  batchNumber?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  isActive?: boolean;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  productsByStage: Record<ProductStage, number>;
  productsByCategory: Record<ProductCategory, number>;
  productsCreatedToday: number;
  averageTransitTime: number;
  qualityCheckPassRate: number;
}

export interface ProductTimeline {
  events: ProductTimelineEvent[];
  totalEvents: number;
}

export interface ProductTimelineEvent {
  id: string;
  type: ProductAction;
  title: string;
  description: string;
  timestamp: string;
  location?: string;
  participant?: string;
  transactionHash?: string;
  icon: string;
  color: string;
}

export interface QRCodeData {
  productId: string;
  verificationUrl: string;
  timestamp: string;
  signature: string;
}

export interface ProductVerification {
  isAuthentic: boolean;
  product: Product;
  history: ProductHistory[];
  qualityChecks: QualityCheck[];
  currentOwnership: {
    owner: string;
    since: string;
    verified: boolean;
  };
  warnings: string[];
}