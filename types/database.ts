export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          company_name: string | null
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          company_name?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          company_name?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      transportation_requests: {
        Row: {
          id: string
          order_number: string
          user_id: string
          pickup_company_name: string
          pickup_company_address: string
          pickup_company_lat: number | null
          pickup_company_lng: number | null
          pickup_contact_name: string
          pickup_contact_phone: string
          delivery_company_name: string
          delivery_company_address: string
          delivery_company_lat: number | null
          delivery_company_lng: number | null
          delivery_contact_name: string
          delivery_contact_phone: string
          vin_number: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: number | null
          status: 'pending' | 'quoted' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled'
          assigned_admin_id: string | null
          priority: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          user_id: string
          pickup_company_name: string
          pickup_company_address: string
          pickup_company_lat?: number | null
          pickup_company_lng?: number | null
          pickup_contact_name: string
          pickup_contact_phone: string
          delivery_company_name: string
          delivery_company_address: string
          delivery_company_lat?: number | null
          delivery_company_lng?: number | null
          delivery_contact_name: string
          delivery_contact_phone: string
          vin_number: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          status?: 'pending' | 'quoted' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled'
          assigned_admin_id?: string | null
          priority?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          user_id?: string
          pickup_company_name?: string
          pickup_company_address?: string
          pickup_company_lat?: number | null
          pickup_company_lng?: number | null
          pickup_contact_name?: string
          pickup_contact_phone?: string
          delivery_company_name?: string
          delivery_company_address?: string
          delivery_company_lat?: number | null
          delivery_company_lng?: number | null
          delivery_contact_name?: string
          delivery_contact_phone?: string
          vin_number?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: number | null
          status?: 'pending' | 'quoted' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled'
          assigned_admin_id?: string | null
          priority?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      document_attachments: {
        Row: {
          id: string
          transportation_request_id: string
          file_name: string
          file_size: number
          file_type: string
          storage_path: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          transportation_request_id: string
          file_name: string
          file_size: number
          file_type: string
          storage_path: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          transportation_request_id?: string
          file_name?: string
          file_size?: number
          file_type?: string
          storage_path?: string
          uploaded_by?: string
          created_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          transportation_request_id: string
          admin_id: string
          base_price: number
          fuel_surcharge: number
          additional_fees: number
          total_amount: number
          estimated_pickup_date: string | null
          estimated_delivery_date: string | null
          terms_and_conditions: string | null
          notes: string | null
          is_active: boolean
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transportation_request_id: string
          admin_id: string
          base_price: number
          fuel_surcharge?: number
          additional_fees?: number
          total_amount: number
          estimated_pickup_date?: string | null
          estimated_delivery_date?: string | null
          terms_and_conditions?: string | null
          notes?: string | null
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transportation_request_id?: string
          admin_id?: string
          base_price?: number
          fuel_surcharge?: number
          additional_fees?: number
          total_amount?: number
          estimated_pickup_date?: string | null
          estimated_delivery_date?: string | null
          terms_and_conditions?: string | null
          notes?: string | null
          is_active?: boolean
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          transportation_request_id: string
          quote_id: string
          user_id: string
          amount: number
          payment_method: 'credit_card' | 'ach' | 'check'
          payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          ach_transaction_id: string | null
          payment_date: string | null
          failure_reason: string | null
          refund_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transportation_request_id: string
          quote_id: string
          user_id: string
          amount: number
          payment_method: 'credit_card' | 'ach' | 'check'
          payment_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          ach_transaction_id?: string | null
          payment_date?: string | null
          failure_reason?: string | null
          refund_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transportation_request_id?: string
          quote_id?: string
          user_id?: string
          amount?: number
          payment_method?: 'credit_card' | 'ach' | 'check'
          payment_status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          ach_transaction_id?: string | null
          payment_date?: string | null
          failure_reason?: string | null
          refund_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      order_activities: {
        Row: {
          id: string
          transportation_request_id: string
          user_id: string | null
          activity_type: string
          description: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          transportation_request_id: string
          user_id?: string | null
          activity_type: string
          description: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          transportation_request_id?: string
          user_id?: string | null
          activity_type?: string
          description?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_order_number: {
        Args: {}
        Returns: string
      }
    }
    Enums: {
      user_role: 'customer' | 'admin'
      order_status: 'pending' | 'quoted' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled'
      payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
      payment_method: 'credit_card' | 'ach' | 'check'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type TransportationRequest = Database['public']['Tables']['transportation_requests']['Row']
export type Quote = Database['public']['Tables']['quotes']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type DocumentAttachment = Database['public']['Tables']['document_attachments']['Row']
export type OrderActivity = Database['public']['Tables']['order_activities']['Row'] 