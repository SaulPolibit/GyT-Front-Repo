# Legal & Terms Feature

## Overview

The Legal & Terms feature allows fund managers to define and customize partnership agreement terms and legal provisions that are displayed to investors in the LP Portal.

## Architecture

### Data Model

Legal terms are stored in the `Structure` interface at `src/lib/structures-storage.ts` with a comprehensive nested structure:

```typescript
legalTerms?: {
  // Partnership Agreement (3 core sections)
  managementControl?: string
  capitalContributions?: string
  allocationsDistributions?: string

  // Limited Partner Rights & Obligations
  limitedPartnerRights?: string[]
  limitedPartnerObligations?: string[]

  // Voting Rights
  votingRights?: {
    votingThreshold?: number
    mattersRequiringConsent?: string[]
  }

  // Redemption & Withdrawal
  redemptionTerms?: {
    lockUpPeriod?: string
    withdrawalConditions?: string[]
    withdrawalProcess?: string[]
  }

  // Transfer Restrictions
  transferRestrictions?: {
    generalProhibition?: string
    permittedTransfers?: string[]
    transferRequirements?: string[]
  }

  // Reporting Commitments
  reportingCommitments?: {
    quarterlyReports?: string
    annualReports?: string
    taxForms?: string
    capitalNotices?: string
    additionalCommunications?: string[]
  }

  // Liability Limitations
  liabilityLimitations?: {
    limitedLiabilityProtection?: string
    exceptionsToLimitedLiability?: string[]
    maximumExposureNote?: string
  }

  // Indemnification
  indemnification?: {
    partnershipIndemnifiesLPFor?: string[]
    lpIndemnifiesPartnershipFor?: string[]
    indemnificationProcedures?: string
  }

  // Additional Provisions (preserve existing fields)
  amendments?: string
  dissolution?: string
  disputes?: string
  governingLaw?: string
  additionalProvisions?: string
}
```

### Components

1. **Investment Manager - Structure Detail** (`/investment-manager/structures/[id]/page.tsx`)
   - Displays comprehensive Legal & Terms card with all provisions organized by section
   - Shows 9 major sections: Partnership Agreement, Rights & Obligations, Voting Rights, Redemption Terms, Transfer Restrictions, Reporting Commitments, Liability Limitations, Indemnification, Additional Provisions
   - Conditional rendering - only shows sections with content
   - Color-coded Rights (green) and Obligations (orange)
   - "Edit Terms" button links to edit page
   - Shows graceful empty state when no terms defined

2. **Investment Manager - Structure Edit** (`/investment-manager/structures/[id]/edit/page.tsx`)
   - Comprehensive edit form with 30+ fields across 9 sections
   - Array fields managed via multi-line textareas (one item per line)
   - Helper functions: `arrayToText()` and `textToArray()` for array conversion
   - Flat formData structure for easier form management
   - Transform logic: flat form state → nested storage structure on save
   - Sections:
     - Partnership Agreement (3 text fields)
     - Rights & Obligations (2 array fields)
     - Voting Rights (1 number + 1 array)
     - Redemption & Withdrawal (1 text + 2 arrays)
     - Transfer Restrictions (1 text + 2 arrays)
     - Reporting Commitments (4 text + 1 array)
     - Liability Limitations (2 text + 1 array)
     - Indemnification (2 arrays + 1 text)
     - Additional Provisions (5 text fields)
   - Anchor link support via `#legal-terms`

3. **LP Portal - Structure Detail** (`/lp-portal/portfolio/[structureId]/page.tsx`)
   - Displays comprehensive legal terms in "Legal & Terms" tab
   - Uses `structure.legalTerms` with fallbacks to default content
   - Organized sections matching Investment Manager display
   - Supports multi-line text with `whitespace-pre-wrap`
   - Array fields rendered as unordered lists
   - Read-only view for investors

## User Flows

### Fund Manager (GP) Flow

