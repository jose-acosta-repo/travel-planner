import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServiceClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get user settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', profile.id)
      .single()

    // If no settings exist, create default settings
    if (!settings) {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: profile.id,
          display_name: session.user.name || null,
          currency: 'USD',
          timezone: 'GMT-08:00',
          password_last_changed: null,
          two_factor_enabled: false,
          two_factor_method: null,
          google_calendar_connected: false,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating default settings:', insertError)
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
      }

      return NextResponse.json({ settings: newSettings })
    }

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error in GET /api/user/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createServiceClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Update settings
    const updateData: any = {}
    if (body.display_name !== undefined) updateData.display_name = body.display_name
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.two_factor_enabled !== undefined) updateData.two_factor_enabled = body.two_factor_enabled
    if (body.two_factor_method !== undefined) updateData.two_factor_method = body.two_factor_method
    if (body.two_factor_phone !== undefined) updateData.two_factor_phone = body.two_factor_phone
    if (body.google_calendar_connected !== undefined) updateData.google_calendar_connected = body.google_calendar_connected

    updateData.updated_at = new Date().toISOString()

    const { data: settings, error } = await supabase
      .from('user_settings')
      .update(updateData)
      .eq('user_id', profile.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error in PATCH /api/user/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
