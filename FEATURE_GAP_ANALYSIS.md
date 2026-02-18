# Lab Price Comparator — Feature Gap Analysis

## Context
This document maps every spec requirement against the current codebase to identify what's **implemented**, what's **partially done**, and what's **missing entirely**. The codebase already has a solid foundation with 11 pages, 23 API routes, 45 components, 8 services, and 10 database models.

---

## Status Legend
- **DONE** = Fully implemented and matches spec
- **PARTIAL** = Some implementation exists but incomplete
- **MISSING** = Not implemented at all

---

## 1. Authentication & Authorization (FR-1.x)

| Requirement | Status | Details |
|---|---|---|
| Login with email/password | **DONE** | `lib/auth.ts` — NextAuth CredentialsProvider |
| JWT session, 30-min expiry | **DONE** | `session.maxAge: 30 * 60` |
| French error messages | **DONE** | "Identifiants invalides", "Votre compte a été désactivé" |
| Auto-logout on inactivity | **DONE** | Session expires after 30 min via JWT maxAge |
| Route protection via middleware | **DONE** | `middleware.ts` redirects unauthenticated users |
| Failed login tracking (5 attempts → 15-min lockout) | **MISSING** | No `failedLoginAttempts` / `lockedUntil` fields on User model, no lockout logic in `authorize()` |
| Rate limiting on API endpoints | **MISSING** | No rate limiter middleware |
| Debug console.logs in auth | **CLEANUP** | `lib/auth.ts` has ~15 `console.log` statements leaking auth info — should be removed for production |

---

## 2. User Management (FR-1.3)

| Requirement | Status | Details |
|---|---|---|
| Create admin users (max 5) | **DONE** | `POST /api/users` enforces 5-user limit |
| Deactivate/reactivate users | **DONE** | `PUT /api/users/[id]` toggles `isActive` |
| Reset user passwords (admin) | **DONE** | `POST /api/users/[id]/reset-password` |
| View user activity log | **DONE** | `GET /api/users/[id]/activity` + Recent Activity on dashboard |
| Force password change on next login | **MISSING** | No `mustChangePassword` field or flow |

---

## 3. Laboratory Management (FR-2.x)

| Requirement | Status | Details |
|---|---|---|
| Add/edit laboratories | **DONE** | Full CRUD with form + API |
| Soft delete | **DONE** | `deletedAt` field, filters active labs |
| Upload Excel price lists (.xlsx/.xls) | **DONE** | ExcelJS parser with French column detection |
| Upload PDF price lists | **DONE** | pdf-parse with regex extraction |
| French character handling (UTF-8) | **DONE** | ExcelJS + PDF parsing handle accents |
| Preview data before import | **PARTIAL** | `PriceListPreview` component exists but needs verification that it's wired into the upload flow as a confirmation step |
| Auto-detect columns | **DONE** | Keyword matching for name/price/code/category/unit |
| Version tracking (upload date, user) | **PARTIAL** | `uploadedAt` tracked, but `uploadedBy` field is missing from PriceList model |
| Edit individual test prices inline | **MISSING** | No inline edit UI or API endpoint for single test price updates |
| Parse turnaround time from lab manuals | **MISSING** | Lab manuals have a "Délai" column (e.g., "24-48h") — not detected by Excel/PDF parser, no `turnaroundTime` field on Test model |
| Parse tube type from lab manuals | **MISSING** | Lab manuals have a "Type d'échantillon/Tube" column (e.g., "Tube violet EDTA") — not detected by parser, no `tubeType` field on Test model |
| Bulk update capability | **MISSING** | No bulk price update feature |
| Search/filter within price lists | **PARTIAL** | Test search exists globally, but no per-lab price list filtering UI |
| Export price list to Excel | **MISSING** | No export functionality |
| Rollback to previous version | **MISSING** | Can view history but no rollback mechanism |
| Mark tests as inactive | **MISSING** | No `isActive` field on Test model |
| Visual warning for stale data (>90 days) | **MISSING** | Dashboard shows last update dates but no warning indicators |

---

## 4. Test Search & Matching (FR-3.x)

