import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const IoTSensors: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        IoT Sensors
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            IoT sensor management interface with real-time data monitoring, alerts, and device configuration.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default IoTSensors;