# Step-by-Step Migration Guide

## Step 1: Verify Current Tables

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `verify_tables.sql`
6. Click **Run**

**Expected tables you should see:**
- `profiles`
- `trips`
- `trip_collaborators`

If you don't see these tables, there's a bigger issue we need to address first.

## Step 2: Check for Existing Migration Tables

Run this query to see if any of our new tables already exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('documents', 'messages', 'user_settings', 'calendar_events', 'checklist_items')
ORDER BY table_name;
```

If any of these tables already exist, we need to drop them first or skip creating them.

## Step 3: Apply the Migration

1. In Supabase SQL Editor, create a **New Query**
2. Copy ALL contents from `apply_migrations.sql` (lines 1-313)
3. Click **Run**
4. Look for any error messages in red at the bottom

**Common errors and solutions:**

### Error: "relation does not exist"
- **Cause:** The `trips` or `profiles` tables don't exist
- **Solution:** You need to run the base schema first (trips and profiles tables)

### Error: "table already exists"
- **Cause:** You've already run part of this migration
- **Solution:** Run this to see which tables exist, then modify the migration:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Error: "permission denied"
- **Cause:** You're not using the service role or proper admin access
- **Solution:** Make sure you're logged into the correct project in Supabase Dashboard

## Step 4: Verify Migration Success

After running the migration, verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('documents', 'messages', 'user_settings', 'calendar_events', 'checklist_items')
ORDER BY table_name;
```

You should see all 5 tables listed.

## Step 5: Test Checklist Creation

1. Go back to your app: http://localhost:3000
2. Navigate to any trip
3. Click the **Checklist** tab
4. Click **Add Task**
5. Fill in a task title
6. Click **Add Task**

The dialog should close and the task should appear in the list without any error alerts.

---

## If You're Still Getting Errors

Please copy the exact error message from the Supabase SQL Editor (the red text at the bottom after clicking Run) and share it. That will help me identify the specific issue.
