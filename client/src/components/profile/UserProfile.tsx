/**
 * Pricing Calculator v0.3.1 - User Profile Component
 * Visualizza il profilo utente corrente con informazioni complete
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import LoadingSpinner from "../LoadingSpinner";
import Card from "../Card";
import "./UserProfile.css";

interface UserProfileData {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  timezone?: string;
  locale?: string;
  bio?: string;
  profile_updated_at?: string;
  auth_provider: string;
  provider_user_id?: string;
  email_verified_at?: string;
  preferences: Record<string, any>;
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/profile");
      setProfile(response.data.profile);
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(
        err.response?.data?.error || "Errore nel caricamento del profilo"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("it-IT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case "local":
        return "Account Locale";
      case "ldap":
        return "Active Directory";
      case "google":
        return "Google";
      default:
        return provider;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "local":
        return "🔐";
      case "ldap":
        return "🏢";
      case "google":
        return "🔍";
      default:
        return "👤";
    }
  };

  if (loading) {
    return (
      <div className="user-profile-container">
        <Card>
          <div className="loading-container">
            <LoadingSpinner />
            <p>Caricamento profilo...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-container">
        <Card>
          <div className="error-container">
            <h3>❌ Errore</h3>
            <p>{error}</p>
            <button onClick={loadProfile} className="retry-button">
              Riprova
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="user-profile-container">
        <Card>
          <div className="error-container">
            <h3>⚠️ Profilo non trovato</h3>
            <p>Impossibile caricare il profilo utente.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <Card>
        <div className="user-profile-header">
          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="avatar-image"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
            ) : null}
            <div
              className={`avatar-placeholder ${
                profile.avatar_url ? "hidden" : ""
              }`}
            >
              {getProviderIcon(profile.auth_provider)}
            </div>
          </div>
          <div className="profile-info">
            <h2 className="profile-name">
              {profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.username}
            </h2>
            {profile.first_name && profile.last_name && (
              <p className="profile-username">@{profile.username}</p>
            )}
            {profile.auth_provider !== "local" &&
              profile.first_name &&
              profile.last_name && (
                <p className="profile-sync-info">
                  📡 Nome sincronizzato da{" "}
                  {profile.auth_provider === "ldap"
                    ? "Active Directory"
                    : "Google"}
                </p>
              )}
            <p className="profile-email">{profile.email}</p>
            <div className="profile-badges">
              <span className={`role-badge role-${profile.role}`}>
                {profile.role === "admin" ? "👑 Amministratore" : "👤 Utente"}
              </span>
              <span className="provider-badge">
                {getProviderIcon(profile.auth_provider)}{" "}
                {getProviderDisplayName(profile.auth_provider)}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-section">
            <h3>📋 Informazioni Personali</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Telefono:</label>
                <span>{profile.phone || "Non specificato"}</span>
              </div>
              <div className="detail-item">
                <label>Fuso Orario:</label>
                <span>{profile.timezone || "Non specificato"}</span>
              </div>
              <div className="detail-item">
                <label>Lingua:</label>
                <span>{profile.locale || "Non specificata"}</span>
              </div>
              <div className="detail-item">
                <label>Email Verificata:</label>
                <span
                  className={
                    profile.email_verified_at ? "verified" : "not-verified"
                  }
                >
                  {profile.email_verified_at ? "✅ Sì" : "❌ No"}
                </span>
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="detail-section">
              <h3>📝 Biografia</h3>
              <p className="bio-text">{profile.bio}</p>
            </div>
          )}

          <div className="detail-section">
            <h3>📊 Informazioni Account</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>ID Utente:</label>
                <span className="monospace">#{profile.id}</span>
              </div>
              <div className="detail-item">
                <label>Account Creato:</label>
                <span>{formatDate(profile.created_at)}</span>
              </div>
              <div className="detail-item">
                <label>Ultimo Accesso:</label>
                <span>{formatDate(profile.last_login)}</span>
              </div>
              {profile.profile_updated_at && (
                <div className="detail-item">
                  <label>Profilo Aggiornato:</label>
                  <span>{formatDate(profile.profile_updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {profile.provider_user_id && (
            <div className="detail-section">
              <h3>🔗 Provider Esterno</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>ID Provider:</label>
                  <span className="monospace">{profile.provider_user_id}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;
