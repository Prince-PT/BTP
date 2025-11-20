# Real Email-Based OTP Setup Guide

## Current Status
Your application is using **Ethereal Email** (fake email service) which only logs preview URLs to the console. To send **real emails**, you need to configure a real SMTP service.

---

## ✅ Option 1: Gmail (Easiest for Development)

### Prerequisites
- A Gmail account
- 2-Factor Authentication enabled

### Steps

#### 1. Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click on "2-Step Verification" and enable it

#### 2. Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other" (enter "RideShare App")
4. Click "Generate"
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

#### 3. Update Your `.env` File
```bash
# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # The app password from step 2
SMTP_FROM="RideShare <your-email@gmail.com>"
```

#### 4. Restart Your Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### ✨ Done! Emails will now be sent to real inboxes.

---

## ✅ Option 2: Brevo (Recommended for Production)

Brevo offers **300 emails/day** for free with no credit card required.

### Steps

#### 1. Create Brevo Account
1. Go to https://www.brevo.com
2. Sign up for free account
3. Verify your email

#### 2. Get SMTP Credentials
1. Login to Brevo dashboard
2. Go to "SMTP & API" section
3. Click on "SMTP" tab
4. You'll see:
   - SMTP Server: `smtp-relay.brevo.com`
   - Port: `587`
   - Login: Your email or username
   - SMTP Key: Click "Generate new SMTP key"

#### 3. Update Your `.env` File
```bash
# Email Configuration (Brevo)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-email@example.com
SMTP_PASS=your-smtp-key-here
SMTP_FROM="RideShare <noreply@yourdomain.com>"
```

#### 4. Restart Your Server
```bash
npm run dev
```

---

## ✅ Option 3: Resend (Modern Alternative)

Resend offers **100 emails/day** for free with a modern API.

### Steps

#### 1. Create Resend Account
1. Go to https://resend.com
2. Sign up with GitHub/Email
3. Verify your email

#### 2. Get API Key
1. Go to API Keys section
2. Create new API key
3. Copy the key

#### 3. Install Resend SDK
```bash
cd apps/api
npm install resend
```

#### 4. Update Email Service
This requires code changes - see the "Resend Integration" section below.

---

## 🔧 Testing Your Email Configuration

After setting up any option, test it:

### 1. Start your backend
```bash
cd apps/api
npm run dev
```

### 2. Request an OTP from your frontend
- Login page → Enter your email → Request OTP
- Check your actual email inbox!

### 3. Check logs
Your terminal should show:
```
📧 OTP email sent to user@example.com
```

No more preview URLs! The email goes to the real inbox.

---

## 🎯 Quick Setup Commands (Gmail)

```bash
# 1. Copy this into your .env file (after getting app password)
echo 'SMTP_HOST=smtp.gmail.com' >> .env
echo 'SMTP_PORT=587' >> .env
echo 'SMTP_USER=your-email@gmail.com' >> .env
echo 'SMTP_PASS=your-app-password-here' >> .env
echo 'SMTP_FROM="RideShare <your-email@gmail.com>"' >> .env

# 2. Restart server
cd apps/api && npm run dev
```

---

## 📧 Resend Integration (Code Changes Required)

If you choose Resend, update your `email.service.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  await resend.emails.send({
    from: 'RideShare <onboarding@resend.dev>', // Use your verified domain
    to: email,
    subject: 'Your RideShare Login Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">RideShare Login Code</h2>
        <p>Your login code is:</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4F46E5; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6B7280;">This code will expire in 5 minutes.</p>
        <p style="color: #6B7280; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  });
};
```

---

## 🚨 Troubleshooting

### Gmail: "Less secure app" error
- **Solution**: Use App Password (not your regular password)
- Make sure 2FA is enabled first

### Port 587 vs 465
- **587**: TLS/STARTTLS (recommended)
- **465**: SSL (alternative)
- Update `SMTP_PORT` if needed

### Emails going to spam
- Use a consistent "From" address
- Add SPF/DKIM records (advanced)
- For development, check spam folder

### Connection timeout
- Check firewall settings
- Try port 465 instead of 587
- Verify SMTP credentials

---

## 📊 Comparison

| Service | Free Limit | Setup Difficulty | Best For |
|---------|-----------|------------------|----------|
| **Gmail** | 500/day | Easy | Development |
| **Brevo** | 300/day | Easy | Production |
| **Resend** | 100/day | Medium | Modern apps |

---

## 🎉 Recommendation

**For immediate testing**: Use **Gmail** (quickest setup)
**For production**: Use **Brevo** (more reliable, higher limits)

Choose one option above and follow the steps. Your OTP emails will be sent to real inboxes! 🚀
