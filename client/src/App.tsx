import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Calculator from "./components/Calculator";
import Settings from "./components/Settings";
import "./App.css";

function App() {
  const location = useLocation();

  return (
    <div className="App">
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <h1 className="nav-title">Pricing Calculator</h1>
            <div className="nav-links">
              <Link
                to="/"
                className={`nav-link ${
                  location.pathname === "/" ? "active" : ""
                }`}
              >
                Calcolatrice
              </Link>
              <Link
                to="/settings"
                className={`nav-link ${
                  location.pathname === "/settings" ? "active" : ""
                }`}
              >
                Impostazioni
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/" element={<Calculator />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p className="text-center text-muted">
            © 2025 LB Pricing Calculator - Calcolatrice prezzi con supporto
            multivaluta
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
