import { apiRequest } from './api';
import { 
  Product, 
  ProductFormData, 
  TransferProductData, 
  BatchTransferData,
  QualityCheck,
  ProductHistory,
  ProductFilter,
  ProductStats,
  ProductVerification,
  QRCodeData
} from '../types/product';
import { PaginatedResponse } from '../types';

class ProductService {
  // Product CRUD operations
  async getProducts(params: {
    page?: number;
    limit?: number;
    filters?: ProductFilter;
    search?: string;
  } = {}): Promise<PaginatedResponse<Product>> {
    return apiRequest.get<PaginatedResponse<Product>>('/products', params);
  }

  async getProductById(productId: string): Promise<Product> {
    return apiRequest.get<Product>(`/products/${productId}`);
  }

  async createProduct(productData: ProductFormData): Promise<Product> {
    const formData = new FormData();
    
    // Add basic product data
    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'images' && key !== 'documents') {
        formData.append(key, String(value));
      }
    });

    // Add images
    if (productData.images) {
      productData.images.forEach((image, index) => {
        formData.append(`images`, image);
      });
    }

    // Add documents
    if (productData.documents) {
      productData.documents.forEach((document, index) => {
        formData.append(`documents`, document);
      });
    }

    return apiRequest.upload<Product>('/products', formData);
  }

  async updateProduct(productId: string, productData: Partial<ProductFormData>): Promise<Product> {
    return apiRequest.put<Product>(`/products/${productId}`, productData);
  }

  async deleteProduct(productId: string): Promise<void> {
    return apiRequest.delete(`/products/${productId}`);
  }

  // Product operations
  async transferProduct(productId: string, transferData: TransferProductData): Promise<Product> {
    return apiRequest.post<Product>(`/products/${productId}/transfer`, transferData);
  }

  async batchTransferProducts(batchData: BatchTransferData): Promise<Product[]> {
    return apiRequest.post<Product[]>('/products/batch-transfer', batchData);
  }

  async updateProductStage(productId: string, stage: number): Promise<Product> {
    return apiRequest.patch<Product>(`/products/${productId}/stage`, { stage });
  }

  // Quality control
  async addQualityCheck(productId: string, qualityData: any): Promise<QualityCheck> {
    return apiRequest.post<QualityCheck>(`/products/${productId}/quality-checks`, qualityData);
  }

  async getProductQualityChecks(productId: string): Promise<QualityCheck[]> {
    return apiRequest.get<QualityCheck[]>(`/products/${productId}/quality-checks`);
  }

  async updateQualityCheck(productId: string, checkId: string, updateData: any): Promise<QualityCheck> {
    return apiRequest.put<QualityCheck>(`/products/${productId}/quality-checks/${checkId}`, updateData);
  }

  async deleteQualityCheck(productId: string, checkId: string): Promise<void> {
    return apiRequest.delete(`/products/${productId}/quality-checks/${checkId}`);
  }

  // Product history and traceability
  async getProductHistory(productId: string): Promise<ProductHistory[]> {
    return apiRequest.get<ProductHistory[]>(`/products/${productId}/history`);
  }

  async getProductTimeline(productId: string): Promise<any> {
    return apiRequest.get(`/products/${productId}/timeline`);
  }

  async verifyProduct(productId: string): Promise<ProductVerification> {
    return apiRequest.get<ProductVerification>(`/products/${productId}/verify`);
  }

  async verifyProductByQR(qrData: string): Promise<ProductVerification> {
    return apiRequest.post<ProductVerification>('/products/verify-qr', { qrData });
  }

  // QR Code operations
  async generateQRCode(productId: string): Promise<{ qrCode: string; qrData: QRCodeData }> {
    return apiRequest.post(`/products/${productId}/qr-code`);
  }

  async getQRCodeData(productId: string): Promise<QRCodeData> {
    return apiRequest.get<QRCodeData>(`/products/${productId}/qr-data`);
  }

  // Product analytics and statistics
  async getProductStats(): Promise<ProductStats> {
    return apiRequest.get<ProductStats>('/products/stats');
  }

  async getProductsByCategory(): Promise<Record<string, number>> {
    return apiRequest.get('/products/stats/by-category');
  }

  async getProductsByStage(): Promise<Record<string, number>> {
    return apiRequest.get('/products/stats/by-stage');
  }

  async getProductsByLocation(): Promise<Record<string, number>> {
    return apiRequest.get('/products/stats/by-location');
  }

  // Product relationships
  async getProductChildren(productId: string): Promise<Product[]> {
    return apiRequest.get<Product[]>(`/products/${productId}/children`);
  }

  async getProductParent(productId: string): Promise<Product | null> {
    return apiRequest.get<Product | null>(`/products/${productId}/parent`);
  }

  async linkProducts(parentId: string, childIds: string[]): Promise<void> {
    return apiRequest.post(`/products/${parentId}/link`, { childIds });
  }

  async unlinkProducts(parentId: string, childIds: string[]): Promise<void> {
    return apiRequest.post(`/products/${parentId}/unlink`, { childIds });
  }

  // Batch operations
  async getBatchProducts(batchNumber: string): Promise<Product[]> {
    return apiRequest.get<Product[]>(`/products/batch/${batchNumber}`);
  }

  async getBatchStats(batchNumber: string): Promise<any> {
    return apiRequest.get(`/products/batch/${batchNumber}/stats`);
  }

  async recallBatch(batchNumber: string, reason: string): Promise<Product[]> {
    return apiRequest.post<Product[]>(`/products/batch/${batchNumber}/recall`, { reason });
  }

  // Product search and filtering
  async searchProducts(query: string, filters?: ProductFilter): Promise<Product[]> {
    return apiRequest.get<Product[]>('/products/search', { query, ...filters });
  }

  async getProductSuggestions(query: string): Promise<string[]> {
    return apiRequest.get<string[]>('/products/suggestions', { query });
  }

  async getFilterOptions(): Promise<{
    categories: string[];
    stages: string[];
    locations: string[];
    owners: string[];
  }> {
    return apiRequest.get('/products/filter-options');
  }

  // Product documents and images
  async uploadProductImage(productId: string, image: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', image);
    return apiRequest.upload(`/products/${productId}/images`, formData);
  }

  async deleteProductImage(productId: string, imageUrl: string): Promise<void> {
    return apiRequest.delete(`/products/${productId}/images`, { imageUrl });
  }

  async uploadProductDocument(productId: string, document: File, type: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('document', document);
    formData.append('type', type);
    return apiRequest.upload(`/products/${productId}/documents`, formData);
  }

  async deleteProductDocument(productId: string, documentId: string): Promise<void> {
    return apiRequest.delete(`/products/${productId}/documents/${documentId}`);
  }

  // Export and reporting
  async exportProducts(filters?: ProductFilter, format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<{ downloadUrl: string }> {
    return apiRequest.post('/products/export', { filters, format });
  }

  async generateProductReport(productId: string, format: 'pdf' | 'html' = 'pdf'): Promise<{ downloadUrl: string }> {
    return apiRequest.post(`/products/${productId}/report`, { format });
  }

  async generateBatchReport(batchNumber: string, format: 'pdf' | 'html' = 'pdf'): Promise<{ downloadUrl: string }> {
    return apiRequest.post(`/products/batch/${batchNumber}/report`, { format });
  }

  // Compliance and auditing
  async getComplianceStatus(productId: string): Promise<{
    isCompliant: boolean;
    issues: string[];
    lastChecked: string;
  }> {
    return apiRequest.get(`/products/${productId}/compliance`);
  }

  async runComplianceCheck(productId: string): Promise<{
    isCompliant: boolean;
    issues: string[];
    checkedAt: string;
  }> {
    return apiRequest.post(`/products/${productId}/compliance/check`);
  }

  async getAuditLog(productId: string): Promise<any[]> {
    return apiRequest.get(`/products/${productId}/audit-log`);
  }

  // Product alerts and notifications
  async setProductAlert(productId: string, alertConfig: {
    type: string;
    threshold?: number;
    notificationMethods: string[];
  }): Promise<void> {
    return apiRequest.post(`/products/${productId}/alerts`, alertConfig);
  }

  async getProductAlerts(productId: string): Promise<any[]> {
    return apiRequest.get(`/products/${productId}/alerts`);
  }

  async deleteProductAlert(productId: string, alertId: string): Promise<void> {
    return apiRequest.delete(`/products/${productId}/alerts/${alertId}`);
  }
}

export const productService = new ProductService();
export default productService;