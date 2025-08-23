import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Assessment as AssessmentIcon,
  Inventory as InventoryIcon,
  Group as GroupIcon,
  Sensors as SensorsIcon,
  LocalShipping as ShippingIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Nature as EcoIcon,
  MonetizationOn as MoneyIcon,
  AccessTime as TimeIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { apiRequest } from '../services/api';
import toast from 'react-hot-toast';

// Mock data for analytics
const mockProductionData = [
  { month: 'Jan', products: 120, transfers: 85, quality: 94.5 },
  { month: 'Feb', products: 135, transfers: 92, quality: 95.2 },
  { month: 'Mar', products: 148, transfers: 101, quality: 93.8 },
  { month: 'Apr', products: 162, transfers: 118, quality: 96.1 },
  { month: 'May', products: 178, transfers: 125, quality: 95.7 },
  { month: 'Jun', products: 189, transfers: 134, quality: 97.2 },
];

const mockSupplyChainData = [
  { stage: 'Production', value: 45, color: '#4caf50' },
  { stage: 'Processing', value: 25, color: '#2196f3' },
  { stage: 'Distribution', value: 20, color: '#ff9800' },
  { stage: 'Retail', value: 10, color: '#f44336' },
];

const mockSensorData = [
  { date: '2024-08-15', temperature: 2.1, humidity: 87, alerts: 2 },
  { date: '2024-08-16', temperature: 1.9, humidity: 89, alerts: 1 },
  { date: '2024-08-17', temperature: 2.3, humidity: 85, alerts: 3 },
  { date: '2024-08-18', temperature: 2.0, humidity: 88, alerts: 1 },
  { date: '2024-08-19', temperature: 1.8, humidity: 91, alerts: 0 },
  { date: '2024-08-20', temperature: 2.2, humidity: 86, alerts: 2 },
  { date: '2024-08-21', temperature: 2.1, humidity: 88, alerts: 1 },
];

const mockComplianceData = [
  { category: 'Temperature Control', score: 98.5, trend: 'up' },
  { category: 'Documentation', score: 96.2, trend: 'stable' },
  { category: 'Traceability', score: 99.1, trend: 'up' },
  { category: 'Quality Checks', score: 94.8, trend: 'down' },
  { category: 'Time Compliance', score: 97.3, trend: 'up' },
];

const mockGeographicData = [
  { location: 'North America', products: 45, participants: 12 },
  { location: 'Europe', products: 38, participants: 15 },
  { location: 'Asia Pacific', products: 32, participants: 18 },
  { location: 'South America', products: 15, participants: 8 },
  { location: 'Africa', products: 8, participants: 5 },
];

const mockKPIData = {
  totalProducts: 1247,
  activeProducts: 342,
  totalParticipants: 58,
  activeSensors: 124,
  avgTransferTime: 4.2, // hours
  qualityScore: 96.8,
  complianceRate: 97.5,
  costSavings: 28500, // USD
  sustainabilityScore: 89.2,
  networkUptime: 99.7,
};

const mockAlerts = [
  { id: 1, type: 'critical', message: 'Temperature threshold exceeded in Warehouse A', time: '2 hours ago' },
  { id: 2, type: 'warning', message: 'Product batch PRD-2024-0845 approaching expiry', time: '4 hours ago' },
  { id: 3, type: 'info', message: 'New participant verification completed', time: '6 hours ago' },
  { id: 4, type: 'warning', message: 'Sensor HUM-001 battery low (32%)', time: '8 hours ago' },
];

