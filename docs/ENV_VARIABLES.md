# Environment Variables Reference

Complete list of environment variables needed for LLMBox.

## Quick Setup

Create `.env.local` in the `web/` directory with these variables:

## Supabase Configuration

Get these from: https://app.supabase.com/project/_/settings/api

```bash
# Public variables (safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side only (KEEP SECRET!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Stripe Configuration

Get these from: https://dashboard.stripe.com/test/apikeys

**Use test keys for development, live keys for production**

```bash
# Server-side only
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# Public (safe for client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...

# Price IDs (from Stripe Products page)
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_MAX=price_...
```

## SendGrid Configuration

Get these from: https://app.sendgrid.com/settings/api_keys

```bash
SENDGRID_API_KEY=SG.xxxxx...
SERVICE_EMAIL_ADDRESS=chat@llmbox.ai
```

## OpenAI Configuration

Get from: https://platform.openai.com/api-keys

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Application Configuration

```bash
# Web app URL (change for production)
NEXT_PUBLIC_WEB_APP_URL=http://localhost:3000
WEB_APP_URL=http://localhost:3000

# Logging level: DEBUG, INFO, WARN, ERROR, CRITICAL
LOG_LEVEL=INFO
```

## Where to Set These Variables

### For Supabase Edge Functions

Set via CLI:
```bash
supabase secrets set OPENAI_API_KEY=sk-... --project-ref YOUR_PROJECT_REF
supabase secrets set SENDGRID_API_KEY=SG... --project-ref YOUR_PROJECT_REF
supabase secrets set SERVICE_EMAIL_ADDRESS=chat@llmbox.ai --project-ref YOUR_PROJECT_REF
supabase secrets set OPENAI_MODEL=gpt-4o-mini --project-ref YOUR_PROJECT_REF
supabase secrets set LOG_LEVEL=INFO --project-ref YOUR_PROJECT_REF
supabase secrets set WEB_APP_URL=https://llmbox.ai --project-ref YOUR_PROJECT_REF
```

Or via Dashboard:
1. Go to Edge Functions → Settings → Secrets
2. Add each variable

### For Next.js Web App (Local Development)

Create `web/.env.local`:
```bash
# Copy all variables listed above
```

### For Next.js Web App (Vercel Production)

Via CLI:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Enter value when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY
# etc...
```

Or via Dashboard:
1. Go to Vercel project → Settings → Environment Variables
2. Add each variable

## Variable Details

| Variable | Required For | Secret? | Description |
|----------|-------------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Web App | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web App | No | Public Supabase key |
| `SUPABASE_SERVICE_ROLE_KEY` | Both | **YES** | Admin access to Supabase |
| `STRIPE_SECRET_KEY` | Web App | **YES** | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Web App | **YES** | Webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Web App | No | Public Stripe key |
| `STRIPE_PRICE_ID_PRO` | Web App | No | Stripe price ID for Pro plan |
| `STRIPE_PRICE_ID_MAX` | Web App | No | Stripe price ID for Max plan |
| `SENDGRID_API_KEY` | Edge Functions | **YES** | SendGrid API key |
| `SERVICE_EMAIL_ADDRESS` | Edge Functions | No | Verified sender email |
| `OPENAI_API_KEY` | Edge Functions | **YES** | OpenAI API key |
| `OPENAI_MODEL` | Edge Functions | No | Default model (gpt-4o-mini) |
| `NEXT_PUBLIC_WEB_APP_URL` | Both | No | Web app base URL |
| `WEB_APP_URL` | Edge Functions | No | Web app URL for links in emails |
| `LOG_LEVEL` | Edge Functions | No | Logging verbosity |

## Security Notes

1. **Never commit secrets to git**
   - Add `.env`, `.env.local`, `.env.production` to `.gitignore`
   - Use `.env.example` (without real values) for templates

2. **Rotate keys regularly**
   - Especially after team members leave
   - If keys are accidentally exposed

3. **Use different keys for environments**
   - Development: Stripe test keys
   - Production: Stripe live keys

4. **Limit key permissions**
   - Create separate keys for different services
   - Use most restrictive permissions possible

5. **Monitor usage**
   - Set up alerts in Stripe, OpenAI, SendGrid
   - Watch for unusual activity

## Testing Variables

For testing, you can use Stripe's test keys and test cards:

**Test Card:**
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

More test cards: https://stripe.com/docs/testing

## Troubleshooting

### Variables not working?

1. **Check spelling** - Variable names are case-sensitive
2. **Restart dev server** - Changes to `.env.local` require restart
3. **Check scope** - `NEXT_PUBLIC_*` available in browser, others server-only
4. **Verify values** - No quotes needed in `.env` files
5. **Check deployment** - Ensure variables set in Vercel/production

### How to verify variables are loaded?

**In Edge Functions:**
```typescript
console.log('OpenAI key exists:', !!Deno.env.get('OPENAI_API_KEY'));
```

**In Next.js (server-side):**
```typescript
console.log('Stripe key exists:', !!process.env.STRIPE_SECRET_KEY);
```

**In Next.js (client-side):**
```typescript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

## See Also

- `EXTERNAL_SETUP.md` - Step-by-step setup guide
- `TESTING_USAGE_TRACKING.md` - Testing guide
- Supabase Docs: https://supabase.com/docs/guides/functions/secrets
- Vercel Docs: https://vercel.com/docs/concepts/projects/environment-variables

