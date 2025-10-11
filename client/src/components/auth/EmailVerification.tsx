import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import LoadingSpinner from "../LoadingSpinner";
import Card from "../Card";
import "./EmailVerification.css";

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setError("Token di verifica mancante");
        return;
      }

      try {
        const response = await api.get(`/profile/verify-email?token=${token}`);
        setStatus("success");
        setMessage(response.data.message || "Email verificata con successo!");

        // Redirect al profilo dopo 3 secondi
        setTimeout(() => {
          navigate("/profile");
        }, 3000);
      } catch (err: any) {
        setStatus("error");
        setError(
          err.response?.data?.error || "Errore nella verifica dell'email"
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  if (status === "loading") {
    return (
      <div className="email-verification-container">
        <Card className="verification-card">
          <div className="verification-content">
            <LoadingSpinner />
            <h2>Verifica Email in Corso...</h2>
            <p>Stiamo verificando il tuo indirizzo email...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="email-verification-container">
        <Card className="verification-card success">
          <div className="verification-content">
            <div className="success-icon">✅</div>
            <h2>Email Verificata!</h2>
            <p>{message}</p>
            <p className="redirect-info">
              Verrai reindirizzato al tuo profilo tra 3 secondi...
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate("/profile")}
            >
              Vai al Profilo
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="email-verification-container">
      <Card className="verification-card error">
        <div className="verification-content">
          <div className="error-icon">❌</div>
          <h2>Errore nella Verifica</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate("/profile")}
            >
              Torna al Profilo
            </button>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Vai alla Home
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EmailVerification;
