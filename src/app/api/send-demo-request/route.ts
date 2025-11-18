import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      companyWebsite,
      tokenizationExpertise,
      estimatedAssetValue,
      currentAssetManagement,
      otherAssetManagement,
      tokenizationMotivation,
      otherMotivation,
      existingInvestorNetwork
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Initialize Resend client (lazy initialization to avoid build-time errors)
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email to your team
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toEmail = process.env.DEMO_EMAIL_RECIPIENT || 'admin@polibit.io';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `New Demo Request from ${firstName} ${lastName}`,
      html: `
        <h2>New Demo Request</h2>

        <h3>Contact Information</h3>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Company Website:</strong> ${companyWebsite || 'Not provided'}</p>

        <h3>Tokenization Details</h3>
        <p><strong>Tokenization Expertise Level:</strong> ${tokenizationExpertise || 'Not specified'}</p>
        <p><strong>Estimated Asset Tokenization Value:</strong> ${estimatedAssetValue || 'Not specified'}</p>
        <p><strong>Current Asset Management Method:</strong> ${currentAssetManagement || 'Not specified'}</p>
        ${otherAssetManagement ? `<p><strong>Other Asset Management Method:</strong> ${otherAssetManagement}</p>` : ''}
        <p><strong>Motivation for Tokenization:</strong> ${tokenizationMotivation || 'Not specified'}</p>
        ${otherMotivation ? `<p><strong>Other Motivation:</strong> ${otherMotivation}</p>` : ''}
        <p><strong>Existing Investor Network:</strong> ${existingInvestorNetwork || 'Not specified'}</p>
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json({
        error: 'Failed to send email',
        details: error.message || 'Unknown error'
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 });
  }
}
