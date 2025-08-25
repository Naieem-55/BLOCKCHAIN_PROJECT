import { apiRequest } from './api';
import { Participant, ParticipantFormData, ParticipantFilter } from '../types/participant';
import { PaginatedResponse } from '../types';

class ParticipantService {
  async getParticipants(params: {
    page?: number;
    limit?: number;
    filters?: ParticipantFilter;
    search?: string;
  } = {}): Promise<any> {
    // The backend returns participants directly, not wrapped in PaginatedResponse
    return apiRequest.get<any>('/participants', params);
  }

  async getParticipantById(participantId: string): Promise<Participant> {
    return apiRequest.get<Participant>(`/participants/${participantId}`);
  }

  async createParticipant(participantData: ParticipantFormData): Promise<Participant> {
    // Transform frontend data to backend format
    const backendData = {
      name: participantData.contactPerson || participantData.name, // Use contactPerson as the actual person name
      email: participantData.email,
      role: participantData.role,
      company: participantData.company,
      location: participantData.location,
      phone: participantData.phone,
    };
    
    console.log('Creating participant with data:', backendData);
    console.log('Original form data:', participantData);
    
    return apiRequest.post<Participant>('/participants', backendData);
  }

  async updateParticipant(participantId: string, participantData: Partial<ParticipantFormData>): Promise<Participant> {
    // Transform frontend data to backend format
    const backendData: any = {};
    if (participantData.contactPerson || participantData.name) {
      backendData.name = participantData.contactPerson || participantData.name;
    }
    if (participantData.email) backendData.email = participantData.email;
    if (participantData.role) backendData.role = participantData.role;
    if (participantData.company) backendData.company = participantData.company;
    if (participantData.location) backendData.location = participantData.location;
    if (participantData.phone) backendData.phone = participantData.phone;
    
    return apiRequest.put<Participant>(`/participants/${participantId}`, backendData);
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