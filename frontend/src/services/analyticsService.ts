import { apiRequest } from './api';

class AnalyticsService {
  async getDashboardStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalParticipants: number;
    activeSensors: number;
    recentTransactions: number;
    qualityScore: number;
    networkHealth: number;
    alertsToday: number;
  }> {
    return apiRequest.get('/analytics/dashboard');
  }

  async getProductAnalytics(params: any): Promise<any> {
    return apiRequest.get('/analytics/products', params);
  }

  async getSensorAnalytics(params: any): Promise<any> {
    return apiRequest.get('/analytics/sensors', params);
  }

  async getParticipantAnalytics(params: any): Promise<any> {
    return apiRequest.get('/analytics/participants', params);
  }

  async getSupplyChainMetrics(dateRange: { startDate: string; endDate: string }): Promise<any> {
    return apiRequest.get('/analytics/supply-chain', dateRange);
  }

  async getPerformanceMetrics(): Promise<any> {
    return apiRequest.get('/analytics/performance');
  }

  async getComplianceReport(): Promise<any> {
    return apiRequest.get('/analytics/compliance');
  }

  async exportAnalytics(type: string, format: string, params?: any): Promise<{ downloadUrl: string }> {
    return apiRequest.post('/analytics/export', { type, format, ...params });
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;