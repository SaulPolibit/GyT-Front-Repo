import { API_CONFIG, getApiUrl } from './api-config'
import { getAuthToken } from './auth-storage'

// Email parameters interface
export interface EmailParams {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  bodyText?: string
  bodyHtml?: string
  attachments?: {
    filename: string
    content: string // base64 encoded or path
    contentType?: string
  }[]
  fromEmail?: string
  fromName?: string
  replyTo?: string
}

// Email template data interfaces
export interface CapitalCallEmailData {
  investorName: string
  structureName: string
  callAmount: string
  callNumber: number
  dueDate: string
  paymentInstructions: string
  fundManagerName: string
  fundManagerEmail: string
  callDetails?: string
}

export interface DistributionEmailData {
  investorName: string
  structureName: string
  distributionAmount: string
  distributionDate: string
  distributionType: string
  fundManagerName: string
  fundManagerEmail: string
  distributionDetails?: string
}

export interface QuarterlyReportEmailData {
  investorName: string
  structureName: string
  quarter: string
  year: string
  reportUrl?: string
  fundManagerName: string
  fundManagerEmail: string
  highlights?: string
}

export interface InvestorActivityEmailData {
  investorName: string
  activityType: string
  activityDescription: string
  structureName?: string
  date: string
  fundManagerName: string
  fundManagerEmail: string
}

export interface DocumentUploadEmailData {
  investorName: string
  documentName: string
  documentType: string
  uploadedBy: string
  structureName?: string
  documentUrl?: string
  fundManagerName: string
  fundManagerEmail: string
}

export interface GeneralAnnouncementEmailData {
  recipientName: string
  announcementTitle: string
  announcementBody: string
  fundManagerName: string
  fundManagerEmail: string
  ctaText?: string
  ctaUrl?: string
}

/**
 * Send email using the API endpoint
 */