| Requirement | Status | Details |
|---|---|---|
| Fuzzy search via pg_trgm | **DONE** | `test-matching.service.ts` uses `similarity()` |
| Similarity threshold 0.3 | **DONE** | Configurable in service |
| Accent-insensitive via `unaccent` | **DONE** | Extension enabled in migrations |
| Confidence scores (High/Medium/Low) | **DONE** | `MatchIndicator` component with color badges |
| Manual test mappings (CRUD) | **DONE** | Full service + UI + API |
| Manual mappings take precedence | **DONE** | Comparison service checks manual first |
| Create mapping from comparison page | **DONE** | `QuickMappingDialog` component |
| Visual badges (manual/automatic/not found) | **DONE** | Blue/green/yellow/red badges |
| Autocomplete search (as-you-type) | **PARTIAL** | Debounced search exists but unclear if true autocomplete dropdown |
| Multi-test cart with running totals | **DONE** | `TestCart` component + `use-tests` hook |
| Cart persistence across page refresh | **DONE** | Cart stored in `sessionStorage` via `hooks/use-tests.ts` |
| Save selection as draft | **MISSING** | No draft saving feature |

---

## 5. Price Comparison (FR-4.x)

| Requirement | Status | Details |
|---|---|---|
| Calculate total per laboratory | **DONE** | `comparison.service.ts` aggregates prices |
| Auto-select cheapest lab | **DONE** | `findBestLaboratory()` function |
| "Meilleur choix" badge | **DONE** | Green highlight + "Meilleur" badge |
| Comparison table with prices | **DONE** | `ComparisonTable` component |
| Match type display per test | **DONE** | `MatchIndicator` with tooltips |
| Exclude labs missing tests | **DONE** | `isComplete` flag filtering |
| "Non Disponible" for missing tests | **DONE** | Shows "NONE" badge with create-mapping button |
| Percentage/amount difference from other labs | **MISSING** | No savings display (e.g., "12% cheaper than Lab B") |
| Display turnaround time per lab per test | **MISSING** | Comparison table only shows price — need turnaround time in each cell |
| Display tube type per lab per test | **MISSING** | No tube info shown in comparison |
| Per-test lab selection (pick best offer per test) | **MISSING** | Currently "pick one lab for all" — users need to select different labs for different tests |
| Optimization presets (best price / fastest results) | **MISSING** | No auto-select by cheapest price or fastest turnaround time |
| Manual override with reason/note | **MISSING** | No override mechanism |

---

## 6. Quotation Generation (FR-5.x)

| Requirement | Status | Details |
|---|---|---|
| Create quotation from comparison | **DONE** | `quotation.service.ts` + form |
| Auto-generated quotation number | **DONE** | `generateQuotationNumber()` in utils |
| Configurable validity period | **DONE** | Default 30 days, adjustable |
| Status workflow (DRAFT→SENT→etc.) | **DONE** | Transition validation in service |
| PDF generation | **DONE** | PDFKit with A4 format |
| French characters in PDF | **DONE** | PDFKit handles UTF-8 |
| Company logo in PDF header | **MISSING** | PDF has text "DEVIS" header but no logo |
| Customer name field | **MISSING** | Only `clientReference` — no dedicated customer name or email fields on Quotation model |
| Customer email field | **MISSING** | No `clientEmail` field on model |
| Tax calculation (configurable) | **MISSING** | No subtotal/tax/total breakdown |
| Terms & conditions in PDF footer | **MISSING** | PDF footer only shows generation date |
| Contact information in PDF | **PARTIAL** | Lab contact info shown, but no company contact info |
| Quotation preview before PDF | **PARTIAL** | `QuotationPreview` component exists but may not show formatted preview matching PDF |
| Filename format `Devis_[Number]_[Date].pdf` | **PARTIAL** | Filename is `Devis-{number}.pdf` — missing date |
| Quotation history with search | **DONE** | Paginated list with search by number/title/reference |
| Multi-lab quotation (tests from different labs) | **MISSING** | `Quotation.laboratoryId` is a single required FK — no support for mixed-lab quotations |
| Option to split or merge multi-lab into separate devis | **MISSING** | No split/merge choice when creating quotations |
| Turnaround time column in quotation PDF | **MISSING** | PDF table only shows test name, code, and price |
| Search by date range | **MISSING** | No date range filter in quotation history |
| Resend email from history | **MISSING** | No resend button on quotation history |
| Regenerate PDF from history | **PARTIAL** | PDF endpoint exists but no "re-download" button in history UI |
| Email status indicator in history | **PARTIAL** | Status field exists but UI may not show email delivery status per quotation |

