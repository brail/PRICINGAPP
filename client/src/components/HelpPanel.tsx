/**
 * Help Panel Component - Pricing Calculator v0.2
 * Pannello di aiuto collassabile con FAQ e guide
 */

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import {
  Help as HelpIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  QuestionAnswer as FAQIcon,
  School as GuideIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import CustomButton from "./CustomButton";
import "./HelpPanel.css";

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
  const [expandedSection, setExpandedSection] = useState<string | false>(false);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedSection(isExpanded ? panel : false);
    };

  const faqData = [
    {
      id: "faq-1",
      question: "Come funziona il calcolo dei prezzi?",
      answer:
        "Il sistema calcola automaticamente i prezzi di vendita basandosi sui parametri impostati: prezzo di acquisto, margine desiderato, dazi, cambio valuta e altri fattori. Puoi scegliere tra calcolo da acquisto a vendita o da vendita a acquisto.",
    },
    {
      id: "faq-2",
      question: "Cosa sono i Template Prezzi?",
      answer:
        "I Template Prezzi sono configurazioni predefinite che salvano tutti i parametri di calcolo (valuta, dazi, cambio, margine, etc.) per riutilizzarli rapidamente in calcoli futuri. Puoi crearne diversi per diversi mercati o prodotti.",
    },
    {
      id: "faq-3",
      question: "Come uso il Calcolo Multiplo?",
      answer:
        "Il Calcolo Multiplo ti permette di calcolare molti prezzi contemporaneamente. Puoi incollare dati da Excel o caricare un file Excel/CSV con i tuoi dati. Il sistema elaborerà tutti i valori in batch.",
    },
    {
      id: "faq-4",
      question: "Come esporto i risultati?",
      answer:
        "Dopo aver eseguito un calcolo multiplo, puoi esportare i risultati in formato Excel cliccando su 'Esporta Excel'. Il file conterrà tutti i dati originali e i risultati calcolati.",
    },
    {
      id: "faq-5",
      question: "Cosa significa 'Target' nel calcolo?",
      answer:
        "Il Target è il margine di profitto che vuoi ottenere, espresso come percentuale. Ad esempio, se inserisci 30%, il sistema calcolerà il prezzo di vendita per ottenere un margine del 30% sul prezzo di acquisto.",
    },
  ];

  const quickGuides = [
    {
      id: "guide-1",
      title: "Primo Calcolo",
      description: "Imposta i parametri base e calcola il tuo primo prezzo",
      steps: [
        "1. Seleziona la valuta di acquisto",
        "2. Inserisci il prezzo di acquisto",
        "3. Imposta il Target (margine desiderato)",
        "4. Clicca 'Calcola' per ottenere il prezzo di vendita",
      ],
    },
    {
      id: "guide-2",
      title: "Creare un Template",
      description: "Salva una configurazione per riutilizzarla",
      steps: [
        "1. Vai alla sezione 'Template Prezzi'",
        "2. Clicca 'Nuovo Template'",
        "3. Compila tutti i parametri",
        "4. Salva con un nome descrittivo",
      ],
    },
    {
      id: "guide-3",
      title: "Calcolo Batch",
      description: "Elabora molti prezzi contemporaneamente",
      steps: [
        "1. Vai al 'Calcolo Multiplo'",
        "2. Scegli 'Copia-Incolla' o 'Upload Excel'",
        "3. Inserisci i tuoi dati",
        "4. Clicca 'Calcola Batch'",
        "5. Esporta i risultati in Excel",
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="help-panel-overlay" onClick={onClose}>
      <Paper className="help-panel" onClick={(e) => e.stopPropagation()}>
        <div className="help-panel-header">
          <div className="help-panel-title">
            <HelpIcon />
            <Typography variant="h6">Aiuto e Supporto</Typography>
          </div>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </div>

        <Divider />

        <div className="help-panel-content">
          {/* Quick Start */}
          <Box className="help-section">
            <Typography variant="h6" className="help-section-title">
              <InfoIcon />
              Inizia Qui
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              className="help-section-desc"
            >
              Benvenuto nel Pricing Calculator! Ecco come iniziare:
            </Typography>
            <div className="quick-start-steps">
              <div className="quick-step">
                <Chip label="1" size="small" color="primary" />
                <span>Imposta i parametri di base nella Calcolatrice</span>
              </div>
              <div className="quick-step">
                <Chip label="2" size="small" color="primary" />
                <span>Salva la configurazione come Template</span>
              </div>
              <div className="quick-step">
                <Chip label="3" size="small" color="primary" />
                <span>Usa il Calcolo Multiplo per elaborare molti prezzi</span>
              </div>
            </div>
          </Box>

          {/* Quick Guides */}
          <Box className="help-section">
            <Typography variant="h6" className="help-section-title">
              <GuideIcon />
              Guide Rapide
            </Typography>
            {quickGuides.map((guide) => (
              <Accordion
                key={guide.id}
                expanded={expandedSection === guide.id}
                onChange={handleChange(guide.id)}
                className="help-accordion"
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">{guide.title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    className="guide-description"
                  >
                    {guide.description}
                  </Typography>
                  <div className="guide-steps">
                    {guide.steps.map((step, index) => (
                      <div key={index} className="guide-step">
                        {step}
                      </div>
                    ))}
                  </div>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          {/* FAQ */}
          <Box className="help-section">
            <Typography variant="h6" className="help-section-title">
              <FAQIcon />
              Domande Frequenti
            </Typography>
            {faqData.map((faq) => (
              <Accordion
                key={faq.id}
                expanded={expandedSection === faq.id}
                onChange={handleChange(faq.id)}
                className="help-accordion"
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2">{faq.answer}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          {/* Contact Support */}
          <Box className="help-section help-contact">
            <Typography variant="h6" className="help-section-title">
              <HelpIcon />
              Hai bisogno di più aiuto?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Se non trovi risposta alle tue domande, contatta il supporto
              tecnico.
            </Typography>
            <div className="help-actions">
              <CustomButton variant="outline" size="sm">
                Contatta Supporto
              </CustomButton>
            </div>
          </Box>
        </div>
      </Paper>
    </div>
  );
};

export default HelpPanel;
