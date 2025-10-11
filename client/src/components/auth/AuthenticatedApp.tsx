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
  Box,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CustomButton from "../CustomButton";
import {
  Calculate,
  Tune as TuneIcon,
  People,
  Logout,
  AccountCircle,
  Menu as MenuIcon,
  Help as HelpIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import Calculator from "../Calculator";
import Parameters from "../Parameters";
import UserDashboard from "./UserDashboard";
import UserManagement from "./UserManagement";
import { ProfilePage } from "../profile";
import EmailVerification from "./EmailVerification";
import Logo from "../Logo";
import HelpPanel from "../HelpPanel";

const AuthenticatedApp: React.FC = () => {
  const { user, logout, refreshUserProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);

  // Aggiorna il profilo utente quando il componente si carica
  React.useEffect(() => {
    if (user && (!user.first_name || !user.last_name)) {
      refreshUserProfile();
    }
  }, [user, refreshUserProfile]);

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
    navigate("/profile");
    handleMenuClose();
    handleMobileMenuClose();
  };

  const handleLogoClick = () => {
    navigate("/");
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              },
            }}
            onClick={handleLogoClick}
          >
            <Logo variant="white" size="medium" />
            <Typography
              variant="h6"
              component="div"
              sx={{
                ml: 2,
                fontSize: { xs: "1rem", sm: "1.25rem" },
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              PRICING CALCULATOR
            </Typography>
          </Box>

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
              <CustomButton
                variant="outline"
                component={Link}
                to="/"
                className={location.pathname === "/" ? "active" : ""}
              >
                <Calculate />
                Calcolatrice
              </CustomButton>

              <CustomButton
                variant="outline"
                component={Link}
                to="/parameters"
                className={location.pathname === "/parameters" ? "active" : ""}
              >
                <TuneIcon />
                Parametri
              </CustomButton>

              {user?.role === "admin" && (
                <CustomButton
                  variant="outline"
                  component={Link}
                  to="/users"
                  className={location.pathname === "/users" ? "active" : ""}
                >
                  <People />
                  Utenti
                </CustomButton>
              )}

              <IconButton
                color="inherit"
                onClick={() => setHelpPanelOpen(true)}
                sx={{ mr: 1 }}
                title="Aiuto e Supporto"
              >
                <HelpIcon />
              </IconButton>

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
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{user?.username} • {user?.role?.toUpperCase()}
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
          <TuneIcon sx={{ mr: 1 }} />
          Parametri
        </MenuItem>

        <MenuItem
          component={Link}
          to="/profile"
          onClick={handleMobileMenuClose}
          selected={location.pathname === "/profile"}
        >
          <AccountCircle sx={{ mr: 1 }} />
          Profilo
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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          {user?.role === "admin" && (
            <Route path="/users" element={<UserManagement />} />
          )}
        </Routes>
      </Box>

      {/* Help Panel */}
      <HelpPanel
        isOpen={helpPanelOpen}
        onClose={() => setHelpPanelOpen(false)}
      />
    </Box>
  );
};

export default AuthenticatedApp;
