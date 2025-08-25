import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Paper,
  Chip,
  Button,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  QrCode,
  Verified,
  LocalShipping,
  Timeline,
  LocationOn,
  Assessment,
  BlockOutlined,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { productService } from '../services/productService';
import { LifecycleTracker } from '../components/ProductLifecycle/LifecycleTracker';
import { LocationTracker } from '../components/LocationTracking/LocationTracker';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
      verifyProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const product = await productService.getProductById(id!);
      setProduct(product);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product');
    } finally {
      setLoading(false);
    }
  };

  const verifyProduct = async () => {
    try {
      const verificationStatus = await productService.verifyProduct(id!);
      setVerificationStatus(verificationStatus);
    } catch (err) {
      console.error('Failed to verify product:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProductUpdate = () => {
    fetchProduct();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading product details...</Typography>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box>
        <Alert severity="error">
          {error || 'Product not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/products')}
          sx={{ mt: 2 }}
        >
          Back to Products
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/products')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            {product.name}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="View QR Code">
            <IconButton>
              <QrCode />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Product Info Card */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Product Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Batch Number
                  </Typography>
                  <Typography variant="body1">{product.batchNumber}</Typography>
                </Grid>
                
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Category
                  </Typography>
                  <Typography variant="body1">
                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Current Stage
                  </Typography>
                  <Typography variant="body1">
                    <Chip
                      label={product.stageName || 'Unknown'}
                      color="primary"
                      size="small"
                    />
                  </Typography>
                </Grid>
                
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Current Location
                  </Typography>
                  <Typography variant="body1">{product.currentLocation}</Typography>
                </Grid>
                
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Expiry Date
                  </Typography>
                  <Typography variant="body1">
                    {product.expiryDate
                      ? format(new Date(product.expiryDate), 'MMM dd, yyyy')
                      : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Status
                  </Typography>
                  <Typography variant="body1">
                    <Chip
                      label={product.isActive ? 'Active' : 'Inactive'}
                      color={product.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{product.description}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verification Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {verificationStatus ? (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Verified
                      color={verificationStatus.isAuthentic ? 'success' : 'error'}
                      sx={{ mr: 1 }}
                    />
                    <Typography
                      variant="h6"
                      color={verificationStatus.isAuthentic ? 'success.main' : 'error.main'}
                    >
                      {verificationStatus.isAuthentic ? 'Verified' : 'Not Verified'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Authenticity Score: {verificationStatus.authenticityScore || 0}%
                  </Typography>
                  
                  {verificationStatus.blockchain && (
                    <Chip
                      icon={<BlockOutlined />}
                      label="On Blockchain"
                      color="info"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  )}
                  
                  {product.blockchain?.transactionHash && (
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                      Tx: {product.blockchain.transactionHash.substring(0, 10)}...
                    </Typography>
                  )}
                </>
              ) : (
                <Typography color="textSecondary">Verification pending...</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="product detail tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<Timeline />}
            label="Lifecycle"
            id="product-tab-0"
            aria-controls="product-tabpanel-0"
          />
          <Tab
            icon={<LocationOn />}
            label="Location Tracking"
            id="product-tab-1"
            aria-controls="product-tabpanel-1"
          />
          <Tab
            icon={<Verified />}
            label="Quality Checks"
            id="product-tab-2"
            aria-controls="product-tabpanel-2"
          />
          <Tab
            icon={<Assessment />}
            label="Analytics"
            id="product-tab-3"
            aria-controls="product-tabpanel-3"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <LifecycleTracker productId={id!} onUpdate={handleProductUpdate} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <LocationTracker productId={id!} onUpdate={handleProductUpdate} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quality Checks
              </Typography>
              {product.qualityChecks && product.qualityChecks.length > 0 ? (
                <Grid container spacing={2}>
                  {product.qualityChecks.map((check: any, index: number) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="primary">
                            {check.checkType.replace('_', ' ').toUpperCase()}
                          </Typography>
                          <Chip
                            label={check.passed ? 'Passed' : 'Failed'}
                            color={check.passed ? 'success' : 'error'}
                            size="small"
                            sx={{ mt: 1, mb: 1 }}
                          />
                          {check.notes && (
                            <Typography variant="body2" color="textSecondary">
                              {check.notes}
                            </Typography>
                          )}
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            {format(new Date(check.timestamp), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="textSecondary">No quality checks recorded</Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Analytics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {product.history?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total Events
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {product.qualityChecks?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Quality Checks
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {product.locationHistory?.length || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Locations
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {verificationStatus?.authenticityScore || 0}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Authenticity
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ProductDetail;