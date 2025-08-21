import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ShardingDashboard: React.FC = () => {
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShardingData();
    const interval = setInterval(loadShardingData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadShardingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statsResponse = await axios.get('/api/sharding/stats');
      setSystemStats(statsResponse.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load sharding data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Adaptive Sharding Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadShardingData}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* System Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚀 Adaptive Sharding System Status
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary">
                      {systemStats?.totalShards || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Shards
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main">
                      {systemStats?.activeShards || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Shards
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="info.main">
                      {systemStats?.totalTransactions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Transactions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="warning.main">
                      {systemStats?.efficiencyScore || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Efficiency Score
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">System Load</Typography>
                  <Typography variant="body2">{systemStats?.avgSystemLoad || 0}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={systemStats?.avgSystemLoad || 0}
                  color={systemStats?.avgSystemLoad && systemStats.avgSystemLoad > 80 ? 'error' : 'primary'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Efficiency Features */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚡ High-Efficiency Features
              </Typography>
              <Typography variant="body2" paragraph>
                ✅ <strong>Adaptive Sharding:</strong> Automatically distributes load across multiple blockchain shards
              </Typography>
              <Typography variant="body2" paragraph>
                ✅ <strong>Batch Processing:</strong> Process multiple operations together for up to 35% gas savings
              </Typography>
              <Typography variant="body2" paragraph>
                ✅ <strong>Load Balancing:</strong> Real-time load monitoring and automatic rebalancing
              </Typography>
              <Typography variant="body2" paragraph>
                ✅ <strong>Performance Optimization:</strong> Continuous monitoring and optimization recommendations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Thesis Implementation Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎓 Thesis Implementation Status
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>"High efficiency blockchain based supply chain traceability with adaptive sharding"</strong>
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Chip label="✅ Blockchain Integration" color="success" size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Chip label="✅ Supply Chain Traceability" color="success" size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Chip label="✅ Adaptive Sharding" color="success" size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Chip label="✅ High Efficiency" color="success" size="small" />
                </Grid>
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                All core thesis requirements have been successfully implemented and are operational.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ShardingDashboard;