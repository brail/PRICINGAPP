# Release v0.3.0 - Multi-Provider Authentication System

**Release Date:** January 27, 2025

## 🎯 Highlights

### Major Features

- **Multi-Provider Authentication System**
  - Support for Local Admin authentication
  - Active Directory/LDAP integration with custom service
  - Google OAuth2 ready (configuration required)

- **Just-in-Time (JIT) User Provisioning**
  - Automatic user creation from external providers
  - Email-based account linking
  - Provider metadata synchronization

- **Enhanced Security**
  - AES-256-CBC encryption for LDAP credentials
  - Service account pattern for LDAP bind
  - JWT-based session management
  - Comprehensive audit logging

- **Dynamic Authentication UI**
  - Provider selection with visual buttons
  - OAuth callback handling
  - Progressive form disclosure
  - Mobile-responsive design

## ⚠️ Breaking Changes

### Authentication Model Changes

1. **Local Authentication Restricted**
   - Local username/password login now only available to administrators
   - Existing non-admin users must use external providers
   - Emergency admin access preserved

2. **Database Schema Migration Required**
   - New columns: `auth_provider`, `provider_user_id`, `provider_metadata`
   - Password column now nullable
   - Run migrations 003 and 004 before starting

3. **New Dependencies**
   - `passport@^0.7.0`
   - `passport-local@^1.0.0`
   - `passport-google-oauth20@^2.0.0`
   - `ldapjs@^3.0.7`
   - `express-session@^1.18.0`

### API Endpoint Changes

- `/auth/login` - Now validates admin-only local access
- `/auth/ldap` - New LDAP authentication endpoint (POST)
- `/auth/google` - New Google OAuth initiation (GET)
- `/auth/google/callback` - New OAuth callback handler (GET)
- `/auth/providers` - New provider listing endpoint (GET)

## 📋 Migration Guide

### Step 1: Backup Your Data

```bash
# Backup database
cp server/data/pricing.db server/data/pricing.db.backup-$(date +%Y%m%d)

# Backup environment config
cp server/.env server/.env.backup
```

### Step 2: Update Dependencies

```bash
# Update server dependencies
cd server
npm install

# Update client dependencies
cd ../client
npm install
```

### Step 3: Configure Environment

Create `server/.env` based on `server/.env.example`:

```env
# Enable authentication providers
ENABLE_LOCAL_AUTH=true
ENABLE_LDAP_AUTH=true  # if using LDAP
ENABLE_GOOGLE_AUTH=false  # enable after Google setup

# LDAP Configuration (if enabled)
LDAP_URL=ldap://your-server:389
LDAP_BIND_DN_ENCRYPTED={"encrypted":"...","iv":"..."}
LDAP_BIND_PASSWORD_ENCRYPTED={"encrypted":"...","iv":"..."}
# ... other LDAP settings
```

**For LDAP credentials encryption:**
```bash
cd server
node scripts/encrypt-ldap-credentials.js
```

### Step 4: Run Database Migrations

Migrations run automatically on server start, or manually:

```bash
cd server
node -e "
const db = require('./database').db;
const migration003 = require('./src/migrations/003_add_auth_providers');
const migration004 = require('./src/migrations/004_fix_password_constraint');

async function runMigrations() {
  await migration003.up(db);
  await migration004.up(db);
  console.log('Migrations completed');
}

runMigrations();
"
```

### Step 5: Test Authentication

```bash
# Start server
npm run server

# In another terminal, test providers endpoint
curl http://localhost:5001/auth/providers

# Test local admin login
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

### Step 6: Configure External Providers (Optional)

#### For Google OAuth:
1. Follow `docs/GOOGLE_OAUTH_SETUP.md`
2. Update environment variables
3. Set `ENABLE_GOOGLE_AUTH=true`

#### For LDAP:
1. Review `docs/LDAP_SECURITY.md`
2. Create service account in AD
3. Encrypt credentials
4. Configure group mappings

## 🔒 Security Considerations

### LDAP Credential Encryption

- **Never store LDAP passwords in plain text**
- Use provided encryption script: `server/scripts/encrypt-ldap-credentials.js`
- Encryption key derived from `JWT_SECRET`
- See `docs/LDAP_SECURITY.md` for details

### JWT Secret Management

- **Change default JWT secrets in production**
- Use strong, random secrets (32+ characters)
- Keep secrets out of version control
- Rotate secrets periodically

### Service Account Best Practices

- Create dedicated LDAP service account
- Grant minimum required permissions (read-only on user OU)
- Never use domain admin credentials
- Monitor service account activity

## 📚 Documentation

- [`docs/AUTH_PROVIDERS.md`](docs/AUTH_PROVIDERS.md) - Architecture overview
- [`docs/GOOGLE_OAUTH_SETUP.md`](docs/GOOGLE_OAUTH_SETUP.md) - Google setup guide
- [`docs/LDAP_SECURITY.md`](docs/LDAP_SECURITY.md) - LDAP security best practices
- [`README-v0.3.0.md`](README-v0.3.0.md) - Quick start guide

## 🐛 Known Issues

- LDAP connection timeout after 30s (configurable)
- OAuth callback requires session storage (in-memory for now)
- Google profile pictures not cached locally

## 🔮 Coming in v0.3.1

- Enhanced user profiles (phone, bio, timezone)
- Email change with verification
- Timezone auto-detection from client
- Avatar URL support from providers
- User activity audit logs
- Admin panel for user management

## 📊 Full Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for complete technical details of all changes.

## 🙏 Acknowledgments

Thanks to all contributors and testers who helped make this release possible!

---

**For support or questions:**
- Create an issue on GitHub
- Check documentation in `docs/` folder
- Review existing closed issues for common problems

