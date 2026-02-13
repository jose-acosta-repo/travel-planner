# Environment Setup Guide

## Quick Fix for "Invalid supabaseUrl" Error

Your .env.local file needs real Supabase credentials. Follow these steps:

### 1. Get Supabase Credentials

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Click **Settings** → **API**

You'll need these values:
- **Project URL** (looks like: https://xxxxxxxxxxxxx.supabase.co)
- **anon public** key (starts with: eyJ...)
- **service_role** key (starts with: eyJ... - keep secret!)

4. Scroll down to **JWT Settings**
- **JWT Secret** (long string)

### 2. Update .env.local

Open your .env.local file and replace the placeholder values:

```bash
# Supabase - REPLACE THESE WITH YOUR ACTUAL VALUES
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase

# NextAuth - GENERATE A SECRET
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run: openssl rand -base64 32

# The rest are optional for now - you can add them later
```

### 3. Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Copy the output and paste it as your NEXTAUTH_SECRET value.

### 4. Restart Your Dev Server

After updating .env.local:
```bash
npm run dev
```

The error should be fixed!

---

## What if I don't have a Supabase project?

### Create a New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: travel-planner
   - **Database Password**: (create a strong password - save it!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for project setup
6. Follow steps above to get credentials

### Run Database Migrations

After creating your project, you need to set up the database:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run the migration files in order:
   - `supabase/schema.sql` (main schema)
   - `update_trip_type_enum.sql` (trip types)
   - Any other .sql files in `supabase/migrations/`

Or copy/paste the SQL from these files into the SQL Editor and execute.

---

## Testing

After setup, test your connection:
1. Start dev server: `npm run dev`
2. Visit: http://localhost:3000
3. You should see the login page without errors
4. Try logging in with Google (if configured) or email magic link

---

## Troubleshooting

**Still getting "Invalid supabaseUrl" error?**
- Check that NEXT_PUBLIC_SUPABASE_URL starts with https://
- Make sure there are no quotes around the URL
- Restart your dev server after changing .env.local

**"Invalid API key" error?**
- Double-check you copied the anon key (not service_role key)
- Make sure there are no extra spaces

**Need help?**
- Check if your Supabase project is running (not paused)
- Verify the URL in browser - it should load Supabase Studio
