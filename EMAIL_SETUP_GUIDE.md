# Email Setup Guide for TripPlanner

Your app is now configured to use **magic link email authentication** (passwordless login). Users will receive an email with a link to sign in.

## Quick Setup Options

### Option 1: Gmail SMTP (Fastest - 5 minutes)

Perfect for testing and development.

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Create App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "TripPlanner"
   - Copy the 16-character password

3. **Add to your .env file:**
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
```

---

### Option 2: Resend (Recommended for Production)

Modern email API with generous free tier (3,000 emails/month).

1. **Sign up at [resend.com](https://resend.com)**

2. **Get API Key**
   - Dashboard → API Keys → Create API Key
   - Copy the key

3. **Verify your domain** (or use resend's test domain)
   - Add DNS records to your domain
   - Or use `onboarding@resend.dev` for testing

4. **Update your lib/auth/options.ts:**
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Replace EmailProvider with:
EmailProvider({
  server: { host: 'smtp.resend.com', port: 465, auth: { user: 'resend', pass: process.env.RESEND_API_KEY } },
  from: process.env.EMAIL_FROM,
}),
```

5. **Add to .env:**
```env
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

---

### Option 3: SendGrid

1. **Sign up at [sendgrid.com](https://sendgrid.com)** (100 emails/day free)

2. **Create API Key**
   - Settings → API Keys → Create API Key

3. **Add to .env:**
```env
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

---

## Required: Get Supabase JWT Secret

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Scroll down to **JWT Settings**
5. Copy the **JWT Secret**

Add to your `.env`:
```env
SUPABASE_JWT_SECRET=your_jwt_secret_from_supabase
```

---

## Test Email Authentication

1. **Start your development server:**
```bash
npm run dev
```

2. **Go to:** http://localhost:3000/login

3. **Enter your email** and click "Send Magic Link"

4. **Check your email** for the sign-in link

5. **Click the link** to complete authentication

---

## Troubleshooting

### Email not sending?
- Check your email credentials are correct
- Verify EMAIL_SERVER_* variables in .env
- Check server logs for errors
- For Gmail: Ensure App Password (not regular password) is used

### "Invalid JWT Secret" error?
- Verify SUPABASE_JWT_SECRET matches your Supabase project
- Restart your dev server after adding the variable

### Email goes to spam?
- Use a custom domain with Resend or SendGrid
- Add SPF, DKIM, and DMARC records to your domain

---

## Production Deployment

When deploying to Vercel, add these environment variables:

```
EMAIL_SERVER_HOST=your_smtp_host
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_smtp_user
EMAIL_SERVER_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@yourdomain.com
SUPABASE_JWT_SECRET=your_jwt_secret
```

**Important:** Update `EMAIL_FROM` to use your actual domain in production.

---

## Customize Email Template (Optional)

NextAuth sends a default email. To customize, update `lib/auth/options.ts`:

```typescript
EmailProvider({
  server: { /* ... */ },
  from: process.env.EMAIL_FROM,
  // Custom email template
  async sendVerificationRequest({ identifier: email, url, provider }) {
    const { host } = new URL(url)
    // Send custom HTML email using your email service
    await resend.emails.send({
      from: provider.from,
      to: email,
      subject: `Sign in to ${host}`,
      html: `
        <h1>Welcome to TripPlanner!</h1>
        <p>Click the button below to sign in:</p>
        <a href="${url}" style="background:#0066ff;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
          Sign In
        </a>
      `,
    })
  },
}),
```

---

## Next Steps

1. ✅ Choose an email provider and configure credentials
2. ✅ Add SUPABASE_JWT_SECRET to .env
3. ✅ Test magic link authentication
4. ✅ Deploy to Vercel with environment variables
5. ✅ (Optional) Customize email template

Need help? Check the [NextAuth Email Provider docs](https://next-auth.js.org/providers/email).
