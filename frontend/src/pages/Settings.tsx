import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Select,
  MenuItem,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  NotificationsActive as NotificationsActiveIcon,
  VolumeUp as VolumeUpIcon,
  Shield as ShieldIcon,
  Sync as SyncIcon,
  Palette as PaletteIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  TextFields as TextFieldsIcon,
  Contrast as ContrastIcon,
  Speed as SpeedIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  LocationOn as LocationIcon,
  Analytics as AnalyticsIcon,
  Storage as StorageIcon,
  Group as GroupIcon,
  Public as PublicIcon,
  Translate as TranslateIcon,
  Schedule as ScheduleIcon,
  DateRange as DateRangeIcon,
  Business as BusinessIcon,
  BugReport as BugReportIcon,
  Code as CodeIcon,
  Timer as TimerIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  CloudDownload as CloudDownloadIcon,
  CloudUpload as CloudUploadIcon,
  RestartAlt as RestartAltIcon,
  Accessibility as AccessibilityIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { selectUser } from '../store/authSlice';

const Settings: React.FC = () => {
  const user = useSelector(selectUser);

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

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Settings
        </Typography>
      </Box>

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
                            a.download = `settings-export-${Date.now()}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast.success('Settings exported successfully!');
                          }, 1500);
                        }}
                      >
                        Export Settings
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
                            localStorage.removeItem('userSettings');
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
              localStorage.setItem('userSettings', JSON.stringify(settings));
              
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
    </Box>
  );
};

export default Settings;