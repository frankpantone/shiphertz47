# Vercel Deployment Guide

## Prerequisites
- GitHub repository is up to date ✅
- Vercel account (sign up at vercel.com)
- Environment variables ready

## Deployment Steps

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Import your GitHub repository: `frankpantone/shiphertz47`

### 2. Configure Project Settings
- **Framework Preset**: Next.js (should auto-detect)
- **Root Directory**: Leave as is (repository root)
- **Build Command**: `npm run build`
- **Install Command**: `npm install`

### 3. Set Environment Variables
Add the following environment variables in Vercel dashboard:

#### Required Variables:
```
NEXT_PUBLIC_SUPABASE_URL=[Your Supabase URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase Anon Key]
SUPABASE_SERVICE_ROLE_KEY=[Your Supabase Service Role Key]
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[Your Google Maps API Key]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[Your Stripe Publishable Key]
STRIPE_SECRET_KEY=[Your Stripe Secret Key]
```

#### Important: Update these before production:
```
STRIPE_WEBHOOK_SECRET=whsec_... (get from Stripe dashboard after setting up webhook)
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=[generate a secure random string]
```

### 4. Stripe Webhook Setup
After deployment:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-vercel-domain.vercel.app/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.failed`
4. Copy the webhook secret and update `STRIPE_WEBHOOK_SECRET` in Vercel

### 5. Deploy
1. Click "Deploy" in Vercel
2. Wait for build to complete (usually 2-3 minutes)
3. Your app will be live at the provided URL

## Post-Deployment Checklist

- [ ] Test the live URL
- [ ] Verify Google Maps autocomplete works
- [ ] Test Stripe payment flow (use test cards)
- [ ] Check admin login functionality
- [ ] Verify file uploads work
- [ ] Test order creation flow
- [ ] Configure custom domain (optional)

## Custom Domain Setup (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Runtime Errors
- Check Function logs in Vercel dashboard
- Verify Supabase RLS policies allow public access where needed
- Ensure API keys have proper permissions

### Google Maps Issues
- Verify API key has Maps JavaScript API and Places API enabled
- Add your Vercel domain to allowed referrers in Google Cloud Console

## Security Notes
- Never commit `.env.local` file
- Rotate API keys regularly
- Use production Stripe keys when going live
- Enable Vercel's DDoS protection for production