const mockRecommendations = [
  {
    id: 1,
    type: 'optimization',
    title: 'Optimize Cold Chain Route',
    description: 'Route optimization could reduce transfer time by 15% and save $2,400 monthly',
    impact: 'high',
    savings: 2400,
  },
  {
    id: 2,
    type: 'maintenance',
    title: 'Sensor Calibration Due',
    description: '8 sensors require calibration within the next 30 days',
    impact: 'medium',
    savings: 800,
  },
  {
    id: 3,
    type: 'efficiency',
    title: 'Batch Size Optimization',
    description: 'Increasing batch sizes for Product Category A could improve efficiency by 12%',
    impact: 'medium',
    savings: 1500,
  },
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

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('30days');
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['products', 'transfers', 'quality']);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, startDate, endDate]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // In production, fetch real analytics data
      // const data = await apiRequest.get('/analytics', { 
      //   params: { startDate, endDate, metrics: selectedMetrics }
      // });
      
      // Simulate API delay
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const now = new Date();
    
    switch (range) {
      case '7days':
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case '30days':
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case '3months':
        setStartDate(subMonths(now, 3));
        setEndDate(now);
        break;
      case '6months':
        setStartDate(subMonths(now, 6));
        setEndDate(now);
        break;
      case '1year':
        setStartDate(subMonths(now, 12));
        setEndDate(now);
        break;
      default:
        break;
    }
  };

  const handleExportData = async (format: string) => {
    try {
      toast.success(`Exporting analytics data as ${format.toUpperCase()}...`);
      // In production: await apiRequest.post('/analytics/export', { format, dateRange: { startDate, endDate } });
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon color="success" />;
      case 'down': return <TrendingDownIcon color="error" />;
      case 'stable': return <TrendingFlatIcon color="warning" />;
      default: return <TrendingFlatIcon />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <ErrorIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'info': return <InfoIcon color="info" />;
      default: return <InfoIcon />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Supply Chain Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="1year">Last Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportData('pdf')}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <InventoryIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{mockKPIData.totalProducts.toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Products
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {mockKPIData.activeProducts} active
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
                    <GroupIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{mockKPIData.totalParticipants}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Participants
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="success.main">
                        +12% this month
                      </Typography>
                    </Box>
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
                    <SpeedIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{mockKPIData.qualityScore}%</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quality Score
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="success.main">
                        +2.3% vs last month
                      </Typography>
                    </Box>
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
                    <MoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">${mockKPIData.costSavings.toLocaleString()}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cost Savings
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      This month
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Overview" icon={<AssessmentIcon />} />
            <Tab label="Supply Chain" icon={<ShippingIcon />} />
            <Tab label="IoT Sensors" icon={<SensorsIcon />} />
            <Tab label="Compliance" icon={<SecurityIcon />} />
            <Tab label="Insights" icon={<TimelineIcon />} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {/* Overview Charts */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Production & Transfer Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={mockProductionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="products"
                          stackId="1"
                          stroke="#2196f3"
                          fill="#2196f3"
                          fillOpacity={0.6}
                          name="Products Created"
                        />
                        <Area
                          type="monotone"
                          dataKey="transfers"
                          stackId="2"
                          stroke="#4caf50"
                          fill="#4caf50"
                          fillOpacity={0.6}
                          name="Transfers Completed"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Supply Chain Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={mockSupplyChainData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {mockSupplyChainData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ mt: 2 }}>
                      {mockSupplyChainData.map((entry, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              bgcolor: entry.color, 
                              borderRadius: '50%' 
                            }} 
                          />
                          <Typography variant="body2">
                            {entry.stage}: {entry.value}%
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quality Score Trend
                    </Typography>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={mockProductionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="quality"
                          stroke="#ff9800"
                          strokeWidth={3}
                          dot={{ fill: '#ff9800', strokeWidth: 2, r: 4 }}
                          name="Quality Score (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {/* Supply Chain Analytics */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Geographic Distribution
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Location</TableCell>
                            <TableCell align="right">Products</TableCell>
                            <TableCell align="right">Participants</TableCell>
                            <TableCell align="right">Utilization</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mockGeographicData.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.location}</TableCell>
                              <TableCell align="right">{row.products}</TableCell>
                              <TableCell align="right">{row.participants}</TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={(row.products / 200) * 100}
                                    sx={{ width: 60, height: 8, borderRadius: 4 }}
                                  />
                                  <Typography variant="body2">
                                    {Math.round((row.products / 200) * 100)}%
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Performance Metrics
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Network Uptime</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {mockKPIData.networkUptime}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={mockKPIData.networkUptime} 
                          sx={{ height: 8, borderRadius: 4 }}
                          color="success"
                        />
                      </Box>
                      
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Compliance Rate</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {mockKPIData.complianceRate}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={mockKPIData.complianceRate} 
                          sx={{ height: 8, borderRadius: 4 }}
                          color="primary"
                        />
                      </Box>
                      
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Sustainability Score</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {mockKPIData.sustainabilityScore}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={mockKPIData.sustainabilityScore} 
                          sx={{ height: 8, borderRadius: 4 }}
                          color="warning"
                        />
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'info.main', width: 32, height: 32 }}>
                          <TimeIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {mockKPIData.avgTransferTime}h
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Avg Transfer Time
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {/* IoT Sensor Analytics */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Sensor Data Trends
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={mockSensorData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="temperature"
                          stroke="#1976d2"
                          strokeWidth={2}
                          name="Temperature (°C)"
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="humidity"
                          stroke="#4caf50"
                          strokeWidth={2}
                          name="Humidity (%)"
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="alerts"
                          fill="#f44336"
                          name="Alert Count"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {/* Compliance Analytics */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Compliance Scores by Category
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Score</TableCell>
                            <TableCell align="right">Trend</TableCell>
                            <TableCell align="right">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {mockComplianceData.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.category}</TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="bold">
                                  {row.score}%
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {getTrendIcon(row.trend)}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={row.score >= 95 ? 'Excellent' : row.score >= 90 ? 'Good' : 'Needs Improvement'}
                                  color={row.score >= 95 ? 'success' : row.score >= 90 ? 'primary' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Alerts
                    </Typography>
                    <List>
                      {mockAlerts.slice(0, 4).map((alert) => (
                        <ListItem key={alert.id} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {getAlertIcon(alert.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                {alert.message}
                              </Typography>
                            }
                            secondary={alert.time}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            {/* AI Insights & Recommendations */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  AI-powered insights based on your supply chain data analysis. Recommendations are generated using machine learning algorithms.
                </Alert>
              </Grid>
              
              {mockRecommendations.map((recommendation) => (
                <Grid item xs={12} md={4} key={recommendation.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: `${getImpactColor(recommendation.impact)}.main` }}>
                          {recommendation.type === 'optimization' ? <SpeedIcon /> :
                           recommendation.type === 'maintenance' ? <BuildIcon /> :
                           <EcoIcon />}
                        </Avatar>
                        <Chip
                          label={`${recommendation.impact} impact`}
                          color={getImpactColor(recommendation.impact) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="h6" gutterBottom>
                        {recommendation.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {recommendation.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          ${recommendation.savings}/month savings
                        </Typography>
                        <Button size="small" variant="outlined">
                          View Details
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Predictive Analytics Summary
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">
                            15%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Predicted efficiency improvement next quarter
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="success.main">
                            $45K
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Potential cost savings over 6 months
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="warning.main">
                            3
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Critical optimizations required
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default Analytics;