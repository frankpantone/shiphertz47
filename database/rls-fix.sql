-- Fix RLS policy for profiles table to allow user signup
-- This allows users to create their own profile during signup

CREATE POLICY "Users can create their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Also ensure users can read their own profile during signup/login process
-- (This might already exist, but adding for completeness)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id); 