/**
 * Template renderer for email templates using {{variable}} substitution.
 *
 * Replaces `{{variableName}}` placeholders in HTML template strings with
 * provided values. Supports both plain-text values (HTML-escaped for safety)
 * and raw HTML values (for trusted content like signatures and logos).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single variable descriptor stored in EmailTemplate.variables (Json). */
export interface TemplateVariableDescriptor {
  name: string;
  label: string;
  description?: string;
  /** If true, the value is inserted as raw HTML (not escaped). */
  isHtml?: boolean;
  /** Sample value shown in the live preview. */
  sampleValue?: string;
}

/** Map of variable name → value supplied at render time. */
export type TemplateVariables = Record<string, string | number | null | undefined>;

/** Options for `renderTemplate`. */
export interface RenderTemplateOptions {
  /**
   * How to handle placeholders whose variable is not supplied.
   * - `"keep"`   → leave `{{name}}` as-is (default)
   * - `"remove"` → replace with empty string
   * - `"error"`  → throw an error
   */
  missingStrategy?: "keep" | "remove" | "error";

  /**
   * Variable names whose values should be injected as raw HTML
   * (skipping HTML-entity escaping). Use for trusted content only,
   * e.g. `signatureHtml`, `companyLogoUrl` wrapped in `<img>`, etc.
   */
  rawHtmlVariables?: string[];
}

// ---------------------------------------------------------------------------
// Core renderer
// ---------------------------------------------------------------------------

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

/**
 * Render an email template by replacing `{{variable}}` placeholders.
 *
 * @param template  - HTML string containing `{{variableName}}` placeholders
 * @param variables - Key/value map of variables to substitute
 * @param options   - Optional rendering behaviour overrides
 * @returns Rendered HTML string
 *
 * @example
 * ```ts
 * const html = renderTemplate(
 *   "<p>Bonjour {{clientName}}, votre devis {{quotationNumber}} est prêt.</p>",
 *   { clientName: "Jean", quotationNumber: "QT-001" }
 * );
 * ```
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables,
  options: RenderTemplateOptions = {},
): string {
  const { missingStrategy = "keep", rawHtmlVariables = [] } = options;

  const rawSet = new Set(rawHtmlVariables);

  return template.replace(PLACEHOLDER_RE, (match, varName: string) => {
    const value = variables[varName];

    // Variable not supplied
    if (value === undefined || value === null) {
      switch (missingStrategy) {
        case "remove":
          return "";
        case "error":
          throw new TemplateRenderError(
            `Variable manquante dans le template : {{${varName}}}`,
            varName,
          );
        case "keep":
        default:
          return match;
      }
    }

    const strValue = String(value);

    // Trusted HTML variables are injected without escaping
    if (rawSet.has(varName)) {
      return strValue;
    }

    return escapeHtml(strValue);
  });
}

// ---------------------------------------------------------------------------
// Subject-line renderer (plain text – never contains HTML)
// ---------------------------------------------------------------------------

/**
 * Render placeholders inside an email subject line.
 * Identical to `renderTemplate` but never escapes (subjects are plain text).
 */
export function renderSubject(
  subject: string,
  variables: TemplateVariables,
  missingStrategy: RenderTemplateOptions["missingStrategy"] = "keep",
): string {
  return subject.replace(PLACEHOLDER_RE, (match, varName: string) => {
    const value = variables[varName];

    if (value === undefined || value === null) {
      switch (missingStrategy) {
        case "remove":
          return "";
        case "error":
          throw new TemplateRenderError(
            `Variable manquante dans le sujet : {{${varName}}}`,
            varName,
          );
        case "keep":
        default:
          return match;
      }
    }

    return String(value);
  });
}

// ---------------------------------------------------------------------------
// Variable extraction helpers
// ---------------------------------------------------------------------------

/**
 * Extract all `{{variableName}}` placeholder names from a template string.
 * Useful for validating that all required variables are supplied.
 *
 * @returns Deduplicated array of variable names in order of first appearance.
 */
export function extractVariableNames(template: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  // Reset lastIndex for safety (global regex)
  const re = new RegExp(PLACEHOLDER_RE.source, "g");
  while ((m = re.exec(template)) !== null) {
    const name = m[1];
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }

  return names;
}

// ---------------------------------------------------------------------------
// Per-template-type variable definitions
// ---------------------------------------------------------------------------

