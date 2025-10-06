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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Calculate,
  Settings as SettingsIcon,
  People,
  Logout,
  AccountCircle,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import Calculator from "../Calculator";
import Parameters from "../Parameters";
import UserDashboard from "./UserDashboard";
import UserManagement from "./UserManagement";

const AuthenticatedApp: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    handleMenuClose();
    handleMobileMenuClose();
  };

  const handleProfile = () => {
    navigate("/dashboard");
    handleMenuClose();
    handleMobileMenuClose();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <People />;
      case "user":
        return <AccountCircle />;
      default:
        return <AccountCircle />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontSize: { xs: "1rem", sm: "1.25rem" } }}
          >
            Pricing Calculator v0.2
          </Typography>

          {isMobile ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton color="inherit" onClick={handleMobileMenuOpen}>
                <MenuIcon />
              </IconButton>
              <IconButton color="inherit" onClick={handleMenuOpen}>
                <Avatar
                  sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}
                >
                  {getRoleIcon(user?.role || "user")}
                </Avatar>
              </IconButton>
            </Box>
          ) : (
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
                to="/parameters"
                startIcon={<SettingsIcon />}
                className={location.pathname === "/parameters" ? "active" : ""}
              >
                Parametri
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

              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
                sx={{ ml: 1 }}
              >
                <Avatar
                  sx={{ width: 32, height: 32, bgcolor: "secondary.main" }}
                >
                  {getRoleIcon(user?.role || "user")}
                </Avatar>
              </IconButton>
            </Box>
          )}
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

      {/* Menu mobile per la navigazione */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
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
          component={Link}
          to="/"
          onClick={handleMobileMenuClose}
          selected={location.pathname === "/"}
        >
          <Calculate sx={{ mr: 1 }} />
          Calcolatrice
        </MenuItem>

        <MenuItem
          component={Link}
          to="/parameters"
          onClick={handleMobileMenuClose}
          selected={location.pathname === "/parameters"}
        >
          <SettingsIcon sx={{ mr: 1 }} />
          Parametri
        </MenuItem>

        {user?.role === "admin" && (
          <MenuItem
            component={Link}
            to="/users"
            onClick={handleMobileMenuClose}
            selected={location.pathname === "/users"}
          >
            <People sx={{ mr: 1 }} />
            Utenti
          </MenuItem>
        )}
      </Menu>

      <Box
        sx={{
          p: { xs: 1, sm: 2, md: 3 },
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <Routes>
          <Route path="/" element={<Calculator />} />
          <Route path="/parameters" element={<Parameters />} />
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
