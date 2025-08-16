import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Product, 
  ProductFormData, 
  TransferProductData, 
  BatchTransferData,
  QualityCheck,
  ProductHistory,
  ProductFilter,
  ProductStats
} from '../types/product';
import { PaginatedResponse } from '../types';
import { productService } from '../services/productService';

interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  productHistory: ProductHistory[];
  qualityChecks: QualityCheck[];
  stats: ProductStats | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ProductFilter;
  searchQuery: string;
}

const initialState: ProductState = {
  products: [],
  currentProduct: null,
  productHistory: [],
  qualityChecks: [],
  stats: null,
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
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: { page?: number; limit?: number; filters?: ProductFilter; search?: string }, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await productService.getProductById(productId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch product');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData: ProductFormData, { rejectWithValue }) => {
    try {
      const response = await productService.createProduct(productData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }: { id: string; data: Partial<ProductFormData> }, { rejectWithValue }) => {
    try {
      const response = await productService.updateProduct(id, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update product');
    }
  }
);

export const transferProduct = createAsyncThunk(
  'products/transferProduct',
  async ({ productId, transferData }: { productId: string; transferData: TransferProductData }, { rejectWithValue }) => {
    try {
      const response = await productService.transferProduct(productId, transferData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to transfer product');
    }
  }
);

export const batchTransferProducts = createAsyncThunk(
  'products/batchTransferProducts',
  async (batchData: BatchTransferData, { rejectWithValue }) => {
    try {
      const response = await productService.batchTransferProducts(batchData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to batch transfer products');
    }
  }
);

export const addQualityCheck = createAsyncThunk(
  'products/addQualityCheck',
  async ({ productId, qualityData }: { productId: string; qualityData: any }, { rejectWithValue }) => {
    try {
      const response = await productService.addQualityCheck(productId, qualityData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add quality check');
    }
  }
);

export const fetchProductHistory = createAsyncThunk(
  'products/fetchProductHistory',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await productService.getProductHistory(productId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch product history');
    }
  }
);

export const fetchProductQualityChecks = createAsyncThunk(
  'products/fetchProductQualityChecks',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await productService.getProductQualityChecks(productId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch quality checks');
    }
  }
);

export const fetchProductStats = createAsyncThunk(
  'products/fetchProductStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getProductStats();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch product stats');
    }
  }
);

export const generateQRCode = createAsyncThunk(
  'products/generateQRCode',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await productService.generateQRCode(productId);
      return { productId, qrCode: response.qrCode };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate QR code');
    }
  }
);

export const verifyProduct = createAsyncThunk(
  'products/verifyProduct',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await productService.verifyProduct(productId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to verify product');
    }
  }
);

// Product slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProduct: (state, action: PayloadAction<Product | null>) => {
      state.currentProduct = action.payload;
    },
    setFilters: (state, action: PayloadAction<ProductFilter>) => {
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
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.productHistory = [];
      state.qualityChecks = [];
    },
    updateProductInList: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch product by ID
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
        state.error = null;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create product
    builder
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products.unshift(action.payload);
        state.error = null;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update product
    builder
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.currentProduct?.id === action.payload.id) {
          state.currentProduct = action.payload;
        }
        state.error = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Transfer product
    builder
      .addCase(transferProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(transferProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update product in the list
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.currentProduct?.id === action.payload.id) {
          state.currentProduct = action.payload;
        }
        state.error = null;
      })
      .addCase(transferProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Batch transfer products
    builder
      .addCase(batchTransferProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(batchTransferProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update multiple products in the list
        action.payload.forEach((updatedProduct: Product) => {
          const index = state.products.findIndex(p => p.id === updatedProduct.id);
          if (index !== -1) {
            state.products[index] = updatedProduct;
          }
        });
        state.error = null;
      })
      .addCase(batchTransferProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add quality check
    builder
      .addCase(addQualityCheck.fulfilled, (state, action) => {
        state.qualityChecks.unshift(action.payload);
        state.error = null;
      });

    // Fetch product history
    builder
      .addCase(fetchProductHistory.fulfilled, (state, action) => {
        state.productHistory = action.payload;
        state.error = null;
      });

    // Fetch product quality checks
    builder
      .addCase(fetchProductQualityChecks.fulfilled, (state, action) => {
        state.qualityChecks = action.payload;
        state.error = null;
      });

    // Fetch product stats
    builder
      .addCase(fetchProductStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.error = null;
      });

    // Generate QR code
    builder
      .addCase(generateQRCode.fulfilled, (state, action) => {
        const { productId, qrCode } = action.payload;
        const index = state.products.findIndex(p => p.id === productId);
        if (index !== -1) {
          state.products[index].qrCode = qrCode;
        }
        if (state.currentProduct?.id === productId) {
          state.currentProduct.qrCode = qrCode;
        }
        state.error = null;
      });
  },
});

// Actions
export const {
  clearError,
  setCurrentProduct,
  setFilters,
  setSearchQuery,
  setPagination,
  clearCurrentProduct,
  updateProductInList,
} = productSlice.actions;

// Selectors
export const selectProducts = (state: { products: ProductState }) => state.products.products;
export const selectCurrentProduct = (state: { products: ProductState }) => state.products.currentProduct;
export const selectProductHistory = (state: { products: ProductState }) => state.products.productHistory;
export const selectQualityChecks = (state: { products: ProductState }) => state.products.qualityChecks;
export const selectProductStats = (state: { products: ProductState }) => state.products.stats;
export const selectProductsLoading = (state: { products: ProductState }) => state.products.isLoading;
export const selectProductsError = (state: { products: ProductState }) => state.products.error;
export const selectProductsPagination = (state: { products: ProductState }) => state.products.pagination;
export const selectProductsFilters = (state: { products: ProductState }) => state.products.filters;
export const selectProductsSearchQuery = (state: { products: ProductState }) => state.products.searchQuery;

export default productSlice.reducer;