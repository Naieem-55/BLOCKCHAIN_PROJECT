import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  CheckCircle,
  RadioButtonUnchecked,
  LocalShipping,
  Store,
  Factory,
  Inventory,
  Warning,
  Info,
  Update,
  History,
  ArrowForward,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';

interface LifecycleStage {
  stage: number;
  name: string;
  description: string;
  timestamp?: string;
  performedBy?: any;
  notes?: string;
  transactionHash?: string;
}

interface ProductLifecycleProps {
  productId: string;
  onUpdate?: () => void;
}

const STAGE_ICONS: { [key: number]: React.ReactElement } = {
  0: <Inventory color="primary" />,
  1: <Factory color="primary" />,
  2: <Factory color="primary" />,
  3: <CheckCircle color="success" />,
  4: <Inventory color="primary" />,
  5: <LocalShipping color="primary" />,
  6: <Store color="primary" />,
  7: <CheckCircle color="success" />,
  8: <Warning color="error" />,
};

const STAGE_COLORS: { [key: number]: 'primary' | 'success' | 'error' | 'warning' | 'info' } = {
  0: 'info',
  1: 'primary',
  2: 'primary',
  3: 'success',
  4: 'primary',
  5: 'primary',
  6: 'primary',
  7: 'success',
  8: 'error',
};

export const LifecycleTracker: React.FC<ProductLifecycleProps> = ({ productId, onUpdate }) => {
  const [lifecycle, setLifecycle] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateDialog, setUpdateDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateLocation, setUpdateLocation] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLifecycle();
    fetchTimeline();
  }, [productId]);

  const fetchLifecycle = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/lifecycle/product/${productId}/lifecycle`);
      setLifecycle(response.data.lifecycle);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch lifecycle data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await api.get(`/lifecycle/product/${productId}/timeline`);
      setTimeline(response.data.timeline);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    }
  };

  const handleStageUpdate = async () => {
    if (!selectedStage) return;

    try {
      setUpdating(true);
      await api.put(`/lifecycle/product/${productId}/stage`, {
        newStage: selectedStage,
        notes: updateNotes,
        location: updateLocation,
      });

      await fetchLifecycle();
      await fetchTimeline();
      setUpdateDialog(false);
      setUpdateNotes('');
      setUpdateLocation('');
      setSelectedStage(null);
      
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update stage');
    } finally {
      setUpdating(false);
    }
  };

  const handleRecall = async () => {
    if (!window.confirm('Are you sure you want to recall this product?')) return;

    try {
      setUpdating(true);
      await api.post(`/lifecycle/product/${productId}/recall`, {
        reason: 'Quality issue detected',
        severity: 'high',
        affectedBatches: [],
      });

      await fetchLifecycle();
      await fetchTimeline();
      
      if (onUpdate) onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to recall product');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Typography>Loading lifecycle data...</Typography>;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Status Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Status
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                {STAGE_ICONS[lifecycle?.currentStage || 0]}
                <Typography variant="h5" sx={{ ml: 2 }}>
                  {lifecycle?.stageName}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary" paragraph>
                {lifecycle?.stageDescription}
              </Typography>
              <Chip
                label={lifecycle?.isComplete ? 'Complete' : 'In Progress'}
                color={lifecycle?.isComplete ? 'success' : 'primary'}
                size="small"
              />
              {lifecycle?.blockchain && (
                <Chip
                  label="On Blockchain"
                  color="info"
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Lifecycle Progress */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Lifecycle Progress
            </Typography>
            <Stepper activeStep={lifecycle?.currentStage || 0} orientation="horizontal">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((stage) => (
                <Step key={stage} completed={stage < (lifecycle?.currentStage || 0)}>
                  <StepLabel
                    StepIconComponent={() => 
                      stage < (lifecycle?.currentStage || 0) ? (
                        <CheckCircle color="success" />
                      ) : stage === lifecycle?.currentStage ? (
                        <RadioButtonUnchecked color="primary" />
                      ) : (
                        <RadioButtonUnchecked color="disabled" />
                      )
                    }
                  >
                    {stage === 0 && 'Created'}
                    {stage === 1 && 'Raw Material'}
                    {stage === 2 && 'Manufacturing'}
                    {stage === 3 && 'Quality Control'}
                    {stage === 4 && 'Packaging'}
                    {stage === 5 && 'Distribution'}
                    {stage === 6 && 'Retail'}
                    {stage === 7 && 'Sold'}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            <Box display="flex" gap={2}>
              {lifecycle?.possibleNextStages?.map((nextStage: any) => (
                <Button
                  key={nextStage.stage}
                  variant="contained"
                  startIcon={<ArrowForward />}
                  onClick={() => {
                    setSelectedStage(nextStage.stage);
                    setUpdateDialog(true);
                  }}
                  disabled={updating}
                >
                  Move to {nextStage.name}
                </Button>
              ))}
              {lifecycle?.canRecall && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Warning />}
                  onClick={handleRecall}
                  disabled={updating}
                >
                  Recall Product
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Timeline */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <History sx={{ mr: 1, verticalAlign: 'middle' }} />
              Activity Timeline
            </Typography>
            <Timeline position="alternate">
              {timeline.slice(0, 10).map((event, index) => (
                <TimelineItem key={index}>
                  <TimelineOppositeContent color="textSecondary">
                    {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={event.type === 'quality_check' && event.passed ? 'success' : 'primary'}>
                      {event.type === 'creation' && <Inventory />}
                      {event.type === 'stage_updated' && <Update />}
                      {event.type === 'quality_check' && <CheckCircle />}
                      {event.type === 'recalled' && <Warning />}
                    </TimelineDot>
                    {index < timeline.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="subtitle2">{event.title}</Typography>
                    {event.description && (
                      <Typography variant="body2" color="textSecondary">
                        {event.description}
                      </Typography>
                    )}
                    {event.performer && (
                      <Typography variant="caption" color="textSecondary">
                        By: {event.performer.name || event.performer.email}
                      </Typography>
                    )}
                    {event.transactionHash && (
                      <Chip
                        size="small"
                        label="Blockchain"
                        color="info"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Paper>
        </Grid>

        {/* History Details */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Stage History
            </Typography>
            <Grid container spacing={2}>
              {lifecycle?.history?.map((stage: any, index: number) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary">
                        {stage.stageName}
                      </Typography>
                      <Typography variant="caption" display="block" gutterBottom>
                        {format(new Date(stage.timestamp), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                      {stage.performedBy && (
                        <Typography variant="body2">
                          By: {stage.performedBy.name || stage.performedBy.email}
                        </Typography>
                      )}
                      {stage.notes && (
                        <Typography variant="body2" color="textSecondary">
                          {stage.notes}
                        </Typography>
                      )}
                      {stage.transactionHash && (
                        <Chip
                          size="small"
                          label="On Chain"
                          color="success"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Update Stage Dialog */}
      <Dialog open={updateDialog} onClose={() => setUpdateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Product Stage</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Moving to: {lifecycle?.possibleNextStages?.find((s: any) => s.stage === selectedStage)?.name}
          </Typography>
          <TextField
            fullWidth
            label="Location"
            value={updateLocation}
            onChange={(e) => setUpdateLocation(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Notes"
            value={updateNotes}
            onChange={(e) => setUpdateNotes(e.target.value)}
            multiline
            rows={3}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialog(false)}>Cancel</Button>
          <Button onClick={handleStageUpdate} variant="contained" disabled={updating}>
            Update Stage
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};