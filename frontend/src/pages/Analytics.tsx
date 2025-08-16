import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Analytics: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Advanced analytics dashboard with supply chain metrics, performance indicators, and business intelligence.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;