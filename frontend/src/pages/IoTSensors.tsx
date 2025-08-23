import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Sensors as SensorsIcon,
  Battery90 as BatteryHighIcon,
  Battery30 as BatteryLowIcon,
  SignalWifi4Bar as OnlineIcon,
  SignalWifiOff as OfflineIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Notifications as AlertsIcon,
  ThermostatAuto as TemperatureIcon,
  Water as HumidityIcon,
  Speed as PressureIcon,
  LocationOn as LocationIcon,
  Vibration as ShockIcon,
  Lightbulb as LightIcon,
  Science as PhIcon,
  Air as OxygenIcon,
  Co2 as Co2Icon,
  DirectionsRun as MotionIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { apiRequest } from '../services/api';
import { Sensor, SensorType, SensorAlert, AlertLevel, SensorStatus, SensorReading } from '../types';
import toast from 'react-hot-toast';

// Form validation schema
const sensorSchema = yup.object({
  name: yup.string().required('Name is required'),
  type: yup.string().required('Type is required'),
  description: yup.string().required('Description is required'),
  location: yup.string().required('Location is required'),
});

const thresholdSchema = yup.object({
  parameter: yup.string().required('Parameter is required'),
  minValue: yup.number().required('Min value is required'),
  maxValue: yup.number().required('Max value is required'),
  unit: yup.string().required('Unit is required'),
  alertLevel: yup.string().required('Alert level is required'),
});

