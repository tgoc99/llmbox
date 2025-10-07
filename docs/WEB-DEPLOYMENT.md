# Web Landing Page Deployment Guide

This guide covers everything you need to do **outside of this repository** to deploy the Next.js landing page.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Deployment Options](#deployment-options)
4. [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
5. [Netlify Deployment](#netlify-deployment)
6. [Custom Domain Setup](#custom-domain-setup)
7. [Environment Variables](#environment-variables)
8. [Post-Deployment Checklist](#post-deployment-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Node.js** - Version 18.x or higher
  - Check: `node --version`
  - Install: [nodejs.org](https://nodejs.org/)

- **npm** - Comes with Node.js (or use pnpm/yarn)
  - Check: `npm --version`

- **Git** - For repository management
  - Check: `git --version`

### Optional

- **GitHub Account** - For Vercel/Netlify integration
- **Custom Domain** - For production deployment

---

## Local Development Setup

### Step 1: Install Dependencies

From the repository root:

```bash
# Using Deno task (recommended)
deno task web:install

# Or manually
cd web
npm install
```

This will install:
- Next.js 14
- React 18
- TailwindCSS 3
- TypeScript 5
- Lucide React (icons)
- All required dev dependencies

**Expected output:**
```
added 300+ packages in 30s
```

### Step 2: Configure Email Address

Before running locally, update the email address in the landing page:

**Files to edit:**
1. `web/components/Hero.tsx` - Line ~70
2. `web/components/CTA.tsx` - Line ~8
3. `web/app/page.tsx` - Footer links

**Find and replace:**
```
assistant@yourdomain.com
```

**With your actual email:**
```
assistant@email.yourdomain.com
```

### Step 3: Run Development Server

```bash
# Using Deno task (recommended)
deno task web:dev

# Or manually
cd web
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.2.15
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.3s
```

### Step 4: View in Browser

Open [http://localhost:3000](http://localhost:3000) in your browser.

**You should see:**
- Hero section with "Chat with AI Through Email"
- Features section
- How It Works section with 3 steps
- CTA section with email address
- Footer

---

## Deployment Options

### Quick Comparison

| Platform | Pros | Cons | Best For |
|----------|------|------|----------|
| **Vercel** | Zero-config, automatic deployments, Next.js optimized | Requires GitHub | Most users |
| **Netlify** | Simple setup, good free tier | Slightly more config | Alternative to Vercel |
| **Cloudflare Pages** | Fast global CDN, generous free tier | More manual setup | Advanced users |
| **Self-hosted** | Full control, no vendor lock-in | Requires server management | Enterprise |

**Recommendation:** Use Vercel for easiest deployment and best Next.js optimization.

---

## Vercel Deployment (Recommended)

### Why Vercel?

- Built by the Next.js team
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Automatic preview deployments for PRs
- Generous free tier

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your GitHub account

### Step 2: Push Code to GitHub

If you haven't already:

```bash
# From repository root
git add .
git commit -m "Add Next.js landing page"
git push origin main
```

### Step 3: Import Project to Vercel

1. In Vercel dashboard, click **"Add New Project"**
2. Click **"Import Git Repository"**
3. Select your `llmbox` repository
4. Vercel will auto-detect Next.js

### Step 4: Configure Build Settings

Vercel should auto-detect these settings, but verify:

**Framework Preset:** `Next.js`

**Root Directory:** `web`
- ⚠️ **IMPORTANT:** Set this to `web` (not empty)
- This tells Vercel where your Next.js app is located

**Build Command:** `npm run build`
- Auto-detected, no change needed

**Output Directory:** `.next`
- Auto-detected, no change needed

**Install Command:** `npm install`
- Auto-detected, no change needed

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. ✅ Your site is live!

**You'll get a URL like:**
```
https://llmbox-abc123.vercel.app
```

### Step 6: Configure Production Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Domains**
3. Add your custom domain (e.g., `llmbox.pro`)
4. Follow DNS configuration instructions (see [Custom Domain Setup](#custom-domain-setup))

### Step 7: Enable Automatic Deployments

Already enabled by default! Every push to `main` branch will auto-deploy.

**Preview deployments:** Every PR gets its own preview URL.

---

## Netlify Deployment

### Why Netlify?

- Simple setup
- Good free tier
- Automatic HTTPS
- Form handling built-in
- Good alternative to Vercel

### Step 1: Create Netlify Account

1. Go to [netlify.com](https://www.netlify.com)
2. Click "Sign Up"
3. Choose "GitHub" to connect

### Step 2: Create New Site

1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your `llmbox` repository
4. Authorize Netlify

### Step 3: Configure Build Settings

**Base directory:** `web`
- ⚠️ **IMPORTANT:** Set this to `web`

**Build command:**
```bash
npm run build
```

**Publish directory:**
```bash
.next
```

**Build settings (advanced):**

Add to `netlify.toml` in repository root:

```toml
[build]
  base = "web"
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Step 4: Deploy

1. Click **"Deploy site"**
2. Wait 2-3 minutes
3. ✅ Site is live!

**You'll get a URL like:**
```
https://llmbox-abc123.netlify.app
```

### Step 5: Configure Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow DNS configuration instructions

---

## Custom Domain Setup

### Step 1: Purchase Domain (if needed)

Popular registrars:
- [Namecheap](https://www.namecheap.com) - Good prices, easy to use
- [Google Domains](https://domains.google) - Simple interface
- [Cloudflare](https://www.cloudflare.com) - Best pricing, advanced features
- [GoDaddy](https://www.godaddy.com) - Popular, more expensive

**Recommended domain for this project:**
- `llmbox.pro`
- `yourdomain.com` (match your email)
- `ai-email.com`

### Step 2: Configure DNS Records

#### For Vercel:

Add these DNS records in your domain registrar:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**CNAME Record (for www):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### For Netlify:

**CNAME Record:**
```
Type: CNAME
Name: @
Value: your-site.netlify.app
TTL: 3600
```

**CNAME Record (for www):**
```
Type: CNAME
Name: www
Value: your-site.netlify.app
TTL: 3600
```

### Step 3: Wait for DNS Propagation

- **Typical time:** 1-24 hours
- **Check status:** [whatsmydns.net](https://www.whatsmydns.net)

### Step 4: Verify SSL Certificate

Both Vercel and Netlify automatically provision SSL certificates.

**Check:**
- Visit `https://yourdomain.com`
- Look for 🔒 padlock in browser

---

## Environment Variables

The landing page is currently **static** with no environment variables needed.

### Future: If You Add Dynamic Features

If you add API calls, analytics, or other dynamic features:

#### In Vercel:

1. Go to **Project Settings** → **Environment Variables**
2. Add variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_GA_ID` (Google Analytics)
   - etc.

#### In Netlify:

1. Go to **Site settings** → **Environment variables**
2. Add the same variables

**Note:** Variables starting with `NEXT_PUBLIC_` are exposed to the browser.

---

## Post-Deployment Checklist

After deploying, verify everything works:

### ✅ Visual Check

- [ ] Hero section displays correctly
- [ ] All 6 feature cards visible
- [ ] "How It Works" section with 3 steps
- [ ] Example conversation displays properly
- [ ] CTA section with copy button
- [ ] Footer with links

### ✅ Responsive Check

Test on different screen sizes:

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Quick test:** Open Chrome DevTools → Toggle device toolbar

### ✅ Functionality Check

- [ ] Smooth scroll to sections works
- [ ] "Get Started" button scrolls to #how-it-works
- [ ] "Learn More" button scrolls to #features
- [ ] Copy email button works (shows "Copied!")
- [ ] All links are not broken
- [ ] Footer links work

### ✅ Performance Check

Use [PageSpeed Insights](https://pagespeed.web.dev/):

1. Enter your deployed URL
2. Wait for analysis
3. Check scores (should be 90+)

**Target scores:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### ✅ SEO Check

- [ ] Page title is correct
- [ ] Meta description is set
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] Favicon displays (if added)

**Check with:**
- [Metatags.io](https://metatags.io)
- View page source in browser

---

## Troubleshooting

### Issue: Build Fails with "Cannot find module"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd web
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Root Directory" not set

**Cause:** Vercel/Netlify looking in wrong folder

**Solution:**
- In Vercel: Settings → General → Root Directory → Set to `web`
- In Netlify: Build settings → Base directory → Set to `web`

### Issue: Styles not loading (no TailwindCSS)

**Cause:** PostCSS config missing or build issue

**Solution:**
1. Verify `postcss.config.js` exists in `web/`
2. Verify `tailwind.config.ts` exists in `web/`
3. Rebuild:
   ```bash
   cd web
   rm -rf .next
   npm run build
   ```

### Issue: Icons not showing (Lucide icons)

**Cause:** Package not installed

**Solution:**
```bash
cd web
npm install lucide-react
```

### Issue: TypeScript errors during build

**Cause:** Type errors in code

**Solution:**
```bash
cd web
npm run type-check
```

Fix reported errors, then rebuild.

### Issue: Page loads but is blank

**Cause:** JavaScript error in browser

**Solution:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Most common: Check that `'use client'` directive is present in components using hooks

### Issue: Custom domain not working

**Cause:** DNS not configured or not propagated

**Solution:**
1. Verify DNS records are correct
2. Wait 24-48 hours for DNS propagation
3. Check propagation: [whatsmydns.net](https://www.whatsmydns.net)
4. Clear browser cache
5. Try incognito/private mode

### Issue: Images not loading (if you add images)

**Cause:** Images in wrong directory

**Solution:**
- Put images in `web/public/`
- Reference as `/image.png` (not `public/image.png`)

### Issue: Deployment succeeds but site shows 404

**Cause:** Root directory not set correctly

**Solution:**
- Vercel/Netlify must have `web` as root directory
- Check deployment logs for correct path

---

## Need Help?

### Documentation

- **Next.js:** [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **Netlify:** [docs.netlify.com](https://docs.netlify.com)
- **TailwindCSS:** [tailwindcss.com/docs](https://tailwindcss.com/docs)

### Community

- **Next.js Discord:** [nextjs.org/discord](https://nextjs.org/discord)
- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **Stack Overflow:** Tag `next.js`

### Repository Issues

For issues specific to this landing page, check:
- Repository GitHub Issues
- Review `README.md` in `web/` directory

---

## Summary: Quick Deployment Checklist

### Before Deploying:

- [ ] Run `deno task web:install` successfully
- [ ] Run `deno task web:dev` and verify site works locally
- [ ] Update email address in components
- [ ] Update footer links
- [ ] Commit and push to GitHub

### Deploying to Vercel:

- [ ] Create Vercel account
- [ ] Import GitHub repository
- [ ] Set root directory to `web`
- [ ] Deploy
- [ ] Verify deployment at provided URL
- [ ] (Optional) Add custom domain

### After Deploying:

- [ ] Test all functionality
- [ ] Check responsive design
- [ ] Run PageSpeed Insights
- [ ] Verify SEO meta tags
- [ ] Share with users! 🎉

---

**🎉 Congratulations!**

Your LLMBox landing page is now live and ready to showcase your email-to-AI service!

**Next Steps:**
1. Share the URL with users
2. Monitor analytics (if added)
3. Iterate based on user feedback
4. Consider adding more features (pricing, blog, etc.)

**Questions?** Check the [Troubleshooting](#troubleshooting) section or open an issue in the repository.

