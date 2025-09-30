# Pricing Calculator

Un'applicazione web completa per il calcolo dei prezzi con funzionalità bidirezionali e supporto multivaluta.

## Funzionalità

- **Calcolo bidirezionale**: Calcola il prezzo di vendita dal prezzo di acquisto e viceversa
- **Gestione margine**: Modifica il margine e aggiorna automaticamente i calcoli
- **Supporto multivaluta**: Calcoli in diverse valute con tassi di cambio aggiornati
- **Interfaccia responsive**: Design minimale e ottimizzato per tutti i dispositivi
- **Pagina impostazioni**: Configurazione parametri di calcolo (margine, IVA, spedizione)

## Struttura del Progetto

```
PRICINGAPP/
├── server/                 # Backend Node.js/Express
│   ├── index.js           # Server principale
│   └── package.json       # Dipendenze backend
├── client/                # Frontend React/TypeScript
│   ├── src/
│   │   ├── components/    # Componenti React
│   │   ├── services/      # Servizi API
│   │   ├── types/         # Tipi TypeScript
│   │   └── ...
│   └── package.json       # Dipendenze frontend
└── package.json           # Script principali
```

## Installazione

1. **Installa tutte le dipendenze**:

   ```bash
   npm run install-all
   ```

2. **Avvia l'applicazione in modalità sviluppo**:

   ```bash
   npm run dev
   ```

   Questo comando avvierà:

   - Backend su `http://localhost:5000`
   - Frontend su `http://localhost:3000`

## Script Disponibili

- `npm run dev` - Avvia backend e frontend in modalità sviluppo
- `npm run server` - Avvia solo il backend
- `npm run client` - Avvia solo il frontend
- `npm run build` - Compila il frontend per la produzione
- `npm run install-all` - Installa tutte le dipendenze

## API Endpoints

### Backend (Porta 5000)

- `GET /api/params` - Ottieni parametri attuali
- `PUT /api/params` - Aggiorna parametri
- `POST /api/calculate-selling` - Calcola prezzo di vendita
- `POST /api/calculate-purchase` - Calcola prezzo di acquisto
- `GET /api/exchange-rates` - Ottieni tassi di cambio
- `GET /api/health` - Health check

## Come Usare l'Applicazione

### Calcolatrice

1. **Inserisci un prezzo di acquisto** per calcolare automaticamente il prezzo di vendita
2. **Inserisci un prezzo di vendita** per calcolare il prezzo di acquisto necessario
3. **Modifica il margine** per aggiornare i calcoli in tempo reale
4. **Seleziona la valuta** per i calcoli

### Impostazioni

1. **Configura il margine di profitto** (percentuale)
2. **Imposta l'aliquota IVA** (percentuale)
3. **Definisci il costo di spedizione** (importo fisso)
4. **Scegli la valuta predefinita**
5. **Visualizza i tassi di cambio** aggiornati

## Formula di Calcolo

```
Prezzo di Vendita = (Prezzo di Acquisto + Margine + Spedizione) × (1 + IVA/100)

Dove:
- Margine = Prezzo di Acquisto × (Margine%/100)
- IVA = (Prezzo + Margine + Spedizione) × (IVA%/100)
```

## Tecnologie Utilizzate

### Backend

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Axios** - Client HTTP per tassi di cambio
- **CORS** - Gestione CORS

### Frontend

- **React 18** - Libreria UI
- **TypeScript** - Tipizzazione statica
- **React Router** - Navigazione
- **Axios** - Client HTTP

### Styling

- **CSS3** - Styling personalizzato
- **Responsive Design** - Design adattivo
- **CSS Grid/Flexbox** - Layout moderno

## Supporto Valute

- EUR (Euro)
- USD (Dollaro USA)
- GBP (Sterlina)
- JPY (Yen Giapponese)
- CHF (Franco Svizzero)
- CAD (Dollaro Canadese)
- AUD (Dollaro Australiano)

I tassi di cambio vengono aggiornati automaticamente ogni ora tramite API esterne.

## Sviluppo

Per contribuire al progetto:

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/nuova-feature`)
3. Commit delle modifiche (`git commit -am 'Aggiunge nuova feature'`)
4. Push del branch (`git push origin feature/nuova-feature`)
5. Crea una Pull Request

## Licenza

MIT License - vedi file LICENSE per dettagli.


