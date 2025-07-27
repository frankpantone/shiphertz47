# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Architecture Overview

This is a **Next.js 14** auto logistics platform with **Supabase** backend, built for transportation request management between customers and admin staff.

### Core Technology Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Custom raw auth system (lib/auth-raw.ts) for admin reliability
- **Payments**: Stripe integration with webhook handling
- **APIs**: Google Maps (address validation), NHTSA (VIN verification)

### Authentication System
The project uses a **dual authentication approach**:
- **Standard Supabase Auth**: For customer-facing pages and general authentication
- **Raw Auth System**: For admin panel to prevent hanging/timeout issues (lib/auth-raw.ts, hooks/useRawAuth.ts)

Admin authentication bypasses Supabase client session management and uses direct API calls for reliability.

### Database Schema
Key tables in Supabase:
- `profiles`: User accounts with role-based access (customer/admin)
- `transportation_requests`: Main order/request entity with TRQ_X format order numbers
- `vehicles`: Multi-vehicle support (linked to transportation_requests)
- `attachments`: File uploads stored in Supabase Storage

### File Structure
- `app/`: Next.js app directory with route handlers
  - `admin/`: Admin dashboard with order management
  - `auth/`: Authentication pages
  - `api/`: API routes for Stripe, webhooks, profiles
- `components/`: Reusable UI components
- `lib/`: Utilities including auth, API integrations, Supabase config
- `database/`: SQL schemas and migrations
- `types/`: TypeScript definitions including database types

### Admin Panel Features
- **Order Management**: View, claim, assign, and update transportation requests
- **Multi-vehicle Support**: Handle multiple VINs per request with NHTSA validation
- **Status Tracking**: Pending → Quoted → Accepted → In Progress → Completed workflow
- **File Attachments**: PDF upload/download with Supabase Storage

### Key Implementation Details

#### Order Numbers
Uses format `TRQ_${timestamp}` for unique identification across the system.

#### VIN Processing
- Multi-VIN input component (components/MultiVinInput.tsx)
- NHTSA API integration for vehicle data validation (lib/nhtsa.ts)
- Supports multiple vehicles per transportation request

#### Payment Processing
- Stripe integration with webhook handling
- ACH and credit card support
- Payment intent creation and confirmation flow

#### Address Validation
- Google Maps integration for pickup/delivery addresses
- Geocoding and address standardization

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Testing Strategy
The project includes comprehensive testing plans:
- `TESTING_PLAN.md`: Full admin system validation
- `QUICK_TEST_CHECKLIST.md`: 5-minute validation for core functionality
- Focus on authentication reliability and order management workflow

### Known Technical Considerations
- Admin pages use raw authentication to prevent Supabase client hanging issues
- Multi-vehicle implementation is partially complete (see MULTI_VIN_COMPLETION_GUIDE.md)
- File upload system uses Supabase Storage with RLS policies
- Order assignment system supports admin role-based access control

### Development Workflow
1. Use raw authentication system for admin-related features
2. Test admin functionality with the quick test checklist
3. Follow existing patterns for new components (check existing components first)
4. Use TypeScript strictly with proper database type definitions
5. Implement proper error handling and user feedback (toast notifications)