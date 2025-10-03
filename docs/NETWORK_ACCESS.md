# 🌐 Accesso di Rete - Pricing Calculator

## 📡 Configurazione per Accesso di Rete Interna

L'applicazione è ora configurata per essere accessibile da tutti i dispositivi della rete interna.

### 🚀 Avvio per Accesso di Rete

```bash
# Avvia l'applicazione per accesso di rete
npm run dev:network
```

### 🔗 URL di Accesso

**Frontend (Interfaccia Utente):**

- **Locale**: http://localhost:3000
- **Rete Interna**: http://192.168.1.71:3000

**Backend (API):**

- **Locale**: http://localhost:5001
- **Rete Interna**: http://192.168.1.71:5001

### 📱 Accesso da Altri Dispositivi

Per accedere dall'applicazione da altri dispositivi nella stessa rete:

1. **Assicurati che i dispositivi siano sulla stessa rete WiFi**
2. **Apri il browser su qualsiasi dispositivo**
3. **Vai all'indirizzo**: `http://192.168.1.71:3000`

### 🔧 Configurazione Tecnica

#### Backend (server/index.js)

```javascript
// Server in ascolto su tutte le interfacce di rete
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
  console.log(`Accessibile da rete interna su: http://[IP_LOCALE]:${PORT}`);
});
```

#### Frontend (package.json principale)

```json
{
  "scripts": {
    "client:network": "cd client && HOST=0.0.0.0 REACT_APP_API_URL=http://192.168.1.71:5001 npm start"
  }
}
```

### 🛡️ Sicurezza

⚠️ **Nota**: Questa configurazione rende l'applicazione accessibile a tutti i dispositivi nella rete locale. Per uso in produzione, considera:

- Configurazione di firewall
- Autenticazione utente
- HTTPS/SSL
- Restrizioni di accesso IP

### 🔍 Troubleshooting

**Problema**: Non riesco ad accedere dall'altro dispositivo
**Soluzione**:

1. Verifica che entrambi i dispositivi siano sulla stessa rete
2. Controlla che il firewall non blocchi le porte 3000 e 5001
3. Prova a disabilitare temporaneamente l'antivirus

**Problema**: L'applicazione non si avvia
**Soluzione**:

1. Assicurati che le porte 3000 e 5001 non siano già in uso
2. Riavvia l'applicazione con `npm run dev:network`

### 📊 Monitoraggio

Per verificare che l'applicazione sia accessibile:

```bash
# Test backend
curl http://192.168.1.71:5001/api/health

# Test frontend
curl http://192.168.1.71:3000
```

---

**🎉 L'applicazione è ora accessibile da tutta la rete interna!**
