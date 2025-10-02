/**
 * Pricing Calculator v0.2 - User Dashboard Component
 * Dashboard utente con informazioni personali
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person,
  Email,
  AdminPanelSettings,
  PersonAdd,
  Edit,
  Save,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UserDashboard: React.FC = () => {
  const { user, updateUser, isLoading } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditProfile = () => {
    setEditForm({
      username: user?.username || '',
      email: user?.email || ''
    });
    setEditDialogOpen(true);
    setError(null);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      await updateUser(editForm);
      setEditDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Errore nell\'aggiornamento del profilo');
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'user': return <Person />;
      case 'guest': return <PersonAdd />;
      default: return <Person />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'user': return 'primary';
      case 'guest': return 'default';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Mai';
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Utente non trovato
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard Utente
      </Typography>

      <Grid container spacing={3}>
        {/* Card Profilo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  {getRoleIcon(user.role)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user.username}</Typography>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={user.role.toUpperCase()}
                    color={getRoleColor(user.role)}
                    size="small"
                  />
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {user.email}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Membro dal
                </Typography>
                <Typography variant="body1">
                  {formatDate(user.created_at)}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Ultimo accesso
                </Typography>
                <Typography variant="body1">
                  {formatDate(user.last_login)}
                </Typography>
              </Box>
              
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={handleEditProfile}
                disabled={isLoading}
              >
                Modifica Profilo
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Card Statistiche */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistiche Account
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Ruolo
                </Typography>
                <Chip
                  icon={getRoleIcon(user.role)}
                  label={user.role === 'admin' ? 'Amministratore' : 
                         user.role === 'user' ? 'Utente' : 'Ospite'}
                  color={getRoleColor(user.role)}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Permessi
                </Typography>
                <Typography variant="body1">
                  {user.role === 'admin' ? 'Accesso completo' :
                   user.role === 'user' ? 'Accesso standard' : 'Accesso limitato'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Versione App
                </Typography>
                <Typography variant="body1">
                  v0.2.0-dev
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Card Preferenze */}
        {user.preferences && Object.keys(user.preferences).length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Preferenze
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {JSON.stringify(user.preferences, null, 2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialog per modifica profilo */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifica Profilo</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Username"
              value={editForm.username}
              onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialogOpen(false)} 
            disabled={saving}
            startIcon={<Cancel />}
          >
            Annulla
          </Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained" 
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDashboard;
