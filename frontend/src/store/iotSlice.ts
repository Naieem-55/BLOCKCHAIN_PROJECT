import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Sensor, SensorReading, SensorAlert, SensorFormData, SensorFilter } from '../types/iot';
import { iotService } from '../services/iotService';

interface IoTState {
  sensors: Sensor[];
  currentSensor: Sensor | null;
  sensorReadings: SensorReading[];
  alerts: SensorAlert[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: SensorFilter;
  realtimeData: Record<string, SensorReading>;
}

const initialState: IoTState = {
  sensors: [],
  currentSensor: null,
  sensorReadings: [],
  alerts: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  realtimeData: {},
};

// Async thunks
export const fetchSensors = createAsyncThunk(
  'iot/fetchSensors',
  async (params: { page?: number; limit?: number; filters?: SensorFilter }, { rejectWithValue }) => {
    try {
      const response = await iotService.getSensors(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sensors');
    }
  }
);

export const fetchSensorById = createAsyncThunk(
  'iot/fetchSensorById',
  async (sensorId: string, { rejectWithValue }) => {
    try {
      const response = await iotService.getSensorById(sensorId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sensor');
    }
  }
);

export const createSensor = createAsyncThunk(
  'iot/createSensor',
  async (sensorData: SensorFormData, { rejectWithValue }) => {
    try {
      const response = await iotService.createSensor(sensorData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create sensor');
    }
  }
);

export const updateSensor = createAsyncThunk(
  'iot/updateSensor',
  async ({ id, data }: { id: string; data: Partial<SensorFormData> }, { rejectWithValue }) => {
    try {
      const response = await iotService.updateSensor(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update sensor');
    }
  }
);

export const deleteSensor = createAsyncThunk(
  'iot/deleteSensor',
  async (sensorId: string, { rejectWithValue }) => {
    try {
      await iotService.deleteSensor(sensorId);
      return sensorId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete sensor');
    }
  }
);

export const fetchSensorReadings = createAsyncThunk(
  'iot/fetchSensorReadings',
  async (params: { sensorId?: string; productId?: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await iotService.getSensorReadings(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sensor readings');
    }
  }
);

export const recordSensorData = createAsyncThunk(
  'iot/recordSensorData',
  async (sensorData: any, { rejectWithValue }) => {
    try {
      const response = await iotService.recordSensorData(sensorData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to record sensor data');
    }
  }
);

export const batchRecordSensorData = createAsyncThunk(
  'iot/batchRecordSensorData',
  async (batchData: any, { rejectWithValue }) => {
    try {
      const response = await iotService.batchRecordSensorData(batchData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to batch record sensor data');
    }
  }
);

export const fetchAlerts = createAsyncThunk(
  'iot/fetchAlerts',
  async (params: { sensorId?: string; resolved?: boolean; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await iotService.getAlerts(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch alerts');
    }
  }
);

export const resolveAlert = createAsyncThunk(
  'iot/resolveAlert',
  async ({ alertId, resolution }: { alertId: string; resolution: string }, { rejectWithValue }) => {
    try {
      const response = await iotService.resolveAlert(alertId, resolution);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resolve alert');
    }
  }
);

// IoT slice
const iotSlice = createSlice({
  name: 'iot',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentSensor: (state, action: PayloadAction<Sensor | null>) => {
      state.currentSensor = action.payload;
    },
    setFilters: (state, action: PayloadAction<SensorFilter>) => {
      state.filters = action.payload;
    },
    setPagination: (state, action: PayloadAction<{ page?: number; limit?: number }>) => {
      if (action.payload.page !== undefined) {
        state.pagination.page = action.payload.page;
      }
      if (action.payload.limit !== undefined) {
        state.pagination.limit = action.payload.limit;
      }
    },
    addRealtimeReading: (state, action: PayloadAction<SensorReading>) => {
      const reading = action.payload;
      state.realtimeData[reading.sensorId] = reading;
      
      // Also add to readings array if it's for the current sensor
      if (state.currentSensor?.sensorId === reading.sensorId) {
        state.sensorReadings.unshift(reading);
        // Keep only the latest 100 readings to prevent memory issues
        if (state.sensorReadings.length > 100) {
          state.sensorReadings = state.sensorReadings.slice(0, 100);
        }
      }
    },
    addRealtimeAlert: (state, action: PayloadAction<SensorAlert>) => {
      state.alerts.unshift(action.payload);
    },
    updateSensorStatus: (state, action: PayloadAction<{ sensorId: string; isActive: boolean }>) => {
      const { sensorId, isActive } = action.payload;
      const sensor = state.sensors.find(s => s.sensorId === sensorId);
      if (sensor) {
        sensor.isActive = isActive;
      }
      if (state.currentSensor?.sensorId === sensorId) {
        state.currentSensor.isActive = isActive;
      }
    },
    clearCurrentSensor: (state) => {
      state.currentSensor = null;
      state.sensorReadings = [];
    },
    clearRealtimeData: (state) => {
      state.realtimeData = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch sensors
    builder
      .addCase(fetchSensors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSensors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sensors = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchSensors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch sensor by ID
    builder
      .addCase(fetchSensorById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSensorById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSensor = action.payload;
        state.error = null;
      })
      .addCase(fetchSensorById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create sensor
    builder
      .addCase(createSensor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSensor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sensors.unshift(action.payload);
        state.error = null;
      })
      .addCase(createSensor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update sensor
    builder
      .addCase(updateSensor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSensor.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.sensors.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.sensors[index] = action.payload;
        }
        if (state.currentSensor?.id === action.payload.id) {
          state.currentSensor = action.payload;
        }
        state.error = null;
      })
      .addCase(updateSensor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete sensor
    builder
      .addCase(deleteSensor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSensor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sensors = state.sensors.filter(s => s.id !== action.payload);
        if (state.currentSensor?.id === action.payload) {
          state.currentSensor = null;
        }
        state.error = null;
      })
      .addCase(deleteSensor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch sensor readings
    builder
      .addCase(fetchSensorReadings.fulfilled, (state, action) => {
        state.sensorReadings = action.payload.data;
        state.error = null;
      });

    // Record sensor data
    builder
      .addCase(recordSensorData.fulfilled, (state, action) => {
        state.sensorReadings.unshift(action.payload);
        state.realtimeData[action.payload.sensorId] = action.payload;
        state.error = null;
      });

    // Batch record sensor data
    builder
      .addCase(batchRecordSensorData.fulfilled, (state, action) => {
        action.payload.forEach((reading: SensorReading) => {
          state.realtimeData[reading.sensorId] = reading;
        });
        state.error = null;
      });

    // Fetch alerts
    builder
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload.data;
        state.error = null;
      });

    // Resolve alert
    builder
      .addCase(resolveAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
        state.error = null;
      });
  },
});

// Actions
export const {
  clearError,
  setCurrentSensor,
  setFilters,
  setPagination,
  addRealtimeReading,
  addRealtimeAlert,
  updateSensorStatus,
  clearCurrentSensor,
  clearRealtimeData,
} = iotSlice.actions;

// Selectors
export const selectSensors = (state: { iot: IoTState }) => state.iot.sensors;
export const selectCurrentSensor = (state: { iot: IoTState }) => state.iot.currentSensor;
export const selectSensorReadings = (state: { iot: IoTState }) => state.iot.sensorReadings;
export const selectAlerts = (state: { iot: IoTState }) => state.iot.alerts;
export const selectIoTLoading = (state: { iot: IoTState }) => state.iot.isLoading;
export const selectIoTError = (state: { iot: IoTState }) => state.iot.error;
export const selectIoTPagination = (state: { iot: IoTState }) => state.iot.pagination;
export const selectIoTFilters = (state: { iot: IoTState }) => state.iot.filters;
export const selectRealtimeData = (state: { iot: IoTState }) => state.iot.realtimeData;
export const selectRealtimeReading = (sensorId: string) => (state: { iot: IoTState }) => 
  state.iot.realtimeData[sensorId];

// Helper selectors
export const selectActiveSensors = (state: { iot: IoTState }) => 
  state.iot.sensors.filter(sensor => sensor.isActive);

export const selectUnresolvedAlerts = (state: { iot: IoTState }) => 
  state.iot.alerts.filter(alert => !alert.isResolved);

export const selectCriticalAlerts = (state: { iot: IoTState }) => 
  state.iot.alerts.filter(alert => !alert.isResolved && alert.severity === 'critical');

export const selectSensorsByType = (type: string) => (state: { iot: IoTState }) =>
  state.iot.sensors.filter(sensor => sensor.type === type);

export default iotSlice.reducer;