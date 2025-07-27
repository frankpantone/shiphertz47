-- Migration: Add support for multiple vehicles per transportation request
-- Run this in Supabase Dashboard → SQL Editor

-- Create vehicles table to support multiple VINs per request
CREATE TABLE vehicles (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  transportation_request_id UUID NOT NULL REFERENCES transportation_requests(id) ON DELETE CASCADE,
  vin_number TEXT NOT NULL,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_type TEXT,
  vehicle_trim TEXT,
  vehicle_engine TEXT,
  nhtsa_data JSONB, -- Store full NHTSA response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX vehicles_transportation_request_id_idx ON vehicles(transportation_request_id);
CREATE INDEX vehicles_vin_number_idx ON vehicles(vin_number);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles table
CREATE POLICY "Users can view vehicles for their requests"
ON vehicles FOR SELECT
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM transportation_requests tr 
    WHERE tr.id = vehicles.transportation_request_id 
    AND tr.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert vehicles for their requests"
ON vehicles FOR INSERT
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM transportation_requests tr 
    WHERE tr.id = vehicles.transportation_request_id 
    AND tr.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all vehicles"
ON vehicles FOR ALL
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Update trigger for vehicles
CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at_trigger
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicles_updated_at();

-- Optional: Migrate existing vehicle data from transportation_requests
-- This will copy any existing single vehicle data to the new vehicles table
INSERT INTO vehicles (transportation_request_id, vin_number, vehicle_make, vehicle_model, vehicle_year)
SELECT 
  id as transportation_request_id,
  vin_number,
  vehicle_make,
  vehicle_model,
  vehicle_year
FROM transportation_requests 
WHERE vin_number IS NOT NULL AND vin_number != '';

-- Note: After running this migration and testing, you can optionally remove 
-- the old vehicle columns from transportation_requests table:
-- ALTER TABLE transportation_requests DROP COLUMN vin_number;
-- ALTER TABLE transportation_requests DROP COLUMN vehicle_make;
-- ALTER TABLE transportation_requests DROP COLUMN vehicle_model;
-- ALTER TABLE transportation_requests DROP COLUMN vehicle_year; 