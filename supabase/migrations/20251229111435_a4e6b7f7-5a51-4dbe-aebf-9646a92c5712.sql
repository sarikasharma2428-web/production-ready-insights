-- SRE Dashboard Schema Update - Part 4: Create metrics table
CREATE TABLE IF NOT EXISTS public.metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on metrics
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for metrics
CREATE POLICY "Authenticated users can view metrics" 
ON public.metrics 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert metrics" 
ON public.metrics 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_metrics_service_id ON public.metrics(service_id);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at ON public.metrics(recorded_at DESC);