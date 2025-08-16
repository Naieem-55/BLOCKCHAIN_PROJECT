import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { analyticsService } from '../services/analyticsService';

interface AnalyticsState {
  dashboardStats: {
    totalProducts: number;
    activeProducts: number;
    totalParticipants: number;
    activeSensors: number;
    recentTransactions: number;
    qualityScore: number;
    networkHealth: number;
    alertsToday: number;
  } | null;
  productAnalytics: any;
  sensorAnalytics: any;
  participantAnalytics: any;
  isLoading: boolean;
  error: string | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const initialState: AnalyticsState = {
  dashboardStats: null,
  productAnalytics: null,
  sensorAnalytics: null,
  participantAnalytics: null,
  isLoading: false,
  error: null,
  dateRange: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
  },
};

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'analytics/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getDashboardStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchProductAnalytics = createAsyncThunk(
  'analytics/fetchProductAnalytics',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getProductAnalytics(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch product analytics');
    }
  }
);

export const fetchSensorAnalytics = createAsyncThunk(
  'analytics/fetchSensorAnalytics',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getSensorAnalytics(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sensor analytics');
    }
  }
);

export const fetchParticipantAnalytics = createAsyncThunk(
  'analytics/fetchParticipantAnalytics',
  async (params: any, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getParticipantAnalytics(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch participant analytics');
    }
  }
);

// Analytics slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDateRange: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.dateRange = action.payload;
    },
    clearAnalyticsData: (state) => {
      state.dashboardStats = null;
      state.productAnalytics = null;
      state.sensorAnalytics = null;
      state.participantAnalytics = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch dashboard stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch product analytics
    builder
      .addCase(fetchProductAnalytics.fulfilled, (state, action) => {
        state.productAnalytics = action.payload;
        state.error = null;
      });

    // Fetch sensor analytics
    builder
      .addCase(fetchSensorAnalytics.fulfilled, (state, action) => {
        state.sensorAnalytics = action.payload;
        state.error = null;
      });

    // Fetch participant analytics
    builder
      .addCase(fetchParticipantAnalytics.fulfilled, (state, action) => {
        state.participantAnalytics = action.payload;
        state.error = null;
      });
  },
});

// Actions
export const { clearError, setDateRange, clearAnalyticsData } = analyticsSlice.actions;

// Selectors
export const selectDashboardStats = (state: { analytics: AnalyticsState }) => state.analytics.dashboardStats;
export const selectProductAnalytics = (state: { analytics: AnalyticsState }) => state.analytics.productAnalytics;
export const selectSensorAnalytics = (state: { analytics: AnalyticsState }) => state.analytics.sensorAnalytics;
export const selectParticipantAnalytics = (state: { analytics: AnalyticsState }) => state.analytics.participantAnalytics;
export const selectAnalyticsLoading = (state: { analytics: AnalyticsState }) => state.analytics.isLoading;
export const selectAnalyticsError = (state: { analytics: AnalyticsState }) => state.analytics.error;
export const selectAnalyticsDateRange = (state: { analytics: AnalyticsState }) => state.analytics.dateRange;

export default analyticsSlice.reducer;