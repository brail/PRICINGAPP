/**
 * Pricing Calculator v0.3.1 - Profile Settings Component
 * Form per modificare le impostazioni del profilo utente
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import LoadingSpinner from "../LoadingSpinner";
import Card from "../Card";
import Input from "../Input";
import CustomButton from "../CustomButton";
import "./ProfileSettings.css";

interface ProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  timezone?: string;
  locale?: string;
  bio?: string;
}

interface UserProfileData {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  timezone?: string;
  locale?: string;
  bio?: string;
  auth_provider: string;
}

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: "",
    timezone: "",
    locale: "it",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Timezone detection
  const [detectedTimezone, setDetectedTimezone] = useState<string>("");

  useEffect(() => {
    loadProfile();
    detectTimezone();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/profile");
      const profileData = response.data.profile;
      setProfile(profileData);
      setFormData({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        phone: profileData.phone || "",
        avatar_url: profileData.avatar_url || "",
        timezone: profileData.timezone || "",
        locale: profileData.locale || "it",
        bio: profileData.bio || "",
      });
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(
        err.response?.data?.error || "Errore nel caricamento del profilo"
      );
    } finally {
      setLoading(false);
    }
  };

  const detectTimezone = () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(timezone);

      // Se non c'è un timezone impostato, suggerisci quello rilevato
      if (!formData.timezone && timezone) {
        setFormData((prev) => ({ ...prev, timezone }));
      }
    } catch (err) {
      console.warn("Could not detect timezone:", err);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validazione
      if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
        setError("Formato telefono non valido");
        return;
      }

      if (formData.bio && formData.bio.length > 500) {
        setError("Bio troppo lunga (max 500 caratteri)");
        return;
      }

      if (
        formData.locale &&
        !["it", "en", "de", "fr", "es"].includes(formData.locale)
      ) {
        setError("Lingua non supportata");
        return;
      }

      const response = await api.put("/profile", formData);
      setSuccess("Profilo aggiornato con successo!");
      setProfile(response.data.profile);

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(
        err.response?.data?.error || "Errore nell'aggiornamento del profilo"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUseDetectedTimezone = () => {
    if (detectedTimezone) {
      setFormData((prev) => ({ ...prev, timezone: detectedTimezone }));
      setSuccess("Fuso orario rilevato automaticamente!");
    }
  };

  const handleEmailChange = async (newEmail: string) => {
    try {
      setSaving(true);
      setError(null);

      const response = await api.post("/profile/email", { newEmail });
      setSuccess(
        "Email di verifica inviata! Controlla la tua nuova casella email."
      );

      // Pulisci il campo
      const emailInput = document.getElementById(
        "new_email"
      ) as HTMLInputElement;
      if (emailInput) emailInput.value = "";
    } catch (err: any) {
      console.error("Error requesting email change:", err);
      setError(
        err.response?.data?.error || "Errore nell'invio dell'email di verifica"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        avatar_url: profile.avatar_url || "",
        timezone: profile.timezone || "",
        locale: profile.locale || "it",
        bio: profile.bio || "",
      });
      setError(null);
      setSuccess(null);
    }
  };

  if (loading) {
    return (
      <div className="profile-settings-container">
        <Card>
          <div className="loading-container">
            <LoadingSpinner />
            <p>Caricamento impostazioni...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-settings-container">
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
    <div className="profile-settings-container">
      <Card>
        <div className="settings-header">
          <h2>⚙️ Impostazioni Profilo</h2>
          <p>Modifica le tue informazioni personali e preferenze</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-section">
            <h3>👤 Informazioni Personali</h3>

            <div className="form-group">
              <label htmlFor="first_name">
                Nome
                {profile?.auth_provider !== "local" && (
                  <span className="sync-badge">
                    📡 {profile.auth_provider === "ldap" ? "AD" : "Google"}
                  </span>
                )}
              </label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  handleInputChange("first_name", e.target.value)
                }
                placeholder="Il tuo nome"
                maxLength={50}
                disabled={profile?.auth_provider !== "local"}
                className={
                  profile?.auth_provider !== "local" ? "disabled-input" : ""
                }
              />
              {profile?.auth_provider !== "local" && (
                <small className="sync-info">
                  Nome sincronizzato automaticamente da{" "}
                  {profile.auth_provider === "ldap"
                    ? "Active Directory"
                    : "Google"}
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                Cognome
                {profile?.auth_provider !== "local" && (
                  <span className="sync-badge">
                    📡 {profile.auth_provider === "ldap" ? "AD" : "Google"}
                  </span>
                )}
              </label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Il tuo cognome"
                maxLength={50}
                disabled={profile?.auth_provider !== "local"}
                className={
                  profile?.auth_provider !== "local" ? "disabled-input" : ""
                }
              />
              {profile?.auth_provider !== "local" && (
                <small className="sync-info">
                  Cognome sincronizzato automaticamente da{" "}
                  {profile.auth_provider === "ldap"
                    ? "Active Directory"
                    : "Google"}
                </small>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>📧 Email</h3>

            <div className="form-group">
              <label htmlFor="current_email">Email Attuale</label>
              <Input
                id="current_email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="disabled-input"
              />
              <small>L'email può essere modificata tramite verifica</small>
            </div>

            <div className="form-group">
              <label htmlFor="new_email">Nuova Email</label>
              <Input
                id="new_email"
                type="email"
                placeholder="nuova@email.com"
                maxLength={100}
              />
              <CustomButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newEmail = (
                    document.getElementById("new_email") as HTMLInputElement
                  )?.value;
                  if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                    handleEmailChange(newEmail);
                  } else {
                    setError("Inserisci un indirizzo email valido");
                  }
                }}
              >
                📧 Richiedi Cambio Email
              </CustomButton>
            </div>
          </div>

          <div className="form-section">
            <h3>📞 Informazioni di Contatto</h3>

            <div className="form-group">
              <label htmlFor="phone">Telefono</label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+39 123 456 789"
                maxLength={20}
              />
              <small>Formato: +39 123 456 789 (opzionale)</small>
            </div>

            <div className="form-group">
              <label htmlFor="avatar_url">URL Avatar</label>
              <Input
                id="avatar_url"
                type="url"
                value={formData.avatar_url}
                onChange={(e) =>
                  handleInputChange("avatar_url", e.target.value)
                }
                placeholder="https://example.com/avatar.jpg"
              />
              <small>URL dell'immagine del profilo (opzionale)</small>
            </div>
          </div>

          <div className="form-section">
            <h3>🌍 Preferenze Locali</h3>

            <div className="form-group">
              <label htmlFor="timezone">Fuso Orario</label>
              <div className="timezone-group">
                <Input
                  id="timezone"
                  type="text"
                  value={formData.timezone}
                  onChange={(e) =>
                    handleInputChange("timezone", e.target.value)
                  }
                  placeholder="Europe/Rome"
                />
                {detectedTimezone && detectedTimezone !== formData.timezone && (
                  <CustomButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleUseDetectedTimezone}
                  >
                    Usa Rilevato ({detectedTimezone})
                  </CustomButton>
                )}
              </div>
              <small>Esempi: Europe/Rome, America/New_York, Asia/Tokyo</small>
            </div>

            <div className="form-group">
              <label htmlFor="locale">Lingua</label>
              <select
                id="locale"
                value={formData.locale}
                onChange={(e) => handleInputChange("locale", e.target.value)}
                className="form-select"
              >
                <option value="it">🇮🇹 Italiano</option>
                <option value="en">🇺🇸 English</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="es">🇪🇸 Español</option>
              </select>
              <small>Lingua preferita per l'interfaccia</small>
            </div>
          </div>

          <div className="form-section">
            <h3>📝 Biografia</h3>

            <div className="form-group">
              <label htmlFor="bio">Descrizione Personale</label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Raccontaci qualcosa di te..."
                maxLength={500}
                rows={4}
                className="form-textarea"
              />
              <small>{formData.bio?.length || 0}/500 caratteri</small>
            </div>
          </div>

          <div className="form-actions">
            <CustomButton
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={saving}
            >
              🔄 Ripristina
            </CustomButton>
            <CustomButton type="submit" variant="primary" disabled={saving}>
              {saving ? "Salvataggio..." : "💾 Salva Modifiche"}
            </CustomButton>
          </div>
        </form>

        <div className="settings-info">
          <h3>ℹ️ Informazioni</h3>
          <ul>
            <li>
              <strong>Username:</strong> {profile.username} (non modificabile)
            </li>
            <li>
              <strong>Email:</strong> {profile.email} (non modificabile)
            </li>
            <li>
              <strong>Provider:</strong> {profile.auth_provider}
            </li>
            <li>
              <strong>Ruolo:</strong> {profile.role}
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ProfileSettings;
