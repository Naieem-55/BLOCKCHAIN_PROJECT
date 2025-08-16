import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Participant, ParticipantFormData, ParticipantFilter } from '../types/participant';
import { participantService } from '../services/participantService';

interface ParticipantState {
  participants: Participant[];
  currentParticipant: Participant | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ParticipantFilter;
  searchQuery: string;
}

const initialState: ParticipantState = {
  participants: [],
  currentParticipant: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  searchQuery: '',
};

// Async thunks
export const fetchParticipants = createAsyncThunk(
  'participants/fetchParticipants',
  async (params: { page?: number; limit?: number; filters?: ParticipantFilter; search?: string }, { rejectWithValue }) => {
    try {
      const response = await participantService.getParticipants(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch participants');
    }
  }
);

export const fetchParticipantById = createAsyncThunk(
  'participants/fetchParticipantById',
  async (participantId: string, { rejectWithValue }) => {
    try {
      const response = await participantService.getParticipantById(participantId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch participant');
    }
  }
);

export const createParticipant = createAsyncThunk(
  'participants/createParticipant',
  async (participantData: ParticipantFormData, { rejectWithValue }) => {
    try {
      const response = await participantService.createParticipant(participantData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create participant');
    }
  }
);

export const updateParticipant = createAsyncThunk(
  'participants/updateParticipant',
  async ({ id, data }: { id: string; data: Partial<ParticipantFormData> }, { rejectWithValue }) => {
    try {
      const response = await participantService.updateParticipant(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update participant');
    }
  }
);

// Participant slice
const participantSlice = createSlice({
  name: 'participants',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentParticipant: (state, action: PayloadAction<Participant | null>) => {
      state.currentParticipant = action.payload;
    },
    setFilters: (state, action: PayloadAction<ParticipantFilter>) => {
      state.filters = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setPagination: (state, action: PayloadAction<{ page?: number; limit?: number }>) => {
      if (action.payload.page !== undefined) {
        state.pagination.page = action.payload.page;
      }
      if (action.payload.limit !== undefined) {
        state.pagination.limit = action.payload.limit;
      }
    },
    clearCurrentParticipant: (state) => {
      state.currentParticipant = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch participants
    builder
      .addCase(fetchParticipants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchParticipants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.participants = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchParticipants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch participant by ID
    builder
      .addCase(fetchParticipantById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchParticipantById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentParticipant = action.payload;
        state.error = null;
      })
      .addCase(fetchParticipantById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create participant
    builder
      .addCase(createParticipant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createParticipant.fulfilled, (state, action) => {
        state.isLoading = false;
        state.participants.unshift(action.payload);
        state.error = null;
      })
      .addCase(createParticipant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update participant
    builder
      .addCase(updateParticipant.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateParticipant.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.participants.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.participants[index] = action.payload;
        }
        if (state.currentParticipant?.id === action.payload.id) {
          state.currentParticipant = action.payload;
        }
        state.error = null;
      })
      .addCase(updateParticipant.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const {
  clearError,
  setCurrentParticipant,
  setFilters,
  setSearchQuery,
  setPagination,
  clearCurrentParticipant,
} = participantSlice.actions;

// Selectors
export const selectParticipants = (state: { participants: ParticipantState }) => state.participants.participants;
export const selectCurrentParticipant = (state: { participants: ParticipantState }) => state.participants.currentParticipant;
export const selectParticipantsLoading = (state: { participants: ParticipantState }) => state.participants.isLoading;
export const selectParticipantsError = (state: { participants: ParticipantState }) => state.participants.error;
export const selectParticipantsPagination = (state: { participants: ParticipantState }) => state.participants.pagination;
export const selectParticipantsFilters = (state: { participants: ParticipantState }) => state.participants.filters;
export const selectParticipantsSearchQuery = (state: { participants: ParticipantState }) => state.participants.searchQuery;

export default participantSlice.reducer;