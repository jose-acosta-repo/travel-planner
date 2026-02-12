-- Create user_settings table to store user preferences and security settings
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text,
  currency text default 'USD',
  timezone text default 'GMT-08:00',
  password_last_changed timestamptz,
  two_factor_enabled boolean default false,
  two_factor_method text check (two_factor_method in ('sms', 'authenticator', null)),
  two_factor_phone text,
  google_calendar_connected boolean default false,
  google_calendar_refresh_token text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Ensure one settings record per user
  unique(user_id)
);

-- Add RLS policies for user_settings
alter table public.user_settings enable row level security;

-- Users can only view their own settings
create policy "Users can view their own settings"
  on public.user_settings for select
  using (user_id = auth.uid());

-- Users can insert their own settings
create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (user_id = auth.uid());

-- Users can update their own settings
create policy "Users can update their own settings"
  on public.user_settings for update
  using (user_id = auth.uid());

-- Add index for performance
create index if not exists user_settings_user_id_idx on public.user_settings(user_id);

-- Add comments for documentation
comment on table public.user_settings is 'User preferences and security settings';
comment on column public.user_settings.password_last_changed is 'When the user last changed their password';
comment on column public.user_settings.two_factor_enabled is 'Whether 2FA is enabled for this user';
comment on column public.user_settings.two_factor_method is 'Method for 2FA: sms or authenticator';
comment on column public.user_settings.google_calendar_connected is 'Whether Google Calendar integration is active';
