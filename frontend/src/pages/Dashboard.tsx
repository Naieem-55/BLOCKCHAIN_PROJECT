import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Inventory,
  People,
  Sensors,
  Warning,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchDashboardStats,
  selectDashboardStats,
  selectAnalyticsLoading,
  selectAnalyticsError,
} from '../store/analyticsSlice';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  change?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value.toLocaleString()}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp 
                  sx={{ 
                    color: change >= 0 ? 'success.main' : 'error.main',
                    fontSize: 16,
                    mr: 0.5 
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ color: change >= 0 ? 'success.main' : 'error.main' }}
                >
                  {change >= 0 ? '+' : ''}{change}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              backgroundColor: `${color}.light`,
              color: `${color}.main` 
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(selectDashboardStats);
  const loading = useAppSelector(selectAnalyticsLoading);
  const error = useAppSelector(selectAnalyticsError);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No dashboard data available
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Overview of your supply chain traceability system
      </Typography>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Inventory />}
            color="primary"
            change={12}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Products"
            value={stats.activeProducts}
            icon={<CheckCircle />}
            color="success"
            change={8}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Participants"
            value={stats.totalParticipants}
            icon={<People />}
            color="info"
            change={3}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sensors"
            value={stats.activeSensors}
            icon={<Sensors />}
            color="warning"
            change={-2}
          />
        </Grid>

        {/* Quality and Health Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={stats.networkHealth}
                    size={60}
                    thickness={4}
                    sx={{ color: stats.networkHealth > 80 ? 'success.main' : 'warning.main' }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div" color="text.secondary">
                      {`${Math.round(stats.networkHealth)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Network Health
                  </Typography>
                  <Typography variant="h6">
                    {stats.networkHealth > 80 ? 'Excellent' : 'Good'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mr: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={stats.qualityScore}
                    size={60}
                    thickness={4}
                    sx={{ color: stats.qualityScore > 85 ? 'success.main' : 'warning.main' }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div" color="text.secondary">
                      {`${Math.round(stats.qualityScore)}%`}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Quality Score
                  </Typography>
                  <Typography variant="h6">
                    {stats.qualityScore > 85 ? 'High' : 'Medium'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Transactions Today
                </Typography>
                <Typography variant="h5" color="primary">
                  {stats.recentTransactions}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Alerts Today
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Warning 
                    sx={{ 
                      color: stats.alertsToday > 5 ? 'error.main' : 'warning.main',
                      fontSize: 20,
                      mr: 0.5 
                    }} 
                  />
                  <Typography 
                    variant="h6" 
                    sx={{ color: stats.alertsToday > 5 ? 'error.main' : 'text.primary' }}
                  >
                    {stats.alertsToday}
                  </Typography>
                </Box>
              </Box>

              {stats.alertsToday > 0 && (
                <Alert 
                  severity={stats.alertsToday > 5 ? "error" : "warning"} 
                  sx={{ mt: 2 }}
                >
                  {stats.alertsToday > 5 
                    ? `${stats.alertsToday} alerts require immediate attention`
                    : `${stats.alertsToday} alerts to review`
                  }
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Common tasks and shortcuts will be available here
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;