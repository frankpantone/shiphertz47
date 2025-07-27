# Auto Logistics Platform

A comprehensive transportation request system for auto logistics companies, built with Next.js, Supabase, and modern web technologies.

## Features

- **User Authentication**: Secure signup/login with Supabase Auth
- **Transportation Requests**: Complete form system with address validation
- **Admin Dashboard**: Role-based access for quote management
- **Order Management**: Assignment system with order tracking (TRQ_X format)
- **Payment Processing**: Stripe integration for credit cards and ACH payments
- **Document Upload**: Secure file attachment system
- **API Integrations**: Google Maps for address validation, NHTSA for VIN verification

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe
- **APIs**: Google Maps, NHTSA
- **Deployment**: Vercel (recommended)

## Quick Start

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Fill in your API keys and configuration
   ```

3. **Database Setup**
   - Create a new Supabase project
   - Run the SQL scripts in `/database/schema.sql`
   - Configure RLS policies

4. **Development**
   ```bash
   npm run dev
   ```

## Project Structure

```
├── app/                    # Next.js app directory
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
├── database/              # Database schema and migrations
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## API Keys Required

1. **Supabase**: Database and authentication
2. **Google Maps**: Address validation and geocoding
3. **Stripe**: Payment processing
4. **NHTSA**: VIN number validation (usually free)

## Deployment

1. Deploy to Vercel or your preferred platform
2. Configure environment variables
3. Set up Stripe webhooks
4. Configure Supabase RLS policies

## Development Phases

- **Phase 1**: Project setup and authentication ✅
- **Phase 2**: Transportation request form
- **Phase 3**: Admin dashboard foundation
- **Phase 4**: Quote management system
- **Phase 5**: Payment integration
- **Phase 6**: Polish and advanced features 