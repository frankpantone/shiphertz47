-- TEMPORARY FIX: Disable RLS for profiles table to test signup
-- This is for testing only - we'll add proper policies back later

-- Disable RLS on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- You can also run this to see current RLS status:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles'; 