---

## 7. Email System (FR-5.4)

| Requirement | Status | Details |
|---|---|---|
| SMTP integration (Nodemailer) | **DONE** | `lib/email/config.ts` supports SMTP + Brevo API |
| Send quotation with PDF attachment | **DONE** | `email.service.ts` |
| Email logging (sent/failed) | **DONE** | `EmailLog` + `QuotationEmail` tables |
| Email status tracking | **DONE** | PENDING/SENT/FAILED statuses |
| SMTP settings configuration UI | **MISSING** | Settings page only shows read-only status, no form to configure SMTP |
| "Send test email" button | **MISSING** | No test email functionality |
| Customizable email template editor | **MISSING** | Hard-coded HTML templates, no editor UI |
| Multiple email templates | **MISSING** | Single template per use case |
| Company logo in email | **MISSING** | No logo in email HTML |
| Email signature configuration | **MISSING** | No configurable signature |
| Email retry mechanism (3 attempts, exponential backoff) | **MISSING** | Single attempt only, no retry logic |
| Preview email before sending | **MISSING** | No email preview step |
| Configurable email subject/body defaults | **MISSING** | Subject provided per-send, no saved defaults |

---

## 8. Admin Dashboard (FR-6.x)

| Requirement | Status | Details |
|---|---|---|
| Total laboratories count | **DONE** | Stats cards on dashboard |
| Total tests count | **DONE** | Stats cards |
| Manual mappings count | **DONE** | Stats cards |
| Active users count | **DONE** | Stats cards |
| Email delivery statistics | **DONE** | Chart + counts |
| Recent quotations (last 10) | **DONE** | Table component |
| Last price list update per lab | **DONE** | `PriceListUpdates` component |
| Recent activity log | **DONE** | `RecentActivity` component |
| Quick links to common actions | **MISSING** | No quick-action buttons (upload, create quotation, manage mappings) |
| Visual indicators for stale data (>90 days) | **MISSING** | No warning badges on outdated price lists |
| Email configuration status indicator | **DONE** | `EmailConfigStatus` component |
| Test mapping quick stats on dashboard | **PARTIAL** | Count shown, but no "recently created" mappings section |

---

## 9. Non-Functional Requirements

| Requirement | Status | Details |
|---|---|---|
| HTTPS/SSL | **DONE** (deployment concern) | Handled by hosting platform |
| bcrypt password hashing | **DONE** | bcryptjs with default rounds |
| JWT tokens | **DONE** | NextAuth JWT strategy |
| Input validation (Zod) | **DONE** | 4 validation schema files |
| Middleware route protection | **DONE** | `middleware.ts` |
| French language UI | **PARTIAL** | Most labels in French, but some English strings remain |
| Responsive design | **PARTIAL** | Tailwind used but not verified for tablet |
| WCAG 2.1 Level A | **PARTIAL** | Radix UI provides accessibility primitives but not audited |
| Error logging | **PARTIAL** | Console logging only, no structured logging (Winston/Pino) |
| Audit trail for price changes | **PARTIAL** | AuditLog model exists but not triggered on all price/mapping changes |

---

## 10. Client Management (FR-7.x)

| Requirement | Status | Details |
|---|---|---|
| Client entity (name, email, phone, company) | **MISSING** | No `Client` model — only `clientReference` (free text) on Quotation |
| Client search/select in quotation form | **MISSING** | No client dropdown — only a free-text reference field |
| Inline client creation from quotation form | **MISSING** | No way to create a client on the fly |
| Client quotation history | **MISSING** | No way to see all quotations/tests sent to a specific client |
| Client detail page | **MISSING** | No client management page or detail view |

---

## Priority Summary: Missing Features

### P0 (Critical) — Must Have

