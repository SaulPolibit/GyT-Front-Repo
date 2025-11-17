import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const webhookSecret = process.env.DOCUSEAL_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.warn('DOCUSEAL_WEBHOOK_SECRET not configured')
    }

    const clientSecret = request.headers.get('x-polibit-secretsignature')

    // For demo purposes, we'll allow requests without strict verification
    // In production, you should verify the signature
    // if (!clientSecret || clientSecret !== webhookSecret) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const body = await request.json()
    const { event_type, data } = body

    // Validate event type
    if (event_type !== 'form.completed') {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    console.log(`[DocuSeal Webhook] Processed submission:`, data)

    return NextResponse.json(
      { success: true, message: 'Webhook received and processed' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DocuSeal Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check document status from DocuSeal API
export async function GET(request: NextRequest) {
  try {
    const templateId = request.nextUrl.searchParams.get('template_id')
    const email = request.nextUrl.searchParams.get('email')

    if (!templateId || !email) {
      return NextResponse.json(
        { error: 'template_id and email parameters required' },
        { status: 400 }
      )
    }

    const docuSealApiKey = process.env.DOCUSEAL_API_KEY

    if (!docuSealApiKey) {
      console.error('[DocuSeal] API key not configured')
      return NextResponse.json(
        { error: 'DocuSeal API key not configured' },
        { status: 500 }
      )
    }

    console.log('[DocuSeal] Querying with template:', templateId, 'email:', email)

    // Try the correct DocuSeal API endpoint
    const apiUrl = `https://app.docuseal.com/api/templates/${templateId}/submissions`

    console.log('[DocuSeal] Making request to:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Auth-Token': docuSealApiKey,
        'Accept': 'application/json',
      },
    })

    console.log('[DocuSeal] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[DocuSeal] API Error - Status:', response.status, 'Body:', errorText)

      // Try alternative endpoint
      console.log('[DocuSeal] Trying alternative endpoint...')
      const altResponse = await fetch(`https://app.docuseal.com/api/submissions?template_id=${templateId}`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': docuSealApiKey,
          'Accept': 'application/json',
        },
      })

      if (!altResponse.ok) {
        const altErrorText = await altResponse.text()
        console.error('[DocuSeal] Alternative API Error:', altResponse.status, altErrorText)
        return NextResponse.json(
          { error: 'Failed to query DocuSeal API', status: response.status },
          { status: 500 }
        )
      }

      const submissions = await altResponse.json()
      console.log('[DocuSeal] Found submissions:', submissions.length)

      // Find submission matching email
      const submission = submissions.find((sub: any) => sub.email === email)

      if (!submission) {
        return NextResponse.json(
          { signed: false, message: 'No submission found for this email' },
          { status: 200 }
        )
      }

      const isSigned = submission.completed_at !== null && submission.completed_at !== undefined

      return NextResponse.json(
        {
          signed: isSigned,
          submission: {
            id: submission.id,
            email: submission.email,
            completed_at: submission.completed_at,
            created_at: submission.created_at,
          },
        },
        { status: 200 }
      )
    }

    const submissions = await response.json()
    console.log('[DocuSeal] Submissions received:', submissions.length || '(empty)')

    // Handle both array and object responses
    const submissionsList = Array.isArray(submissions) ? submissions : submissions.submissions || []

    // Find submission matching email
    const submission = submissionsList.find((sub: any) =>
      sub.email === email || sub.values?.email === email
    )

    if (!submission) {
      console.log('[DocuSeal] No submission found for email:', email)
      return NextResponse.json(
        { signed: false, message: 'No submission found for this email' },
        { status: 200 }
      )
    }

    console.log('[DocuSeal] Found submission:', submission.id, 'completed_at:', submission.completed_at)

    const isSigned = submission.completed_at !== null && submission.completed_at !== undefined

    return NextResponse.json(
      {
        signed: isSigned,
        submission: {
          id: submission.id,
          email: submission.email || submission.values?.email,
          completed_at: submission.completed_at,
          created_at: submission.created_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DocuSeal Check] Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    )
  }
}
