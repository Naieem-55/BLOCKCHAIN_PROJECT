import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// Import all slice reducers
import authSlice from './authSlice';
import productSlice from './productSlice';
import participantSlice from './participantSlice';
import iotSlice from './iotSlice';
import uiSlice from './uiSlice';
import analyticsSlice from './analyticsSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  products: productSlice,
  participants: participantSlice,
  iot: iotSlice,
  ui: uiSlice,
  analytics: analyticsSlice,
});

// Persist configuration
const persistConfig = {
  key: 'supply-chain-root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and ui state
  blacklist: ['products', 'participants', 'iot', 'analytics'], // Don't persist data that should be fresh
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;