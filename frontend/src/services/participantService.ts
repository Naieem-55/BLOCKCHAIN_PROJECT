import { apiRequest } from './api';
import { Participant, ParticipantFormData, ParticipantFilter } from '../types/participant';
import { PaginatedResponse } from '../types';

class ParticipantService {
  async getParticipants(params: {
    page?: number;
    limit?: number;
    filters?: ParticipantFilter;
    search?: string;
  } = {}): Promise<PaginatedResponse<Participant>> {
    return apiRequest.get<PaginatedResponse<Participant>>('/participants', params);
  }

  async getParticipantById(participantId: string): Promise<Participant> {
    return apiRequest.get<Participant>(`/participants/${participantId}`);
  }

  async createParticipant(participantData: ParticipantFormData): Promise<Participant> {
    return apiRequest.post<Participant>('/participants', participantData);
  }

  async updateParticipant(participantId: string, participantData: Partial<ParticipantFormData>): Promise<Participant> {
    return apiRequest.put<Participant>(`/participants/${participantId}`, participantData);
  }

  async deleteParticipant(participantId: string): Promise<void> {
    return apiRequest.delete(`/participants/${participantId}`);
  }

  async verifyParticipant(participantId: string, verificationData: any): Promise<Participant> {
    return apiRequest.post<Participant>(`/participants/${participantId}/verify`, verificationData);
  }

  async getParticipantAnalytics(participantId: string): Promise<any> {
    return apiRequest.get(`/participants/${participantId}/analytics`);
  }

  async inviteParticipant(inviteData: { email: string; role: string; message?: string }): Promise<void> {
    return apiRequest.post('/participants/invite', inviteData);
  }
}

export const participantService = new ParticipantService();
export default participantService;