import React from 'react';
import { Box, Typography, Card, CardContent, Container } from '@mui/material';

const Register: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Register
            </Typography>
            <Typography variant="body1" align="center">
              User registration form will be implemented here.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register;