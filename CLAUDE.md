# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Wafie Console**, a Next.js 16.1.6 web application built with TypeScript, Tailwind CSS v4, and DaisyUI v5.
Wafie Console - is a Kubernetes Native Web Application and API security platform.

## Development Commands

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture & Key Patterns

### App Router Structure
- Uses Next.js App Router (not Pages Router)
- Main application code in `app/` directory
- Root layout at `app/layout.tsx` with global metadata and theme setup
- Home page at `app/page.tsx`

### Styling Architecture
- **Tailwind CSS v4** with new `@tailwindcss/postcss` plugin system
- **DaisyUI v5.5.16** component library for pre-built UI components
- Global styles in `app/globals.css`
- Default theme: "cupcake" (set in `data-theme` attribute)
- Available themes: light, dark, cupcake, retro

### TypeScript Configuration
- Strict mode enabled
- Path alias `@/*` maps to root directory
- JSX set to `react-jsx` (no import React needed)
- Uses React 19 and latest TypeScript 5 features

### Code Quality
- ESLint v9 with flat config format (`eslint.config.mjs`)
- Next.js specific rules including core web vitals
- TypeScript integration with Next.js linting rules

## Important Implementation Notes

### UI Components
- Use DaisyUI component classes (e.g., `btn`, `card`, `card-body`, `btn-primary`)
- Components are styled with utility-first Tailwind approach
- Current implementation shows buttons and cards as primary UI patterns

### Theme System
- DaisyUI theme is set globally in root layout via `data-theme="cupcake"`
- Theme can be changed by modifying the `data-theme` attribute
- Custom CSS variables available through DaisyUI theme system

### No Testing Framework
- Project currently has no testing setup (Jest, React Testing Library, etc.)
- No test files or test scripts configured

### Dependencies Management
- Uses npm (not yarn, pnpm, or bun based on lock file)
- All dependencies are pinned to specific versions
- Modern browser support only (`"> 1%"` in browserslist)

## File Structure Context

```
app/
├── layout.tsx          # Root layout with theme and metadata
├── page.tsx           # Home page component
├── globals.css        # Global styles with Tailwind directives
└── favicon.ico        # Site icon

Configuration files:
├── next.config.ts     # Next.js configuration (minimal)
├── tsconfig.json      # TypeScript configuration
├── eslint.config.mjs  # ESLint v9 flat config
└── postcss.config.mjs # PostCSS with Tailwind v4 plugin
```

## Development Workflow

1. Start with `npm run dev` for hot reloading
2. Edit `app/page.tsx` for home page changes
3. Add new pages as files in `app/` directory
4. Use DaisyUI components with Tailwind utilities
5. Run `npm run lint` before committing
6. Build with `npm run build` for production deployment

## Current State

The project is in early development with basic DaisyUI components (buttons, cards) implemented on the home page. The layout includes a "cupcake" theme and is ready for dashboard/console UI development.