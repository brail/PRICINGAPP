import React, { useState } from "react";
import Button from "./Button";
import Card from "./Card";
import { Form, FormGroup, FormLabel, FormInput, FormTextArea } from "./Form";
import Input from "./Input";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "./Modal";
import LoadingSpinner from "./LoadingSpinner";
import Alert from "./Alert";

const DesignSystemTest: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleShowSpinner = () => {
    setShowSpinner(true);
    setTimeout(() => setShowSpinner(false), 3000);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 className="text-h1">Design System Test</h1>
      <p className="text-body">Test di tutti i componenti standardizzati</p>

      {/* Alert Components */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className="text-h2">Alert Components</h2>
        <Alert severity="success" variant="outlined" size="md" dismissible>
          Messaggio di successo
        </Alert>
        <Alert severity="error" variant="filled" size="md">
          Messaggio di errore
        </Alert>
        <Alert severity="warning" variant="text" size="md">
          Messaggio di avviso
        </Alert>
        <Alert severity="info" variant="outlined" size="md">
          Messaggio informativo
        </Alert>
      </div>

      {/* Button Components */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className="text-h2">Button Components</h2>
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <Button variant="primary" size="sm">
            Primary Small
          </Button>
          <Button variant="secondary" size="md">
            Secondary Medium
          </Button>
          <Button variant="success" size="lg">
            Success Large
          </Button>
          <Button variant="danger" size="md">
            Danger Medium
          </Button>
          <Button variant="warning" size="md">
            Warning Medium
          </Button>
          <Button variant="info" size="md">
            Info Medium
          </Button>
          <Button variant="outline" size="md">
            Outline Medium
          </Button>
        </div>
      </div>

      {/* Card Components */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className="text-h2">Card Components</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          <Card variant="default" padding="md">
            <h3 className="text-h3">Card Default</h3>
            <p className="text-body">
              Questa è una card standard con padding medio.
            </p>
          </Card>

          <Card variant="elevated" padding="lg">
            <h3 className="text-h3">Card Elevated</h3>
            <p className="text-body">
              Questa è una card con ombra elevata e padding grande.
            </p>
          </Card>

          <Card variant="outlined" padding="sm">
            <h3 className="text-h3">Card Outlined</h3>
            <p className="text-body">
              Questa è una card con bordo e padding piccolo.
            </p>
          </Card>
        </div>
      </div>

      {/* Input Components */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className="text-h2">Input Components</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          <Input
            label="Input Standard"
            type="text"
            placeholder="Inserisci il testo"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="Messaggio di aiuto"
          />

          <Input
            label="Input con Errore"
            type="email"
            placeholder="email@example.com"
            error={true}
            helperText="Email non valida"
          />

          <Input
            label="Input Required"
            type="text"
            placeholder="Campo obbligatorio"
            required
            helperText="Questo campo è obbligatorio"
          />
        </div>
      </div>

      {/* Form Components */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className="text-h2">Form Components</h2>
        <Card variant="outlined" padding="lg">
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Form submitted", formData);
            }}
          >
            <FormGroup>
              <FormLabel htmlFor="name" required>
                Nome
              </FormLabel>
              <FormInput
                id="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange("name")}
                placeholder="Inserisci il nome"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="email" required>
                Email
              </FormLabel>
              <FormInput
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange("email")}
                placeholder="Inserisci l'email"
              />
            </FormGroup>

            <FormGroup>
              <FormLabel htmlFor="message">Messaggio</FormLabel>
              <FormTextArea
                id="message"
                value={formData.message}
                onChange={handleInputChange("message")}
                placeholder="Inserisci il messaggio"
                rows={4}
              />
            </FormGroup>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setFormData({ name: "", email: "", message: "" })
                }
              >
                Reset
              </Button>
              <Button type="submit" variant="primary">
                Invia
              </Button>
            </div>
          </Form>
        </Card>
      </div>

      {/* Loading Spinner */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className="text-h2">Loading Spinner</h2>
        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <LoadingSpinner size="sm" color="primary" />
          <LoadingSpinner size="md" color="secondary" />
          <LoadingSpinner size="lg" color="primary" message="Caricamento..." />
          <Button variant="primary" onClick={handleShowSpinner}>
            Mostra Spinner Fullscreen
          </Button>
        </div>

        {showSpinner && (
          <LoadingSpinner
            size="xl"
            color="primary"
            message="Caricamento in corso..."
            fullScreen={true}
          />
        )}
      </div>

      {/* Modal Test */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className="text-h2">Modal Components</h2>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Apri Modal
        </Button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Test Modal"
          size="md"
        >
          <ModalBody>
            <p className="text-body">
              Questo è un modal di test per verificare il funzionamento del
              componente Modal.
            </p>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Modal form submitted");
              }}
            >
              <FormGroup>
                <FormLabel htmlFor="modal-input">Input nel Modal</FormLabel>
                <FormInput
                  id="modal-input"
                  type="text"
                  placeholder="Inserisci qualcosa"
                />
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Annulla
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Conferma
            </Button>
          </ModalFooter>
        </Modal>
      </div>

      {/* Typography Test */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className="text-h2">Typography</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h1 className="text-h1">Heading 1 - Titolo Principale</h1>
          <h2 className="text-h2">Heading 2 - Titolo Secondario</h2>
          <h3 className="text-h3">Heading 3 - Titolo Terziario</h3>
          <p className="text-body">
            Questo è un paragrafo di testo normale con il testo del corpo.
          </p>
          <p className="text-muted">
            Questo è un testo secondario con stile muted.
          </p>
        </div>
      </div>

      {/* Color Palette Test */}
      <div style={{ marginBottom: "32px" }}>
        <h2 className="text-h2">Color Palette</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              padding: "16px",
              background: "var(--color-primary)",
              color: "white",
              borderRadius: "8px",
            }}
          >
            Primary
          </div>
          <div
            style={{
              padding: "16px",
              background: "var(--color-secondary)",
              color: "white",
              borderRadius: "8px",
            }}
          >
            Secondary
          </div>
          <div
            style={{
              padding: "16px",
              background: "var(--color-success)",
              color: "white",
              borderRadius: "8px",
            }}
          >
            Success
          </div>
          <div
            style={{
              padding: "16px",
              background: "var(--color-danger)",
              color: "white",
              borderRadius: "8px",
            }}
          >
            Danger
          </div>
          <div
            style={{
              padding: "16px",
              background: "var(--color-warning)",
              color: "var(--color-text-primary)",
              borderRadius: "8px",
            }}
          >
            Warning
          </div>
          <div
            style={{
              padding: "16px",
              background: "var(--color-info)",
              color: "white",
              borderRadius: "8px",
            }}
          >
            Info
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignSystemTest;
