# 🚨 GUIDA GESTIONE ERRORI UNIFICATA

## 📋 **PATTERN OBBLIGATORIO PER TUTTI I COMPONENTI**

### **✅ IMPORTS RICHIESTI**

```typescript
import { useBusinessErrorHandler, createBusinessError } from "../../hooks/useBusinessErrorHandler";
import { CompactErrorHandler } from "../CompactErrorHandler";
import { useNotification } from "../../contexts/NotificationContext";
```

### **✅ HOOKS OBBLIGATORI**

```typescript
const { addError, clearErrors, errors } = useBusinessErrorHandler();
const { showSuccess, showError, showWarning, showInfo } = useNotification();
```

### **✅ RENDERING ERRORI**

```typescript
return (
  <div>
    <CompactErrorHandler />
    {/* resto del componente */}
  </div>
);
```

### **✅ GESTIONE ERRORI API**

```typescript
try {
  // operazione API
  const result = await pricingApi.get('/endpoint');
  showSuccess("Operazione completata", "L'operazione è stata eseguita con successo.");
} catch (err: any) {
  addError(createBusinessError.apiError(
    "Titolo errore",
    "Descrizione dettagliata dell'errore con suggerimenti.",
    err
  ));
}
```

### **✅ GESTIONE ERRORI VALIDAZIONE**

```typescript
if (!formData.requiredField) {
  addError(createBusinessError.validationError(
    "Campo obbligatorio",
    "Il campo è obbligatorio per completare l'operazione."
  ));
  return;
}
```

### **✅ GESTIONE ERRORI BUSINESS**

```typescript
if (businessCondition) {
  addError(createBusinessError.businessError(
    "Condizione business",
    "Descrizione del problema e suggerimenti per risolverlo."
  ));
  return;
}
```

## 🚫 **COSA NON FARE**

### **❌ NON usare:**
- `useState<string>("")` per errori
- `setError()` per gestire errori
- `Alert` component per errori
- Gestione errori locale non strutturata

### **❌ NON fare:**
```typescript
// SBAGLIATO
const [error, setError] = useState<string>("");
setError("Errore generico");
{error && <Alert severity="error">{error}</Alert>}
```

## 📝 **TEMPLATE COMPONENTE NUOVO**

```typescript
import React, { useState } from "react";
import { useBusinessErrorHandler, createBusinessError } from "../../hooks/useBusinessErrorHandler";
import { CompactErrorHandler } from "../CompactErrorHandler";
import { useNotification } from "../../contexts/NotificationContext";

const NewComponent: React.FC = () => {
  const { addError, clearErrors, errors } = useBusinessErrorHandler();
  const { showSuccess, showError } = useNotification();
  
  const handleOperation = async () => {
    try {
      clearErrors();
      // operazione
      showSuccess("Successo", "Operazione completata con successo.");
    } catch (err: any) {
      addError(createBusinessError.apiError(
        "Errore operazione",
        "Descrizione dettagliata dell'errore.",
        err
      ));
    }
  };

  return (
    <div>
      <CompactErrorHandler />
      {/* resto del componente */}
    </div>
  );
};
```

## 🎯 **TIPI DI ERRORI DISPONIBILI**

### **1. API Errors**
```typescript
createBusinessError.apiError(title, message, axiosError)
```

### **2. Validation Errors**
```typescript
createBusinessError.validationError(title, message)
```

### **3. Business Errors**
```typescript
createBusinessError.businessError(title, message)
```

### **4. Network Errors**
```typescript
createBusinessError.networkError(title, message)
```

## 🔧 **UTILITÀ DISPONIBILI**

### **Toast Notifications**
```typescript
showSuccess("Titolo", "Messaggio");
showError("Titolo", "Messaggio");
showWarning("Titolo", "Messaggio");
showInfo("Titolo", "Messaggio");
```

### **Error Management**
```typescript
clearErrors(); // Pulisce tutti gli errori
addError(businessError); // Aggiunge un errore
```

## 📚 **ESEMPI PRATICI**

### **Form Validation**
```typescript
const handleSubmit = async () => {
  if (!formData.email) {
    addError(createBusinessError.validationError(
      "Email obbligatoria",
      "L'email è obbligatoria per completare la registrazione."
    ));
    return;
  }
  
  try {
    await submitForm();
    showSuccess("Registrazione completata", "Il tuo account è stato creato con successo.");
  } catch (err) {
    addError(createBusinessError.apiError(
      "Errore registrazione",
      "Impossibile completare la registrazione. Verifica i dati e riprova.",
      err
    ));
  }
};
```

### **API Call**
```typescript
const loadData = async () => {
  try {
    clearErrors();
    const response = await pricingApi.get('/data');
    setData(response.data);
    showSuccess("Dati caricati", "I dati sono stati caricati con successo.");
  } catch (err) {
    addError(createBusinessError.apiError(
      "Errore caricamento",
      "Impossibile caricare i dati. Verifica la connessione e riprova.",
      err
    ));
  }
};
```

## 🎨 **DESIGN PRINCIPLES**

1. **Coerenza**: Stesso pattern in tutti i componenti
2. **Chiarezza**: Messaggi di errore chiari e utili
3. **Azioni**: Suggerimenti per risolvere i problemi
4. **UX**: Feedback immediato e non invasivo
5. **Scalabilità**: Facile da estendere per nuove funzionalità

## 🚀 **BENEFICI**

- ✅ **Gestione errori unificata** in tutta l'app
- ✅ **Messaggi di errore professionali** e utili
- ✅ **Toast notifications** per feedback positivo
- ✅ **Facile manutenzione** e estensione
- ✅ **UX consistente** per l'utente
- ✅ **Debugging semplificato** per sviluppatori

---

**⚠️ IMPORTANTE**: Segui sempre questo pattern quando crei nuovi componenti o modifichi quelli esistenti!
