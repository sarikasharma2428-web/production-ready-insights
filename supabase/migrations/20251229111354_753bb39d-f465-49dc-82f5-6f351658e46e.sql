-- SRE Dashboard Schema Update - Part 3: Incidents and SLOs
ALTER TABLE public.incidents
ADD COLUMN IF NOT EXISTS created_by UUID;

ALTER TABLE public.incidents
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

ALTER TABLE public.incidents
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- SLOs table
ALTER TABLE public.slos
ADD COLUMN IF NOT EXISTS target_latency_p99 INTEGER;

ALTER TABLE public.slos
ADD COLUMN IF NOT EXISTS current_latency_p99 INTEGER;

ALTER TABLE public.slos
ADD COLUMN IF NOT EXISTS error_budget NUMERIC;

ALTER TABLE public.slos
ADD COLUMN IF NOT EXISTS period TEXT DEFAULT '30d';

-- Copy existing values
UPDATE public.slos SET target_latency_p99 = latency_target WHERE target_latency_p99 IS NULL;
UPDATE public.slos SET current_latency_p99 = latency_current WHERE current_latency_p99 IS NULL;
UPDATE public.slos SET error_budget = error_budget_total WHERE error_budget IS NULL;