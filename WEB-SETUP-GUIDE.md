# 🚀 Web Landing Page Setup Guide

This guide covers **everything you need to do outside this repository** to get the Next.js landing page running and deployed.

---

## ✅ What's Already Done (In This Repo)

- ✅ Complete Next.js 14 app with App Router
- ✅ Beautiful landing page with 4 sections (Hero, Features, How It Works, CTA)
- ✅ TailwindCSS styling (fully responsive)
- ✅ TypeScript configuration
- ✅ All components and layouts
- ✅ Deno task integration
- ✅ Documentation

**You can preview the code structure in the `web/` directory.**

---

## 📋 What You Need To Do

### Step 1: Install Node.js (If Not Installed)

**Check if you have Node.js:**
```bash
node --version
```

**If not installed:**
- Visit [nodejs.org](https://nodejs.org/)
- Download and install **LTS version** (v18 or higher)
- Restart your terminal

---

### Step 2: Install Web Dependencies

From the repository root:

```bash
deno task web:install
```

Or manually:
```bash
cd web
npm install
```

**What this does:**
- Installs Next.js, React, TailwindCSS, and all dependencies
- Takes ~1-2 minutes
- Creates `node_modules/` directory (ignored by git)

**Expected output:**
```
added 300+ packages in 30s
```

---

### Step 3: Update Email Address

**⚠️ IMPORTANT:** Replace placeholder email with your actual service email.

**Files to edit:**

1. **`web/components/Hero.tsx`** (around line 70)
   ```tsx
   assistant@yourdomain.com
   ```
   Change to:
   ```tsx
   assistant@email.yourdomain.com
   ```

2. **`web/components/CTA.tsx`** (around line 8)
   ```tsx
   const emailAddress = 'assistant@yourdomain.com';
   ```
   Change to:
   ```tsx
   const emailAddress = 'assistant@email.yourdomain.com';
   ```

3. **`web/app/page.tsx`** (footer links - optional)
   - Update GitHub links
   - Update documentation links

**Tip:** Use Find & Replace (Cmd+Shift+F in VS Code) to find all instances of `yourdomain.com`

---

### Step 4: Test Locally

Run the development server:

```bash
deno task web:dev
```

Or manually:
```bash
cd web
npm run dev
```

**Expected output:**
```
▲ Next.js 14.2.15
- Local:        http://localhost:3000
- Ready in 2.3s
```

**Open browser:** [http://localhost:3000](http://localhost:3000)

**Verify:**
- ✅ Page loads without errors
- ✅ All sections visible (Hero, Features, How It Works, CTA)
- ✅ Email address shows your actual email
- ✅ Copy button works
- ✅ Smooth scrolling works
- ✅ Responsive on mobile (test with DevTools)

---

### Step 5: Deploy to Vercel (Recommended)

**Why Vercel?**
- Zero-config deployment for Next.js
- Automatic HTTPS and CDN
- Free tier is generous
- Preview deployments for every commit

#### 5.1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel

#### 5.2: Push to GitHub (If Not Already)

```bash
# From repository root
git add .
git commit -m "Add Next.js landing page"
git push origin main
```

#### 5.3: Import Project

1. In Vercel dashboard, click **"Add New Project"**
2. Select **"Import Git Repository"**
3. Choose your `llmbox` repository
4. Vercel will detect Next.js automatically

#### 5.4: Configure Build Settings

**⚠️ CRITICAL STEP:**

Set **Root Directory** to: `web`

Other settings (auto-detected):
- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

#### 5.5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. ✅ Your site is live!

**You'll get a URL like:**
```
https://llmbox-abc123.vercel.app
```

---

### Step 6: Add Custom Domain (Optional)

If you want `llmbox.com` instead of `llmbox-abc123.vercel.app`:

#### 6.1: Purchase Domain

Popular registrars:
- **Namecheap** - Good prices, easy to use
- **Google Domains** - Simple interface
- **Cloudflare** - Best pricing
- **GoDaddy** - Popular choice

Cost: ~$10-20/year

#### 6.2: Add Domain to Vercel

1. In Vercel, go to your project
2. Click **Settings** → **Domains**
3. Click **"Add"**
4. Enter your domain: `llmbox.com`

#### 6.3: Configure DNS

Vercel will show you DNS records to add. In your domain registrar:

**Add A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**Add CNAME for www:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### 6.4: Wait for DNS Propagation

- **Time:** 1-24 hours (usually < 1 hour)
- **Check:** [whatsmydns.net](https://www.whatsmydns.net)
- **SSL:** Vercel auto-provisions SSL certificate

---

## 🎯 Quick Checklist

### Before Deploying:
- [ ] Node.js installed (`node --version`)
- [ ] Dependencies installed (`deno task web:install`)
- [ ] Email addresses updated in components
- [ ] Tested locally (`deno task web:dev`)
- [ ] Everything looks good at `http://localhost:3000`

### Deploying:
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Root directory set to `web` ⚠️
- [ ] Deployment successful
- [ ] Site accessible at Vercel URL

### Post-Deploy (Optional):
- [ ] Custom domain purchased
- [ ] DNS records configured
- [ ] Domain verified in Vercel
- [ ] SSL certificate active (🔒 in browser)
- [ ] Update email address in SendGrid to match domain

---

## 🛠️ Troubleshooting

### "Cannot find module" error

**Solution:**
```bash
cd web
rm -rf node_modules package-lock.json
npm install
```

### Build fails on Vercel

**Check:**
1. Root directory is set to `web`
2. Build logs for specific errors
3. All dependencies are in `package.json`

### Page is blank after deployment

**Check:**
1. Browser console for JavaScript errors (F12)
2. Ensure `'use client'` is in `page.tsx`
3. Verify all components are exported correctly

### Styles not showing

**Solution:**
1. Verify `tailwind.config.ts` is in `web/` directory
2. Verify `postcss.config.js` is in `web/` directory
3. Rebuild: `npm run build`

### Custom domain not working

**Check:**
1. DNS records are correct
2. Wait 24-48 hours for propagation
3. Check [whatsmydns.net](https://www.whatsmydns.net)
4. Clear browser cache

---

## 📚 Additional Resources

### Documentation
- **Full Deployment Guide:** [docs/WEB-DEPLOYMENT.md](docs/WEB-DEPLOYMENT.md)
- **Web App README:** [web/README.md](web/README.md)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)

### Available Commands

From repository root:
```bash
deno task web:install      # Install dependencies
deno task web:dev          # Run dev server
deno task web:build        # Build for production
deno task web:start        # Start production server
deno task web:lint         # Lint code
deno task web:type-check   # Type check
```

From `web/` directory:
```bash
npm install        # Install dependencies
npm run dev        # Run dev server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Lint code
npm run type-check # Type check
```

---

## ❓ Need Help?

### For Setup/Deployment Issues:
- Check [docs/WEB-DEPLOYMENT.md](docs/WEB-DEPLOYMENT.md) (comprehensive troubleshooting)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Next.js Discord: [nextjs.org/discord](https://nextjs.org/discord)

### For Code Issues:
- Check [web/README.md](web/README.md)
- Open an issue in the repository

### For Email Service Issues:
- Check main [README.md](README.md)
- Review [docs/WHAT-YOU-NEED-TO-DO.md](docs/WHAT-YOU-NEED-TO-DO.md)

---

## 🎉 Success!

Once deployed, you'll have a beautiful landing page at:
- **Vercel URL:** `https://llmbox-abc123.vercel.app`
- **Custom Domain:** `https://llmbox.com` (if configured)

**Share it with your users and start getting emails!** 📧✨

---

## 📝 Summary

**Time Required:**
- Installing dependencies: 2 minutes
- Updating email addresses: 5 minutes
- Testing locally: 5 minutes
- Deploying to Vercel: 5 minutes
- **Total:** ~15-20 minutes

**Plus (if using custom domain):**
- DNS configuration: 10 minutes
- DNS propagation: 1-24 hours (wait time)

**Cost:**
- **Vercel hosting:** Free (generous free tier)
- **Custom domain:** ~$10-20/year (optional)

**No credit card required** for Vercel free tier!

---

**Ready to deploy?** Start with Step 1! 🚀

