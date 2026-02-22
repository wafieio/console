# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wafie Console** is a Kubernetes-native Web Application and API Security Platform dashboard built with Next.js 16 and React 19. It provides a web interface for managing application security, threat detection, and API protection for Kubernetes applications.

## Development Commands

```bash
# Start development server
npm run dev                    # Opens at http://localhost:3000

# Production build
npm run build
npm start

# Linting
npm run lint
```

## Environment Setup

Create `.env.local` with:
```bash
WAFIE_API_HOST=http://your-wafie-api-host
```

The application forwards API requests from Next.js routes to the external Wafie backend API specified in `WAFIE_API_HOST`.

## Architecture Overview

### Technology Stack
- **Next.js 16.1.6** with App Router (app directory structure)
- **React 19.2.3** with TypeScript 5
- **Tailwind CSS 4** with **DaisyUI 5.5.16** for components
- **React Icons 5.5.0** for UI icons

### Core Application Structure

**Multi-Layer Dashboard Architecture:**

1. **Layout Layer** (`app/components/dashboard/`)
   - `DashboardLayout.tsx` - Root wrapper with responsive drawer navigation
   - `TopNavbar.tsx` - Breadcrumb navigation with dynamic app name fetching
   - `SideMenu.tsx` - Main navigation (Overview, Discovery, Settings)

2. **Application Layer** (`app/components/application/`)
   - `ApplicationLayout.tsx` - Per-application wrapper
   - `ApplicationSideMenu.tsx` - Security feature navigation per app
   - Feature-specific components for security management

3. **API Proxy Pattern** (`app/api/`)
   - All routes follow: Client → Next.js Route → External Wafie API
   - Service-oriented endpoints: `wafie.v1.ApplicationService`, `wafie.v1.ProtectionService`, etc.
   - Routes in `/api/wafie.v1.{Service}/{Method}/route.ts` format

### Key Features & Pages

**Main Navigation:**
- **Overview** (`/overview`) - Security dashboard with status cards
- **Discovery** (`/discovery`) - Kubernetes application discovery and protection status
- **Settings** (`/settings`) - Security and network configuration

**Per-Application Security Management** (`/applications/[id]/`):
- **Overview** - Protection toggle and status
- **Client IP** - Client IP filtering configuration
- **AntiBot** - Bot detection settings
- **Basic Auth** - Basic authentication setup
- **Token Auth** - Token-based authentication
- **IP Rules** - IP-based access control

### Data Models

Key TypeScript interfaces in `app/types/`:

```typescript
interface Application {
  id: number;
  name: string;
  ingress: Ingress[];
}

interface ProtectionResponse {
  protection: {
    id: number;
    applicationId: number;
    protectionMode: 'PROTECTION_MODE_ON' | 'PROTECTION_MODE_OFF';
    desiredState: {
      ipRules: object;
      auth: { basicAuth: object; tokenAuth: object };
      antiBot: { captchaV2: object };
    };
  };
}
```

## Development Patterns

### Component Architecture
- Most components are client components (`'use client'`) due to interactivity
- React hooks (useState, useEffect) for local state management
- No global state management library used
- Async data fetching with loading and error states

### Routing & Navigation
- Uses Next.js 15+ pattern with Promise-based params and `use()` hook
- Dynamic routes with `[id]` segments for applications
- Breadcrumb navigation automatically fetches application names via API

### API Integration
- API routes proxy requests to external Wafie backend
- Error handling with proper HTTP status codes
- Loading states and user feedback throughout the UI

### Styling Approach
- Tailwind CSS utility classes throughout
- DaisyUI components for consistent UI elements
- Dark theme as default
- Responsive design with mobile drawer pattern

## Development Guidelines

### Code Organization
- Features organized by route structure in `app/` directory
- Reusable components in `app/components/`
- Type definitions in `app/types/`
- Keep components focused and single-purpose

### API Development
- Follow the existing proxy pattern for new API endpoints
- Use proper TypeScript interfaces for request/response types
- Include error handling and loading states in components

### UI/UX Consistency
- Use DaisyUI components for consistency
- Follow existing responsive patterns (drawer navigation for mobile)
- Include loading skeletons and error states for better UX

## Project Context

This project recently completed a v2 refactor (latest commit: "refactored is done for v2"). The codebase contains a `prompts/` directory with Claude-generated specifications for different features, indicating this project was developed with AI assistance and has clear feature specifications.

The application serves as a dashboard for the broader Wafie security platform, focusing on Kubernetes application discovery and security management through an intuitive web interface.