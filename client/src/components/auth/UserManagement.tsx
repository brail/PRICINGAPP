/**
 * Pricing Calculator v0.2 - User Management Component
 * Gestione utenti per admin
 */

import React, { useState, useEffect } from "react";
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
  CircularProgress,
} from "@mui/material";
import {
  Edit,
  Delete,
  Add,
  Refresh,
  PowerSettingsNew,
  Lock,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { pricingApi } from "../../services/api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ChangePasswordDialog from "./ChangePasswordDialog";
import "./UserManagement.css";

interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user" | "guest";
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingUser, setTogglingUser] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as "admin" | "user" | "guest",
    is_active: "true" as string,
  });

  // Carica la lista utenti
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pricingApi.getUsers();
      setUsers(response.users);
    } catch (err: any) {
      setError(err.response?.data?.error || "Errore nel caricamento utenti");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadUsers();
    }
  }, [currentUser]);

  // Refresh automatico ogni 60 secondi
  useEffect(() => {
    if (currentUser?.role === "admin") {
      const interval = setInterval(() => {
        loadUsers();
      }, 60000); // 60 secondi

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Gestione modifica utente
  const handleEditUser = (user: User) => {
    setIsCreating(false);
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
      is_active: user.is_active ? "true" : "false",
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      setLoading(true);

      if (isCreating) {
        // Creazione nuovo utente
        const userData = {
          username: editForm.username,
          email: editForm.email,
          password: editForm.password,
          confirmPassword: editForm.confirmPassword,
        };
        await pricingApi.register(
          userData.username,
          userData.email,
          userData.password,
          userData.confirmPassword
        );
      } else {
        // Modifica utente esistente
        if (!editingUser) return;

        const userData = {
          username: editForm.username,
          email: editForm.email,
          role: editForm.role,
          is_active: editForm.is_active === "true",
        };
        await pricingApi.updateUser(editingUser.id, userData);
      }

      await loadUsers();
      setEditDialogOpen(false);
      setEditingUser(null);
      setIsCreating(false);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          `Errore nella ${isCreating ? "creazione" : "modifica"} utente`
      );
    } finally {
      setLoading(false);
    }
  };

  // Gestione eliminazione permanente utente
  const handleDeleteUser = async (userId: number) => {
    if (
      !window.confirm(
        "⚠️ ATTENZIONE: Questa azione eliminerà PERMANENTEMENTE l'utente dal database. Questa operazione non può essere annullata. Sei sicuro?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await pricingApi.deleteUser(userId);
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || "Errore nell'eliminazione utente");
    } finally {
      setLoading(false);
    }
  };

  // Gestione disattivazione/attivazione utente
  const handleToggleUserStatus = async (userId: number) => {
    try {
      setTogglingUser(userId);
      setError(null);
      const result = await pricingApi.toggleUserStatus(userId);
      await loadUsers();
      // Mostra messaggio di successo
      console.log("Successo:", result.message);
    } catch (err: any) {
      console.error("Errore in handleToggleUserStatus:", err);
      setError(
        err.response?.data?.error || "Errore nella modifica stato utente"
      );
    } finally {
      setTogglingUser(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "error";
      case "user":
        return "primary";
      case "guest":
        return "default";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Mai";
    return new Date(dateString).toLocaleDateString("it-IT");
  };

  if (currentUser?.role !== "admin") {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Accesso negato. Solo gli amministratori possono gestire gli utenti.
        </Alert>
      </Box>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>Gestione Utenti</h2>
        <p className="text-muted">
          Gestisci gli utenti del sistema, crea nuovi account e modifica i
          permessi.
        </p>
      </div>

      <div className="user-management-content">
        <div className="user-management-actions">
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => {
              setIsCreating(true);
              setEditingUser(null);
              setEditForm({
                username: "",
                email: "",
                password: "",
                confirmPassword: "",
                role: "user",
                is_active: "true",
              });
              setEditDialogOpen(true);
            }}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Aggiungi Utente
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={loadUsers}
            disabled={loading}
          >
            Aggiorna
          </Button>
        </div>

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
                            label={user.is_active ? "Attivo" : "Disattivato"}
                            color={user.is_active ? "success" : "default"}
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
                            title="Modifica utente"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            onClick={() => handleToggleUserStatus(user.id)}
                            disabled={
                              togglingUser === user.id ||
                              user.id === currentUser?.id
                            }
                            size="small"
                            color={user.is_active ? "warning" : "success"}
                            title={
                              togglingUser === user.id
                                ? "Caricamento..."
                                : user.is_active
                                ? "Disattiva utente"
                                : "Attiva utente"
                            }
                          >
                            {togglingUser === user.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <PowerSettingsNew />
                            )}
                          </IconButton>
                          <IconButton
                            onClick={() => {
                              setEditingUser(user);
                              setChangePasswordDialogOpen(true);
                            }}
                            disabled={loading}
                            size="small"
                            color="info"
                            title="Cambia password"
                          >
                            <Lock />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={loading || user.id === currentUser?.id}
                            size="small"
                            color="error"
                            title="Elimina permanentemente"
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
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {isCreating ? "Aggiungi Utente" : "Modifica Utente"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={editForm.username}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, username: e.target.value }))
                }
                sx={{ mb: 2 }}
                required
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, email: e.target.value }))
                }
                sx={{ mb: 2 }}
                required
              />
              {isCreating && (
                <>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    sx={{ mb: 2 }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Conferma Password"
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    sx={{ mb: 2 }}
                    required
                  />
                </>
              )}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Ruolo</InputLabel>
                <Select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      role: e.target.value as any,
                    }))
                  }
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
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      is_active: e.target.value,
                    }))
                  }
                  label="Stato"
                >
                  <MenuItem value="true">Attivo</MenuItem>
                  <MenuItem value="false">Disattivato</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)} disabled={loading}>
              Annulla
            </Button>
            <Button
              onClick={handleSaveUser}
              variant="contained"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : isCreating ? (
                "Crea"
              ) : (
                "Salva"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Cambio Password */}
        <ChangePasswordDialog
          open={changePasswordDialogOpen}
          onClose={() => {
            setChangePasswordDialogOpen(false);
            setEditingUser(null);
          }}
          userId={editingUser?.id}
          username={editingUser?.username}
          onSuccess={() => {
            // Opzionale: aggiorna la lista utenti o mostra messaggio
          }}
        />
      </div>
    </div>
  );
};

export default UserManagement;
