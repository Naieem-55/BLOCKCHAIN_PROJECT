import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const QRScanner: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        QR Scanner
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            QR code scanner for product verification and traceability lookup.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default QRScanner;