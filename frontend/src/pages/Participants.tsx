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
      role: UserRole.PRODUCER,
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
      // For development, use mock data
      // In production, replace with: const data = await apiRequest.get<Participant[]>('/participants');
      setTimeout(() => {
        setParticipants(mockParticipants);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error('Failed to load participants');
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: ParticipantFormData) => {
    try {
      if (editingParticipant) {
        // Update participant
        // await apiRequest.put(`/participants/${editingParticipant.id}`, data);
        const updatedParticipant = {
          ...editingParticipant,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        setParticipants(prev => prev.map(p => p.id === editingParticipant.id ? updatedParticipant : p));
        toast.success('Participant updated successfully');
      } else {
        // Create new participant
        // const newParticipant = await apiRequest.post<Participant>('/participants', data);
        const newParticipant: Participant = {
          id: Date.now().toString(),
          ...data,
          walletAddress: data.walletAddress || `0x${Math.random().toString(16).substr(2, 40)}`,
          isActive: true,
          isVerified: false,
          certifications: [],
          blockchain: {
            participantId: participants.length + 1,
            contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
            registrationHash: `0x${Math.random().toString(16).substr(2, 40)}`,
          },
          stats: {
            totalProducts: 0,
            activeProducts: 0,
            completedTransfers: 0,
            qualityScore: 0,
            avgResponseTime: 0,
            lastActivity: new Date().toISOString(),
            monthlyVolume: 0,
            complianceRate: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setParticipants(prev => [...prev, newParticipant]);
        toast.success('Participant created successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving participant:', error);
      toast.error('Failed to save participant');
    }
  };

  const handleInvite = async (data: any) => {
    try {
      // await apiRequest.post('/participants/invite', data);
      toast.success(`Invitation sent to ${data.email}`);
      setOpenInviteDialog(false);
      resetInvite();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleDelete = async (participant: Participant) => {
    if (window.confirm(`Are you sure you want to delete ${participant.name}?`)) {
      try {
        // await apiRequest.delete(`/participants/${participant.id}`);
        setParticipants(prev => prev.filter(p => p.id !== participant.id));
        toast.success('Participant deleted successfully');
      } catch (error) {
        console.error('Error deleting participant:', error);
        toast.error('Failed to delete participant');
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
                      <IconButton onClick={(e) => handleMenuClick(e, participant)}>
                        <MoreVertIcon />
                      </IconButton>
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
        <MenuItem onClick={() => { handleEdit(selectedParticipant!); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        {selectedParticipant && !selectedParticipant.isVerified && (
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
        
        <MenuItem onClick={() => { handleDelete(selectedParticipant!); handleMenuClose(); }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
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