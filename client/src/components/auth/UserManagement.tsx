/**
 * Pricing Calculator v0.2 - User Management Component
 * Gestione utenti per admin
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { pricingApi } from '../../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: 'user' as 'admin' | 'user' | 'guest',
    is_active: true
  });

  // Carica la lista utenti
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pricingApi.get('/auth/users');
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore nel caricamento utenti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  // Gestione modifica utente
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      await pricingApi.put(`/auth/users/${editingUser.id}`, editForm);
      await loadUsers();
      setEditDialogOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore nell\'aggiornamento utente');
    } finally {
      setLoading(false);
    }
  };

  // Gestione eliminazione utente
  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente?')) {
      return;
    }

    try {
      setLoading(true);
      await pricingApi.delete(`/auth/users/${userId}`);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Errore nell\'eliminazione utente');
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Mai';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Accesso negato. Solo gli amministratori possono gestire gli utenti.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestione Utenti
        </Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={loadUsers}
          disabled={loading}
        >
          Aggiorna
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Ruolo</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell>Creato</TableCell>
                  <TableCell>Ultimo Login</TableCell>
                  <TableCell>Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Nessun utente trovato
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? 'Attivo' : 'Disattivato'}
                          color={user.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.last_login)}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleEditUser(user)}
                          disabled={loading}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={loading || user.id === currentUser?.id}
                          size="small"
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog per modifica utente */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifica Utente</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
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
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Ruolo</InputLabel>
              <Select
                value={editForm.role}
                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
                label="Ruolo"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="guest">Guest</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Stato</InputLabel>
              <Select
                value={editForm.is_active}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.value as boolean }))}
                label="Stato"
              >
                <MenuItem value={true}>Attivo</MenuItem>
                <MenuItem value={false}>Disattivato</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={loading}>
            Annulla
          </Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Salva'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