1. Navigate to structure detail: `/investment-manager/structures/polibit-real-estate-i`
2. Scroll to "Legal & Terms" section
3. Click "Edit Terms" button
4. Fill in legal provisions in the edit form
5. Click "Save Changes"
6. Legal terms now visible in both Investment Manager and LP Portal

### Investor (LP) Flow

1. Navigate to portfolio: `/lp-portal/portfolio/polibit-real-estate-i`
2. Click "Legal & Terms" tab
3. View partnership agreement and additional provisions
4. Terms are read-only for investors

## Default Legal Terms

### Partnership Agreement

**Management & Control:**
> The General Partner has exclusive authority to manage and control the business and affairs of the Partnership. Limited Partners have no right to participate in management and control of the Partnership business.

**Capital Contributions:**
> Your capital contributions shall be made within the specified business days of receiving a capital call notice (as defined in the structure settings).
>
> Minimum notice period will be provided as specified in the structure settings.
>
> All capital contributions must be made in accordance with the payment instructions provided in the capital call notice.

**Allocations & Distributions:**
> Profits and losses shall be allocated among the Partners in accordance with their respective Partnership Interests.
>
> Distributions shall be made at the discretion of the General Partner in accordance with the waterfall provisions set forth in Schedule A of the Partnership Agreement.
>
> Distribution frequency will follow the schedule specified in the structure settings, or as deemed appropriate by the General Partner.

### Limited Partner Rights & Obligations

**Limited Partner Rights:**
- Right to receive quarterly financial statements and performance reports
- Right to receive annual audited financial statements
- Right to receive K-1 tax forms by the specified deadline
- Right to attend annual investor meetings
- Right to inspect Partnership books and records upon reasonable notice
- Right to receive distribution notices and capital call notices as specified
- Right to vote on matters requiring Limited Partner consent

**Limited Partner Obligations:**
- Obligation to fund capital calls within the specified notice period
- Obligation to maintain confidentiality of Partnership information
- Obligation to comply with transfer restrictions
- Obligation to provide updated contact information and tax documentation
- Obligation to refrain from competing with the Partnership during the term
- Obligation to indemnify the Partnership for breaches of representations

### Voting Rights

**Voting Threshold:** 66.67% of Partnership Interests

**Matters Requiring Consent:**
- Amendment of fundamental Partnership terms
- Removal or replacement of the General Partner
- Dissolution or liquidation of the Partnership
- Material changes to the investment strategy
- Approval of related party transactions above specified threshold
- Extension of the Partnership term beyond the initial term

### Redemption & Withdrawal Terms

**Lock-Up Period:**
> Limited Partners may not redeem or withdraw their Partnership Interest during the initial 3-year lock-up period from the date of their initial capital contribution. After the lock-up period, redemptions may be permitted subject to the conditions and process outlined below.

**Withdrawal Conditions:**
- Redemptions permitted only after the initial lock-up period
- Redemptions subject to General Partner approval and available liquidity
- Minimum redemption amount may apply as specified in the Partnership Agreement
- Redemptions may be suspended during certain events (e.g., pending acquisitions, market disruptions)

**Withdrawal Process:**
- Submit written redemption notice to the General Partner at least 90 days prior to desired redemption date
- General Partner will evaluate request based on available liquidity and Partnership needs
- If approved, redemption will be processed at fair market value as determined by independent valuation
- Payment may be made in cash or in-kind distributions of Partnership assets
- General Partner may defer or stagger redemptions to protect remaining Partners

### Transfer Restrictions

**General Prohibition:**
> No Limited Partner may Transfer all or any portion of its Partnership Interest without the prior written consent of the General Partner, which consent may be given or withheld in the General Partner's sole discretion. Any attempted Transfer in violation of this provision shall be null and void.

**Permitted Transfers:**
- Transfers to affiliates of the Limited Partner (subject to notice and documentation requirements)
- Transfers to immediate family members or trusts for estate planning purposes
- Transfers required by court order or operation of law

**Transfer Requirements:**
- Written consent from the General Partner
- Transferee must meet investor qualification requirements
- Transferee must execute Partnership Agreement and other required documents
- Payment of any transfer fees or expenses specified in the Partnership Agreement
- Compliance with applicable securities laws and regulations

