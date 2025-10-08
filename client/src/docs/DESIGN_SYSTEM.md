# Design System - Pricing Calculator v0.2

## 🎨 **Panoramica**

Questo design system standardizza tutti gli elementi visivi dell'applicazione per garantire coerenza e manutenibilità.

## 🎯 **Principi Guida**

1. **Consistency** - Elementi visivi coerenti in tutta l'applicazione
2. **Scalability** - Facile aggiunta di nuovi componenti
3. **Maintainability** - Modifiche centralizzate tramite variabili CSS
4. **Accessibility** - Supporto per screen reader e navigazione da tastiera

## 🎨 **Sistema Colori**

### Colori Primari

```css
--color-primary: #1976d2; /* Blu principale */
--color-primary-hover: #1565c0; /* Blu hover */
--color-primary-light: #e3f2fd; /* Blu chiaro */
```

### Colori Secondari

```css
--color-secondary: #6c757d; /* Grigio */
--color-secondary-hover: #545b62; /* Grigio hover */
--color-secondary-light: #f8f9fa; /* Grigio chiaro */
```

### Colori di Stato

```css
--color-success: #28a745; /* Verde successo */
--color-danger: #dc3545; /* Rosso errore */
--color-warning: #ffc107; /* Giallo avviso */
--color-info: #17a2b8; /* Azzurro info */
```

## 📏 **Sistema Spaziature**

### Scala Base (8px)

```css
--space-xs: 4px; /* 0.25rem */
--space-sm: 8px; /* 0.5rem */
--space-md: 16px; /* 1rem */
--space-lg: 24px; /* 1.5rem */
--space-xl: 32px; /* 2rem */
--space-2xl: 48px; /* 3rem */
```

### Padding Componenti

```css
--padding-sm: 8px; /* Componenti piccoli */
--padding-md: 16px; /* Componenti medi */
--padding-lg: 24px; /* Componenti grandi */
--padding-xl: 32px; /* Componenti extra grandi */
```

## 🔲 **Border Radius**

```css
--radius-sm: 4px; /* Elementi piccoli */
--radius-md: 8px; /* Elementi medi */
--radius-lg: 12px; /* Elementi grandi */
--radius-xl: 16px; /* Elementi extra grandi */
--radius-full: 9999px; /* Cerchi */
```

## 📝 **Tipografia**

### Dimensioni Font

```css
--font-xs: 0.75rem; /* 12px */
--font-sm: 0.875rem; /* 14px */
--font-base: 1rem; /* 16px */
--font-lg: 1.125rem; /* 18px */
--font-xl: 1.25rem; /* 20px */
--font-2xl: 1.5rem; /* 24px */
--font-3xl: 1.875rem; /* 30px */
```

### Pesi Font

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## 🧩 **Componenti Standardizzati**

### Button Component

```tsx
import Button from "./components/Button";

<Button variant="primary" size="md">
  Clicca qui
</Button>;
```

**Varianti:**

- `primary` - Pulsante principale
- `secondary` - Pulsante secondario
- `success` - Pulsante successo
- `danger` - Pulsante pericolo
- `warning` - Pulsante avviso
- `info` - Pulsante informativo
- `outline` - Pulsante contorno

**Dimensioni:**

- `sm` - Piccolo
- `md` - Medio (default)
- `lg` - Grande

### Card Component

```tsx
import Card from "./components/Card";

<Card variant="elevated" padding="lg">
  Contenuto della card
</Card>;
```

**Varianti:**

- `default` - Card standard
- `elevated` - Card con ombra
- `outlined` - Card con bordo

**Padding:**

- `sm` - 8px
- `md` - 16px
- `lg` - 24px (default)
- `xl` - 32px

### Form Components

```tsx
import {
  Form,
  FormGroup,
  FormLabel,
  FormInput,
  FormTextArea,
} from "./components/Form";

<Form onSubmit={handleSubmit}>
  <FormGroup>
    <FormLabel htmlFor="name" required>
      Nome
    </FormLabel>
    <FormInput id="name" type="text" error={hasError} />
  </FormGroup>
</Form>;
```

### Input Component

```tsx
import Input from "./components/Input";

<Input
  label="Nome"
  type="text"
  placeholder="Inserisci il nome"
  error={hasError}
  helperText="Messaggio di aiuto"
  required
/>;
```

