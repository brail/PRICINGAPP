import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Chip,
  Avatar,
  Divider,
  Box,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import CustomButton from "../CustomButton";
import "./UserDetailModal.css";

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

interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onEdit: (user: User) => void;
  currentUserId?: number;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  open,
  onClose,
  user,
  onEdit,
  currentUserId,
}) => {
  if (!user) return null;

  const isExternalProvider =
    user.auth_provider && user.auth_provider !== "local";
  const isCurrentUser = user.id === currentUserId;
  const fullName =
    user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.username;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Mai";
    return new Date(dateString).toLocaleString("it-IT", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProviderInfo = () => {
    switch (user.auth_provider) {
      case "ldap":
        return {
          name: "Active Directory",
          icon: <BusinessIcon />,
          color: "success" as const,
          description: "Sincronizzato da Active Directory",
        };
      case "google":
        return {
          name: "Google",
          icon: <LanguageIcon />,
          color: "warning" as const,
          description: "Sincronizzato da Google",
        };
      default:
        return {
          name: "Locale",
          icon: <SecurityIcon />,
          color: "default" as const,
          description: "Account locale",
        };
    }
  };

  const providerInfo = getProviderInfo();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="user-detail-modal"
    >
      <DialogTitle className="modal-header">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={user.avatar_url}
              alt={fullName}
              sx={{ width: 48, height: 48 }}
            >
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" component="div">
                {fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{user.username}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              icon={providerInfo.icon}
              label={providerInfo.name}
              color={providerInfo.color}
              size="small"
            />
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent className="modal-content">
        <Box className="modal-sections">
          {/* Informazioni Base */}
          <Box className="section">
            <Typography variant="h6" gutterBottom className="section-title">
              Informazioni Base
            </Typography>
            <Box className="info-grid">
              <Box className="info-item">
                <Typography variant="body2" color="text.secondary">
                  Nome Completo
                </Typography>
                <Typography variant="body1">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : "Non specificato"}
                  {isExternalProvider && (
                    <Chip
                      label="Sincronizzato"
                      size="small"
                      color="info"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </Box>
              <Box className="info-item">
                <Typography variant="body2" color="text.secondary">
                  Username
                </Typography>
                <Typography variant="body1">@{user.username}</Typography>
              </Box>
              <Box className="info-item full-width">
                <EmailIcon className="info-icon" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{user.email}</Typography>
                  {user.email_verified_at && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Verificata"
                      size="small"
                      color="success"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                  {isExternalProvider && (
                    <Chip
                      label="Sincronizzata"
                      size="small"
                      color="info"
                      sx={{ mt: 0.5, ml: 1 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ width: "100%", my: 2 }} />

          {/* Informazioni Profilo */}
          <Box className="section">
            <Typography variant="h6" gutterBottom className="section-title">
              Profilo
            </Typography>
            <Box className="info-grid">
              {user.phone && (
                <Box className="info-item">
                  <PhoneIcon className="info-icon" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Telefono
                    </Typography>
                    <Typography variant="body1">{user.phone}</Typography>
                  </Box>
                </Box>
              )}
              <Box className="info-item">
                <ScheduleIcon className="info-icon" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fuso Orario
                  </Typography>
                  <Typography variant="body1">
                    {user.timezone || "Europe/Rome"}
                  </Typography>
                </Box>
              </Box>
              <Box className="info-item">
                <LanguageIcon className="info-icon" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Lingua
                  </Typography>
                  <Typography variant="body1">
                    {user.locale === "it"
                      ? "Italiano"
                      : user.locale || "Italiano"}
                  </Typography>
                </Box>
              </Box>
              {user.bio && (
                <Box className="info-item full-width">
                  <Typography variant="body2" color="text.secondary">
                    Biografia
                  </Typography>
                  <Typography variant="body1" className="bio-text">
                    {user.bio}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Divider sx={{ width: "100%", my: 2 }} />

          {/* Informazioni Sistema */}
          <Box className="section">
            <Typography variant="h6" gutterBottom className="section-title">
              Informazioni Sistema
            </Typography>
            <Box className="info-grid">
              <Box className="info-item">
                <Typography variant="body2" color="text.secondary">
                  Ruolo
                </Typography>
                <Chip
                  label={
                    user.role === "admin" ? "👑 Amministratore" : "👤 Utente"
                  }
                  color={user.role === "admin" ? "primary" : "default"}
                  size="small"
                />
              </Box>
              <Box className="info-item">
                <Typography variant="body2" color="text.secondary">
                  Stato
                </Typography>
                <Chip
                  icon={user.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                  label={user.is_active ? "Attivo" : "Disattivato"}
                  color={user.is_active ? "success" : "error"}
                  size="small"
                />
              </Box>
              <Box className="info-item">
                <Typography variant="body2" color="text.secondary">
                  Data Creazione
                </Typography>
                <Typography variant="body1">
                  {formatDate(user.created_at)}
                </Typography>
              </Box>
              <Box className="info-item">
                <Typography variant="body2" color="text.secondary">
                  Ultimo Login
                </Typography>
                <Typography variant="body1">
                  {formatDate(user.last_login)}
                </Typography>
              </Box>
              {user.profile_updated_at && (
                <Box className="info-item">
                  <Typography variant="body2" color="text.secondary">
                    Profilo Aggiornato
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(user.profile_updated_at)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Informazioni Provider */}
          {isExternalProvider && (
            <>
              <Divider sx={{ width: "100%", my: 2 }} />
              <Box className="section">
                <Typography variant="h6" gutterBottom className="section-title">
                  Informazioni Provider
                </Typography>
                <Box className="provider-info">
                  <Typography variant="body2" color="text.secondary">
                    {providerInfo.description}
                  </Typography>
                  {user.provider_user_id && (
                    <Typography variant="body2" color="text.secondary">
                      ID Provider: {user.provider_user_id}
                    </Typography>
                  )}
                  <Box className="sync-notice">
                    <Typography variant="body2" color="info.main">
                      ℹ️ Nome, cognome ed email sono sincronizzati
                      automaticamente dal provider e non possono essere
                      modificati.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions className="modal-actions">
        <CustomButton onClick={onClose} variant="secondary">
          Chiudi
        </CustomButton>
        {!isCurrentUser && (
          <CustomButton onClick={() => onEdit(user)} variant="primary">
            <EditIcon sx={{ mr: 1 }} />
            Modifica Utente
          </CustomButton>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailModal;
