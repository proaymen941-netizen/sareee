# Al-Sarie One (السريع ون) - Food Delivery System

## Project Overview

A comprehensive food delivery management system with three user interfaces:
- **Customer App**: Browse restaurants, categories, and place orders
- **Admin Dashboard**: Manage restaurants, menu items, drivers, orders, and financial reports
- **Driver App**: Accept/manage deliveries, track earnings, and update availability

A "4-click" security feature on the app logo reveals hidden links to Admin and Driver interfaces.

## Architecture

### Frontend
- **React 18** + **TypeScript**
- **Vite** build tool
- **Tailwind CSS** + **Radix UI** components
- **TanStack Query** for data fetching
- **Wouter** for routing
- **Framer Motion** for animations
- **Google Maps API** + **Leaflet** for maps

### Backend
- **Node.js** + **Express.js** (TypeScript)
- **PostgreSQL** via Replit's managed database
- **Drizzle ORM** for schema and queries
- **Passport.js** for authentication
- **Socket.io/ws** for real-time order tracking

## Project Structure

```
├── client/          # React frontend
│   └── src/
│       ├── components/  # UI components (includes ui/ for Radix)
│       ├── pages/       # Customer, Admin, Driver pages
│       ├── context/     # React Contexts (Auth, Cart, Theme)
│       └── lib/         # Client utilities
├── server/          # Express backend
│   ├── routes/      # API routes (admin, driver, customer)
│   ├── services/    # Business logic
│   ├── db.ts        # DatabaseStorage class with Drizzle
│   ├── storage.ts   # IStorage interface
│   └── index.ts     # Server entry point
├── shared/          # Shared code
│   └── schema.ts    # Drizzle ORM schema + Zod types
└── drizzle/         # Database migrations
```

## Development

The app runs as a unified server (Express + Vite middleware) on port 5000.

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run db:push    # Push schema changes to database
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection (Replit managed)
- `SESSION_SECRET` - Express session secret (Replit secret)
- `NODE_ENV` - Environment mode
- `PORT` - Server port (default: 5000)

## Deployment

Configured for autoscale deployment:
- **Build**: `npm run build`
- **Run**: `node dist/index.js`

## Default Credentials

The database is seeded with default data including:
- Admin users (see server/seed.ts for credentials)
- Sample categories, restaurants, and menu items
- UI settings
