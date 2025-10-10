/**
 * ProviderButton Component per Pricing Calculator v0.3.0
 * Componente riutilizzabile per bottoni di autenticazione provider
 */

import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
  Google as GoogleIcon,
} from '@mui/icons-material';
import { AuthProvider } from '../../contexts/AuthContext';

interface ProviderButtonProps {
  provider: AuthProvider;
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
}

const ProviderButton: React.FC<ProviderButtonProps> = ({
  provider,
  onClick,
  disabled = false,
  fullWidth = true,
  variant = 'outlined',
  size = 'large'
}) => {
  const getIcon = () => {
    switch (provider.icon) {
      case 'admin_panel_settings':
        return <AdminIcon />;
      case 'business':
        return <BusinessIcon />;
      case 'google':
        return <GoogleIcon />;
      default:
        return <AdminIcon />;
    }
  };

  const getColor = () => {
    switch (provider.id) {
      case 'local':
        return 'primary';
      case 'ldap':
        return 'secondary';
      case 'google':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getButtonStyle = () => {
    if (provider.id === 'google') {
      return {
        backgroundColor: '#4285f4',
        color: 'white',
        '&:hover': {
          backgroundColor: '#3367d6',
        },
        '&:disabled': {
          backgroundColor: '#e0e0e0',
          color: '#9e9e9e',
        }
      };
    }
    return {};
  };

  return (
    <Button
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || !provider.enabled}
      onClick={onClick}
      startIcon={getIcon()}
      color={getColor() as any}
      sx={{
        ...getButtonStyle(),
        py: 1.5,
        mb: 2,
        textTransform: 'none',
        fontSize: '1rem',
        fontWeight: 500,
        borderRadius: 2,
        boxShadow: variant === 'contained' ? 2 : 0,
        '&:hover': {
          boxShadow: variant === 'contained' ? 4 : 2,
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
        <Typography variant="button" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
          Accedi con {provider.name}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            opacity: 0.8, 
            fontSize: '0.75rem',
            lineHeight: 1,
            mt: 0.5
          }}
        >
          {provider.description}
        </Typography>
      </Box>
    </Button>
  );
};

export default ProviderButton;
