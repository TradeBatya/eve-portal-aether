-- Create intel reports table for tracking hostile activity
CREATE TABLE public.intel_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  system_name TEXT NOT NULL,
  region_name TEXT,
  hostiles_count INTEGER DEFAULT 1,
  hostile_corps TEXT[],
  ship_types TEXT[],
  activity_type TEXT NOT NULL, -- 'gateCamp', 'roaming', 'cynoBeacon', 'structure', 'mining', 'ratting', 'other'
  threat_level TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '2 hours'),
  
  CONSTRAINT valid_threat_level CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_activity_type CHECK (activity_type IN ('gateCamp', 'roaming', 'cynoBeacon', 'structure', 'mining', 'ratting', 'other'))
);

-- Enable RLS
ALTER TABLE public.intel_reports ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active intel reports
CREATE POLICY "Authenticated users can view active intel"
  ON public.intel_reports FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Authenticated users can create intel reports
CREATE POLICY "Authenticated users can create intel"
  ON public.intel_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Users can update their own reports
CREATE POLICY "Users can update their own intel"
  ON public.intel_reports FOR UPDATE
  USING (auth.uid() = reported_by);

-- Admins can manage all intel reports
CREATE POLICY "Admins can manage all intel"
  ON public.intel_reports FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_intel_reports_updated_at
  BEFORE UPDATE ON public.intel_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_intel_reports_active ON public.intel_reports(is_active, expires_at) WHERE is_active = true;
CREATE INDEX idx_intel_reports_system ON public.intel_reports(system_name);
CREATE INDEX idx_intel_reports_created_at ON public.intel_reports(created_at DESC);