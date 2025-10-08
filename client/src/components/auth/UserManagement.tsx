/**
 * Pricing Calculator v0.2 - User Management Component
 * Gestione utenti per admin
 */

import React, { useState, useEffect } from "react";
import {
  Box,
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
  Typography,
} from "@mui/material";
import Button from "../Button";
import Card from "../Card";
import Input from "../Input";
import LoadingSpinner from "../LoadingSpinner";
import {
  Edit,
  Delete,
  Refresh,
  Lock,
  PersonAdd,
  Warning,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { pricingApi } from "../../services/api";
import {
  useBusinessErrorHandler,
  createBusinessError,
} from "../../hooks/useBusinessErrorHandler";
import ErrorListHandler from "../ErrorListHandler";
import { useNotification } from "../../contexts/NotificationContext";
import ChangePasswordDialog from "./ChangePasswordDialog";
import "./UserManagement.css";

interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addError, clearErrors, errors, removeError } =
    useBusinessErrorHandler();
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    role: "user" as "admin" | "user",
    is_active: true,
  });
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as "admin" | "user",
    is_active: true,
  });

  // Carica la lista utenti
  const loadUsers = async () => {
    try {
      setLoading(true);
      clearErrors();
      const response = await pricingApi.get("/api/auth/users");
      setUsers(response.data.users);
    } catch (err: any) {
      addError(
        createBusinessError.network(
          "Impossibile caricare la lista degli utenti. Verifica la connessione e riprova."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
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
      is_active: user.is_active,
    });
    setEditDialogOpen(true);
  };

  // Gestione cambio password
  const handleChangePassword = (user: User) => {
    setEditingUser(user);
    setChangePasswordDialogOpen(true);
  };

  // Gestione creazione utente
  const handleCreateUser = () => {
    setCreateForm({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
      is_active: true,
    });
    setCreateDialogOpen(true);
    clearErrors();
  };

  const handleSaveNewUser = async () => {
    // Validazione
    if (!createForm.username || !createForm.email || !createForm.password) {
      addError(
        createBusinessError.validation(
          "Tutti i campi sono obbligatori per creare un nuovo utente."
        )
      );
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      addError(
        createBusinessError.validation(
          "Le password inserite non coincidono. Verifica e riprova."
        )
      );
      return;
    }

    if (createForm.password.length < 6) {
      addError(
        createBusinessError.validation(
          "La password deve essere di almeno 6 caratteri per motivi di sicurezza."
        )
      );
      return;
    }

    try {
      setLoading(true);
      clearErrors();
      await pricingApi.post("/api/auth/register", {
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
      });
      await loadUsers();
      setCreateDialogOpen(false);
      showSuccess(
        "Utente creato",
        `L'utente ${createForm.username} è stato creato con successo.`
      );
    } catch (err: any) {
      addError(
        createBusinessError.network(
          "Impossibile creare il nuovo utente. Verifica i dati inseriti e riprova."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      clearErrors();
      await pricingApi.put(`/api/auth/users/${editingUser.id}`, editForm);
      await loadUsers();
      setEditDialogOpen(false);
      setEditingUser(null);
      showSuccess(
        "Utente aggiornato",
        `Le informazioni dell'utente ${editForm.username} sono state aggiornate con successo.`
      );
    } catch (err: any) {
      addError(
        createBusinessError.network(
          "Impossibile aggiornare le informazioni dell'utente. Verifica i dati e riprova."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Gestione eliminazione utente
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      clearErrors();
      await pricingApi.delete(`/api/auth/users/${userToDelete.id}`);
      await loadUsers();
      setDeleteConfirmDialogOpen(false);
      setUserToDelete(null);
      showSuccess(
        "Utente eliminato",
        `L'utente ${userToDelete.username} è stato eliminato con successo.`
      );
    } catch (err: any) {
      addError(
        createBusinessError.network(
          "Impossibile eliminare l'utente. Verifica i permessi e riprova."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Mai";
    return new Date(dateString).toLocaleDateString("it-IT");
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="user-management">
        <div className="user-management-content">
          <Alert severity="error">
            Accesso negato. Solo gli amministratori possono gestire gli utenti.
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>Gestione Utenti</h2>
        <p className="text-muted">
          Gestisci gli utenti del sistema e i loro permessi.
        </p>
      </div>

      <div className="user-management-content">
        <ErrorListHandler errors={errors} onDismiss={removeError} />

        <div className="user-management-actions">
          <h3>Lista Utenti</h3>
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={handleCreateUser}
              disabled={loading}
            >
              <PersonAdd className="btn-icon" />
              Crea Utente
            </button>
            <button
              className="btn btn-secondary"
              onClick={loadUsers}
              disabled={loading}
            >
              <Refresh className="btn-icon" />
              Aggiorna
            </button>
          </div>
        </div>

        <div className="user-management-card">
          <table className="users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Ruolo</th>
                <th>Stato</th>
                <th>Creato</th>
                <th>Ultimo Login</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="loading-container">
                    <CircularProgress />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    Nessun utente trovato
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`user-chip ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`user-chip ${
                          user.is_active ? "active" : "inactive"
                        }`}
                      >
                        {user.is_active ? "Attivo" : "Disattivato"}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>{formatDate(user.last_login)}</td>
                    <td>
                      <div className="user-actions">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEditUser(user)}
                          disabled={loading}
                          title="Modifica utente"
                        >
                          <Edit />
                        </button>
                        <button
                          className="action-btn password"
                          onClick={() => handleChangePassword(user)}
                          disabled={loading}
                          title="Cambia password"
                        >
                          <Lock />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteUser(user)}
                          disabled={loading || user.id === currentUser?.id}
                          title="Elimina utente"
                        >
                          <Delete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog per modifica utente */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Modifica Utente</DialogTitle>
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
            />
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
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Stato</InputLabel>
              <Select
                value={editForm.is_active ? "true" : "false"}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    is_active: e.target.value === "true",
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
          <Button onClick={handleSaveUser} variant="primary" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Salva"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per cambio password */}
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={() => {
          setChangePasswordDialogOpen(false);
          setEditingUser(null);
        }}
        userId={editingUser?.id}
        username={editingUser?.username}
        onSuccess={() => {
          showSuccess(
            "Password aggiornata",
            `La password per ${editingUser?.username} è stata aggiornata con successo.`
          );
        }}
      />

      {/* Dialog per creazione nuovo utente */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crea Nuovo Utente</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Username"
              value={createForm.username}
              onChange={(e) =>
                setCreateForm({ ...createForm, username: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Conferma Password"
              type="password"
              value={createForm.confirmPassword}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  confirmPassword: e.target.value,
                })
              }
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Ruolo</InputLabel>
              <Select
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    role: e.target.value as "admin" | "user",
                  })
                }
                label="Ruolo"
              >
                <MenuItem value="user">Utente</MenuItem>
                <MenuItem value="admin">Amministratore</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annulla</Button>
          <Button
            onClick={handleSaveNewUser}
            variant="primary"
            disabled={loading}
          >
            {loading ? "Creazione..." : "Crea Utente"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog di conferma eliminazione */}
      <Dialog
        open={deleteConfirmDialogOpen}
        onClose={() => setDeleteConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Warning />
          Conferma Eliminazione
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Sei sicuro di voler eliminare l'utente{" "}
            <strong>{userToDelete?.username}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Questa azione non può essere annullata. L'utente verrà
            permanentemente rimosso dal sistema.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteConfirmDialogOpen(false)}
            disabled={loading}
          >
            Annulla
          </Button>
          <Button
            onClick={confirmDeleteUser}
            variant="primary"
            disabled={loading}
          >
            {loading ? "Eliminazione..." : "Elimina Utente"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserManagement;
