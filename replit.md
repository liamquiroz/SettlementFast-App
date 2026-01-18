# SettlementFast Mobile App

## Overview

SettlementFast is a React Native (Expo) mobile application that helps users discover and track class action settlements. The app connects to an existing production backend API at settlementfast.com and provides a polished, App Store-ready experience for browsing settlements, checking eligibility, and managing claims.

The app follows a "Bloomberg meets Headspace" design philosophy - sophisticated information design with generous whitespace, typography-led hierarchy, and smooth purposeful animations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 (New Architecture enabled)
- **Navigation**: React Navigation v7 with nested stack and tab navigators
  - Root Stack Navigator handles authentication flow and modal screens
  - Main Tab Navigator with 4 tabs: Home, Browse, My Claims, Profile
  - Each tab has its own stack navigator for deep navigation
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Custom theme system with light/dark mode support, Montserrat font family
- **Animations**: React Native Reanimated for smooth, performant animations with spring physics

### Backend Architecture
- **Server**: Express.js running on port 5000
- **API Pattern**: Proxy server that forwards all `/api/*` requests to the production SettlementFast API (https://settlementfast.com)
- **Database**: PostgreSQL with Drizzle ORM (schema defined in `shared/schema.ts`)
- **Storage**: Currently uses in-memory storage for local user data, with Drizzle schema ready for PostgreSQL migration

### Authentication
- **Provider**: Supabase Auth with JWT tokens
- **Methods**: Email/password, magic link (passwordless), planned biometric support
- **Token Storage**: expo-secure-store for native, localStorage for web
- **Flow**: Tokens automatically refreshed via Supabase client, included in Authorization header for API calls

### Project Structure
```
client/           # React Native app code
  ├── components/ # Reusable UI components
  ├── contexts/   # React Context providers (Auth)
  ├── hooks/      # Custom hooks (useTheme, useScreenOptions)
  ├── lib/        # API client, Supabase client, query client
  ├── navigation/ # React Navigation setup
  └── screens/    # Screen components
server/           # Express backend
shared/           # Shared types and schemas (Drizzle)
```

### Path Aliases
- `@/` → `./client/`
- `@shared/` → `./shared/`

## External Dependencies

### Authentication & Backend Services
- **Supabase**: Authentication provider (Project ID: misxfwpxaukxdklqcxfq)
- **Production API**: https://settlementfast.com - main data source for settlements

### Database
- **PostgreSQL**: Primary database (requires DATABASE_URL environment variable)
- **Drizzle ORM**: Type-safe database queries and migrations

### Required Environment Variables
```
EXPO_PUBLIC_SUPABASE_URL=https://misxfwpxaukxdklqcxfq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=(from Supabase dashboard)
EXPO_PUBLIC_API_URL=https://settlementfast.com
DATABASE_URL=(PostgreSQL connection string)
```

### Key NPM Packages
- `@supabase/supabase-js` - Authentication
- `@tanstack/react-query` - Data fetching and caching
- `drizzle-orm` + `drizzle-zod` - Database ORM with validation
- `expo-secure-store` - Secure token storage
- `react-native-reanimated` - Animations
- `expo-haptics` - Haptic feedback
- `date-fns` - Date formatting