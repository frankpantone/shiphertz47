import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔧 Admin API: Updating user role to admin:', userId)

    // Update user role using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('❌ Admin API error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Admin API success:', data)
    return NextResponse.json({ 
      success: true, 
      message: 'User role updated to admin successfully',
      data 
    })

  } catch (error: any) {
    console.error('💥 Admin API exception:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
} 