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
  const initialTab = tabParam === 'security' ? 1 : 0;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

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


  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Handle URL parameter changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'security') {
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


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Update URL to reflect the current tab
    const tabNames = ['personal', 'security'];
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

  const handleTwoFactorToggle = () => {
    const newValue = !twoFactorAuth;
    setTwoFactorAuth(newValue);
    
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
                      secondary={twoFactorAuth ? 'Enabled' : 'Disabled'}
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={twoFactorAuth}
                        onChange={handleTwoFactorToggle}
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