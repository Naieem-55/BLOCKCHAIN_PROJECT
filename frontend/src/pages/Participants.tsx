import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Public as WebsiteIcon,
  LocationOn as LocationIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  PersonAdd as InviteIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { apiRequest } from '../services/api';
import { useAppSelector } from '../store';
import { selectUser } from '../store/authSlice';
import { participantService } from '../services/participantService';
import { Participant, ParticipantFormData, UserRole, VerificationLevel } from '../types';
import toast from 'react-hot-toast';

// Form validation schemas
const participantSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  role: yup.mixed<UserRole>().oneOf(Object.values(UserRole)).required('Role is required'),
  company: yup.string().required('Company is required'),
  location: yup.string().required('Location is required'),
  contactPerson: yup.string().required('Contact person is required'),
  phone: yup.string().required('Phone is required'),
  website: yup.string().url('Invalid URL').optional(),
  walletAddress: yup.string().optional(),
}).required();

const inviteSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  role: yup.string().required('Role is required'),
  message: yup.string().optional(),
});

// Mock data for development
const mockParticipants: Participant[] = [
  {
    id: '1',
    name: 'Green Farms Ltd',
    role: UserRole.PRODUCER,
    email: 'contact@greenfarms.com',
    company: 'Green Farms Ltd',
    location: 'California, USA',
    contactPerson: 'John Smith',
    phone: '+1-555-0123',
    website: 'https://greenfarms.com',
    walletAddress: '0x1234567890123456789012345678901234567890',
    isActive: true,
    isVerified: true,
    verificationDate: '2024-01-15T10:00:00Z',
    certifications: [
      {
        id: 'cert1',
        name: 'Organic Certification',
        type: 'organic' as any,
        issuedBy: 'USDA',
        issuedDate: '2024-01-01T00:00:00Z',
        expiryDate: '2025-01-01T00:00:00Z',
        verified: true,
      },
    ],
    blockchain: {
      participantId: 1,
      contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      registrationHash: '0x987654321098765432109876543210987654321',
    },
    stats: {
      totalProducts: 150,
      activeProducts: 45,
      completedTransfers: 120,
      qualityScore: 95.5,
      avgResponseTime: 12,
      lastActivity: '2024-08-22T09:30:00Z',
      monthlyVolume: 89,
      complianceRate: 98.2,
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-08-22T09:30:00Z',
  },
  {
    id: '2',
    name: 'Swift Logistics',
    role: UserRole.DISTRIBUTOR,
    email: 'ops@swiftlogistics.com',
    company: 'Swift Logistics Inc',
    location: 'Texas, USA',
    contactPerson: 'Sarah Johnson',
    phone: '+1-555-0124',
    walletAddress: '0x2345678901234567890123456789012345678901',
    isActive: true,
    isVerified: false,
    certifications: [],
    blockchain: {
      participantId: 2,
      contractAddress: '0xbcdef1234567890abcdef1234567890abcdef123',
      registrationHash: '0x8765432109876543210987654321098765432',
    },
    stats: {
      totalProducts: 89,
      activeProducts: 23,
      completedTransfers: 78,
      qualityScore: 87.3,
      avgResponseTime: 18,
      lastActivity: '2024-08-21T15:45:00Z',
      monthlyVolume: 67,
      complianceRate: 92.1,
    },
    createdAt: '2024-02-10T14:30:00Z',
    updatedAt: '2024-08-21T15:45:00Z',
  },
];

const Participants: React.FC = () => {
  const currentUser = useAppSelector(selectUser);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ParticipantFormData>({
    resolver: yupResolver(participantSchema),
    defaultValues: {
      name: '',
      email: '',
      role: UserRole.SUPPLIER,
      company: '',
      location: '',
      contactPerson: '',
      phone: '',
      website: '',
      walletAddress: '',
    },
  });

  const {
    control: inviteControl,
    handleSubmit: handleInviteSubmit,
    reset: resetInvite,
    formState: { errors: inviteErrors, isSubmitting: isInviteSubmitting },
  } = useForm({
    resolver: yupResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: UserRole.PRODUCER,
      message: '',
    },
  });

  // Load participants on mount
  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const response = await participantService.getParticipants({
        page: 1,
        limit: 100 // Get all participants for now
      });
      
      console.log('Raw participants response:', response);
      console.log('Response type:', typeof response);
      console.log('Is array?', Array.isArray(response));
      
      // The response is already unwrapped by apiRequest.get, so it's the array directly
      const users = Array.isArray(response) ? response : (response as any).data || [];
      
      console.log('Users to transform:', users);
      console.log('Number of users:', users.length);
      
      // Transform User data to Participant format
      const transformedParticipants: Participant[] = users.map((user: any) => ({
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        company: user.company || '',
        location: user.location || '',
        contactPerson: user.name, // Use name as contact person for now
        phone: user.phone || '',
        website: '', // Not in User model
        walletAddress: user.walletAddress || '',
        isActive: user.isActive,
        isVerified: user.isVerified || false,
        verificationDate: user.verificationDate,
        certifications: [], // Not in User model
        blockchain: {
          participantId: 0,
          contractAddress: '',
          registrationHash: ''
        },
        stats: {
          totalProducts: 0,
          activeProducts: 0,
          completedTransfers: 0,
          qualityScore: 0,
          avgResponseTime: 0,
          lastActivity: user.updatedAt,
          monthlyVolume: 0,
          complianceRate: 0,
        },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      
      console.log('Transformed participants:', transformedParticipants);
      console.log('Setting', transformedParticipants.length, 'participants');
      setParticipants(transformedParticipants);
    } catch (error: any) {
      console.error('Error loading participants:', error);
      // If API fails, show user-friendly message
      if (error.status === 401) {
        toast.error('Please login to view participants');
      } else if (error.status === 403) {
        toast.error('You do not have permission to view participants');
      } else {
        toast.error('Failed to load participants');
      }
      setParticipants([]); // Set empty array instead of mock data
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: ParticipantFormData) => {
    // Check admin permission
    if (!isAdmin) {
      toast.error('Only administrators can create or update participants');
      return;
    }

    try {
      // Use the original form data which has all required fields including contactPerson
      if (editingParticipant) {
        // Update participant
        await participantService.updateParticipant(editingParticipant.id, data);
        toast.success('Participant updated successfully');
      } else {
        // Create new participant
        await participantService.createParticipant(data);
        toast.success('Participant created successfully');
      }
      
      handleCloseDialog();
      // Refresh participants list to get updated data from server
      await loadParticipants();
    } catch (error: any) {
      console.error('Error saving participant:', error);
      console.error('Error details:', error.details);
      console.error('Validation errors:', error.validationErrors);
      
      if (error.status === 403) {
        toast.error('Only administrators can create participants');
      } else if (error.status === 400) {
        // Show detailed validation errors
        if (error.validationErrors && error.validationErrors.length > 0) {
          const errorMessages = error.validationErrors.map((err: any) => err.msg || err.message || err.field).join(', ');
          toast.error(`Validation failed: ${errorMessages}`);
        } else {
          toast.error(error.message || 'Invalid participant data');
        }
      } else {
        toast.error('Failed to save participant');
      }
    }
  };

  const handleInvite = async (data: any) => {
    if (!isAdmin) {
      toast.error('Only administrators can send invitations');
      return;
    }

    try {
      await participantService.inviteParticipant(data);
      toast.success(`Invitation sent to ${data.email}`);
      setOpenInviteDialog(false);
      resetInvite();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      if (error.status === 403) {
        toast.error('Only administrators can send invitations');
      } else {
        toast.error('Failed to send invitation');
      }
    }
  };

  const handleDelete = async (participant: Participant) => {
    if (!isAdmin) {
      toast.error('Only administrators can delete participants');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${participant.name}?`)) {
      try {
        await participantService.deleteParticipant(participant.id);
        setParticipants(prev => prev.filter(p => p.id !== participant.id));
        toast.success('Participant deleted successfully');
      } catch (error: any) {
        console.error('Error deleting participant:', error);
        if (error.status === 403) {
          toast.error('Only administrators can delete participants');
        } else {
          toast.error('Failed to delete participant');
        }
      }
    }
  };

  const handleVerify = async (participant: Participant) => {
    try {
      // await apiRequest.post(`/participants/${participant.id}/verify`);
      const updatedParticipant = {
        ...participant,
        isVerified: true,
        verificationDate: new Date().toISOString(),
      };
      setParticipants(prev => prev.map(p => p.id === participant.id ? updatedParticipant : p));
      toast.success('Participant verified successfully');
    } catch (error) {
      console.error('Error verifying participant:', error);
      toast.error('Failed to verify participant');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingParticipant(null);
    reset();
  };

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant);
    reset({
      name: participant.name,
      email: participant.email,
      role: participant.role,
      company: participant.company,
      location: participant.location,
      contactPerson: participant.contactPerson,
      phone: participant.phone,
      website: participant.website || '',
      walletAddress: participant.walletAddress || '',
    });
    setOpenDialog(true);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, participant: Participant) => {
    setAnchorEl(event.currentTarget);
    setSelectedParticipant(participant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedParticipant(null);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.PRODUCER: return 'success';
      case UserRole.MANUFACTURER: return 'primary';
      case UserRole.DISTRIBUTOR: return 'warning';
      case UserRole.RETAILER: return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (participant: Participant) => {
    if (!participant.isActive) return 'error';
    if (!participant.isVerified) return 'warning';
    return 'success';
  };

  const getStatusText = (participant: Participant) => {
    if (!participant.isActive) return 'Inactive';
    if (!participant.isVerified) return 'Unverified';
    return 'Active';
  };

  // Filter participants
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || participant.role === selectedRole;
    const matchesStatus = !selectedStatus || 
                         (selectedStatus === 'active' && participant.isActive && participant.isVerified) ||
                         (selectedStatus === 'unverified' && !participant.isVerified) ||
                         (selectedStatus === 'inactive' && !participant.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Supply Chain Participants
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isAdmin && (
            <>
              <Button
                variant="outlined"
                startIcon={<InviteIcon />}
                onClick={() => setOpenInviteDialog(true)}
              >
                Invite Participant
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Add Participant
              </Button>
            </>
          )}
          {!isAdmin && (
            <Alert severity="info" sx={{ flex: 1, maxWidth: 400 }}>
              Only administrators can manage participants
            </Alert>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value={UserRole.PRODUCER}>Producer</MenuItem>
                  <MenuItem value={UserRole.MANUFACTURER}>Manufacturer</MenuItem>
                  <MenuItem value={UserRole.DISTRIBUTOR}>Distributor</MenuItem>
                  <MenuItem value={UserRole.RETAILER}>Retailer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="unverified">Unverified</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary" align="center">
                {filteredParticipants.length} participants
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Participants Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Participant</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Stats</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No participants found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge
                          badgeContent={participant.isVerified ? <VerifiedIcon sx={{ fontSize: 16 }} /> : null}
                          color="primary"
                        >
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <BusinessIcon />
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {participant.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {participant.company}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={participant.role}
                        color={getRoleColor(participant.role) as any}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" color="disabled" />
                          <Typography variant="body2">{participant.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" color="disabled" />
                          <Typography variant="body2">{participant.phone}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon fontSize="small" color="disabled" />
                          <Typography variant="body2">{participant.location}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={getStatusText(participant)}
                        color={getStatusColor(participant) as any}
                        size="small"
                        icon={participant.isVerified ? <CheckCircleIcon /> : <WarningIcon />}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2">
                          Products: {participant.stats.activeProducts}/{participant.stats.totalProducts}
                        </Typography>
                        <Typography variant="body2">
                          Quality: {participant.stats.qualityScore.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2">
                          Compliance: {participant.stats.complianceRate.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      {isAdmin ? (
                        <IconButton onClick={(e) => handleMenuClick(e, participant)}>
                          <MoreVertIcon />
                        </IconButton>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          View Only
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {isAdmin && (
          <MenuItem onClick={() => { handleEdit(selectedParticipant!); handleMenuClose(); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        
        {isAdmin && selectedParticipant && !selectedParticipant.isVerified && (
          <MenuItem onClick={() => { handleVerify(selectedParticipant!); handleMenuClose(); }}>
            <ListItemIcon>
              <VerifiedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Verify</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => { /* View stats */ handleMenuClose(); }}>
          <ListItemIcon>
            <StatsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Analytics</ListItemText>
        </MenuItem>
        
        {isAdmin && (
          <MenuItem onClick={() => { handleDelete(selectedParticipant!); handleMenuClose(); }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Create/Edit Participant Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingParticipant ? 'Edit Participant' : 'Add New Participant'}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleCreateOrUpdate)}>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Participant Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.role}>
                      <InputLabel>Role</InputLabel>
                      <Select {...field} label="Role">
                        <MenuItem value={UserRole.PRODUCER}>Producer</MenuItem>
                        <MenuItem value={UserRole.MANUFACTURER}>Manufacturer</MenuItem>
                        <MenuItem value={UserRole.DISTRIBUTOR}>Distributor</MenuItem>
                        <MenuItem value={UserRole.RETAILER}>Retailer</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Company"
                      error={!!errors.company}
                      helperText={errors.company?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Location"
                      error={!!errors.location}
                      helperText={errors.location?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="contactPerson"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Person"
                      error={!!errors.contactPerson}
                      helperText={errors.contactPerson?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="website"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Website (optional)"
                      error={!!errors.website}
                      helperText={errors.website?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="walletAddress"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Wallet Address (optional)"
                      error={!!errors.walletAddress}
                      helperText={errors.walletAddress?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={20} /> : editingParticipant ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Invite Participant Dialog */}
      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Participant</DialogTitle>
        <form onSubmit={handleInviteSubmit(handleInvite)}>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={inviteControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                      error={!!inviteErrors.email}
                      helperText={inviteErrors.email?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="role"
                  control={inviteControl}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!inviteErrors.role}>
                      <InputLabel>Role</InputLabel>
                      <Select {...field} label="Role">
                        <MenuItem value={UserRole.PRODUCER}>Producer</MenuItem>
                        <MenuItem value={UserRole.MANUFACTURER}>Manufacturer</MenuItem>
                        <MenuItem value={UserRole.DISTRIBUTOR}>Distributor</MenuItem>
                        <MenuItem value={UserRole.RETAILER}>Retailer</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="message"
                  control={inviteControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Invitation Message (optional)"
                      multiline
                      rows={3}
                      placeholder="Welcome to our supply chain network..."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isInviteSubmitting}>
              {isInviteSubmitting ? <CircularProgress size={20} /> : 'Send Invitation'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Participants;