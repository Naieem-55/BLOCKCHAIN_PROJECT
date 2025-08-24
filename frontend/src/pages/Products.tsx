import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Edit,
  Delete,
  Visibility,
  QrCode,
  LocalShipping,
  Inventory,
  Category,
  Timeline,
  Security,
  Speed,
  CloudSync,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api, { apiRequest } from '../services/api';
import productService from '../services/productService';

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  batchNumber: string;
  blockchainId?: string;
  transactionHash?: string;
  shardId?: string;
  blockchainEnabled?: boolean;
  manufacturer: {
    _id: string;
    name: string;
    email: string;
  };
  currentOwner: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  stage: number;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
}

interface ProductTraceData {
  product: Product;
  databaseHistory: any[];
  blockchain: {
    enabled: boolean;
    productId: string | null;
    transactionHash: string | null;
    shardId: string | null;
    history: any;
    isAuthentic: boolean | null;
  };
}

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    batchNumber: '',
    quantity: 0,
    unit: 'pcs',
    price: 0,
    expiryDate: '',
    initialLocation: '',
  });

  const categories = ['Electronics', 'Food', 'Textiles', 'Pharmaceuticals', 'Automotive', 'Other'];
  const units = ['pcs', 'kg', 'lbs', 'liters', 'meters', 'boxes'];
  const statuses = ['active', 'inactive', 'recalled'];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found');
        toast.error('Please login to view products');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      console.log('Fetching products from API...');
      const data = await apiRequest.get<Product[]>('/products');
      console.log('Products fetched:', data);
      
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      
      if (error.statusCode === 401 || error.code === 'HTTP_401') {
        toast.error('Please login to view products');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to fetch products');
      }
      
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to create products');
        window.location.href = '/login';
        return;
      }

      // Validate required fields
      if (!formData.name || !formData.description || !formData.category || !formData.batchNumber) {
        toast.error('Please fill all required fields');
        return;
      }

      // Prepare the data according to backend requirements
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate || undefined,
        initialLocation: formData.initialLocation || 'Warehouse',
        // Additional fields can be added to metadata
        metadata: {
          quantity: formData.quantity,
          unit: formData.unit,
          price: formData.price,
        }
      };

      console.log('Creating product with data:', productData);
      
      const newProduct = await apiRequest.post<Product>('/products', productData);
      
      toast.success('Product created successfully');
      setProducts([newProduct, ...products]);
      setOpenDialog(false);
      setFormData({
        name: '',
        description: '',
        category: '',
        batchNumber: '',
        quantity: 0,
        unit: 'pcs',
        price: 0,
        expiryDate: '',
        initialLocation: '',
      });
      fetchProducts(); // Refresh the products list
    } catch (error: any) {
      console.error('Product creation error:', error);
      if (error.statusCode === 401) {
        toast.error('Session expired. Please login again');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.details) {
        toast.error(error.details);
      } else {
        toast.error(error.message || 'Failed to create product');
      }
    }
  };

  const handleProductClick = async (productId: string) => {
    try {
      setFetchingDetails(true);
      setOpenDetailDialog(true);
      
      // Fetch detailed product information with blockchain traceability
      const traceData = await productService.getProductTrace(productId);
      setSelectedProduct(traceData);
      
      toast.success('Product details loaded with blockchain traceability');
    } catch (error: any) {
      console.error('Error fetching product details:', error);
      toast.error('Failed to load product details');
      setOpenDetailDialog(false);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted successfully');
      setProducts(products.filter(p => p._id !== id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const getStageLabel = (stage: number) => {
    const stages = [
      'Created',
      'Raw Material',
      'Manufacturing',
      'Quality Control',
      'Packaging',
      'Distribution',
      'Retail',
      'Sold',
      'Recalled'
    ];
    return stages[stage] || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'recalled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStageColor = (stage: number) => {
    if (stage <= 2) return 'info';
    if (stage <= 5) return 'primary';
    if (stage === 7) return 'success';
    if (stage === 8) return 'error';
    return 'default';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Products
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Add Product
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Products
                  </Typography>
                  <Typography variant="h4">
                    {products.length}
                  </Typography>
                </Box>
                <Inventory sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active
                  </Typography>
                  <Typography variant="h4">
                    {products.filter(p => p.status === 'active').length}
                  </Typography>
                </Box>
                <LocalShipping sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Categories
                  </Typography>
                  <Typography variant="h4">
                    {new Set(products.map(p => p.category)).size}
                  </Typography>
                </Box>
                <Category sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="h4">
                    ${products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toLocaleString()}
                  </Typography>
                </Box>
                <QrCode sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  {statuses.map(status => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(9)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body1" color="textSecondary">
                        No products found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow key={product._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {product.description.substring(0, 50)}...
                      </Typography>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      {product.quantity} {product.unit}
                    </TableCell>
                    <TableCell>${product.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStageLabel(product.stage)}
                        color={getStageColor(product.stage) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.status}
                        color={getStatusColor(product.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {product.currentOwner?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(product.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleProductClick(product._id)}
                        color="primary"
                        title="View Product Details with Blockchain Traceability"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/products/${product._id}`)}
                        color="info"
                        title="Edit Product"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteProduct(product._id)}
                        color="error"
                        title="Delete Product"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Product</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                helperText="Enter the product name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Batch Number *"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                required
                helperText="Unique batch identifier"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                helperText="Detailed product description"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category *"
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Initial Location"
                value={formData.initialLocation}
                onChange={(e) => setFormData({ ...formData, initialLocation: e.target.value })}
                helperText="Current location of product"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Product expiration date"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText="Unit price"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                helperText="Available quantity"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  label="Unit"
                >
                  {units.map(unit => (
                    <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2 }}>
            Fields marked with * are required. Make sure you're logged in to create products.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProduct} variant="contained">
            Create Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Product Detail Dialog with Blockchain Traceability */}
      <Dialog 
        open={openDetailDialog} 
        onClose={() => setOpenDetailDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Timeline color="primary" />
            Product Traceability Details
            {selectedProduct?.blockchain.enabled && (
              <Chip
                icon={<CloudSync />}
                label="Blockchain Enabled"
                color="success"
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {fetchingDetails ? (
            <Box sx={{ py: 4 }}>
              <Skeleton variant="rectangular" width="100%" height={60} />
              <Skeleton variant="text" sx={{ mt: 2 }} />
              <Skeleton variant="text" />
              <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
            </Box>
          ) : selectedProduct ? (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Basic Product Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Product Information
                    </Typography>
                    <Typography><strong>Name:</strong> {selectedProduct.product.name}</Typography>
                    <Typography><strong>Description:</strong> {selectedProduct.product.description}</Typography>
                    <Typography><strong>Category:</strong> {selectedProduct.product.category}</Typography>
                    <Typography><strong>Batch Number:</strong> {selectedProduct.product.batchNumber}</Typography>
                    <Typography><strong>Current Stage:</strong> {getStageLabel(selectedProduct.product.stage)}</Typography>
                    <Typography><strong>Status:</strong> 
                      <Chip 
                        label={selectedProduct.product.status} 
                        color={getStatusColor(selectedProduct.product.status) as any}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography><strong>Created:</strong> {format(new Date(selectedProduct.product.createdAt), 'MMM dd, yyyy HH:mm')}</Typography>
                    <Typography><strong>Owner:</strong> {selectedProduct.product.currentOwner?.name || 'N/A'}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Blockchain Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Security color="primary" />
                      <Typography variant="h6">
                        Blockchain Integration
                      </Typography>
                    </Box>
                    
                    {selectedProduct.blockchain.enabled ? (
                      <>
                        <Typography><strong>Blockchain ID:</strong> {selectedProduct.blockchain.productId}</Typography>
                        <Typography><strong>Transaction Hash:</strong> 
                          <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8em', wordBreak: 'break-all' }}>
                            {selectedProduct.blockchain.transactionHash}
                          </Box>
                        </Typography>
                        <Typography><strong>Shard ID:</strong> {selectedProduct.blockchain.shardId || 'N/A'}</Typography>
                        <Typography><strong>Authentic:</strong> 
                          <Chip 
                            label={selectedProduct.blockchain.isAuthentic ? 'Verified' : 'Unverified'} 
                            color={selectedProduct.blockchain.isAuthentic ? 'success' : 'warning'}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            icon={<Speed />}
                            label="High Efficiency Sharding Active"
                            color="info"
                            size="small"
                          />
                        </Box>
                      </>
                    ) : (
                      <Alert severity="info">
                        This product is not registered on the blockchain. Database tracking only.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Traceability History */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Traceability History
                    </Typography>
                    
                    {selectedProduct.databaseHistory && selectedProduct.databaseHistory.length > 0 ? (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Action</TableCell>
                              <TableCell>From</TableCell>
                              <TableCell>To</TableCell>
                              <TableCell>Location</TableCell>
                              <TableCell>Timestamp</TableCell>
                              <TableCell>Notes</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedProduct.databaseHistory.map((record: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{record.action}</TableCell>
                                <TableCell>{record.fromOwner || 'N/A'}</TableCell>
                                <TableCell>{record.toOwner || 'N/A'}</TableCell>
                                <TableCell>{record.toLocation || record.fromLocation || 'N/A'}</TableCell>
                                <TableCell>{format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
                                <TableCell>{record.notes || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="textSecondary">No history records available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
          {selectedProduct && (
            <Button 
              variant="contained" 
              onClick={() => navigate(`/products/${selectedProduct.product._id}`)}
            >
              Edit Product
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;