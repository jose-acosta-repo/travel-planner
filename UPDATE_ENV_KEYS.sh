#!/bin/bash
# Helper script to update .env.local with your Supabase keys
# Run this after copying your keys from Supabase Dashboard

echo "=== Update .env.local with Supabase Keys ==="
echo ""
echo "Get your keys from:"
echo "https://supabase.com/dashboard/project/xcfpljxmudfyhcxqxmjx/settings/api"
echo ""

read -p "Paste your ANON KEY (starts with eyJ...): " ANON_KEY
read -p "Paste your SERVICE ROLE KEY (starts with eyJ...): " SERVICE_KEY
read -p "Paste your JWT SECRET: " JWT_SECRET

# Update .env.local
sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" .env.local
sed -i '' "s|SUPABASE_JWT_SECRET=.*|SUPABASE_JWT_SECRET=$JWT_SECRET|" .env.local

echo ""
echo "✅ .env.local updated successfully!"
echo ""
echo "Now run: npm run dev"
