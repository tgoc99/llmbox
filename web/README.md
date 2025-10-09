# LLMBox Landing Page

Beautiful, modern landing page for the LLMBox email-to-AI service.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS 3
- **Icons:** Lucide React
- **Deployment:** Vercel (recommended)

## Quick Start

### Install Dependencies

```bash
# From repository root
deno task web:install

# Or from web directory
npm install
```

### Run Development Server

```bash
# From repository root
deno task web:dev

# Or from web directory
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# From repository root
deno task web:build

# Or from web directory
npm run build
```

### Start Production Server

```bash
# From repository root
deno task web:start

# Or from web directory
npm start
```

## Project Structure

```
web/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main landing page
│   └── globals.css         # Global styles & Tailwind
├── components/
│   ├── Hero.tsx            # Hero section
│   ├── Features.tsx        # Features grid
│   ├── HowItWorks.tsx      # How it works section
│   └── CTA.tsx             # Call-to-action section
├── public/                 # Static assets (add images here)
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind config
├── next.config.js          # Next.js config
└── postcss.config.js       # PostCSS config
```

## Customization

### Update Email Address

Replace `assistant@yourdomain.com` in:

- `components/Hero.tsx`
- `components/CTA.tsx`

### Update Links

Replace GitHub/documentation links in:

- `components/CTA.tsx`
- `app/page.tsx` (footer)

### Change Colors

Edit the color scheme in `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    // Change these values
    500: '#8b5cf6',
    600: '#7c3aed',
    // etc.
  },
}
```

### Add Images

1. Add images to `public/` directory
2. Reference in components: `<img src="/logo.png" alt="Logo" />`
3. Or use Next.js Image: `<Image src="/logo.png" width={200} height={50} alt="Logo" />`

### Modify Content

All content is in the component files:

- **Hero:** `components/Hero.tsx`
- **Features:** `components/Features.tsx` (edit the `features` array)
- **How It Works:** `components/HowItWorks.tsx` (edit the `steps` array)
- **CTA:** `components/CTA.tsx`

## Available Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start development server |
| `npm run build`      | Build for production     |
| `npm start`          | Start production server  |
| `npm run lint`       | Run ESLint               |
| `npm run type-check` | Check TypeScript types   |

## Deployment

See [../docs/WEB-DEPLOYMENT.md](../docs/WEB-DEPLOYMENT.md) for complete deployment guide.

### Quick Deploy to Vercel

1. Push to GitHub
2. Import project to Vercel
3. Set root directory to `web`
4. Deploy!

## Features

- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Accessible (semantic HTML, ARIA labels)
- ✅ SEO optimized (metadata, Open Graph, Twitter Cards)
- ✅ Fast loading (Next.js optimizations)
- ✅ Modern design (gradient backgrounds, smooth animations)
- ✅ Copy-to-clipboard functionality
- ✅ Smooth scroll navigation
- ✅ Email threading example

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

Target Lighthouse scores:

- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## License

Same as parent repository.
