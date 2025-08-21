import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  Email,
  Lock,
  Business,
  LocationOn,
  Badge,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../store';
import { registerUser, selectAuthLoading, selectAuthError, selectIsAuthenticated } from '../store/authSlice';
import { RegisterData, UserRole } from '../types/auth';

const Register: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: UserRole.SUPPLIER,
    company: '',
    location: '',
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    // Password strength check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }

    // Terms acceptance
    if (!formData.termsAccepted) {
      errors.terms = 'You must accept the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'termsAccepted' ? checked : value,
    }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await dispatch(registerUser(formData));
    if (registerUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: UserRole.ADMIN, label: 'Administrator', description: 'Full system access' },
    { value: UserRole.SUPPLIER, label: 'Supplier', description: 'Raw material provider' },
    { value: UserRole.MANUFACTURER, label: 'Manufacturer', description: 'Product manufacturer' },
    { value: UserRole.DISTRIBUTOR, label: 'Distributor', description: 'Distribution company' },
    { value: UserRole.RETAILER, label: 'Retailer', description: 'Retail store' },
    { value: UserRole.AUDITOR, label: 'Auditor', description: 'Quality auditor' },
  ];

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        py: 4,
      }}>
        <Card sx={{ width: '100%', maxWidth: 600 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonAdd sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Typography variant="h4" component="h1">
                Create Account
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Join the blockchain-powered supply chain network
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                {/* Name Field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    error={!!validationErrors.name}
                    helperText={validationErrors.name}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Badge />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Email Field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    error={!!validationErrors.email}
                    helperText={validationErrors.email}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Role Selection */}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      label="Role"
                      disabled={loading}
                    >
                      {roles.map(role => (
                        <MenuItem key={role.value} value={role.value}>
                          <Box>
                            <Typography variant="body1">{role.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {role.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Company Field */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company (Optional)"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Location Field */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location (Optional)"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Password Field */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    error={!!validationErrors.password}
                    helperText={validationErrors.password || 'Min 6 chars, include uppercase, lowercase & numbers'}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Confirm Password Field */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    error={!!validationErrors.confirmPassword}
                    helperText={validationErrors.confirmPassword}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Terms and Conditions */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I accept the{' '}
                        <Link to="/terms" style={{ textDecoration: 'none' }}>
                          Terms and Conditions
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" style={{ textDecoration: 'none' }}>
                          Privacy Policy
                        </Link>
                      </Typography>
                    }
                  />
                  {validationErrors.terms && (
                    <Typography variant="caption" color="error">
                      {validationErrors.terms}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || !formData.termsAccepted}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <Divider sx={{ my: 2 }}>OR</Divider>

              {/* Login Link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    Sign In
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register;