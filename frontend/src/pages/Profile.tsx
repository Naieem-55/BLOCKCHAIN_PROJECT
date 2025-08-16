import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const Profile: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            User profile management interface with account settings and preferences.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;