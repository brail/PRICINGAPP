/**
 * Pricing Calculator v0.3.1 - Profile Page Component
 * Pagina principale per la gestione del profilo utente con tab navigation
 */

import React, { useState } from "react";
import UserProfile from "./UserProfile";
import ProfileSettings from "./ProfileSettings";
import "./ProfilePage.css";

type TabType = "view" | "edit";

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("view");

  const tabs = [
    {
      id: "view" as TabType,
      label: "👁️ Visualizza Profilo",
      description: "Visualizza le tue informazioni personali",
    },
    {
      id: "edit" as TabType,
      label: "✏️ Modifica Profilo",
      description: "Modifica le tue informazioni e preferenze",
    },
  ];

  return (
    <div className="profile-page-container">
      <div className="profile-page-header">
        <h1>👤 Il Mio Profilo</h1>
        <p>Gestisci le tue informazioni personali e preferenze</p>
      </div>

      <div className="profile-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <div className="tab-content">
              <span className="tab-label">{tab.label}</span>
              <span className="tab-description">{tab.description}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="profile-content">
        {activeTab === "view" && <UserProfile />}
        {activeTab === "edit" && <ProfileSettings />}
      </div>
    </div>
  );
};

export default ProfilePage;
