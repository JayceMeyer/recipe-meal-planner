const RESEND_API = 'https://api.resend.com/emails'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface InviteEmailRequest {
  email: string
  token: string
  householdName: string
}

function buildEmailHtml(householdName: string, joinLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0 0 8px; font-size: 22px; color: #18181b;">You're invited!</h1>
      <p style="margin: 0 0 24px; color: #71717a; font-size: 15px;">
        You've been invited to join <strong style="color: #18181b;">${householdName}</strong> on Chomp Plan.
      </p>
      <a href="${joinLink}" style="display: inline-block; padding: 12px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 15px;">
        Accept Invite
      </a>
      <p style="margin: 24px 0 0; font-size: 13px; color: #a1a1aa;">
        Or copy this link: <br>
        <a href="${joinLink}" style="color: #71717a; word-break: break-all;">${joinLink}</a>
      </p>
      <p style="margin: 24px 0 0; font-size: 12px; color: #d4d4d8;">
        This invite expires in 7 days.
      </p>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return jsonResponse({ error: 'Email service not configured' }, 500)
    }

    let body: InviteEmailRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid request body' }, 400)
    }

    const { email, token, householdName } = body

    if (!email || !token) {
      return jsonResponse({ error: 'Missing email or token' }, 400)
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://chompplan.com'
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
    const joinLink = `${appUrl}/join/${token}`

    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `Join ${householdName || 'a household'} on Chomp Plan`,
        html: buildEmailHtml(householdName || 'a household', joinLink),
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Resend API error:', errorText)
      return jsonResponse({ error: 'Failed to send email' }, 500)
    }

    const data = await res.json()
    return jsonResponse({ success: true, id: data.id })
  } catch (err) {
    console.error('send-invite-email error:', err)
    return jsonResponse({ error: (err as Error).message || 'Internal error' }, 500)
  }
})
