import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ToastMessage, ModalState } from '../types';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  modals: Record<string, ModalState>;
  notifications: ToastMessage[];
  loading: Record<string, boolean>;
  pageTitle: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  searchDialogOpen: boolean;
  commandPaletteOpen: boolean;
  fullScreenMode: boolean;
  settingsDialogOpen: boolean;
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  modals: {},
  notifications: [],
  loading: {},
  pageTitle: 'Dashboard',
  breadcrumbs: [],
  searchDialogOpen: false,
  commandPaletteOpen: false,
  fullScreenMode: false,
  settingsDialogOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar management
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    // Theme management
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },

    // Modal management
    openModal: (state, action: PayloadAction<{ id: string; type?: string; data?: any }>) => {
      const { id, type, data } = action.payload;
      state.modals[id] = {
        isOpen: true,
        type,
        data,
      };
    },
    closeModal: (state, action: PayloadAction<string>) => {
      const modalId = action.payload;
      if (state.modals[modalId]) {
        state.modals[modalId].isOpen = false;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalId => {
        state.modals[modalId].isOpen = false;
      });
    },
    setModalData: (state, action: PayloadAction<{ id: string; data: any }>) => {
      const { id, data } = action.payload;
      if (state.modals[id]) {
        state.modals[id].data = data;
      }
    },

    // Notification management
    addNotification: (state, action: PayloadAction<Omit<ToastMessage, 'id'>>) => {
      const notification: ToastMessage = {
        id: `notification-${Date.now()}-${Math.random()}`,
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    updateNotification: (state, action: PayloadAction<{ id: string; updates: Partial<ToastMessage> }>) => {
      const { id, updates } = action.payload;
      const index = state.notifications.findIndex(notification => notification.id === id);
      if (index !== -1) {
        state.notifications[index] = { ...state.notifications[index], ...updates };
      }
    },

    // Loading state management
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      const { key, isLoading } = action.payload;
      if (isLoading) {
        state.loading[key] = true;
      } else {
        delete state.loading[key];
      }
    },
    clearAllLoading: (state) => {
      state.loading = {};
    },

    // Page management
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; href?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<{ label: string; href?: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },

    // Dialog management
    setSearchDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.searchDialogOpen = action.payload;
    },
    toggleSearchDialog: (state) => {
      state.searchDialogOpen = !state.searchDialogOpen;
    },
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteOpen = action.payload;
    },
    toggleCommandPalette: (state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    },
    setSettingsDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.settingsDialogOpen = action.payload;
    },
    toggleSettingsDialog: (state) => {
      state.settingsDialogOpen = !state.settingsDialogOpen;
    },

    // Full screen mode
    setFullScreenMode: (state, action: PayloadAction<boolean>) => {
      state.fullScreenMode = action.payload;
    },
    toggleFullScreenMode: (state) => {
      state.fullScreenMode = !state.fullScreenMode;
    },

    // Reset UI state
    resetUIState: () => initialState,
  },
});

// Actions
export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleTheme,
  openModal,
  closeModal,
  closeAllModals,
  setModalData,
  addNotification,
  removeNotification,
  clearAllNotifications,
  updateNotification,
  setLoading,
  clearAllLoading,
  setPageTitle,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
  setSearchDialogOpen,
  toggleSearchDialog,
  setCommandPaletteOpen,
  toggleCommandPalette,
  setSettingsDialogOpen,
  toggleSettingsDialog,
  setFullScreenMode,
  toggleFullScreenMode,
  resetUIState,
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectModal = (modalId: string) => (state: { ui: UIState }) => state.ui.modals[modalId];
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectLoading = (state: { ui: UIState }) => state.ui.loading;
export const selectIsLoading = (key: string) => (state: { ui: UIState }) => state.ui.loading[key] || false;
export const selectPageTitle = (state: { ui: UIState }) => state.ui.pageTitle;
export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;
export const selectSearchDialogOpen = (state: { ui: UIState }) => state.ui.searchDialogOpen;
export const selectCommandPaletteOpen = (state: { ui: UIState }) => state.ui.commandPaletteOpen;
export const selectFullScreenMode = (state: { ui: UIState }) => state.ui.fullScreenMode;
export const selectSettingsDialogOpen = (state: { ui: UIState }) => state.ui.settingsDialogOpen;

// Helper selectors
export const selectIsAnyModalOpen = (state: { ui: UIState }) => {
  return Object.values(state.ui.modals).some(modal => modal.isOpen);
};

export const selectHasActiveNotifications = (state: { ui: UIState }) => {
  return state.ui.notifications.length > 0;
};

export const selectIsAnyLoading = (state: { ui: UIState }) => {
  return Object.keys(state.ui.loading).length > 0;
};

// Notification helper actions
export const showSuccessNotification = (message: string, title?: string) => 
  addNotification({
    type: 'success',
    title: title || 'Success',
    message,
    duration: 3000,
  });

export const showErrorNotification = (message: string, title?: string) => 
  addNotification({
    type: 'error',
    title: title || 'Error',
    message,
    duration: 5000,
  });

export const showWarningNotification = (message: string, title?: string) => 
  addNotification({
    type: 'warning',
    title: title || 'Warning',
    message,
    duration: 4000,
  });

export const showInfoNotification = (message: string, title?: string) => 
  addNotification({
    type: 'info',
    title: title || 'Info',
    message,
    duration: 4000,
  });

export default uiSlice.reducer;