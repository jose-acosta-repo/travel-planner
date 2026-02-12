# TripPlanner - Travel Itinerary SaaS

A Next.js 14 SaaS application for creating, sharing, and collaborating on travel itineraries with AI-powered image recognition.

## Features

- **User Authentication**: Google OAuth and email/password login via NextAuth.js
- **Trip Management**: Create personal and business trips with dates, destinations, and descriptions
- **Day-by-Day Itinerary**: Organize activities by day with time slots and categories
- **AI Image Recognition**: Upload photos of tickets, reservations, or brochures - GPT-4 Vision extracts details automatically
- **Real-time Collaboration**: Invite collaborators with editor/viewer roles
- **Public Sharing**: Generate shareable links for read-only access to itineraries

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 Vision
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query + Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google OAuth credentials (optional)
- OpenAI API key

### 1. Clone and Install

```bash
cd travel-planner
npm install
```

### 2. Configure Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for development)
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `OPENAI_API_KEY` - Your OpenAI API key

Optional (for Google OAuth):
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
travel-planner/
├── app/
│   ├── (auth)/           # Auth pages (login, register)
│   ├── (dashboard)/      # Protected dashboard pages
│   ├── api/              # API routes
│   ├── share/            # Public share pages
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── trips/            # Trip-related components
│   ├── itinerary/        # Itinerary components
│   ├── ai/               # AI feature components
│   ├── collaboration/    # Collaboration components
│   └── layout/           # Layout components
├── lib/
│   ├── supabase/         # Supabase client utilities
│   ├── auth/             # Auth configuration
│   ├── openai/           # OpenAI integration
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript types
└── supabase/
    └── schema.sql        # Database schema
```

## API Routes

### Trips
- `GET /api/trips` - List user's trips
- `POST /api/trips` - Create a new trip
- `GET /api/trips/[tripId]` - Get trip details
- `PATCH /api/trips/[tripId]` - Update trip
- `DELETE /api/trips/[tripId]` - Delete trip

### Itinerary Items
- `GET /api/trips/[tripId]/items` - List trip items
- `POST /api/trips/[tripId]/items` - Add item
- `PATCH /api/trips/[tripId]/items/[itemId]` - Update item
- `DELETE /api/trips/[tripId]/items/[itemId]` - Delete item

### Collaborators
- `GET /api/trips/[tripId]/collaborators` - List collaborators
- `POST /api/trips/[tripId]/collaborators` - Invite collaborator
- `DELETE /api/trips/[tripId]/collaborators/[collaboratorId]` - Remove collaborator

### AI
- `POST /api/ai/extract` - Extract activities from image

## Activity Categories

- `flight` - Flights and air travel
- `hotel` - Accommodations
- `restaurant` - Dining
- `activity` - Tours, attractions, experiences
- `transport` - Ground transportation
- `meeting` - Business meetings
- `other` - Everything else

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Railway
- Render
- AWS Amplify
- Self-hosted with Docker

## License

MIT