### Reporting Commitments

**Quarterly Reports:**
> Unaudited financial statements and performance updates within 45 days of quarter end

**Annual Reports:**
> Audited financial statements and comprehensive annual report within 120 days of fiscal year end

**Tax Forms:**
> K-1 tax forms and supporting schedules by March 15th (or extended deadline if applicable)

**Capital Notices:**
> Capital call notices with minimum advance notice as specified in structure settings; distribution notices at least 5 business days prior to distribution

**Additional Communications:**
- Material event notifications (acquisitions, dispositions, major financings)
- Investor meetings at least annually (in-person or virtual)
- Ad-hoc updates for significant developments affecting Partnership value
- Access to secure investor portal for ongoing information and documents

### Liability Limitations

**Limited Liability Protection:**
> As a Limited Partner, your liability is generally limited to your capital commitment to the Partnership. You are not personally liable for the debts, obligations, or liabilities of the Partnership beyond your capital contribution.

**Exceptions to Limited Liability:**
- Breach of confidentiality obligations
- Fraudulent or willful misconduct
- Participation in management or control of the Partnership business
- Breach of representations and warranties made to the Partnership

**Maximum Exposure:**
> Subject to the exceptions above, your maximum financial exposure is limited to your total capital commitment as specified in your subscription agreement.

### Indemnification

