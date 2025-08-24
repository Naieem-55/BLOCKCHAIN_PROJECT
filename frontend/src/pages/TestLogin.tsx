import React from 'react';
import { Button, Container, Card, CardContent, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const TestLogin: React.FC = () => {
  const navigate = useNavigate();

  const handleTestLogin = async () => {
    try {
      const response = await api.post('/test-auth/test-login', {});
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        toast.success('Test login successful! Redirecting to products...');
        
        // Redirect to products page
        setTimeout(() => {
          navigate('/products');
        }, 1000);
      }
    } catch (error) {
      console.error('Test login error:', error);
      toast.error('Failed to perform test login');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom align="center">
              Development Test Login
            </Typography>
            <Typography variant="body1" paragraph align="center">
              This is a test login page for development purposes.
              Click the button below to login as a test user.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleTestLogin}
              >
                Login as Test User
              </Button>
            </Box>
            <Typography variant="caption" display="block" align="center" sx={{ mt: 3 }}>
              Test User: test@example.com | Role: Manufacturer
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default TestLogin;