export async function sendEmail(userId: string, emailParams: EmailParams): Promise<{ success: boolean; message?: string }> {
  try {
    const token = getAuthToken()
    if (!token) {
      throw new Error('Authentication token not found')
    }

    // Ensure 'to' is always an array
    const payload = {
      ...emailParams,
      to: Array.isArray(emailParams.to) ? emailParams.to : [emailParams.to],
      cc: emailParams.cc ? (Array.isArray(emailParams.cc) ? emailParams.cc : [emailParams.cc]) : undefined,
      bcc: emailParams.bcc ? (Array.isArray(emailParams.bcc) ? emailParams.bcc : [emailParams.bcc]) : undefined,
    }

    const response = await fetch(getApiUrl(API_CONFIG.endpoints.sendEmail(userId)), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to send email')
    }

    const data = await response.json()
    return { success: true, message: data.message }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

/**
 * Capital Call Notice Email Template
 */
export function createCapitalCallEmail(data: CapitalCallEmailData): { subject: string; bodyHtml: string; bodyText: string } {
  const subject = `Capital Call Notice - ${data.structureName} (Call #${data.callNumber})`

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 24px;">Capital Call Notice</h1>
    <p style="color: #7f8c8d; margin: 0; font-size: 14px;">Call #${data.callNumber} - ${data.structureName}</p>
  </div>

  <p>Dear ${data.investorName},</p>

  <p>This notice is to inform you that a capital call has been issued for <strong>${data.structureName}</strong>.</p>

  <div style="background-color: #e8f4f8; padding: 20px; border-left: 4px solid #3498db; margin: 20px 0;">
    <h2 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px;">Call Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 40%;">Call Amount:</td>
        <td style="padding: 8px 0;">${data.callAmount}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Due Date:</td>
        <td style="padding: 8px 0;">${data.dueDate}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Call Number:</td>
        <td style="padding: 8px 0;">#${data.callNumber}</td>
      </tr>
    </table>
  </div>

  ${data.callDetails ? `
  <div style="margin: 20px 0;">
    <h3 style="color: #2c3e50; font-size: 16px; margin-bottom: 10px;">Additional Details</h3>
    <p style="margin: 0;">${data.callDetails}</p>
  </div>
  ` : ''}

  <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <h3 style="color: #856404; font-size: 16px; margin: 0 0 10px 0;">Payment Instructions</h3>
    <p style="margin: 0; color: #856404;">${data.paymentInstructions}</p>
  </div>

  <p>Please ensure payment is received by the due date to avoid any penalties or interest charges.</p>

  <p>If you have any questions regarding this capital call, please don't hesitate to contact us.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
    <p style="margin: 5px 0;"><strong>${data.fundManagerName}</strong></p>
    <p style="margin: 5px 0; color: #7f8c8d;">${data.fundManagerEmail}</p>
  </div>

  <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; font-size: 12px; color: #7f8c8d;">
    <p style="margin: 0;">This is an automated message. Please do not reply to this email directly.</p>
  </div>
</body>
</html>
  `

  const bodyText = `
Capital Call Notice - ${data.structureName} (Call #${data.callNumber})

Dear ${data.investorName},

This notice is to inform you that a capital call has been issued for ${data.structureName}.

CALL DETAILS:
Call Amount: ${data.callAmount}
Due Date: ${data.dueDate}
Call Number: #${data.callNumber}

${data.callDetails ? `ADDITIONAL DETAILS:\n${data.callDetails}\n\n` : ''}

PAYMENT INSTRUCTIONS:
${data.paymentInstructions}

Please ensure payment is received by the due date to avoid any penalties or interest charges.

If you have any questions regarding this capital call, please don't hesitate to contact us.

Best regards,
${data.fundManagerName}
${data.fundManagerEmail}

---
This is an automated message. Please do not reply to this email directly.
  `

  return { subject, bodyHtml, bodyText }
}

/**
 * Distribution Notice Email Template
 */
export function createDistributionEmail(data: DistributionEmailData): { subject: string; bodyHtml: string; bodyText: string } {
  const subject = `Distribution Notice - ${data.structureName}`

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #27ae60; margin: 0 0 10px 0; font-size: 24px;">Distribution Notice</h1>
    <p style="color: #7f8c8d; margin: 0; font-size: 14px;">${data.structureName}</p>
  </div>

  <p>Dear ${data.investorName},</p>

  <p>We are pleased to inform you that a distribution has been processed for <strong>${data.structureName}</strong>.</p>

  <div style="background-color: #e8f8f1; padding: 20px; border-left: 4px solid #27ae60; margin: 20px 0;">
    <h2 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px;">Distribution Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 40%;">Distribution Amount:</td>
        <td style="padding: 8px 0;">${data.distributionAmount}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Distribution Type:</td>
        <td style="padding: 8px 0;">${data.distributionType}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Distribution Date:</td>
        <td style="padding: 8px 0;">${data.distributionDate}</td>
      </tr>
    </table>
  </div>

  ${data.distributionDetails ? `
  <div style="margin: 20px 0;">
    <h3 style="color: #2c3e50; font-size: 16px; margin-bottom: 10px;">Additional Information</h3>
    <p style="margin: 0;">${data.distributionDetails}</p>
  </div>
  ` : ''}

  <p>The distribution will be processed according to your payment preferences on file. If you have any questions or need to update your payment information, please contact us.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
    <p style="margin: 5px 0;"><strong>${data.fundManagerName}</strong></p>
    <p style="margin: 5px 0; color: #7f8c8d;">${data.fundManagerEmail}</p>
  </div>

  <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; font-size: 12px; color: #7f8c8d;">
    <p style="margin: 0;">This is an automated message. Please do not reply to this email directly.</p>
  </div>
</body>
</html>
  `

  const bodyText = `
Distribution Notice - ${data.structureName}

Dear ${data.investorName},

We are pleased to inform you that a distribution has been processed for ${data.structureName}.

DISTRIBUTION DETAILS:
Distribution Amount: ${data.distributionAmount}
Distribution Type: ${data.distributionType}
Distribution Date: ${data.distributionDate}

${data.distributionDetails ? `ADDITIONAL INFORMATION:\n${data.distributionDetails}\n\n` : ''}

The distribution will be processed according to your payment preferences on file. If you have any questions or need to update your payment information, please contact us.

Best regards,
${data.fundManagerName}
${data.fundManagerEmail}

---
This is an automated message. Please do not reply to this email directly.
  `

  return { subject, bodyHtml, bodyText }
}

/**
 * Quarterly Report Email Template
 */
export function createQuarterlyReportEmail(data: QuarterlyReportEmailData): { subject: string; bodyHtml: string; bodyText: string } {
  const subject = `Quarterly Report - ${data.quarter} ${data.year} - ${data.structureName}`

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 24px;">Quarterly Report Available</h1>
    <p style="color: #7f8c8d; margin: 0; font-size: 14px;">${data.quarter} ${data.year} - ${data.structureName}</p>
  </div>

  <p>Dear ${data.investorName},</p>

  <p>The quarterly report for <strong>${data.structureName}</strong> for <strong>${data.quarter} ${data.year}</strong> is now available for your review.</p>

  ${data.highlights ? `
  <div style="background-color: #e8f4f8; padding: 20px; border-left: 4px solid #3498db; margin: 20px 0;">
    <h2 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px;">Key Highlights</h2>
    <p style="margin: 0;">${data.highlights}</p>
  </div>
  ` : ''}

  ${data.reportUrl ? `
  <div style="text-align: center; margin: 30px 0;">
    <a href="${data.reportUrl}" style="display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Quarterly Report</a>
  </div>
  ` : ''}

  <p>This report includes detailed information about fund performance, portfolio updates, and financial statements for the quarter.</p>

  <p>Please review the report at your earliest convenience. If you have any questions or would like to discuss the report in more detail, please don't hesitate to reach out.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
    <p style="margin: 5px 0;"><strong>${data.fundManagerName}</strong></p>
    <p style="margin: 5px 0; color: #7f8c8d;">${data.fundManagerEmail}</p>
  </div>

  <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; font-size: 12px; color: #7f8c8d;">
    <p style="margin: 0;">This is an automated message. Please do not reply to this email directly.</p>
  </div>
</body>
</html>
  `

  const bodyText = `
Quarterly Report Available - ${data.quarter} ${data.year} - ${data.structureName}

Dear ${data.investorName},

The quarterly report for ${data.structureName} for ${data.quarter} ${data.year} is now available for your review.

${data.highlights ? `KEY HIGHLIGHTS:\n${data.highlights}\n\n` : ''}

${data.reportUrl ? `View the report at: ${data.reportUrl}\n\n` : ''}

This report includes detailed information about fund performance, portfolio updates, and financial statements for the quarter.

Please review the report at your earliest convenience. If you have any questions or would like to discuss the report in more detail, please don't hesitate to reach out.

Best regards,
${data.fundManagerName}
${data.fundManagerEmail}

---
This is an automated message. Please do not reply to this email directly.
  `

  return { subject, bodyHtml, bodyText }
}

/**
 * Investor Activity Email Template
 */
export function createInvestorActivityEmail(data: InvestorActivityEmailData): { subject: string; bodyHtml: string; bodyText: string } {
  const subject = `Activity Notification: ${data.activityType}${data.structureName ? ` - ${data.structureName}` : ''}`

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 24px;">Activity Notification</h1>
    <p style="color: #7f8c8d; margin: 0; font-size: 14px;">${data.activityType}</p>
  </div>

  <p>Dear ${data.investorName},</p>

  <div style="background-color: #fff9e6; padding: 20px; border-left: 4px solid #f39c12; margin: 20px 0;">
    <h2 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px;">Activity Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 30%;">Activity Type:</td>
        <td style="padding: 8px 0;">${data.activityType}</td>
      </tr>
      ${data.structureName ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Structure:</td>
        <td style="padding: 8px 0;">${data.structureName}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Date:</td>
        <td style="padding: 8px 0;">${data.date}</td>
      </tr>
    </table>
  </div>

  <div style="margin: 20px 0;">
    <h3 style="color: #2c3e50; font-size: 16px; margin-bottom: 10px;">Description</h3>
    <p style="margin: 0;">${data.activityDescription}</p>
  </div>

  <p>This notification is to keep you informed of important activities related to your account.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
    <p style="margin: 5px 0;"><strong>${data.fundManagerName}</strong></p>
    <p style="margin: 5px 0; color: #7f8c8d;">${data.fundManagerEmail}</p>
  </div>

  <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; font-size: 12px; color: #7f8c8d;">
    <p style="margin: 0;">This is an automated message. Please do not reply to this email directly.</p>
  </div>
</body>
</html>
  `

  const bodyText = `
Activity Notification: ${data.activityType}${data.structureName ? ` - ${data.structureName}` : ''}

Dear ${data.investorName},

ACTIVITY DETAILS:
Activity Type: ${data.activityType}
${data.structureName ? `Structure: ${data.structureName}\n` : ''}Date: ${data.date}

DESCRIPTION:
${data.activityDescription}

This notification is to keep you informed of important activities related to your account.

Best regards,
${data.fundManagerName}
${data.fundManagerEmail}

---
This is an automated message. Please do not reply to this email directly.
  `

  return { subject, bodyHtml, bodyText }
}

/**
 * Document Upload Email Template
 */
export function createDocumentUploadEmail(data: DocumentUploadEmailData): { subject: string; bodyHtml: string; bodyText: string } {
  const subject = `New Document Available: ${data.documentName}${data.structureName ? ` - ${data.structureName}` : ''}`

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #8e44ad; margin: 0 0 10px 0; font-size: 24px;">New Document Available</h1>
    <p style="color: #7f8c8d; margin: 0; font-size: 14px;">${data.documentType}</p>
  </div>

  <p>Dear ${data.investorName},</p>

  <p>A new document has been uploaded to your account and is now available for review.</p>

  <div style="background-color: #f4ecf7; padding: 20px; border-left: 4px solid #8e44ad; margin: 20px 0;">
    <h2 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px;">Document Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 35%;">Document Name:</td>
        <td style="padding: 8px 0;">${data.documentName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Document Type:</td>
        <td style="padding: 8px 0;">${data.documentType}</td>
      </tr>
      ${data.structureName ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Related To:</td>
        <td style="padding: 8px 0;">${data.structureName}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Uploaded By:</td>
        <td style="padding: 8px 0;">${data.uploadedBy}</td>
      </tr>
    </table>
  </div>

  ${data.documentUrl ? `
  <div style="text-align: center; margin: 30px 0;">
    <a href="${data.documentUrl}" style="display: inline-block; padding: 12px 30px; background-color: #8e44ad; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">View Document</a>
  </div>
  ` : ''}

  <p>You can access this document through your investor portal in the Documents section.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
    <p style="margin: 5px 0;"><strong>${data.fundManagerName}</strong></p>
    <p style="margin: 5px 0; color: #7f8c8d;">${data.fundManagerEmail}</p>
  </div>

  <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; font-size: 12px; color: #7f8c8d;">
    <p style="margin: 0;">This is an automated message. Please do not reply to this email directly.</p>
  </div>
</body>
</html>
  `

  const bodyText = `
New Document Available: ${data.documentName}${data.structureName ? ` - ${data.structureName}` : ''}

Dear ${data.investorName},

A new document has been uploaded to your account and is now available for review.

DOCUMENT DETAILS:
Document Name: ${data.documentName}
Document Type: ${data.documentType}
${data.structureName ? `Related To: ${data.structureName}\n` : ''}Uploaded By: ${data.uploadedBy}

${data.documentUrl ? `View the document at: ${data.documentUrl}\n\n` : ''}

You can access this document through your investor portal in the Documents section.

Best regards,
${data.fundManagerName}
${data.fundManagerEmail}

---
This is an automated message. Please do not reply to this email directly.
  `

  return { subject, bodyHtml, bodyText }
}

/**
 * General Announcement Email Template
 */
export function createGeneralAnnouncementEmail(data: GeneralAnnouncementEmailData): { subject: string; bodyHtml: string; bodyText: string } {
  const subject = data.announcementTitle

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 24px;">${data.announcementTitle}</h1>
  </div>

  <p>Dear ${data.recipientName},</p>

  <div style="margin: 20px 0;">
    ${data.announcementBody}
  </div>

  ${data.ctaUrl && data.ctaText ? `
  <div style="text-align: center; margin: 30px 0;">
    <a href="${data.ctaUrl}" style="display: inline-block; padding: 12px 30px; background-color: #3498db; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">${data.ctaText}</a>
  </div>
  ` : ''}

  <p>If you have any questions, please don't hesitate to contact us.</p>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
    <p style="margin: 5px 0;"><strong>${data.fundManagerName}</strong></p>
    <p style="margin: 5px 0; color: #7f8c8d;">${data.fundManagerEmail}</p>
  </div>

  <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; font-size: 12px; color: #7f8c8d;">
    <p style="margin: 0;">This is an automated message. Please do not reply to this email directly.</p>
  </div>
</body>
</html>
  `

  const bodyText = `
${data.announcementTitle}

Dear ${data.recipientName},

${data.announcementBody.replace(/<[^>]*>/g, '')}

${data.ctaUrl && data.ctaText ? `${data.ctaText}: ${data.ctaUrl}\n\n` : ''}

If you have any questions, please don't hesitate to contact us.

Best regards,
${data.fundManagerName}
${data.fundManagerEmail}

---
This is an automated message. Please do not reply to this email directly.
  `

  return { subject, bodyHtml, bodyText }
}

/**
 * Helper function to send Capital Call email
 */
export async function sendCapitalCallEmail(
  userId: string,
  to: string | string[],
  data: CapitalCallEmailData,
  options?: { cc?: string | string[]; bcc?: string | string[]; fromEmail?: string; fromName?: string; replyTo?: string }
): Promise<{ success: boolean; message?: string }> {
  const { subject, bodyHtml, bodyText } = createCapitalCallEmail(data)

  return sendEmail(userId, {
    to,
    cc: options?.cc,
    bcc: options?.bcc,
    subject,
    bodyHtml,
    bodyText,
    fromEmail: options?.fromEmail,
    fromName: options?.fromName,
    replyTo: options?.replyTo,
  })
}

/**
 * Helper function to send Distribution email
 */
export async function sendDistributionEmail(
  userId: string,
  to: string | string[],
  data: DistributionEmailData,
  options?: { cc?: string | string[]; bcc?: string | string[]; fromEmail?: string; fromName?: string; replyTo?: string }
): Promise<{ success: boolean; message?: string }> {
  const { subject, bodyHtml, bodyText } = createDistributionEmail(data)

  return sendEmail(userId, {
    to,
    cc: options?.cc,
    bcc: options?.bcc,
    subject,
    bodyHtml,
    bodyText,
    fromEmail: options?.fromEmail,
    fromName: options?.fromName,
    replyTo: options?.replyTo,
  })
}

/**
 * Helper function to send Quarterly Report email
 */
export async function sendQuarterlyReportEmail(
  userId: string,
  to: string | string[],
  data: QuarterlyReportEmailData,
  options?: { cc?: string | string[]; bcc?: string | string[]; fromEmail?: string; fromName?: string; replyTo?: string }
): Promise<{ success: boolean; message?: string }> {
  const { subject, bodyHtml, bodyText } = createQuarterlyReportEmail(data)

  return sendEmail(userId, {
    to,
    cc: options?.cc,
    bcc: options?.bcc,
    subject,
    bodyHtml,
    bodyText,
    fromEmail: options?.fromEmail,
    fromName: options?.fromName,
    replyTo: options?.replyTo,
  })
}

/**
 * Helper function to send Investor Activity email
 */
export async function sendInvestorActivityEmail(
  userId: string,
  to: string | string[],
  data: InvestorActivityEmailData,
  options?: { cc?: string | string[]; bcc?: string | string[]; fromEmail?: string; fromName?: string; replyTo?: string }
): Promise<{ success: boolean; message?: string }> {
  const { subject, bodyHtml, bodyText } = createInvestorActivityEmail(data)

  return sendEmail(userId, {
    to,
    cc: options?.cc,
    bcc: options?.bcc,
    subject,
    bodyHtml,
    bodyText,
    fromEmail: options?.fromEmail,
    fromName: options?.fromName,
    replyTo: options?.replyTo,
  })
}

/**
 * Helper function to send Document Upload email
 */
export async function sendDocumentUploadEmail(
  userId: string,
  to: string | string[],
  data: DocumentUploadEmailData,
  options?: { cc?: string | string[]; bcc?: string | string[]; fromEmail?: string; fromName?: string; replyTo?: string }
): Promise<{ success: boolean; message?: string }> {
  const { subject, bodyHtml, bodyText } = createDocumentUploadEmail(data)

  return sendEmail(userId, {
    to,
    cc: options?.cc,
    bcc: options?.bcc,
    subject,
    bodyHtml,
    bodyText,
    fromEmail: options?.fromEmail,
    fromName: options?.fromName,
    replyTo: options?.replyTo,
  })
}

/**
 * Helper function to send General Announcement email
 */
export async function sendGeneralAnnouncementEmail(
  userId: string,
  to: string | string[],
  data: GeneralAnnouncementEmailData,
  options?: { cc?: string | string[]; bcc?: string | string[]; fromEmail?: string; fromName?: string; replyTo?: string }
): Promise<{ success: boolean; message?: string }> {
  const { subject, bodyHtml, bodyText } = createGeneralAnnouncementEmail(data)

  return sendEmail(userId, {
    to,
    cc: options?.cc,
    bcc: options?.bcc,
    subject,
    bodyHtml,
    bodyText,
    fromEmail: options?.fromEmail,
    fromName: options?.fromName,
    replyTo: options?.replyTo,
  })
}
