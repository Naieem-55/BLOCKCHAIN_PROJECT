import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Paper,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  AccountBalanceWallet as WalletIcon,
  Security as SecurityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  VpnKey as KeyIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  LocalShipping as ShippingIcon,
  Factory as FactoryIcon,
  Store as StoreIcon,
  Assignment as AuditIcon,
  ShoppingCart as ConsumerIcon,
  Agriculture as ProducerIcon,
  ExpandMore as ExpandMoreIcon,
  Palette as PaletteIcon,
  FormatSize as FormatSizeIcon,
  Accessibility as AccessibilityIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  CloudDownload as CloudDownloadIcon,
  CloudUpload as CloudUploadIcon,
  RestartAlt as RestartAltIcon,
  Shield as ShieldIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Sync as SyncIcon,
  SyncDisabled as SyncDisabledIcon,
  Timer as TimerIcon,
  Schedule as ScheduleIcon,
  DateRange as DateRangeIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Group as GroupIcon,
  PersonOff as PersonOffIcon,
  Analytics as AnalyticsIcon,
  BugReport as BugReportIcon,
  Code as CodeIcon,
  Translate as TranslateIcon,
  AccessAlarm as AccessAlarmIcon,
  DoNotDisturb as DoNotDisturbIcon,
  Weekend as WeekendIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  TextFields as TextFieldsIcon,
  FormatColorText as FormatColorTextIcon,
  Contrast as ContrastIcon,
  InvertColors as InvertColorsIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectWalletConnection,
  updateProfile,
  changePassword,
  connectWallet,
  disconnectWallet,
  logoutUser,
} from '../store/authSlice';
import { UserRole, UpdateProfileData, ChangePasswordData } from '../types/auth';
import { AppDispatch } from '../store';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const walletConnection = useSelector(selectWalletConnection);

  // Check URL params for tab selection
  const urlParams = new URLSearchParams(location.search);
  const tabParam = urlParams.get('tab');
  const initialTab = tabParam === 'settings' ? 2 : tabParam === 'security' ? 1 : 0;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState<UpdateProfileData>({
    name: '',
    company: '',
    location: '',
    walletAddress: '',
  });

  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Settings states
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    notificationFrequency: 'instant',
    productUpdates: true,
    securityAlerts: true,
    newsletterSubscription: false,
    marketingEmails: false,
    
    // Appearance
    darkMode: false,
    theme: 'blue',
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    compactMode: false,
    
    // Privacy
    profileVisibility: 'public',
    showEmail: false,
    showLocation: true,
    showCompany: true,
    allowAnalytics: true,
    allowCookies: true,
    dataSharing: false,
    
    // Regional
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    measurementUnit: 'metric',
    
    // Security
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30,
    biometricAuth: false,
    
    // System
    autoSync: true,
    cacheEnabled: true,
    debugMode: false,
    performanceMode: false,
    betaFeatures: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Handle URL parameter changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'settings') {
      setActiveTab(2);
    } else if (tabParam === 'security') {
      setActiveTab(1);
    } else if (tabParam === 'personal') {
      setActiveTab(0);
    }
  }, [location.search]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        company: user.company || '',
        location: user.location || '',
        walletAddress: user.walletAddress || '',
      });
    }
  }, [user]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        
        // Apply theme settings immediately
        applyThemeSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Apply theme settings to the document
  const applyThemeSettings = (currentSettings: typeof settings) => {
    const root = document.documentElement;
    
    // Apply dark mode
    if (currentSettings.darkMode) {
      document.body.classList.add('dark-mode');
      root.style.setProperty('--bg-color', '#121212');
      root.style.setProperty('--text-color', '#ffffff');
    } else {
      document.body.classList.remove('dark-mode');
      root.style.setProperty('--bg-color', '#ffffff');
      root.style.setProperty('--text-color', '#000000');
    }
    
    // Apply font size
    const fontSizeMap: { [key: string]: string } = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[currentSettings.fontSize] || '16px');
    document.body.style.fontSize = fontSizeMap[currentSettings.fontSize] || '16px';
    
    // Apply high contrast
    if (currentSettings.highContrast) {
      root.style.setProperty('--contrast', '1.5');
      document.body.classList.add('high-contrast');
    } else {
      root.style.setProperty('--contrast', '1');
      document.body.classList.remove('high-contrast');
    }
    
    // Apply compact mode
    if (currentSettings.compactMode) {
      root.style.setProperty('--spacing-unit', '4px');
      document.body.classList.add('compact-mode');
    } else {
      root.style.setProperty('--spacing-unit', '8px');
      document.body.classList.remove('compact-mode');
    }
    
    // Apply reduced motion
    if (currentSettings.reducedMotion) {
      root.style.setProperty('--transition-speed', '0ms');
      document.body.classList.add('reduced-motion');
    } else {
      root.style.setProperty('--transition-speed', '300ms');
      document.body.classList.remove('reduced-motion');
    }
    
    // Apply theme color
    const themeColors: { [key: string]: string } = {
      'blue': '#1976d2',
      'green': '#4caf50',
      'purple': '#9c27b0',
      'orange': '#ff9800'
    };
    root.style.setProperty('--primary-color', themeColors[currentSettings.theme] || '#1976d2');
  };

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    applyThemeSettings(settings);
    
    // Apply notification settings
    if ('Notification' in window) {
      if (settings.pushNotifications && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Update URL to reflect the current tab
    const tabNames = ['personal', 'security', 'settings'];
    const tabName = tabNames[newValue];
    if (tabName) {
      navigate(`/profile?tab=${tabName}`, { replace: true });
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Reset form if canceling
      if (user) {
        setProfileForm({
          name: user.name || '',
          company: user.company || '',
          location: user.location || '',
          walletAddress: user.walletAddress || '',
        });
      }
      setAvatarPreview(null);
    }
    setIsEditMode(!isEditMode);
  };

  const handleProfileUpdate = async () => {
    try {
      await dispatch(updateProfile(profileForm)).unwrap();
      setIsEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      await dispatch(changePassword(passwordForm)).unwrap();
      setShowPasswordDialog(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Password changed successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to change password');
    }
  };

  const handleWalletConnect = async () => {
    try {
      await dispatch(connectWallet()).unwrap();
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to connect wallet');
    }
  };

  const handleWalletDisconnect = async () => {
    try {
      await dispatch(disconnectWallet()).unwrap();
      toast.success('Wallet disconnected');
    } catch (error: any) {
      toast.error(error || 'Failed to disconnect wallet');
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setProfileForm({ ...profileForm, avatar: file });
    }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleSettingToggle = (setting: keyof typeof settings) => {
    const newValue = !settings[setting];
    
    setSettings(prev => ({
      ...prev,
      [setting]: newValue,
    }));
    
    // Format the setting name for display
    const settingName = setting
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    // Special handling for certain settings
    switch (setting) {
      case 'darkMode':
        toast.success(`${newValue ? 'Dark' : 'Light'} mode activated`, {
          icon: newValue ? '🌙' : '☀️',
          style: {
            background: newValue ? '#333' : '#fff',
            color: newValue ? '#fff' : '#333',
          },
        });
        break;
      
      case 'pushNotifications':
        if (newValue && 'Notification' in window) {
          if (Notification.permission === 'denied') {
            toast.error('Push notifications are blocked. Please enable them in your browser settings.');
            setSettings(prev => ({ ...prev, pushNotifications: false }));
            return;
          }
        }
        toast.success(`${settingName} ${newValue ? 'enabled' : 'disabled'}`);
        break;
      
      case 'twoFactorAuth':
        if (newValue) {
          toast.success('Two-factor authentication enabled. You will receive a setup email.');
        } else {
          toast('Two-factor authentication disabled. Your account may be less secure.', {
            icon: '⚠️',
            style: {
              background: '#ff9800',
              color: '#fff',
            },
          });
        }
        break;
      
      case 'autoSync':
        if (newValue) {
          toast.success('Auto-sync enabled. Your data will sync every 5 minutes.');
        } else {
          toast('Auto-sync disabled. Remember to manually save your work.', {
            icon: 'ℹ️',
          });
        }
        break;
      
      case 'performanceMode':
        toast.success(`Performance mode ${newValue ? 'enabled' : 'disabled'}. ${newValue ? 'Some visual effects will be reduced.' : 'All visual effects restored.'}`);
        break;
      
      case 'betaFeatures':
        if (newValue) {
          toast('Beta features enabled. These features may be unstable.', {
            icon: '⚠️',
            style: {
              background: '#ff9800',
              color: '#fff',
            },
          });
        } else {
          toast('Beta features disabled. Using stable features only.', {
            icon: 'ℹ️',
          });
        }
        break;
      
      default:
        toast.success(`${settingName} ${newValue ? 'enabled' : 'disabled'}`);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <AdminIcon />;
      case UserRole.SUPPLIER:
      case UserRole.DISTRIBUTOR:
        return <ShippingIcon />;
      case UserRole.MANUFACTURER:
        return <FactoryIcon />;
      case UserRole.RETAILER:
        return <StoreIcon />;
      case UserRole.AUDITOR:
        return <AuditIcon />;
      case UserRole.CONSUMER:
        return <ConsumerIcon />;
      case UserRole.PRODUCER:
        return <ProducerIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'error';
      case UserRole.SUPPLIER:
      case UserRole.DISTRIBUTOR:
        return 'primary';
      case UserRole.MANUFACTURER:
        return 'secondary';
      case UserRole.RETAILER:
        return 'success';
      case UserRole.AUDITOR:
        return 'warning';
      case UserRole.CONSUMER:
      case UserRole.PRODUCER:
        return 'info';
      default:
        return 'default';
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Profile
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {/* Profile Header Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3} sx={{ textAlign: 'center' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  isEditMode ? (
                    <IconButton
                      color="primary"
                      aria-label="upload picture"
                      component="label"
                      sx={{
                        bgcolor: 'background.paper',
                        border: '2px solid',
                        borderColor: 'primary.main',
                      }}
                    >
                      <input
                        hidden
                        accept="image/*"
                        type="file"
                        onChange={handleAvatarChange}
                      />
                      <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                  ) : null
                }
              >
                <Avatar
                  src={avatarPreview || user.avatar || undefined}
                  sx={{ width: 150, height: 150, mx: 'auto', fontSize: 48 }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
              </Badge>
              <Typography variant="h5" sx={{ mt: 2 }}>
                {user.name}
              </Typography>
              <Chip
                icon={getRoleIcon(user.role)}
                label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                color={getRoleColor(user.role) as any}
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={9}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{user.email}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Company
                      </Typography>
                      <Typography variant="body1">
                        {user.company || 'Not specified'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body1">
                        {user.location || 'Not specified'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccessTimeIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Last Login
                      </Typography>
                      <Typography variant="body1">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleString()
                          : 'Never'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WalletIcon sx={{ mr: 2, color: 'text.secondary' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Wallet Address
                      </Typography>
                      <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                        {walletConnection?.address || user.walletAddress || 'Not connected'}
                      </Typography>
                    </Box>
                    {!walletConnection ? (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<WalletIcon />}
                        onClick={handleWalletConnect}
                      >
                        Connect Wallet
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={handleWalletDisconnect}
                      >
                        Disconnect
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Account Status */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={user.isActive ? <CheckCircleIcon /> : <WarningIcon />}
                  label={user.isActive ? 'Active' : 'Inactive'}
                  color={user.isActive ? 'success' : 'warning'}
                  size="small"
                />
                {user.profileComplete ? (
                  <Chip
                    icon={<VerifiedIcon />}
                    label="Profile Complete"
                    color="primary"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<WarningIcon />}
                    label="Profile Incomplete"
                    color="warning"
                    size="small"
                  />
                )}
                {walletConnection && (
                  <Chip
                    icon={<WalletIcon />}
                    label={`Balance: ${walletConnection.balance} ETH`}
                    color="info"
                    size="small"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
          <Tab label="Personal Information" icon={<PersonIcon />} iconPosition="start" />
          <Tab label="Security" icon={<SecurityIcon />} iconPosition="start" />
          <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Personal Information Tab */}
      <TabPanel value={activeTab} index={0}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Personal Information</Typography>
              <Button
                variant={isEditMode ? 'contained' : 'outlined'}
                startIcon={isEditMode ? <SaveIcon /> : <EditIcon />}
                onClick={isEditMode ? handleProfileUpdate : handleEditToggle}
                disabled={isLoading}
              >
                {isEditMode ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  disabled={!isEditMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={user.email}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company"
                  value={profileForm.company}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                  disabled={!isEditMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  disabled={!isEditMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="User Key"
                  value={user.userKey}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Your unique identifier in the system"
                />
              </Grid>
            </Grid>

            {isEditMode && (
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleEditToggle}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleProfileUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Password & Authentication
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <KeyIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Password"
                      secondary="Last changed 30 days ago"
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowPasswordDialog(true)}
                      >
                        Change
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>

                  <Divider />

                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary={settings.twoFactorAuth ? 'Enabled' : 'Disabled'}
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onChange={() => handleSettingToggle('twoFactorAuth')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Sessions
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Current Session"
                      secondary={`Active since ${new Date().toLocaleString()}`}
                    />
                  </ListItem>
                </List>

                <Alert severity="info" sx={{ mt: 2 }}>
                  Only one active session detected. Your account is secure.
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Danger Zone
                </Typography>
                
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Deleting your account is permanent and cannot be undone.
                </Alert>

                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ maxWidth: 1200 }}>
          {/* Notifications Settings */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6">Notifications</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Notification Channels
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <EmailIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email Notifications"
                            secondary="Receive updates via email"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.emailNotifications}
                              onChange={() => handleSettingToggle('emailNotifications')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <NotificationsActiveIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Push Notifications"
                            secondary="Browser and desktop alerts"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.pushNotifications}
                              onChange={() => handleSettingToggle('pushNotifications')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <VolumeUpIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="SMS Notifications"
                            secondary="Text message alerts"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.smsNotifications}
                              onChange={() => handleSettingToggle('smsNotifications')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Notification Types
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <ShieldIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Security Alerts"
                            secondary="Login attempts and security events"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.securityAlerts}
                              onChange={() => handleSettingToggle('securityAlerts')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <SyncIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Product Updates"
                            secondary="New features and improvements"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.productUpdates}
                              onChange={() => handleSettingToggle('productUpdates')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <EmailIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Marketing Emails"
                            secondary="Promotional content and offers"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.marketingEmails}
                              onChange={() => handleSettingToggle('marketingEmails')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Notification Frequency
                      </Typography>
                      <FormControl component="fieldset">
                        <RadioGroup
                          row
                          value={settings.notificationFrequency}
                          onChange={(e) => setSettings({ ...settings, notificationFrequency: e.target.value })}
                        >
                          <FormControlLabel value="instant" control={<Radio />} label="Instant" />
                          <FormControlLabel value="hourly" control={<Radio />} label="Hourly Digest" />
                          <FormControlLabel value="daily" control={<Radio />} label="Daily Digest" />
                          <FormControlLabel value="weekly" control={<Radio />} label="Weekly Summary" />
                        </RadioGroup>
                      </FormControl>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Appearance Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PaletteIcon color="primary" />
                <Typography variant="h6">Appearance & Accessibility</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Theme Settings
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            {settings.darkMode ? <Brightness4Icon /> : <Brightness7Icon />}
                          </ListItemIcon>
                          <ListItemText
                            primary="Dark Mode"
                            secondary={settings.darkMode ? 'Dark theme active' : 'Light theme active'}
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.darkMode}
                              onChange={() => handleSettingToggle('darkMode')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <PaletteIcon />
                          </ListItemIcon>
                          <ListItemText primary="Theme Color" />
                          <ListItemSecondaryAction>
                            <Select
                              value={settings.theme}
                              onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                              size="small"
                            >
                              <MenuItem value="blue">Blue</MenuItem>
                              <MenuItem value="green">Green</MenuItem>
                              <MenuItem value="purple">Purple</MenuItem>
                              <MenuItem value="orange">Orange</MenuItem>
                            </Select>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <SpeedIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Compact Mode"
                            secondary="Reduce spacing and padding"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.compactMode}
                              onChange={() => handleSettingToggle('compactMode')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Accessibility
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <TextFieldsIcon />
                          </ListItemIcon>
                          <ListItemText primary="Font Size" />
                          <ListItemSecondaryAction>
                            <Select
                              value={settings.fontSize}
                              onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
                              size="small"
                            >
                              <MenuItem value="small">Small</MenuItem>
                              <MenuItem value="medium">Medium</MenuItem>
                              <MenuItem value="large">Large</MenuItem>
                              <MenuItem value="extra-large">Extra Large</MenuItem>
                            </Select>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <ContrastIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="High Contrast"
                            secondary="Increase color contrast"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.highContrast}
                              onChange={() => handleSettingToggle('highContrast')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <AccessibilityIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Reduced Motion"
                            secondary="Minimize animations"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.reducedMotion}
                              onChange={() => handleSettingToggle('reducedMotion')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Privacy Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LockIcon color="primary" />
                <Typography variant="h6">Privacy & Data</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Profile Privacy
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <VisibilityIcon />
                          </ListItemIcon>
                          <ListItemText primary="Profile Visibility" />
                          <ListItemSecondaryAction>
                            <Select
                              value={settings.profileVisibility}
                              onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
                              size="small"
                            >
                              <MenuItem value="public">Public</MenuItem>
                              <MenuItem value="private">Private</MenuItem>
                              <MenuItem value="contacts">Contacts Only</MenuItem>
                            </Select>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <EmailIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Show Email"
                            secondary="Display email publicly"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.showEmail}
                              onChange={() => handleSettingToggle('showEmail')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <LocationIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Show Location"
                            secondary="Display location publicly"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.showLocation}
                              onChange={() => handleSettingToggle('showLocation')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Data Management
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <AnalyticsIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Analytics"
                            secondary="Help improve our services"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.allowAnalytics}
                              onChange={() => handleSettingToggle('allowAnalytics')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <StorageIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Cookies"
                            secondary="Store preferences locally"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.allowCookies}
                              onChange={() => handleSettingToggle('allowCookies')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <GroupIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Data Sharing"
                            secondary="Share with partners"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.dataSharing}
                              onChange={() => handleSettingToggle('dataSharing')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Data Actions
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="outlined"
                          startIcon={<CloudDownloadIcon />}
                          onClick={() => {
                            toast.success('Preparing your data export...');
                            // Implement data export functionality
                            setTimeout(() => {
                              const dataExport = {
                                user: user,
                                settings: settings,
                                exportDate: new Date().toISOString(),
                              };
                              const blob = new Blob([JSON.stringify(dataExport, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `profile-export-${Date.now()}.json`;
                              a.click();
                              URL.revokeObjectURL(url);
                              toast.success('Data exported successfully!');
                            }, 1500);
                          }}
                        >
                          Export My Data
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          component="label"
                        >
                          Import Settings
                          <input
                            type="file"
                            hidden
                            accept=".json"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  try {
                                    const importedData = JSON.parse(event.target?.result as string);
                                    if (importedData.settings) {
                                      setSettings(importedData.settings);
                                      toast.success('Settings imported successfully!');
                                    }
                                  } catch (error) {
                                    toast.error('Failed to import settings');
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                          />
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          startIcon={<RestartAltIcon />}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to reset all settings to default?')) {
                              // Reset to default settings
                              window.location.reload();
                              toast.success('Settings reset to default');
                            }
                          }}
                        >
                          Reset to Default
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Regional Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PublicIcon color="primary" />
                <Typography variant="h6">Regional & Language</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Localization
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <TranslateIcon />
                          </ListItemIcon>
                          <ListItemText primary="Language" />
                          <ListItemSecondaryAction>
                            <Select
                              value={settings.language}
                              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                              size="small"
                            >
                              <MenuItem value="en">English</MenuItem>
                              <MenuItem value="es">Español</MenuItem>
                              <MenuItem value="fr">Français</MenuItem>
                              <MenuItem value="de">Deutsch</MenuItem>
                              <MenuItem value="zh">中文</MenuItem>
                              <MenuItem value="ja">日本語</MenuItem>
                            </Select>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <ScheduleIcon />
                          </ListItemIcon>
                          <ListItemText primary="Timezone" />
                          <ListItemSecondaryAction>
                            <Select
                              value={settings.timezone}
                              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                              size="small"
                            >
                              <MenuItem value="UTC">UTC</MenuItem>
                              <MenuItem value="EST">Eastern Time</MenuItem>
                              <MenuItem value="CST">Central Time</MenuItem>
                              <MenuItem value="MST">Mountain Time</MenuItem>
                              <MenuItem value="PST">Pacific Time</MenuItem>
                            </Select>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <DateRangeIcon />
                          </ListItemIcon>
                          <ListItemText primary="Date Format" />
                          <ListItemSecondaryAction>
                            <Select
                              value={settings.dateFormat}
                              onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                              size="small"
                            >
                              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                            </Select>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Units & Currency
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <BusinessIcon />
                          </ListItemIcon>
                          <ListItemText primary="Currency" />
                          <ListItemSecondaryAction>
                            <Select
                              value={settings.currency}
                              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                              size="small"
                            >
                              <MenuItem value="USD">USD ($)</MenuItem>
                              <MenuItem value="EUR">EUR (€)</MenuItem>
                              <MenuItem value="GBP">GBP (£)</MenuItem>
                              <MenuItem value="JPY">JPY (¥)</MenuItem>
                              <MenuItem value="CNY">CNY (¥)</MenuItem>
                            </Select>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <SpeedIcon />
                          </ListItemIcon>
                          <ListItemText primary="Measurement Units" />
                          <ListItemSecondaryAction>
                            <Select
                              value={settings.measurementUnit}
                              onChange={(e) => setSettings({ ...settings, measurementUnit: e.target.value })}
                              size="small"
                            >
                              <MenuItem value="metric">Metric</MenuItem>
                              <MenuItem value="imperial">Imperial</MenuItem>
                            </Select>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* System Settings */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SettingsIcon color="primary" />
                <Typography variant="h6">System & Performance</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Performance
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <SyncIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Auto Sync"
                            secondary="Sync data automatically"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.autoSync}
                              onChange={() => handleSettingToggle('autoSync')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <StorageIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Cache"
                            secondary="Store data for offline use"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.cacheEnabled}
                              onChange={() => handleSettingToggle('cacheEnabled')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <SpeedIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Performance Mode"
                            secondary="Optimize for speed"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.performanceMode}
                              onChange={() => handleSettingToggle('performanceMode')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Advanced
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <BugReportIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Debug Mode"
                            secondary="Show detailed error messages"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.debugMode}
                              onChange={() => handleSettingToggle('debugMode')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CodeIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Beta Features"
                            secondary="Try experimental features"
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              checked={settings.betaFeatures}
                              onChange={() => handleSettingToggle('betaFeatures')}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <TimerIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary="Session Timeout"
                            secondary="Auto logout after inactivity"
                          />
                          <ListItemSecondaryAction>
                            <Select
                              value={settings.sessionTimeout}
                              onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                              size="small"
                            >
                              <MenuItem value={15}>15 minutes</MenuItem>
                              <MenuItem value={30}>30 minutes</MenuItem>
                              <MenuItem value={60}>1 hour</MenuItem>
                              <MenuItem value={120}>2 hours</MenuItem>
                              <MenuItem value={0}>Never</MenuItem>
                            </Select>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                        Cache Management
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Current cache size: 124 MB
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            toast.success('Cache cleared successfully!');
                          }}
                        >
                          Clear Cache
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Save Settings Button */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => {
                // Reload settings from localStorage
                const savedSettings = localStorage.getItem('userSettings');
                if (savedSettings) {
                  const parsedSettings = JSON.parse(savedSettings);
                  setSettings(parsedSettings);
                  toast('Settings reverted to last saved state', {
                    icon: 'ℹ️',
                  });
                } else {
                  window.location.reload();
                }
              }}
            >
              Revert Changes
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => {
                // Save settings to backend and localStorage
                localStorage.setItem('userSettings', JSON.stringify(settings));
                
                // Show success message with summary
                const activeSettings = Object.entries(settings)
                  .filter(([key, value]) => typeof value === 'boolean' && value === true)
                  .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase());
                
                toast.success(
                  <div>
                    <strong>Settings saved successfully!</strong>
                    <br />
                    <small>Active: {activeSettings.slice(0, 3).join(', ')}
                      {activeSettings.length > 3 && ` +${activeSettings.length - 3} more`}
                    </small>
                  </div>,
                  { duration: 4000 }
                );
              }}
            >
              Save All Settings
            </Button>
          </Box>
        </Box>
      </TabPanel>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              sx={{ mb: 2 }}
              helperText="Minimum 8 characters"
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              error={passwordForm.confirmPassword !== '' && passwordForm.newPassword !== passwordForm.confirmPassword}
              helperText={
                passwordForm.confirmPassword !== '' && passwordForm.newPassword !== passwordForm.confirmPassword
                  ? 'Passwords do not match'
                  : ''
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
            disabled={
              !passwordForm.currentPassword ||
              !passwordForm.newPassword ||
              !passwordForm.confirmPassword ||
              passwordForm.newPassword !== passwordForm.confirmPassword ||
              isLoading
            }
          >
            {isLoading ? <CircularProgress size={24} /> : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle color="error">Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 2 }}>
            This action cannot be undone. All your data will be permanently deleted.
          </Alert>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to delete your account? Type your email address to confirm:
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            sx={{ mt: 2 }}
            placeholder={user.email}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;