**Partnership Indemnifies LP For:**
- Claims arising from Partnership operations (excluding LP's own misconduct)
- Third-party claims related to LP's status as a Limited Partner
- Expenses incurred in defending claims covered by indemnification

**LP Indemnifies Partnership For:**
- Breach of LP's representations and warranties
- Violation of transfer restrictions or other LP obligations
- Claims arising from LP's willful misconduct or fraud

**Indemnification Procedures:**
> The indemnified party must provide prompt written notice of any claim. The indemnifying party has the right to control the defense of the claim, subject to the indemnified party's right to participate at its own expense. Indemnification obligations survive termination of the Partnership Agreement.

### Additional Provisions

**Amendments:**
> This Agreement may be amended only with the written consent of the General Partner and Limited Partners holding a majority of the Partnership Interests.
>
> Notwithstanding the foregoing, the General Partner may amend this Agreement without the consent of the Limited Partners to the extent necessary to comply with applicable law or to correct any ambiguity or inconsistency.

**Dissolution:**
> The Partnership shall be dissolved upon the earliest to occur of:
> (a) The expiration of the term specified in the Partnership Agreement;
> (b) The written consent of the General Partner and Limited Partners holding a majority of the Partnership Interests;
> (c) The occurrence of any event that makes it unlawful for the Partnership to continue; or
> (d) As otherwise provided by applicable law.
>
> Upon dissolution, the Partnership shall be liquidated and the proceeds distributed in accordance with the waterfall provisions.

**Dispute Resolution:**
> Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
>
> The arbitration shall be conducted in the jurisdiction specified in the Partnership Agreement. The decision of the arbitrator(s) shall be final and binding upon all parties.

**Governing Law:**
> This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflicts of law principles.
>
> Any action or proceeding relating to this Agreement shall be brought exclusively in the courts of the State of Delaware or the federal courts located in Delaware.

**Additional Provisions:**
> Confidentiality: Each Partner agrees to maintain the confidentiality of all non-public information relating to the Partnership and its investments.
>
> Indemnification: The Partnership shall indemnify and hold harmless the General Partner and its affiliates from and against any losses arising out of the management of the Partnership, except in cases of gross negligence, willful misconduct, or breach of fiduciary duty.
>
> Notices: All notices under this Agreement shall be in writing and delivered to the addresses specified in the Partnership records.

## Setup Instructions

### Populating Default Legal Terms

To add the default legal terms to an existing structure (like Polibit Real Estate I):

1. **Option A: Browser Console**
   ```bash
   npm run populate-legal-terms
   ```
   Then copy and paste the output code into your browser console while on the app.

2. **Option B: Manual Entry**
   - Navigate to `/investment-manager/structures/polibit-real-estate-i/edit`
   - Scroll to "Legal & Terms" section
   - Copy the default text from this document
   - Paste into respective fields
   - Click "Save Changes"

### Verifying Installation

1. **Check Investment Manager:**
   - Go to `/investment-manager/structures/polibit-real-estate-i`
   - Scroll to "Legal & Terms" card
   - Should see all partnership agreement terms

2. **Check LP Portal:**
   - Go to `/lp-portal/portfolio/polibit-real-estate-i`
   - Click "Legal & Terms" tab
   - Should see the same terms (investor view)

## Data Flow

```
Investment Manager Edit Page
        ↓
   formData.legalTerms
        ↓
   updateStructure()
        ↓
   localStorage
        ↓
   ┌─────────────────────┐
   ↓                     ↓
IM Structure Detail   LP Portal
(GP View)            (Investor View)
```

## Technical Notes

### Data Structure
- Comprehensive nested structure with arrays and objects
- All fields are optional (nullable)
- Arrays store lists (rights, obligations, conditions, etc.)
- Nested objects group related fields (votingRights, redemptionTerms, etc.)

### Form Management
- Edit form uses flat formData structure for easier state management
- Helper functions `arrayToText()` and `textToArray()` convert arrays ↔ multi-line text
- Array fields: one item per line in textarea
- Transform logic converts flat form state → nested storage structure on save
- Textarea fields are resizable in edit form

### Display Patterns
- Legal terms support multi-line text with `\n` characters
- LP Portal and IM detail pages display with `whitespace-pre-wrap` for proper formatting
- Arrays rendered as unordered lists (`<ul>`)
- Conditional rendering: sections only shown when data exists
- Falls back to comprehensive defaults if `structure.legalTerms` is undefined
- Color-coded Rights (green) and Obligations (orange) in IM detail view

### Array Field Examples
```typescript
// In edit form - textarea with multi-line input
<Textarea
  value={arrayToText(formData.legalTerms.limitedPartnerRights)}
  onBlur={(e) => updateLegalTermsArray('limitedPartnerRights', e.target.value)}
  placeholder="Right 1&#10;Right 2&#10;Right 3"
/>

// On save - transform to array
limitedPartnerRights: formData.legalTerms.limitedPartnerRights

// In display - render as list
{structure.legalTerms?.limitedPartnerRights?.map((right, idx) => (
  <li key={idx}>{right}</li>
))}
```

### Nested Object Access
```typescript
// Access nested voting rights
structure.legalTerms?.votingRights?.votingThreshold // 66.67
structure.legalTerms?.votingRights?.mattersRequiringConsent // string[]

// Access nested redemption terms
structure.legalTerms?.redemptionTerms?.lockUpPeriod // string
structure.legalTerms?.redemptionTerms?.withdrawalConditions // string[]

// Access nested transfer restrictions
structure.legalTerms?.transferRestrictions?.generalProhibition // string
structure.legalTerms?.transferRestrictions?.permittedTransfers // string[]
```

## Future Enhancements

- [ ] Rich text editor (WYSIWYG)
- [ ] Template library with predefined legal terms
- [ ] Version history tracking
- [ ] Digital signature workflow
- [ ] Automated variable replacement (e.g., `{{fundName}}`, `{{investorName}}`)
- [ ] PDF generation of complete agreement
- [ ] Multi-language support

## Related Files

- `src/lib/structures-storage.ts` - Data model
- `src/app/investment-manager/structures/[id]/page.tsx` - IM detail view
- `src/app/investment-manager/structures/[id]/edit/page.tsx` - IM edit form
- `src/app/lp-portal/portfolio/[structureId]/page.tsx` - LP Portal view
- `scripts/populate-legal-terms.js` - Migration script
- `docs/legal-terms-feature.md` - This documentation

## Support

For questions or issues with the Legal & Terms feature, please refer to the main project documentation or contact the development team.
