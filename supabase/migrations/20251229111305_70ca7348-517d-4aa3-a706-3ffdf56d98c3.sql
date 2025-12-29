-- SRE Dashboard Schema Update - Part 1: Services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS uptime NUMERIC DEFAULT 99.9;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS latency_p50 INTEGER DEFAULT 0;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS requests_per_second INTEGER DEFAULT 0;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ DEFAULT now();