import { apiRequest } from './api';
import { Sensor, SensorFormData, SensorFilter, SensorReading, SensorAlert } from '../types/iot';
import { PaginatedResponse } from '../types';

class IoTService {
  async getSensors(params: {
    page?: number;
    limit?: number;
    filters?: SensorFilter;
  } = {}): Promise<PaginatedResponse<Sensor>> {
    return apiRequest.get<PaginatedResponse<Sensor>>('/iot/sensors', params);
  }

  async getSensorById(sensorId: string): Promise<Sensor> {
    return apiRequest.get<Sensor>(`/iot/sensors/${sensorId}`);
  }

  async createSensor(sensorData: SensorFormData): Promise<Sensor> {
    return apiRequest.post<Sensor>('/iot/sensors', sensorData);
  }

  async updateSensor(sensorId: string, sensorData: Partial<SensorFormData>): Promise<Sensor> {
    return apiRequest.put<Sensor>(`/iot/sensors/${sensorId}`, sensorData);
  }

  async deleteSensor(sensorId: string): Promise<void> {
    return apiRequest.delete(`/iot/sensors/${sensorId}`);
  }

  async getSensorReadings(params: {
    sensorId?: string;
    productId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SensorReading>> {
    return apiRequest.get<PaginatedResponse<SensorReading>>('/iot/readings', params);
  }

  async recordSensorData(sensorData: any): Promise<SensorReading> {
    return apiRequest.post<SensorReading>('/iot/readings', sensorData);
  }

  async batchRecordSensorData(batchData: any): Promise<SensorReading[]> {
    return apiRequest.post<SensorReading[]>('/iot/readings/batch', batchData);
  }

  async getAlerts(params: {
    sensorId?: string;
    resolved?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SensorAlert>> {
    return apiRequest.get<PaginatedResponse<SensorAlert>>('/iot/alerts', params);
  }

  async resolveAlert(alertId: string, resolution: string): Promise<SensorAlert> {
    return apiRequest.post<SensorAlert>(`/iot/alerts/${alertId}/resolve`, { resolution });
  }

  async getSensorAnalytics(sensorId: string): Promise<any> {
    return apiRequest.get(`/iot/sensors/${sensorId}/analytics`);
  }
}

export const iotService = new IoTService();
export default iotService;