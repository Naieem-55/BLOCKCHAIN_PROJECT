import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Profile page with Settings tab selected
    navigate('/profile?tab=settings', { replace: true });
  }, [navigate]);

  return null;
};

export default Settings;