// Mock data for development
const mockSensors: Sensor[] = [
  {
    id: '1',
    sensorId: 'TEMP-001',
    name: 'Cold Storage Temperature Monitor',
    type: SensorType.TEMPERATURE,
    description: 'Monitors temperature in cold storage warehouse',
    owner: 'Green Farms Ltd',
    location: 'Warehouse A - Section 1',
    isActive: true,
    lastReading: '2024-08-22T09:30:00Z',
    batteryLevel: 85,
    firmware: 'v2.1.3',
    calibrationData: {
      lastCalibrated: '2024-07-15T00:00:00Z',
      calibratedBy: 'Tech Team',
      nextCalibrationDue: '2025-01-15T00:00:00Z',
      calibrationMethod: 'Standard Protocol',
      accuracy: 99.8,
      precision: 0.1,
    },
    thresholds: [
      {
        id: 'th1',
        parameter: 'temperature',
        minValue: -5,
        maxValue: 5,
        unit: '°C',
        alertLevel: AlertLevel.CRITICAL,
        isActive: true,
        description: 'Critical temperature range for frozen goods',
      },
    ],
    blockchain: {
      contractAddress: '0xsensor1234567890abcdef1234567890abcdef123',
      registrationHash: '0xsensorhash1234567890abcdef1234567890abcdef',
    },
    specifications: {
      range: { min: -40, max: 85, unit: '°C' },
      accuracy: 99.8,
      resolution: 0.1,
      operatingTemperature: { min: -40, max: 85 },
      powerRequirement: '3.3V DC',
      communicationProtocol: ['Wi-Fi', 'Bluetooth'],
      ipRating: 'IP67',
      dimensions: { length: 50, width: 30, height: 15, weight: 45 },
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-08-22T09:30:00Z',
  },
  {
    id: '2',
    sensorId: 'HUM-001',
    name: 'Humidity Sensor - Produce Area',
    type: SensorType.HUMIDITY,
    description: 'Monitors humidity levels for fresh produce storage',
    owner: 'Green Farms Ltd',
    location: 'Warehouse B - Fresh Produce',
    isActive: true,
    lastReading: '2024-08-22T09:25:00Z',
    batteryLevel: 42,
    firmware: 'v1.8.2',
    calibrationData: {
      lastCalibrated: '2024-06-01T00:00:00Z',
      calibratedBy: 'Service Team',
      nextCalibrationDue: '2024-12-01T00:00:00Z',
      calibrationMethod: 'Standard Protocol',
      accuracy: 98.5,
      precision: 0.5,
    },
    thresholds: [
      {
        id: 'th2',
        parameter: 'humidity',
        minValue: 85,
        maxValue: 95,
        unit: '%RH',
        alertLevel: AlertLevel.WARNING,
        isActive: true,
        description: 'Optimal humidity range for fresh produce',
      },
    ],
    blockchain: {
      contractAddress: '0xsensor2234567890abcdef1234567890abcdef123',
      registrationHash: '0xsensorhash2234567890abcdef1234567890abcdef',
    },
    specifications: {
      range: { min: 0, max: 100, unit: '%RH' },
      accuracy: 98.5,
      resolution: 0.5,
      operatingTemperature: { min: -20, max: 60 },
      powerRequirement: '3.3V DC',
      communicationProtocol: ['Wi-Fi', 'LoRaWAN'],
      ipRating: 'IP65',
      dimensions: { length: 45, width: 25, height: 12, weight: 35 },
    },
    createdAt: '2024-02-10T14:30:00Z',
    updatedAt: '2024-08-22T09:25:00Z',
  },
];

const mockAlerts: SensorAlert[] = [
  {
    id: '1',
    sensorId: 'HUM-001',
    alertType: 'threshold_violation' as any,
    severity: AlertLevel.WARNING,
    message: 'Humidity level below optimal range (82% RH)',
    triggerValue: 82,
    threshold: {
      id: 'th2',
      parameter: 'humidity',
      minValue: 85,
      maxValue: 95,
      unit: '%RH',
      alertLevel: AlertLevel.WARNING,
      isActive: true,
    },
    isResolved: false,
    notificationsSent: [],
    createdAt: '2024-08-22T08:45:00Z',
    updatedAt: '2024-08-22T08:45:00Z',
  },
];

const mockReadings = [
  { time: '09:00', temperature: 2.1, humidity: 88 },
  { time: '09:05', temperature: 1.8, humidity: 86 },
  { time: '09:10', temperature: 2.3, humidity: 84 },
  { time: '09:15', temperature: 2.0, humidity: 82 },
  { time: '09:20', temperature: 1.9, humidity: 85 },
  { time: '09:25', temperature: 2.2, humidity: 87 },
  { time: '09:30', temperature: 2.0, humidity: 89 },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const IoTSensors: React.FC = () => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openThresholdDialog, setOpenThresholdDialog] = useState(false);
  const [editingSensor, setEditingSensor] = useState<Sensor | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [realtimeData, setRealtimeData] = useState(mockReadings);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(sensorSchema),
    defaultValues: {
      name: '',
      type: SensorType.TEMPERATURE,
      description: '',
      location: '',
    },
  });

  const {
    control: thresholdControl,
    handleSubmit: handleThresholdSubmit,
    reset: resetThreshold,
    formState: { errors: thresholdErrors, isSubmitting: isThresholdSubmitting },
  } = useForm({
    resolver: yupResolver(thresholdSchema),
    defaultValues: {
      parameter: '',
      minValue: 0,
      maxValue: 100,
      unit: '',
      alertLevel: AlertLevel.WARNING,
    },
  });

  useEffect(() => {
    loadSensors();
    loadAlerts();

    // Simulate real-time data updates
    const interval = setInterval(() => {
      const newReading = {
        time: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        temperature: 2.0 + (Math.random() - 0.5) * 0.6,
        humidity: 87 + (Math.random() - 0.5) * 10,
      };
      setRealtimeData(prev => [...prev.slice(-6), newReading]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadSensors = async () => {
    try {
      setLoading(true);
      // In production: const data = await apiRequest.get<Sensor[]>('/sensors');
      setTimeout(() => {
        setSensors(mockSensors);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading sensors:', error);
      toast.error('Failed to load sensors');
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      // In production: const data = await apiRequest.get<SensorAlert[]>('/sensors/alerts');
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const handleCreateOrUpdate = async (data: any) => {
    try {
      if (editingSensor) {
        const updatedSensor = {
          ...editingSensor,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        setSensors(prev => prev.map(s => s.id === editingSensor.id ? updatedSensor : s));
        toast.success('Sensor updated successfully');
      } else {
        const newSensor: Sensor = {
          id: Date.now().toString(),
          sensorId: `${data.type.toUpperCase().substr(0, 4)}-${String(sensors.length + 1).padStart(3, '0')}`,
          ...data,
          owner: 'Current User',
          isActive: true,
          batteryLevel: 100,
          firmware: 'v1.0.0',
          calibrationData: {
            lastCalibrated: new Date().toISOString(),
            calibratedBy: 'System',
            nextCalibrationDue: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
            calibrationMethod: 'Initial Setup',
            accuracy: 99.0,
            precision: 1.0,
          },
          thresholds: [],
          blockchain: {
            contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
            registrationHash: `0x${Math.random().toString(16).substr(2, 40)}`,
          },
          specifications: {
            range: { min: 0, max: 100, unit: 'unit' },
            accuracy: 99.0,
            resolution: 1.0,
            operatingTemperature: { min: -20, max: 60 },
            powerRequirement: '3.3V DC',
            communicationProtocol: ['Wi-Fi'],
            dimensions: { length: 50, width: 30, height: 15, weight: 40 },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSensors(prev => [...prev, newSensor]);
        toast.success('Sensor created successfully');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving sensor:', error);
      toast.error('Failed to save sensor');
    }
  };

  const handleAddThreshold = async (data: any) => {
    if (selectedSensor) {
      try {
        const newThreshold = {
          id: Date.now().toString(),
          ...data,
          isActive: true,
        };
        const updatedSensor = {
          ...selectedSensor,
          thresholds: [...selectedSensor.thresholds, newThreshold],
        };
        setSensors(prev => prev.map(s => s.id === selectedSensor.id ? updatedSensor : s));
        setSelectedSensor(updatedSensor);
        toast.success('Threshold added successfully');
        setOpenThresholdDialog(false);
        resetThreshold();
      } catch (error) {
        console.error('Error adding threshold:', error);
        toast.error('Failed to add threshold');
      }
    }
  };

  const handleDelete = async (sensor: Sensor) => {
    if (window.confirm(`Are you sure you want to delete sensor ${sensor.name}?`)) {
      try {
        setSensors(prev => prev.filter(s => s.id !== sensor.id));
        toast.success('Sensor deleted successfully');
      } catch (error) {
        console.error('Error deleting sensor:', error);
        toast.error('Failed to delete sensor');
      }
    }
  };

  const handleToggleStatus = async (sensor: Sensor) => {
    try {
      const updatedSensor = {
        ...sensor,
        isActive: !sensor.isActive,
        updatedAt: new Date().toISOString(),
      };
      setSensors(prev => prev.map(s => s.id === sensor.id ? updatedSensor : s));
      toast.success(`Sensor ${updatedSensor.isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling sensor status:', error);
      toast.error('Failed to update sensor status');
    }
  };

  const handleResolveAlert = async (alert: SensorAlert) => {
    try {
      const updatedAlert = {
        ...alert,
        isResolved: true,
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'Current User',
        resolution: 'Resolved by user',
      };
      setAlerts(prev => prev.map(a => a.id === alert.id ? updatedAlert : a));
      toast.success('Alert resolved');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSensor(null);
    reset();
  };

  const handleEdit = (sensor: Sensor) => {
    setEditingSensor(sensor);
    reset({
      name: sensor.name,
      type: sensor.type,
      description: sensor.description,
      location: sensor.location,
    });
    setOpenDialog(true);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, sensor: Sensor) => {
    setAnchorEl(event.currentTarget);
    setSelectedSensor(sensor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getSensorTypeIcon = (type: SensorType) => {
    switch (type) {
      case SensorType.TEMPERATURE: return <TemperatureIcon />;
      case SensorType.HUMIDITY: return <HumidityIcon />;
      case SensorType.PRESSURE: return <PressureIcon />;
      case SensorType.LOCATION: return <LocationIcon />;
      case SensorType.SHOCK: return <ShockIcon />;
      case SensorType.LIGHT: return <LightIcon />;
      case SensorType.PH: return <PhIcon />;
      case SensorType.OXYGEN: return <OxygenIcon />;
      case SensorType.CO2: return <Co2Icon />;
      case SensorType.MOTION: return <MotionIcon />;
      default: return <SensorsIcon />;
    }
  };

  const getSensorStatus = (sensor: Sensor): SensorStatus => {
    if (!sensor.isActive) return SensorStatus.OFFLINE;
    if (sensor.batteryLevel && sensor.batteryLevel < 30) return SensorStatus.WARNING;
    if (alerts.some(alert => alert.sensorId === sensor.sensorId && !alert.isResolved)) return SensorStatus.WARNING;
    return SensorStatus.ONLINE;
  };

  const getStatusColor = (status: SensorStatus) => {
    switch (status) {
      case SensorStatus.ONLINE: return 'success';
      case SensorStatus.WARNING: return 'warning';
      case SensorStatus.ERROR: return 'error';
      case SensorStatus.OFFLINE: return 'default';
      default: return 'default';
    }
  };

  const getBatteryIcon = (level?: number) => {
    if (!level) return <BatteryLowIcon />;
    return level > 30 ? <BatteryHighIcon /> : <BatteryLowIcon />;
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'error';
    if (level > 60) return 'success';
    if (level > 30) return 'warning';
    return 'error';
  };

  // Filter sensors
  const filteredSensors = sensors.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.sensorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || sensor.type === selectedType;
    const status = getSensorStatus(sensor);
    const matchesStatus = !selectedStatus ||
                         (selectedStatus === 'online' && status === SensorStatus.ONLINE) ||
                         (selectedStatus === 'warning' && status === SensorStatus.WARNING) ||
                         (selectedStatus === 'offline' && status === SensorStatus.OFFLINE) ||
                         (selectedStatus === 'error' && status === SensorStatus.ERROR);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          IoT Sensor Network
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Sensor
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SensorsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{sensors.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sensors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <OnlineIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {sensors.filter(s => getSensorStatus(s) === SensorStatus.ONLINE).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Online Sensors
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AlertsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {alerts.filter(a => !a.isResolved).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Alerts
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TimelineIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {Math.round(sensors.reduce((acc, s) => acc + (s.batteryLevel || 0), 0) / sensors.length)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Battery
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Sensors" />
          <Tab label="Real-time Data" />
          <Tab label="Alerts" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Filters */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search sensors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value={SensorType.TEMPERATURE}>Temperature</MenuItem>
                    <MenuItem value={SensorType.HUMIDITY}>Humidity</MenuItem>
                    <MenuItem value={SensorType.PRESSURE}>Pressure</MenuItem>
                    <MenuItem value={SensorType.LOCATION}>Location</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="online">Online</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="offline">Offline</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Typography variant="body2" color="text.secondary" align="center">
                  {filteredSensors.length} sensors
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Sensors Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sensor</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Battery</TableCell>
                  <TableCell>Last Reading</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredSensors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No sensors found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSensors.map((sensor) => {
                    const status = getSensorStatus(sensor);
                    return (
                      <TableRow key={sensor.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getSensorTypeIcon(sensor.type)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {sensor.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {sensor.sensorId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Chip label={sensor.type} size="small" />
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">{sensor.location}</Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Chip
                            label={status}
                            color={getStatusColor(status) as any}
                            size="small"
                            icon={status === SensorStatus.ONLINE ? <OnlineIcon /> : 
                                  status === SensorStatus.OFFLINE ? <OfflineIcon /> : 
                                  <WarningIcon />}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getBatteryIcon(sensor.batteryLevel)}
                            <Typography variant="body2" color={`${getBatteryColor(sensor.batteryLevel)}.main`}>
                              {sensor.batteryLevel || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {sensor.lastReading ? 
                              new Date(sensor.lastReading).toLocaleString() : 
                              'No data'
                            }
                          </Typography>
                        </TableCell>
                        
                        <TableCell align="center">
                          <IconButton onClick={(e) => handleMenuClick(e, sensor)}>
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Temperature Readings
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={realtimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="temperature" 
                        stroke="#1976d2" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Humidity Levels
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={realtimeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="humidity" 
                        stroke="#2e7d32" 
                        fill="#4caf50"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Alerts
            </Typography>
          </Box>
          
          {alerts.filter(alert => !alert.isResolved).length === 0 ? (
            <Alert severity="success">
              No active alerts. All sensors are operating within normal parameters.
            </Alert>
          ) : (
            alerts.filter(alert => !alert.isResolved).map((alert) => (
              <Alert
                key={alert.id}
                severity={alert.severity === AlertLevel.CRITICAL ? 'error' : 
                         alert.severity === AlertLevel.WARNING ? 'warning' : 'info'}
                sx={{ mb: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => handleResolveAlert(alert)}
                  >
                    Resolve
                  </Button>
                }
              >
                <Typography variant="subtitle2">
                  Sensor: {alert.sensorId}
                </Typography>
                <Typography variant="body2">
                  {alert.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(alert.createdAt).toLocaleString()}
                </Typography>
              </Alert>
            ))
          )}
        </TabPanel>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleEdit(selectedSensor!); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { setOpenThresholdDialog(true); handleMenuClose(); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Threshold</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { handleToggleStatus(selectedSensor!); handleMenuClose(); }}>
          <ListItemIcon>
            {selectedSensor?.isActive ? <OfflineIcon fontSize="small" /> : <OnlineIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>{selectedSensor?.isActive ? 'Deactivate' : 'Activate'}</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { handleDelete(selectedSensor!); handleMenuClose(); }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Sensor Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSensor ? 'Edit Sensor' : 'Add New Sensor'}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleCreateOrUpdate)}>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Sensor Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.type}>
                      <InputLabel>Sensor Type</InputLabel>
                      <Select {...field} label="Sensor Type">
                        <MenuItem value={SensorType.TEMPERATURE}>Temperature</MenuItem>
                        <MenuItem value={SensorType.HUMIDITY}>Humidity</MenuItem>
                        <MenuItem value={SensorType.PRESSURE}>Pressure</MenuItem>
                        <MenuItem value={SensorType.LOCATION}>Location</MenuItem>
                        <MenuItem value={SensorType.SHOCK}>Shock</MenuItem>
                        <MenuItem value={SensorType.LIGHT}>Light</MenuItem>
                        <MenuItem value={SensorType.PH}>pH</MenuItem>
                        <MenuItem value={SensorType.OXYGEN}>Oxygen</MenuItem>
                        <MenuItem value={SensorType.CO2}>CO2</MenuItem>
                        <MenuItem value={SensorType.MOTION}>Motion</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Description"
                      multiline
                      rows={3}
                      error={!!errors.description}
                      helperText={errors.description?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Location"
                      error={!!errors.location}
                      helperText={errors.location?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={20} /> : editingSensor ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Threshold Dialog */}
      <Dialog open={openThresholdDialog} onClose={() => setOpenThresholdDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Threshold</DialogTitle>
        <form onSubmit={handleThresholdSubmit(handleAddThreshold)}>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="parameter"
                  control={thresholdControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Parameter"
                      error={!!thresholdErrors.parameter}
                      helperText={thresholdErrors.parameter?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="minValue"
                  control={thresholdControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Min Value"
                      type="number"
                      error={!!thresholdErrors.minValue}
                      helperText={thresholdErrors.minValue?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="maxValue"
                  control={thresholdControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Max Value"
                      type="number"
                      error={!!thresholdErrors.maxValue}
                      helperText={thresholdErrors.maxValue?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="unit"
                  control={thresholdControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Unit"
                      error={!!thresholdErrors.unit}
                      helperText={thresholdErrors.unit?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={6}>
                <Controller
                  name="alertLevel"
                  control={thresholdControl}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Alert Level</InputLabel>
                      <Select {...field} label="Alert Level">
                        <MenuItem value={AlertLevel.INFO}>Info</MenuItem>
                        <MenuItem value={AlertLevel.WARNING}>Warning</MenuItem>
                        <MenuItem value={AlertLevel.CRITICAL}>Critical</MenuItem>
                        <MenuItem value={AlertLevel.EMERGENCY}>Emergency</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenThresholdDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isThresholdSubmitting}>
              {isThresholdSubmitting ? <CircularProgress size={20} /> : 'Add Threshold'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default IoTSensors;