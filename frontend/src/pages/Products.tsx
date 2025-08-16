import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Products: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Products
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Product management interface will be implemented here.
            This will include product listing, creation, editing, and traceability features.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Products;