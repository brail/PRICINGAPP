# 🧪 TEST CRUD PARAMETRI - VERIFICA COMPLETA

## 🎯 **OBIETTIVO**

Testare tutte le funzioni CRUD dei parametri nel frontend per identificare e risolvere l'errore HTTP 400 durante la modifica.

---

## **📋 CHECKLIST TEST CRUD**

### **1. ✅ TEST LETTURA (READ)**

- [ ] **Caricamento parametri correnti**: `/api/params`
- [ ] **Lista set di parametri**: `/api/parameter-sets`
- [ ] **Caricamento set specifico**: `/api/parameter-sets/{id}/load`
- [ ] **Visualizzazione in Calculator**: Parametri mostrati correttamente
- [ ] **Visualizzazione in Parameters**: Lista set caricata correttamente

### **2. ✅ TEST CREAZIONE (CREATE)**

- [ ] **Nuovo set di parametri**: Creare set con tutti i campi
- [ ] **Validazione form**: Campi obbligatori e valori numerici
- [ ] **Salvataggio**: Set creato e aggiunto alla lista
- [ ] **Sincronizzazione**: Calculator mostra il nuovo set
- [ ] **Persistenza**: Set salvato nel database

### **3. ✅ TEST AGGIORNAMENTO (UPDATE)**

- [ ] **Modifica parametri correnti**: Cambiare valori in Parameters
- [ ] **Aggiornamento set esistente**: Modificare set salvato
- [ ] **Validazione**: Controllo campi obbligatori
- [ ] **Sincronizzazione**: Calculator aggiornato immediatamente
- [ ] **Persistenza**: Modifiche salvate nel database

### **4. ✅ TEST ELIMINAZIONE (DELETE)**

- [ ] **Eliminazione set**: Rimuovere set di parametri
- [ ] **Conferma eliminazione**: Dialog di conferma
- [ ] **Aggiornamento lista**: Set rimosso dalla lista
- [ ] **Protezione set default**: Non eliminare set di default

### **5. ✅ TEST ORDINAMENTO (REORDER)**

- [ ] **Drag & Drop**: Riordinare set di parametri
- [ ] **Persistenza ordine**: Ordine salvato nel database
- [ ] **Aggiornamento UI**: Lista aggiornata immediatamente

---

## **🔍 ANALISI ERRORI**

### **Errore HTTP 400 Identificato:**

```
PUT /parameter-sets/16 - HTTP 400
```

**Possibili Cause:**

1. **Validazione campi**: Campi obbligatori mancanti
2. **Formato dati**: Mapping camelCase ↔ snake_case
3. **Validazione server**: Controlli lato server
4. **Autenticazione**: Token scaduto o mancante

---

## **🧪 TEST SPECIFICI**

### **TEST A: Creazione Set**

1. Aprire Parameters
2. Cliccare "Nuovo Set"
3. Compilare tutti i campi:
   - Description: "Test Set"
   - Purchase Currency: USD
   - Selling Currency: EUR
   - Quality Control: 5
   - Transport Insurance: 2.3
   - Duty: 8
   - Exchange Rate: 1.07
   - Italy Accessory Costs: 0.3
   - Tools: 1
   - Retail Multiplier: 2.6
   - Optimal Margin: 25
4. Salvare
5. **Verificare**: Set creato e visibile nella lista

### **TEST B: Modifica Set (PROBLEMA IDENTIFICATO)**

1. Selezionare un set esistente
2. Cliccare "Modifica"
3. Cambiare alcuni valori:
   - Duty: da 8 a 15
   - Optimal Margin: da 25 a 30
   - Purchase Currency: da USD a EUR
4. Salvare
5. **Verificare**: Modifiche salvate senza errori HTTP 400

### **TEST C: Caricamento Set**

1. Selezionare un set diverso
2. Cliccare "Carica"
3. **Verificare**: Calculator aggiornato con nuovi parametri
4. **Verificare**: Calcolo usa i nuovi parametri

### **TEST D: Eliminazione Set**

1. Selezionare un set non-default
2. Cliccare "Elimina"
3. Confermare eliminazione
4. **Verificare**: Set rimosso dalla lista

---

## **🔧 DEBUGGING**

### **Log Server da Analizzare:**

```
PUT /parameter-sets/16 - HTTP 400
```

**Azioni di Debug:**

1. **Controllare validazione server**: Middleware di validazione
2. **Verificare mapping campi**: camelCase vs snake_case
3. **Controllare autenticazione**: Token valido
4. **Analizzare payload**: Dati inviati dal frontend

### **Test API Diretti:**

```bash
# Test creazione
curl -X POST http://localhost:5001/api/parameter-sets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"description":"Test","purchase_currency":"USD",...}'

# Test modifica
curl -X PUT http://localhost:5001/api/parameter-sets/16 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"duty":15,"optimal_margin":30}'
```

---

## **📊 RISULTATI ATTESI**

### **✅ SUCCESSO COMPLETO:**

- Tutte le operazioni CRUD funzionano
- Nessun errore HTTP 400
- Sincronizzazione perfetta Calculator ↔ Parameters
- Persistenza dati corretta

### **❌ PROBLEMI IDENTIFICATI:**

- Errore HTTP 400 durante modifica set
- Possibile problema di validazione o mapping campi
- Necessità di correzione prima del commit

---

**🎯 PROSSIMO STEP**: Eseguire test manuali per identificare la causa esatta dell'errore HTTP 400 e correggerla prima del commit.
