# 🏦 Nordea CreativeIQ

> Internal AI-powered Creative Intelligence Platform for Nordea's Marketing Team

## 🎯 Overview

Nordea CreativeIQ is an internal platform that helps Nordea's marketing team:

- **Analyze ads** with AI-powered brand fit, performance, and compliance scoring
- **Test creatives** with virtual customer personas before publishing
- **Generate copy** that follows Nordea's Tone of Voice
- **Plan campaigns** with budget forecasting and reach simulation
- **Localize content** for Nordic & Baltic markets (SE, DK, NO, FI, EE, LT)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- OpenAI API key (or Anthropic)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your keys to .env.local
# Then run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Login

Use any `@nordea.com` email address (e.g., `test@nordea.com`)

## 📁 Project Structure

```
/app
  /(auth)/login          # Nordea-branded login
  /(dashboard)           # Main app
    /ad-studio           # Creative analysis + focus groups
    /copy-studio         # AI copy generation
    /campaign-planner    # Budget & forecasting
    /localization        # Nordic market adaptation
    /personas            # Customer persona library
/components              # Reusable UI components
/lib                     # Utilities, AI clients, Supabase
/public
  /fonts                 # Nordea Sans (add manually)
  /images                # Logos and brand assets
```

## 🎨 Brand Assets

Add these files manually:

```
/public/fonts/
  NordeaSans-Regular.woff2
  NordeaSans-Medium.woff2
  NordeaSans-Bold.woff2

/public/images/
  nordea-logo.svg
  nordea-logo-white.svg
```

The app will use fallback fonts/placeholders if these are missing.

## 📖 Documentation

- [CLAUDE.md](./CLAUDE.md) - Quick reference for AI assistants
- [NORDEA-CREATIVEIQ-SPEC.md](./NORDEA-CREATIVEIQ-SPEC.md) - Full technical specification

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **AI:** OpenAI GPT-4 / Claude
- **Deployment:** Vercel

## 📝 License

Internal Nordea tool - Not for distribution.
