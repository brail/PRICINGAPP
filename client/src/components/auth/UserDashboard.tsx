/**
 * Pricing Calculator v0.2 - User Dashboard Component
 * Dashboard utente con informazioni personali
 */

import React, { useState } from "react";
import {
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  Person,
  AdminPanelSettings,
  PersonAdd,
  Edit,
  Save,
  Cancel,
  Lock,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import ChangePasswordDialog from "./ChangePasswordDialog";
import "./UserDashboard.css";

const UserDashboard: React.FC = () => {
  const { user, updateUser, isLoading } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] =
    useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditProfile = () => {
    setEditForm({
      username: user?.username || "",
      email: user?.email || "",
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
      setError(err.message || "Errore nell'aggiornamento del profilo");
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <AdminPanelSettings />;
      case "user":
        return <Person />;
      default:
        return <Person />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "error";
      case "user":
        return "primary";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Mai";
    return new Date(dateString).toLocaleDateString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Utente non trovato</Alert>
      </Box>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard Utente</h2>
        <p className="text-muted">
          Gestisci il tuo profilo e le impostazioni dell'account.
        </p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          {/* Card Profilo */}
          <div className="dashboard-card">
            <div className="profile-header">
              <div className="profile-avatar">{getRoleIcon(user.role)}</div>
              <div className="profile-info">
                <h4>{user.username}</h4>
                <span className={`profile-role ${user.role}`}>
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="profile-divider"></div>

            <div className="profile-field">
              <span className="profile-field-label">Email</span>
              <span className="profile-field-value">{user.email}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Membro dal</span>
              <span className="profile-field-value">
                {formatDate(user.created_at)}
              </span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Ultimo accesso</span>
              <span className="profile-field-value">
                {formatDate(user.last_login)}
              </span>
            </div>

            <div className="profile-actions">
              <button
                className="btn btn-outlined"
                onClick={handleEditProfile}
                disabled={isLoading}
              >
                <Edit className="btn-icon" />
                Modifica Profilo
              </button>
              <button
                className="btn btn-outlined"
                onClick={() => setChangePasswordDialogOpen(true)}
                disabled={isLoading}
              >
                <Lock className="btn-icon" />
                Cambia Password
              </button>
            </div>
          </div>

          {/* Card Statistiche */}
          <div className="dashboard-card">
            <h3>Statistiche Account</h3>

            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Ruolo</span>
                <span className={`stat-chip ${user.role}`}>
                  {user.role === "admin"
                    ? "Amministratore"
                    : user.role === "user"
                    ? "Utente"
                    : "Ospite"}
                </span>
              </div>

              <div className="stat-item">
                <span className="stat-label">Permessi</span>
                <span className="stat-value">
                  {user.role === "admin"
                    ? "Accesso completo"
                    : user.role === "user"
                    ? "Accesso standard"
                    : "Accesso limitato"}
                </span>
              </div>

              <div className="stat-item">
                <span className="stat-label">Versione App</span>
                <span className="stat-value">v0.2.0-dev</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog per modifica profilo */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
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
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog per cambio password */}
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onClose={() => setChangePasswordDialogOpen(false)}
        onSuccess={() => {
          // Opzionale: mostra un messaggio di successo
        }}
      />
    </div>
  );
};

export default UserDashboard;
