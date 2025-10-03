/**
 * Pricing Calculator v0.2 - Authenticated App Component
 * Componente principale per utenti autenticati
 */

import React, { useState } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Calculate,
  Settings as SettingsIcon,
  Dashboard,
  People,
  Logout,
  AccountCircle,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import Calculator from "../Calculator";
import Settings from "../Settings";
import UserDashboard from "./UserDashboard";
import UserManagement from "./UserManagement";

const AuthenticatedApp: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleMenuClose();
  };

  const handleProfile = () => {
    navigate("/dashboard");
    handleMenuClose();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <People />;
      case "user":
        return <AccountCircle />;
      case "guest":
        return <AccountCircle />;
      default:
        return <AccountCircle />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pricing Calculator v0.2
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              color="inherit"
              component={Link}
              to="/"
              startIcon={<Calculate />}
              className={location.pathname === "/" ? "active" : ""}
            >
              Calcolatrice
            </Button>

            <Button
              color="inherit"
              component={Link}
              to="/settings"
              startIcon={<SettingsIcon />}
              className={location.pathname === "/settings" ? "active" : ""}
            >
              Impostazioni
            </Button>

            <Button
              color="inherit"
              component={Link}
              to="/dashboard"
              startIcon={<Dashboard />}
              className={location.pathname === "/dashboard" ? "active" : ""}
            >
              Dashboard
            </Button>

            {user?.role === "admin" && (
              <Button
                color="inherit"
                component={Link}
                to="/users"
                startIcon={<People />}
                className={location.pathname === "/users" ? "active" : ""}
              >
                Utenti
              </Button>
            )}

            <IconButton color="inherit" onClick={handleMenuOpen} sx={{ ml: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}>
                {getRoleIcon(user?.role || "user")}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem disabled>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {user?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role?.toUpperCase()}
            </Typography>
          </Box>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleProfile}>
          <AccountCircle sx={{ mr: 1 }} />
          Profilo
        </MenuItem>

        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      <Box sx={{ p: 3 }}>
        <Routes>
          <Route path="/" element={<Calculator />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          {user?.role === "admin" && (
            <Route path="/users" element={<UserManagement />} />
          )}
        </Routes>
      </Box>
    </Box>
  );
};

export default AuthenticatedApp;