**Varianti:**

- `default` - Input standard
- `outlined` - Input con bordo
- `filled` - Input riempito

**Dimensioni:**

- `sm` - Piccolo
- `md` - Medio (default)
- `lg` - Grande

### Modal Components

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from "./components/Modal";

<Modal isOpen={isOpen} onClose={onClose} title="Titolo" size="md">
  <ModalBody>Contenuto del modal</ModalBody>
  <ModalFooter>
    <Button onClick={onClose}>Chiudi</Button>
  </ModalFooter>
</Modal>;
```

**Dimensioni:**

- `sm` - 400px
- `md` - 600px (default)
- `lg` - 800px
- `xl` - 1200px

**Varianti:**

- `default` - Modal standard
- `centered` - Modal centrato
- `fullscreen` - Modal a schermo intero

### Loading Spinner Component

```tsx
import LoadingSpinner from "./components/LoadingSpinner";

<LoadingSpinner
  size="md"
  color="primary"
  message="Caricamento..."
  fullScreen={false}
/>;
```

**Dimensioni:**

- `sm` - 20px
- `md` - 32px (default)
- `lg` - 48px
- `xl` - 64px

**Colori:**

- `primary` - Colore primario
- `secondary` - Colore secondario
- `white` - Bianco
- `muted` - Colore attenuato

### Alert Component

```tsx
import Alert from "./components/Alert";

<Alert
  severity="success"
  variant="outlined"
  size="md"
  dismissible
  onDismiss={handleDismiss}
>
  Messaggio di successo
</Alert>;
```

**Severità:**

- `success` - Successo
- `error` - Errore
- `warning` - Avviso
- `info` - Informazione

**Varianti:**

- `filled` - Riempito
- `outlined` - Con bordo (default)
- `text` - Solo testo

**Dimensioni:**

- `sm` - Piccolo
- `md` - Medio (default)
- `lg` - Grande

## 🎨 **Classi Utility**

### Typography

```css
.text-h1    /* Titolo principale */
/* Titolo principale */
/* Titolo principale */
/* Titolo principale */
.text-h2    /* Titolo secondario */
.text-h3    /* Titolo terziario */
.text-body  /* Testo corpo */
.text-muted; /* Testo secondario */
```

### Spacing

```css
.margin-sm  /* Margine piccolo */
/* Margine piccolo */
/* Margine piccolo */
/* Margine piccolo */
.margin-md  /* Margine medio */
.margin-lg  /* Margine grande */
.margin-xl; /* Margine extra grande */
```

## 📱 **Responsive Design**

```css
@media (max-width: 768px) {
  :root {
    --padding-lg: var(--space-md);
    --padding-xl: var(--space-lg);
  }
}
```

## 🚀 **Utilizzo**

### 1. Importa il Design System

```css
@import "./styles/design-system.css";
```

### 2. Usa i Componenti React

```tsx
import Button from "./components/Button";
import Card from "./components/Card";
import { Form, FormGroup, FormLabel, FormInput } from "./components/Form";
```

### 3. Usa le Variabili CSS

```css
.my-component {
  background: var(--color-primary);
  padding: var(--padding-md);
  border-radius: var(--radius-md);
}
```

## 🔧 **Manutenzione**

### Aggiungere Nuovi Colori

1. Aggiungi la variabile in `design-system.css`
2. Documenta nel file `DESIGN_SYSTEM.md`
3. Testa in tutti i componenti

### Aggiungere Nuovi Componenti

1. Crea il componente in `components/`
2. Aggiungi le classi CSS in `design-system.css`
3. Documenta l'utilizzo
4. Aggiungi test

## 📋 **Checklist Coerenza**

- [ ] Tutti i colori usano variabili CSS
- [ ] Tutte le spaziature usano variabili CSS
- [ ] Tutti i border radius usano variabili CSS
- [ ] I componenti usano i componenti standardizzati
- [ ] Le form usano i componenti Form
- [ ] I pulsanti usano il componente Button
- [ ] Le card usano il componente Card

## 🎯 **Prossimi Passi**

1. **Migrazione Graduale** - Sostituire gradualmente le classi inconsistenti
2. **Testing** - Testare tutti i componenti con il nuovo design system
3. **Documentazione** - Aggiornare la documentazione per i nuovi componenti
4. **Training** - Formare il team sull'utilizzo del design system