/** Default variables available for QUOTATION templates. */
export const QUOTATION_VARIABLES: TemplateVariableDescriptor[] = [
  { name: "quotationNumber", label: "N° Devis", sampleValue: "QT-20260217-A3F1" },
  { name: "title", label: "Titre du devis", sampleValue: "Devis analyses biochimiques" },
  { name: "clientName", label: "Nom du client", sampleValue: "Jean Dupont" },
  { name: "clientEmail", label: "Email du client", sampleValue: "jean@example.com" },
  { name: "laboratoryName", label: "Nom du laboratoire", sampleValue: "Laboratoire Central" },
  { name: "totalPrice", label: "Montant total", sampleValue: "1 250,00 MAD" },
  { name: "validUntil", label: "Date de validité", sampleValue: "17/03/2026" },
  { name: "itemCount", label: "Nombre d'analyses", sampleValue: "5" },
  { name: "customMessage", label: "Message personnalisé", sampleValue: "" },
  { name: "companyLogoUrl", label: "URL du logo", isHtml: false, sampleValue: "https://example.com/logo.png" },
  { name: "signatureHtml", label: "Signature HTML", isHtml: true, sampleValue: "<p>Cordialement,<br/>L'équipe Lab Price Comparator</p>" },
];

/** Default variables available for COMPARISON templates. */
export const COMPARISON_VARIABLES: TemplateVariableDescriptor[] = [
  { name: "clientName", label: "Nom du client", sampleValue: "Jean Dupont" },
  { name: "testNames", label: "Noms des analyses", sampleValue: "Glycémie, Créatinine" },
  { name: "cheapestLabName", label: "Labo le moins cher", sampleValue: "Laboratoire Central" },
  { name: "cheapestLabPrice", label: "Prix le moins cher", sampleValue: "850,00 MAD" },
  { name: "comparisonTableHtml", label: "Tableau comparatif", isHtml: true, sampleValue: "<table><tr><td>...</td></tr></table>" },
  { name: "companyLogoUrl", label: "URL du logo", isHtml: false, sampleValue: "https://example.com/logo.png" },
  { name: "signatureHtml", label: "Signature HTML", isHtml: true, sampleValue: "<p>Cordialement,<br/>L'équipe Lab Price Comparator</p>" },
];

/** Default variables available for GENERAL templates. */
export const GENERAL_VARIABLES: TemplateVariableDescriptor[] = [
  { name: "recipientName", label: "Nom du destinataire", sampleValue: "Jean Dupont" },
  { name: "messageBody", label: "Corps du message", isHtml: true, sampleValue: "<p>Contenu du message.</p>" },
  { name: "companyLogoUrl", label: "URL du logo", isHtml: false, sampleValue: "https://example.com/logo.png" },
  { name: "signatureHtml", label: "Signature HTML", isHtml: true, sampleValue: "<p>Cordialement,<br/>L'équipe Lab Price Comparator</p>" },
];

/**
 * Return the variable descriptors for a given template type.
 * The `type` values match the `EmailTemplateType` Prisma enum.
 */
export function getVariablesForType(
  type: "QUOTATION" | "COMPARISON" | "GENERAL",
): TemplateVariableDescriptor[] {
  switch (type) {
    case "QUOTATION":
      return QUOTATION_VARIABLES;
    case "COMPARISON":
      return COMPARISON_VARIABLES;
    case "GENERAL":
      return GENERAL_VARIABLES;
  }
}

/**
 * Build a sample variables map from descriptors (for live preview).
 */
export function buildSampleVariables(
  descriptors: TemplateVariableDescriptor[],
): TemplateVariables {
  const vars: TemplateVariables = {};
  for (const d of descriptors) {
    vars[d.name] = d.sampleValue ?? `[${d.label}]`;
  }
  return vars;
}

/**
 * Return the list of variable names that should be treated as raw HTML
 * based on the descriptors' `isHtml` flag.
 */
export function getRawHtmlVariableNames(
  descriptors: TemplateVariableDescriptor[],
): string[] {
  return descriptors.filter((d) => d.isHtml).map((d) => d.name);
}

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------

export class TemplateRenderError extends Error {
  public readonly variableName: string;

  constructor(message: string, variableName: string) {
    super(message);
    this.name = "TemplateRenderError";
    this.variableName = variableName;
  }
}
