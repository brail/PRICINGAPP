/**
 * AuthCallback Component per Pricing Calculator v0.3.0
 * Gestisce il callback OAuth e redirect
 */

import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const { handleOAuthCallback, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokens = urlParams.get('tokens');
    const error = urlParams.get('error');

    if (tokens) {
      try {
        handleOAuthCallback(tokens);
      } catch (error) {
        console.error('Errore nel callback OAuth:', error);
        navigate('/login?error=oauth_error');
      }
    } else if (error) {
      navigate(`/login?error=${error}`);
    } else {
      navigate('/login');
    }
  }, [handleOAuthCallback, navigate]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#F0F0F0',
      }}
    >
      <CircularProgress size={60} sx={{ mb: 3 }} />
      <Typography variant="h6" color="text.secondary">
        Completamento autenticazione...
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Ti stiamo reindirizzando...
      </Typography>
    </Box>
  );
};

export default AuthCallback;
