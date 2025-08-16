import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const ProductDetail: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Product Detail
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Detailed product view with traceability timeline, quality checks, and blockchain verification.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductDetail;