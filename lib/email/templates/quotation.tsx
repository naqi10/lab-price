import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Row, Column, Preview,
} from "@react-email/components";
import * as React from "react";

/**
 * Props for the QuotationEmail template.
 */
interface QuotationEmailProps {
  quotationNumber: string;
  title: string;
  laboratoryName: string;
  totalPrice: string;
  validUntil: string;
  itemCount: number;
  customMessage?: string;
  recipientName?: string;
}

/**
 * React Email template for quotation notifications (French language).
 */
export default function QuotationEmail({
  quotationNumber = "QT-20260212-A3F1",
  title = "Devis analyses biochimiques",
  laboratoryName = "Laboratoire Central",
  totalPrice = "1 250,00 MAD",
  validUntil = "12/03/2026",
  itemCount = 5,
  customMessage,
  recipientName,
}: QuotationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Devis {quotationNumber} - {title}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Heading style={styles.headerTitle}>Lab Price Comparator</Heading>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>
              Bonjour{recipientName ? " " + recipientName : ""},
            </Text>

            {customMessage ? (
              <Text style={styles.text}>{customMessage}</Text>
            ) : (
              <Text style={styles.text}>
                Veuillez trouver ci-joint votre devis. Vous trouverez
                ci-dessous un résumé des informations principales.
              </Text>
            )}

            <Section style={styles.card}>
              <Heading as="h2" style={styles.cardTitle}>
                Devis N° {quotationNumber}
              </Heading>
              <Row style={styles.row}>
                <Column style={styles.label}>Titre :</Column>
                <Column style={styles.value}>{title}</Column>
              </Row>
              <Row style={styles.row}>
                <Column style={styles.label}>Laboratoire :</Column>
                <Column style={styles.value}>{laboratoryName}</Column>
              </Row>
              <Row style={styles.row}>
                <Column style={styles.label}>Nombre d'analyses :</Column>
                <Column style={styles.value}>{itemCount}</Column>
              </Row>
              <Hr style={styles.divider} />
              <Row style={styles.row}>
                <Column style={styles.label}><strong>Montant total :</strong></Column>
                <Column style={styles.totalValue}>{totalPrice}</Column>
              </Row>
              <Row style={styles.row}>
                <Column style={styles.label}>Valide jusqu'au :</Column>
                <Column style={styles.value}>{validUntil}</Column>
              </Row>
            </Section>

            <Text style={styles.text}>
              Le détail complet du devis est disponible dans le fichier PDF joint.
            </Text>
            <Text style={styles.text}>
              Pour toute question, n'hésitez pas à nous contacter.
            </Text>
            <Text style={styles.signature}>Cordialement,</Text>
            <Text style={styles.signature}>L'équipe Lab Price Comparator</Text>
          </Section>

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Ce message a été envoyé automatiquement par Lab Price Comparator.
            </Text>
            <Text style={styles.footerText}>
              Merci de ne pas répondre directement à cet email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const styles = {
  body: {
    backgroundColor: "#f7fafc",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: "0", padding: "0",
  },
  container: { maxWidth: "600px", margin: "0 auto", padding: "20px" },
  header: { backgroundColor: "#1a365d", padding: "20px 30px", borderRadius: "8px 8px 0 0" },
  headerTitle: {
    color: "#ffffff", fontSize: "22px", fontWeight: "700" as const,
    margin: "0", textAlign: "center" as const,
  },
  content: {
    backgroundColor: "#ffffff", padding: "30px",
    borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0",
  },
  greeting: { fontSize: "16px", color: "#2d3748", marginBottom: "16px" },
  text: { fontSize: "14px", color: "#4a5568", lineHeight: "1.6", marginBottom: "12px" },
  card: {
    backgroundColor: "#f7fafc", border: "1px solid #e2e8f0",
    borderRadius: "8px", padding: "20px", margin: "20px 0",
  },
  cardTitle: {
    fontSize: "16px", color: "#1a365d", fontWeight: "700" as const,
    marginBottom: "16px", marginTop: "0",
  },
  row: { marginBottom: "8px" },
  label: { fontSize: "13px", color: "#718096", width: "180px", verticalAlign: "top" as const },
  value: { fontSize: "13px", color: "#2d3748", fontWeight: "500" as const },
  totalValue: { fontSize: "16px", color: "#1a365d", fontWeight: "700" as const },
  divider: { borderTop: "1px solid #e2e8f0", margin: "12px 0" },
  signature: { fontSize: "14px", color: "#4a5568", marginBottom: "4px" },
  footer: {
    backgroundColor: "#f7fafc", padding: "20px 30px", borderRadius: "0 0 8px 8px",
    borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0",
    borderBottom: "1px solid #e2e8f0",
  },
  footerText: {
    fontSize: "11px", color: "#a0aec0", textAlign: "center" as const, margin: "4px 0",
  },
};
