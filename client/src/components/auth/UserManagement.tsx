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
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CustomButton from "../CustomButton";
import UserDetailModal from "./UserDetailModal";
import {
  Edit,
  Delete,
  Refresh,
  Lock,
  PersonAdd,
  Warning,
  MoreVert,
  Person,
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
  auth_provider?: "local" | "ldap" | "google";
  provider_user_id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  timezone?: string;
  locale?: string;
  bio?: string;
  profile_updated_at?: string;
  email_verified_at?: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addError, clearErrors, errors, removeError } =
    useBusinessErrorHandler();
  const { showSuccess } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] =
    useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    role: "user" as "admin" | "user",
    is_active: true,
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: "",
    timezone: "Europe/Rome",
    locale: "it",
    bio: "",
  });
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as "admin" | "user",
    is_active: true,
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: "",
    timezone: "Europe/Rome",
    locale: "it",
    bio: "",
  });

  // Carica la lista utenti
  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      clearErrors();
      const response = await pricingApi.get("/auth/users");
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
  }, []); // Funzioni stabili, nessuna dipendenza necessaria

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadUsers();
    }
  }, [currentUser?.role, loadUsers]); // Includiamo loadUsers nelle dipendenze

  // Gestione menu azioni
  const handleActionMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    user: User
  ) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedUser(null);
  };

  // Gestione modifica utente
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      avatar_url: user.avatar_url || "",
      timezone: user.timezone || "Europe/Rome",
      locale: user.locale || "it",
      bio: user.bio || "",
    });
    setEditDialogOpen(true);
    handleActionMenuClose();
  };

  // Gestione cambio password
  const handleChangePassword = (user: User) => {
    setEditingUser(user);
    setChangePasswordDialogOpen(true);
    handleActionMenuClose();
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
      first_name: "",
      last_name: "",
      phone: "",
      avatar_url: "",
      timezone: "Europe/Rome",
      locale: "it",
      bio: "",
    });
    setCreateDialogOpen(true);
    clearErrors();
  };

  // Submit creazione utente
  const handleCreateUserSubmit = async () => {
    if (createForm.password !== createForm.confirmPassword) {
      addError(createBusinessError.validation("Le password non coincidono"));
      return;
    }

    try {
      setLoading(true);
      clearErrors();

      const { confirmPassword, ...userData } = createForm;
      await pricingApi.post("/auth/users", userData);

      setCreateDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      addError(
        createBusinessError.network(
          "Impossibile creare l'utente. Verifica i dati e riprova."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit modifica utente
  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      setLoading(true);
      clearErrors();

      await pricingApi.put(`/auth/users/${editingUser.id}`, editForm);

      setEditDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      addError(
        createBusinessError.network(
          "Impossibile aggiornare l'utente. Verifica i dati e riprova."
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
    handleActionMenuClose();
  };

  // Gestione visualizzazione dettagli utente
  const handleViewUserDetails = (user: User) => {
    setSelectedUserForDetail(user);
    setDetailModalOpen(true);
    handleActionMenuClose();
  };

  // Gestione chiusura modal dettagli
  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedUserForDetail(null);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      clearErrors();
      await pricingApi.delete(`/auth/users/${userToDelete.id}`);
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
            <CustomButton
              variant="primary"
              onClick={handleCreateUser}
              disabled={loading}
            >
              <PersonAdd className="btn-icon" />
              Crea Utente Locale
            </CustomButton>
            <CustomButton
              variant="secondary"
              onClick={loadUsers}
              disabled={loading}
            >
              <Refresh className="btn-icon" />
              Aggiorna
            </CustomButton>
          </div>
        </div>

        <div className="user-management-card">
          <table className="users-table">
            <thead>
              <tr>
                <th>Utente</th>
                <th>Provider</th>
                <th>Ruolo</th>
                <th>Stato</th>
                <th>Ultimo Login</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="loading-container">
                    <CircularProgress />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Nessun utente trovato
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">
                          {user.first_name && user.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user.username}
                        </div>
                        <div className="user-details">
                          <span className="username">@{user.username}</span>
                          <span className="email">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`user-chip provider-${
                          user.auth_provider || "local"
                        }`}
                      >
                        {user.auth_provider === "ldap"
                          ? "🏢 AD"
                          : user.auth_provider === "google"
                          ? "🌐 Google"
                          : "🔐 Locale"}
                      </span>
                    </td>
                    <td>
                      <span className={`user-chip ${user.role}`}>
                        {user.role === "admin" ? "👑 Admin" : "👤 User"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`user-chip ${
                          user.is_active ? "active" : "inactive"
                        }`}
                      >
                        {user.is_active ? "✅ Attivo" : "❌ Disattivato"}
                      </span>
                    </td>
                    <td>{formatDate(user.last_login)}</td>
                    <td>
                      <IconButton
                        onClick={(e) => handleActionMenuOpen(e, user)}
                        disabled={loading}
                        size="small"
                        title="Azioni utente"
                      >
                        <MoreVert />
                      </IconButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Menu dropdown azioni */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => selectedUser && handleViewUserDetails(selectedUser)}
        >
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>Visualizza Dettagli</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleEditUser(selectedUser)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Modifica Utente</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => selectedUser && handleChangePassword(selectedUser)}
        >
          <ListItemIcon>
            <Lock fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cambia Password</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => selectedUser && handleDeleteUser(selectedUser)}
          disabled={selectedUser?.id === currentUser?.id}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Elimina Utente</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog per modifica utente */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Modifica Utente</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Informazioni Base */}
            <Typography variant="h6" sx={{ mb: 2, color: "#667eea" }}>
              Informazioni Base
            </Typography>

            {/* Alert per utenti esterni */}
            {editingUser?.auth_provider &&
              editingUser.auth_provider !== "local" && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Utente Sincronizzato</strong>
                    <br />
                    Username, email, nome e cognome sono sincronizzati
                    automaticamente da{" "}
                    {editingUser.auth_provider === "ldap"
                      ? "Active Directory"
                      : "Google"}{" "}
                    e non possono essere modificati.
                  </Typography>
                </Alert>
              )}

            <TextField
              fullWidth
              label="Username"
              value={editForm.username}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, username: e.target.value }))
              }
              disabled={
                editingUser?.auth_provider &&
                editingUser.auth_provider !== "local"
              }
              sx={{ mb: 2 }}
              helperText={
                editingUser?.auth_provider &&
                editingUser.auth_provider !== "local"
                  ? "Username sincronizzato dal provider esterno"
                  : ""
              }
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, email: e.target.value }))
              }
              disabled={
                editingUser?.auth_provider &&
                editingUser.auth_provider !== "local"
              }
              sx={{ mb: 2 }}
              helperText={
                editingUser?.auth_provider &&
                editingUser.auth_provider !== "local"
                  ? "Email sincronizzata dal provider esterno"
                  : ""
              }
            />

            {/* Informazioni Profilo */}
            <Typography variant="h6" sx={{ mb: 2, mt: 3, color: "#667eea" }}>
              Profilo
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                fullWidth
                label="Nome"
                value={editForm.first_name}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
                disabled={
                  editingUser?.auth_provider &&
                  editingUser.auth_provider !== "local"
                }
                helperText={
                  editingUser?.auth_provider &&
                  editingUser.auth_provider !== "local"
                    ? "Nome sincronizzato dal provider esterno"
                    : ""
                }
              />
              <TextField
                fullWidth
                label="Cognome"
                value={editForm.last_name}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
                disabled={
                  editingUser?.auth_provider &&
                  editingUser.auth_provider !== "local"
                }
                helperText={
                  editingUser?.auth_provider &&
                  editingUser.auth_provider !== "local"
                    ? "Cognome sincronizzato dal provider esterno"
                    : ""
                }
              />
            </Box>

            <TextField
              fullWidth
              label="Telefono"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Avatar URL"
              value={editForm.avatar_url}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, avatar_url: e.target.value }))
              }
              sx={{ mb: 2 }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                fullWidth
                label="Fuso Orario"
                value={editForm.timezone}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, timezone: e.target.value }))
                }
              />
              <FormControl fullWidth>
                <InputLabel>Lingua</InputLabel>
                <Select
                  value={editForm.locale}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, locale: e.target.value }))
                  }
                  label="Lingua"
                >
                  <MenuItem value="it">Italiano</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="Biografia"
              multiline
              rows={3}
              value={editForm.bio}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, bio: e.target.value }))
              }
              sx={{ mb: 2 }}
            />

            {/* Informazioni Sistema */}
            <Typography variant="h6" sx={{ mb: 2, mt: 3, color: "#667eea" }}>
              Sistema
            </Typography>

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <FormControl fullWidth>
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

            {/* Avviso Provider */}
            {editingUser?.auth_provider &&
              editingUser.auth_provider !== "local" && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>
                      Provider {editingUser.auth_provider.toUpperCase()}:
                    </strong>
                    Nome, cognome ed email sono sincronizzati automaticamente e
                    non possono essere modificati.
                  </Typography>
                </Alert>
              )}
          </Box>
        </DialogContent>
        <DialogActions>
          <CustomButton
            onClick={() => setEditDialogOpen(false)}
            disabled={loading}
          >
            Annulla
          </CustomButton>
          <CustomButton
            onClick={handleSaveUser}
            variant="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Salva"}
          </CustomButton>
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Crea Nuovo Utente Locale</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Informazioni Base */}
            <Typography variant="h6" sx={{ mb: 2, color: "#667eea" }}>
              Informazioni Base
            </Typography>

            {/* Alert informativo per creazione utenti locali */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Creazione Utente Locale</strong>
                <br />
                Gli utenti creati dall'app sono sempre <strong>locali</strong> e
                gestiti internamente. Gli utenti esterni (LDAP/Google) vengono
                creati automaticamente al primo login.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Username"
              value={createForm.username}
              onChange={(e) =>
                setCreateForm({ ...createForm, username: e.target.value })
              }
              sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
              required
            />

            {/* Informazioni Profilo */}
            <Typography variant="h6" sx={{ mb: 2, mt: 3, color: "#667eea" }}>
              Profilo
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                fullWidth
                label="Nome"
                value={createForm.first_name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, first_name: e.target.value })
                }
              />
              <TextField
                fullWidth
                label="Cognome"
                value={createForm.last_name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, last_name: e.target.value })
                }
              />
            </Box>

            <TextField
              fullWidth
              label="Telefono"
              value={createForm.phone}
              onChange={(e) =>
                setCreateForm({ ...createForm, phone: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Avatar URL"
              value={createForm.avatar_url}
              onChange={(e) =>
                setCreateForm({ ...createForm, avatar_url: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 2,
              }}
            >
              <TextField
                fullWidth
                label="Fuso Orario"
                value={createForm.timezone}
                onChange={(e) =>
                  setCreateForm({ ...createForm, timezone: e.target.value })
                }
              />
              <FormControl fullWidth>
                <InputLabel>Lingua</InputLabel>
                <Select
                  value={createForm.locale}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, locale: e.target.value })
                  }
                  label="Lingua"
                >
                  <MenuItem value="it">Italiano</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="Biografia"
              multiline
              rows={3}
              value={createForm.bio}
              onChange={(e) =>
                setCreateForm({ ...createForm, bio: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            {/* Informazioni Sistema */}
            <Typography variant="h6" sx={{ mb: 2, mt: 3, color: "#667eea" }}>
              Sistema
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
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
          <CustomButton onClick={() => setCreateDialogOpen(false)}>
            Annulla
          </CustomButton>
          <CustomButton
            onClick={handleCreateUserSubmit}
            variant="primary"
            disabled={loading}
          >
            {loading ? "Creazione..." : "Crea Utente Locale"}
          </CustomButton>
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
          <CustomButton
            onClick={() => setDeleteConfirmDialogOpen(false)}
            disabled={loading}
          >
            Annulla
          </CustomButton>
          <CustomButton
            onClick={confirmDeleteUser}
            variant="primary"
            disabled={loading}
          >
            {loading ? "Eliminazione..." : "Elimina Utente"}
          </CustomButton>
        </DialogActions>
      </Dialog>

      {/* Modal Dettagli Utente */}
      <UserDetailModal
        open={detailModalOpen}
        onClose={handleCloseDetailModal}
        user={selectedUserForDetail}
        onEdit={handleEditUser}
        currentUserId={currentUser?.id}
      />
    </div>
  );
};

export default UserManagement;