1. **Failed login lockout** (FR-1.1) — 5 attempts → 15-min lock
2. **Customer name + email fields on Quotation** — core quotation data missing from model
3. **SMTP configuration UI** (FR-6.4) — admins can't configure email from the app
4. **Test email functionality** — no way to verify email settings work
5. **Edit individual test prices** (FR-2.4) — no inline edit
6. **Dashboard stale data warnings** (FR-6.2) — visual indicator for >90-day-old price lists
7. **Dashboard quick action links** (FR-6.1)
8. **Parse turnaround time + tube type from lab manuals** (FR-2.x) — schema + parser changes
9. **Per-test lab selection in comparison table** (FR-4.x) — pick best offer per test instead of one lab for all
10. **Optimization presets** (FR-4.x) — auto-select by cheapest price or fastest turnaround
11. **Client entity + lightweight management** (FR-7.x) — Client model, search/select, inline creation

### P1 (High) — Should Have

12. **Quotation PDF improvements** — company logo, tax line, terms & conditions, contact info
13. **Email retry with exponential backoff** (3 attempts)
14. **Price list export to Excel**
15. **Price list versioning rollback**
16. **Percentage/savings display in comparison** table
17. **Quotation history email status + resend**
18. **Date range filter for quotation search**
19. **Upload preview confirmation step** (verify wiring)
20. **Price list `uploadedBy` tracking**
21. **Multi-lab quotation support** (FR-5.x) — single or split devis for tests from different labs
22. **Turnaround time in comparison table display** (FR-4.x) — show turnaround time alongside price
23. **Tube type in comparison table display** (FR-4.x) — show tube/sample type info
24. **Turnaround time column in quotation PDF** (FR-5.x) — add turnaround time to PDF table
25. **Client quotation history** (FR-7.x) — view all quotations for a specific client

### P2 (Medium) — Nice to Have

26. **Email template editor** with preview
27. **Manual override** in comparison with reason
28. **Rate limiting** on API endpoints
29. **Remove debug console.logs** from auth
30. **Structured logging** (Winston/Pino)
31. **Force password change** after admin reset
32. **Save test selection as draft**
33. **Bulk price update**
34. **Mark individual tests as inactive**
35. **Search/filter within per-lab price lists**

---

## Files to Modify (for P0 + P1 items)

| Feature | Files |
|---|---|
| Login lockout | `prisma/schema.prisma` (add fields), `lib/auth.ts` |
| Customer name/email on Quotation | `prisma/schema.prisma`, `lib/services/quotation.service.ts`, `lib/services/pdf.service.ts`, `components/quotations/quotation-form.tsx` |
| SMTP config UI | `components/settings/email-config-status.tsx` → new `email-config-form.tsx`, new `POST /api/settings/email` |
| Test email | New `POST /api/settings/email/test` endpoint |
| Edit test prices | New `PUT /api/tests/[id]` endpoint, update lab detail page |
| Stale data warnings | `components/dashboard/price-list-updates.tsx` |
| Quick action links | `app/(dashboard)/page.tsx` |
| Parse turnaround time + tube type | `prisma/schema.prisma` (`turnaroundTime`/`tubeType` on Test + TestMappingEntry), `lib/services/file-parser.service.ts` (column detection) |
| Per-test lab selection | `components/comparison/comparison-table.tsx` (per-test selection UI), new `hooks/use-test-selections.ts` |
| Optimization presets | `lib/services/comparison.service.ts` (turnaround/tube matrices + preset logic) |
| Client management | `prisma/schema.prisma` (Client model, Quotation client FK), new `lib/services/client.service.ts`, new `app/api/clients/` routes, new `components/clients/client-select.tsx` |
| Multi-lab quotation | `lib/services/quotation.service.ts` (multi-lab mode), `prisma/schema.prisma` (QuotationItem lab fields) |
| Turnaround/tube in comparison | `components/comparison/comparison-table.tsx`, `lib/services/comparison.service.ts` |
| Turnaround in quotation PDF | `lib/services/pdf.service.ts` (add turnaround column to PDF table) |
| Client quotation history | New `app/api/clients/[id]/quotations/` route, new client detail page |
