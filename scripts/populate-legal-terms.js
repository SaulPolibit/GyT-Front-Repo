// Script to populate legal terms for Polibit Real Estate I structure
// Run this once to add the default legal terms to the structure

// Comprehensive default legal terms with nested structure
const defaultLegalTerms = {
  // Partnership Agreement (3 core sections)
  managementControl: "The General Partner has exclusive authority to manage and control the business and affairs of the Partnership. Limited Partners have no right to participate in management and control of the Partnership business.",

  capitalContributions: `Your capital contributions shall be made within the specified business days of receiving a capital call notice (as defined in the structure settings).

Minimum notice period will be provided as specified in the structure settings.

All capital contributions must be made in accordance with the payment instructions provided in the capital call notice.`,

  allocationsDistributions: `Profits and losses shall be allocated among the Partners in accordance with their respective Partnership Interests.

Distributions shall be made at the discretion of the General Partner in accordance with the waterfall provisions set forth in Schedule A of the Partnership Agreement.

Distribution frequency will follow the schedule specified in the structure settings, or as deemed appropriate by the General Partner.`,

  // Limited Partner Rights & Obligations
  limitedPartnerRights: [
    "Right to receive quarterly financial statements and performance reports",
    "Right to receive annual audited financial statements",
    "Right to receive K-1 tax forms by the specified deadline",
    "Right to attend annual investor meetings",
    "Right to inspect Partnership books and records upon reasonable notice",
    "Right to receive distribution notices and capital call notices as specified",
    "Right to vote on matters requiring Limited Partner consent"
  ],

  limitedPartnerObligations: [
    "Obligation to fund capital calls within the specified notice period",
    "Obligation to maintain confidentiality of Partnership information",
    "Obligation to comply with transfer restrictions",
    "Obligation to provide updated contact information and tax documentation",
    "Obligation to refrain from competing with the Partnership during the term",
    "Obligation to indemnify the Partnership for breaches of representations"
  ],

  // Voting Rights
  votingRights: {
    votingThreshold: 66.67,
    mattersRequiringConsent: [
      "Amendment of fundamental Partnership terms",
      "Removal or replacement of the General Partner",
      "Dissolution or liquidation of the Partnership",
      "Material changes to the investment strategy",
      "Approval of related party transactions above specified threshold",
      "Extension of the Partnership term beyond the initial term"
    ]
  },

  // Redemption & Withdrawal Terms
  redemptionTerms: {
    lockUpPeriod: "Limited Partners may not redeem or withdraw their Partnership Interest during the initial 3-year lock-up period from the date of their initial capital contribution. After the lock-up period, redemptions may be permitted subject to the conditions and process outlined below.",
    withdrawalConditions: [
      "Redemptions permitted only after the initial lock-up period",
      "Redemptions subject to General Partner approval and available liquidity",
      "Minimum redemption amount may apply as specified in the Partnership Agreement",
      "Redemptions may be suspended during certain events (e.g., pending acquisitions, market disruptions)"
    ],
    withdrawalProcess: [
      "Submit written redemption notice to the General Partner at least 90 days prior to desired redemption date",
      "General Partner will evaluate request based on available liquidity and Partnership needs",
      "If approved, redemption will be processed at fair market value as determined by independent valuation",
      "Payment may be made in cash or in-kind distributions of Partnership assets",
      "General Partner may defer or stagger redemptions to protect remaining Partners"
    ]
  },

  // Transfer Restrictions
  transferRestrictions: {
    generalProhibition: "No Limited Partner may Transfer all or any portion of its Partnership Interest without the prior written consent of the General Partner, which consent may be given or withheld in the General Partner's sole discretion. Any attempted Transfer in violation of this provision shall be null and void.",
    permittedTransfers: [
      "Transfers to affiliates of the Limited Partner (subject to notice and documentation requirements)",
      "Transfers to immediate family members or trusts for estate planning purposes",
      "Transfers required by court order or operation of law"
    ],
    transferRequirements: [
      "Written consent from the General Partner",
      "Transferee must meet investor qualification requirements",
      "Transferee must execute Partnership Agreement and other required documents",
      "Payment of any transfer fees or expenses specified in the Partnership Agreement",
      "Compliance with applicable securities laws and regulations"
    ]
  },

  // Reporting Commitments
  reportingCommitments: {
    quarterlyReports: "Unaudited financial statements and performance updates within 45 days of quarter end",
    annualReports: "Audited financial statements and comprehensive annual report within 120 days of fiscal year end",
    taxForms: "K-1 tax forms and supporting schedules by March 15th (or extended deadline if applicable)",
    capitalNotices: "Capital call notices with minimum advance notice as specified in structure settings; distribution notices at least 5 business days prior to distribution",
    additionalCommunications: [
      "Material event notifications (acquisitions, dispositions, major financings)",
      "Investor meetings at least annually (in-person or virtual)",
      "Ad-hoc updates for significant developments affecting Partnership value",
      "Access to secure investor portal for ongoing information and documents"
    ]
  },

  // Liability Limitations
  liabilityLimitations: {
    limitedLiabilityProtection: "As a Limited Partner, your liability is generally limited to your capital commitment to the Partnership. You are not personally liable for the debts, obligations, or liabilities of the Partnership beyond your capital contribution.",
    exceptionsToLimitedLiability: [
      "Breach of confidentiality obligations",
      "Fraudulent or willful misconduct",
      "Participation in management or control of the Partnership business",
      "Breach of representations and warranties made to the Partnership"
    ],
    maximumExposureNote: "Subject to the exceptions above, your maximum financial exposure is limited to your total capital commitment as specified in your subscription agreement."
  },

  // Indemnification
  indemnification: {
    partnershipIndemnifiesLPFor: [
      "Claims arising from Partnership operations (excluding LP's own misconduct)",
      "Third-party claims related to LP's status as a Limited Partner",
      "Expenses incurred in defending claims covered by indemnification"
    ],
    lpIndemnifiesPartnershipFor: [
      "Breach of LP's representations and warranties",
      "Violation of transfer restrictions or other LP obligations",
      "Claims arising from LP's willful misconduct or fraud"
    ],
    indemnificationProcedures: "The indemnified party must provide prompt written notice of any claim. The indemnifying party has the right to control the defense of the claim, subject to the indemnified party's right to participate at its own expense. Indemnification obligations survive termination of the Partnership Agreement."
  },

  // Additional Provisions
  amendments: `This Agreement may be amended only with the written consent of the General Partner and Limited Partners holding a majority of the Partnership Interests.

Notwithstanding the foregoing, the General Partner may amend this Agreement without the consent of the Limited Partners to the extent necessary to comply with applicable law or to correct any ambiguity or inconsistency.`,

  dissolution: `The Partnership shall be dissolved upon the earliest to occur of:
(a) The expiration of the term specified in the Partnership Agreement;
(b) The written consent of the General Partner and Limited Partners holding a majority of the Partnership Interests;
(c) The occurrence of any event that makes it unlawful for the Partnership to continue; or
(d) As otherwise provided by applicable law.

Upon dissolution, the Partnership shall be liquidated and the proceeds distributed in accordance with the waterfall provisions.`,

  disputes: `Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.

The arbitration shall be conducted in the jurisdiction specified in the Partnership Agreement. The decision of the arbitrator(s) shall be final and binding upon all parties.`,

  governingLaw: `This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflicts of law principles.

Any action or proceeding relating to this Agreement shall be brought exclusively in the courts of the State of Delaware or the federal courts located in Delaware.`,

  additionalProvisions: `Confidentiality: Each Partner agrees to maintain the confidentiality of all non-public information relating to the Partnership and its investments.

Indemnification: The Partnership shall indemnify and hold harmless the General Partner and its affiliates from and against any losses arising out of the management of the Partnership, except in cases of gross negligence, willful misconduct, or breach of fiduciary duty.

Notices: All notices under this Agreement shall be in writing and delivered to the addresses specified in the Partnership records.`
};

// Read structures from localStorage (from browser, so we'll update the file directly)
console.log('This script should be run from the browser console:');
console.log('');
console.log('Copy and paste this code into your browser console while on the app:');
console.log('');
console.log(`
const defaultLegalTerms = ${JSON.stringify(defaultLegalTerms, null, 2)};

// Get structures from localStorage
const structures = JSON.parse(localStorage.getItem('polibit_structures') || '[]');

// Find Polibit Real Estate I
const polibitRealEstateI = structures.find(s =>
  s.name === 'Polibit Real Estate I' ||
  s.id === 'polibit-real-estate-i'
);

if (polibitRealEstateI) {
  // Add legal terms
  polibitRealEstateI.legalTerms = defaultLegalTerms;

  // Save back to localStorage
  localStorage.setItem('polibit_structures', JSON.stringify(structures));

  console.log('✅ Legal terms added to Polibit Real Estate I!');
  console.log('Refresh the page to see the changes.');
} else {
  console.error('❌ Polibit Real Estate I structure not found');
  console.log('Available structures:', structures.map(s => s.name));
}
`);
