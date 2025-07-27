-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'quoted', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('credit_card', 'ach', 'check');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    company_name TEXT,
    role user_role DEFAULT 'customer' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transportation requests table
CREATE TABLE public.transportation_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Pickup information
    pickup_company_name TEXT NOT NULL,
    pickup_company_address TEXT NOT NULL,
    pickup_company_lat DECIMAL(10, 8),
    pickup_company_lng DECIMAL(11, 8),
    pickup_contact_name TEXT NOT NULL,
    pickup_contact_phone TEXT NOT NULL,
    
    -- Delivery information
    delivery_company_name TEXT NOT NULL,
    delivery_company_address TEXT NOT NULL,
    delivery_company_lat DECIMAL(10, 8),
    delivery_company_lng DECIMAL(11, 8),
    delivery_contact_name TEXT NOT NULL,
    delivery_contact_phone TEXT NOT NULL,
    
    -- Vehicle information
    vin_number TEXT NOT NULL,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year INTEGER,
    
    -- Order management
    status order_status DEFAULT 'pending' NOT NULL,
    assigned_admin_id UUID REFERENCES public.profiles(id),
    priority INTEGER DEFAULT 0,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document attachments table
CREATE TABLE public.document_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transportation_request_id UUID REFERENCES public.transportation_requests(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes table
CREATE TABLE public.quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transportation_request_id UUID REFERENCES public.transportation_requests(id) ON DELETE CASCADE NOT NULL,
    admin_id UUID REFERENCES public.profiles(id) NOT NULL,
    
    -- Quote details
    base_price DECIMAL(10, 2) NOT NULL,
    fuel_surcharge DECIMAL(10, 2) DEFAULT 0,
    additional_fees DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Quote information
    estimated_pickup_date DATE,
    estimated_delivery_date DATE,
    terms_and_conditions TEXT,
    notes TEXT,
    
    -- Quote status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transportation_request_id UUID REFERENCES public.transportation_requests(id) ON DELETE CASCADE NOT NULL,
    quote_id UUID REFERENCES public.quotes(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_status payment_status DEFAULT 'pending' NOT NULL,
    
    -- External payment references
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    ach_transaction_id TEXT,
    
    -- Payment metadata
    payment_date TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order activity log table
CREATE TABLE public.order_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transportation_request_id UUID REFERENCES public.transportation_requests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id),
    activity_type TEXT NOT NULL, -- 'created', 'quoted', 'assigned', 'status_changed', 'payment_received', etc.
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transportation_requests_user_id ON public.transportation_requests(user_id);
CREATE INDEX idx_transportation_requests_status ON public.transportation_requests(status);
CREATE INDEX idx_transportation_requests_assigned_admin ON public.transportation_requests(assigned_admin_id);
CREATE INDEX idx_transportation_requests_order_number ON public.transportation_requests(order_number);
CREATE INDEX idx_quotes_transportation_request_id ON public.quotes(transportation_request_id);
CREATE INDEX idx_quotes_admin_id ON public.quotes(admin_id);
CREATE INDEX idx_payments_transportation_request_id ON public.payments(transportation_request_id);
CREATE INDEX idx_order_activities_transportation_request_id ON public.order_activities(transportation_request_id);

-- Create sequence for order numbers
CREATE SEQUENCE public.order_number_seq START 1;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TRQ_' || nextval('public.order_number_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically generate order number on insert
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set order number
CREATE TRIGGER set_order_number_trigger
    BEFORE INSERT ON public.transportation_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transportation_requests_updated_at
    BEFORE UPDATE ON public.transportation_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_activities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Transportation requests policies
CREATE POLICY "Users can view their own requests" ON public.transportation_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests" ON public.transportation_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests" ON public.transportation_requests
    FOR UPDATE USING (
        auth.uid() = user_id AND status = 'pending'
    );

CREATE POLICY "Admins can view all requests" ON public.transportation_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Document attachments policies
CREATE POLICY "Users can view documents for their requests" ON public.document_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.transportation_requests tr
            WHERE tr.id = transportation_request_id AND tr.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upload documents to their requests" ON public.document_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transportation_requests tr
            WHERE tr.id = transportation_request_id AND tr.user_id = auth.uid()
        )
        AND auth.uid() = uploaded_by
    );

CREATE POLICY "Admins can view all documents" ON public.document_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Quotes policies
CREATE POLICY "Users can view quotes for their requests" ON public.quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.transportation_requests tr
            WHERE tr.id = transportation_request_id AND tr.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage quotes" ON public.quotes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Payments policies
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments for their requests" ON public.payments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.transportation_requests tr
            WHERE tr.id = transportation_request_id AND tr.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Order activities policies
CREATE POLICY "Users can view activities for their requests" ON public.order_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.transportation_requests tr
            WHERE tr.id = transportation_request_id AND tr.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all activities" ON public.order_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert activities" ON public.order_activities
    FOR INSERT WITH CHECK (true); 