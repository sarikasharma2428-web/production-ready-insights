-- SRE Dashboard Schema Update - Part 2: Alerts table
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS metric_name TEXT DEFAULT 'cpu_usage';

ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS fired_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS silenced_until TIMESTAMPTZ;

-- Copy existing data
UPDATE public.alerts SET name = title WHERE name IS NULL;
UPDATE public.alerts SET message = description WHERE message IS NULL;
UPDATE public.alerts SET fired_at = created_at WHERE fired_at IS NULL;