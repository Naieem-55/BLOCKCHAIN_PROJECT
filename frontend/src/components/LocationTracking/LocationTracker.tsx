import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  LocationOn,
  LocalShipping,
  Store,
  Warehouse,
  Home,
  Timeline,
  Map,
  AddLocation,
  History,
  Speed,
  Schedule,
  Navigation,
  Info,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import api from '../../services/api';

interface Location {
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  timestamp: string;
  locationType?: string;
  recordedBy?: any;
  transportDetails?: {
    vehicleId?: string;
    driverId?: string;
    route?: string;
    estimatedArrival?: string;
  };
}

interface LocationTrackerProps {
  productId: string;
  onUpdate?: () => void;
}

const LOCATION_TYPE_ICONS: { [key: string]: React.ReactElement } = {
  warehouse: <Warehouse />,
  transport: <LocalShipping />,
  facility: <Store />,
  retail: <Store />,
  customer: <Home />,
};

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060,
};

export const LocationTracker: React.FC<LocationTrackerProps> = ({ productId, onUpdate }) => {
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [locationHistory, setLocationHistory] = useState<Location[]>([]);
  const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialog, setAddDialog] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Form states
  const [newLocation, setNewLocation] = useState({
    location: '',
    locationType: 'warehouse',
    coordinates: {
      latitude: 0,
      longitude: 0,
    },
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    transportDetails: {
      vehicleId: '',
      driverId: '',
      route: '',
      estimatedArrival: '',
    },
  });

  useEffect(() => {
    fetchLocationData();
  }, [productId]);

  const fetchLocationData = async () => {
    try {
      setLoading(true);
      const [currentRes, historyRes, journeyRes] = await Promise.all([
        api.get(`/location/product/${productId}/location/current`),
        api.get(`/location/product/${productId}/locations`),
        api.get(`/location/product/${productId}/journey`),
      ]);

      setCurrentLocation(currentRes.data.currentLocation);
      setLocationHistory(historyRes.data.locationHistory);
      setJourney(journeyRes.data.journey);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch location data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async () => {
    try {
      setUpdating(true);
      await api.post(`/location/product/${productId}/location`, newLocation);
      
      await fetchLocationData();
      setAddDialog(false);
      resetForm();
      
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add location');
    } finally {
      setUpdating(false);
    }
  };

  const resetForm = () => {
    setNewLocation({
      location: '',
      locationType: 'warehouse',
      coordinates: { latitude: 0, longitude: 0 },
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      transportDetails: {
        vehicleId: '',
        driverId: '',
        route: '',
        estimatedArrival: '',
      },
    });
  };

  const formatAddress = (address: any) => {
    if (!address) return '';
    const parts = [
      address.street,
      address.city,
      address.state,
      address.country,
      address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getLocationIcon = (type?: string) => {
    return LOCATION_TYPE_ICONS[type || 'warehouse'] || <LocationOn />;
  };

  if (loading) return <Typography>Loading location data...</Typography>;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Location Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Current Location</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddLocation />}
                  onClick={() => setAddDialog(true)}
                  size="small"
                >
                  Update Location
                </Button>
              </Box>
              
              {currentLocation ? (
                <>
                  <Box display="flex" alignItems="center" mb={2}>
                    {getLocationIcon(currentLocation.locationType)}
                    <Typography variant="h5" sx={{ ml: 2 }}>
                      {currentLocation.name}
                    </Typography>
                  </Box>
                  
                  {currentLocation.address && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {formatAddress(currentLocation.address)}
                    </Typography>
                  )}
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Type
                      </Typography>
                      <Typography variant="body2">
                        {currentLocation.locationType || 'Unknown'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(currentLocation.lastUpdated), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {currentLocation.inTransit && currentLocation.transportDetails && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">In Transit</Typography>
                      <Typography variant="body2">
                        Vehicle: {currentLocation.transportDetails.vehicleId}
                        {currentLocation.transportDetails.estimatedArrival && (
                          <> | ETA: {format(new Date(currentLocation.transportDetails.estimatedArrival), 'MMM dd, HH:mm')}</>
                        )}
                      </Typography>
                    </Alert>
                  )}
                </>
              ) : (
                <Typography color="textSecondary">No location data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Journey Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Journey Statistics
              </Typography>
              
              {journey ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Navigation color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Total Distance
                        </Typography>
                        <Typography variant="h6">
                          {journey.statistics?.totalDistance || 0} km
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Schedule color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Duration
                        </Typography>
                        <Typography variant="h6">
                          {Math.round((journey.statistics?.totalDuration || 0) / 3600)} hrs
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <LocationOn color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Total Stops
                        </Typography>
                        <Typography variant="h6">
                          {journey.totalStops || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Speed color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Avg Speed
                        </Typography>
                        <Typography variant="h6">
                          {Math.round(journey.statistics?.averageSpeed || 0)} km/h
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="textSecondary">No journey data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Location History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                Location History
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Map />}
                onClick={() => setMapView(!mapView)}
              >
                {mapView ? 'List View' : 'Map View'}
              </Button>
            </Box>

            {mapView ? (
              <Box>
                {/* Map View - Requires Google Maps API Key */}
                <Alert severity="info" sx={{ mb: 2 }}>
                  Map view requires Google Maps API configuration
                </Alert>
                <Paper sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="textSecondary">
                    Map visualization would be displayed here with proper API key
                  </Typography>
                </Paper>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Location</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Recorded By</TableCell>
                      <TableCell>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {locationHistory.map((loc, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getLocationIcon(loc.locationType)}
                            <Typography sx={{ ml: 1 }}>{loc.location}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={loc.locationType || 'Unknown'}
                            size="small"
                            color={loc.locationType === 'transport' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{formatAddress(loc.address) || '-'}</TableCell>
                        <TableCell>
                          {format(new Date(loc.timestamp), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {loc.recordedBy?.name || loc.recordedBy?.email || '-'}
                        </TableCell>
                        <TableCell>
                          {loc.transportDetails?.vehicleId && (
                            <Tooltip title={`Vehicle: ${loc.transportDetails.vehicleId}`}>
                              <IconButton size="small">
                                <Info fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Journey Path */}
        {journey?.waypoints && journey.waypoints.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                Journey Path
              </Typography>
              <List>
                {journey.waypoints.map((waypoint: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {index === 0 ? (
                        <Chip label="Origin" color="success" size="small" />
                      ) : index === journey.waypoints.length - 1 ? (
                        <Chip label="Current" color="primary" size="small" />
                      ) : (
                        <Chip label={`Stop ${index}`} size="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={waypoint.location}
                      secondary={
                        <>
                          {waypoint.address && formatAddress(waypoint.address)}
                          {waypoint.timestamp && (
                            <> | {format(new Date(waypoint.timestamp), 'MMM dd, yyyy HH:mm')}</>
                          )}
                        </>
                      }
                    />
                    {waypoint.duration > 0 && (
                      <ListItemSecondaryAction>
                        <Typography variant="caption" color="textSecondary">
                          {Math.round(waypoint.duration / 3600)} hrs from previous
                        </Typography>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Add Location Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location Name"
                value={newLocation.location}
                onChange={(e) => setNewLocation({ ...newLocation, location: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Location Type</InputLabel>
                <Select
                  value={newLocation.locationType}
                  onChange={(e) => setNewLocation({ ...newLocation, locationType: e.target.value })}
                  label="Location Type"
                >
                  <MenuItem value="warehouse">Warehouse</MenuItem>
                  <MenuItem value="transport">In Transit</MenuItem>
                  <MenuItem value="facility">Facility</MenuItem>
                  <MenuItem value="retail">Retail</MenuItem>
                  <MenuItem value="customer">Customer</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Coordinates (Optional)
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={newLocation.coordinates.latitude}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  coordinates: { ...newLocation.coordinates, latitude: parseFloat(e.target.value) }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={newLocation.coordinates.longitude}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  coordinates: { ...newLocation.coordinates, longitude: parseFloat(e.target.value) }
                })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Address (Optional)
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street"
                value={newLocation.address.street}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  address: { ...newLocation.address, street: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="City"
                value={newLocation.address.city}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  address: { ...newLocation.address, city: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="State"
                value={newLocation.address.state}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  address: { ...newLocation.address, state: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Country"
                value={newLocation.address.country}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  address: { ...newLocation.address, country: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={newLocation.address.postalCode}
                onChange={(e) => setNewLocation({
                  ...newLocation,
                  address: { ...newLocation.address, postalCode: e.target.value }
                })}
              />
            </Grid>

            {newLocation.locationType === 'transport' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Transport Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Vehicle ID"
                    value={newLocation.transportDetails.vehicleId}
                    onChange={(e) => setNewLocation({
                      ...newLocation,
                      transportDetails: { ...newLocation.transportDetails, vehicleId: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Driver ID"
                    value={newLocation.transportDetails.driverId}
                    onChange={(e) => setNewLocation({
                      ...newLocation,
                      transportDetails: { ...newLocation.transportDetails, driverId: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Route"
                    value={newLocation.transportDetails.route}
                    onChange={(e) => setNewLocation({
                      ...newLocation,
                      transportDetails: { ...newLocation.transportDetails, route: e.target.value }
                    })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Estimated Arrival"
                    type="datetime-local"
                    value={newLocation.transportDetails.estimatedArrival}
                    onChange={(e) => setNewLocation({
                      ...newLocation,
                      transportDetails: { ...newLocation.transportDetails, estimatedArrival: e.target.value }
                    })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddLocation}
            variant="contained"
            disabled={updating || !newLocation.location}
          >
            Add Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};