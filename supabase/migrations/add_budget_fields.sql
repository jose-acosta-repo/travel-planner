-- Add budget-related fields to trips table

alter table public.trips
  add column if not exists total_budget decimal(10, 2) default 0,
  add column if not exists member_budgets jsonb default '{}',
  add column if not exists category_goals jsonb default '{}',
  add column if not exists split_method text default 'budget-proportion',
  add column if not exists custom_split_percentages jsonb default '{}';

-- Add comments for documentation
comment on column public.trips.total_budget is 'Total budget for the trip';
comment on column public.trips.member_budgets is 'Budget allocations per member (JSON: {"memberName": amount})';
comment on column public.trips.category_goals is 'Budget goals per category (JSON: {"categoryKey": amount})';
comment on column public.trips.split_method is 'Method for splitting costs: even-split, budget-proportion, or custom-percentage';
comment on column public.trips.custom_split_percentages is 'Custom split percentages per member (JSON: {"memberName": percentage})';
