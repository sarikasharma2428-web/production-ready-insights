-- SRE Dashboard Schema Update - Part 5: Create incident_events table
CREATE TABLE IF NOT EXISTS public.incident_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'comment',
  message TEXT NOT NULL,
  author_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on incident_events
ALTER TABLE public.incident_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for incident_events
CREATE POLICY "Authenticated users can view incident events" 
ON public.incident_events 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert incident events" 
ON public.incident_events 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id ON public.incident_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_alerts_fired_at ON public.alerts(fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.logs(created_at DESC);