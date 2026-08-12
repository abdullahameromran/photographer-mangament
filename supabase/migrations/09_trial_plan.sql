alter table public.subscriptions drop constraint if exists subscriptions_plan_code_check;
alter table public.subscriptions add constraint subscriptions_plan_code_check
  check (plan_code in ('trial','monthly','quarterly','yearly'));
