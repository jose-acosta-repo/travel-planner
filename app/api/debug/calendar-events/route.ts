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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (profileError) {
      return NextResponse.json({
        error: 'Profile error',
        details: profileError
      }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Try to fetch events WITHOUT filters to see raw data
    const { data: allEvents, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')

    // Check RLS policies
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          tablename,
          policyname,
          permissive,
          roles,
          cmd
        FROM pg_policies
        WHERE tablename = 'calendar_events'
        AND schemaname = 'public'
      `
    }).catch(() => ({ data: null, error: { message: 'Cannot query policies directly' } }))

    return NextResponse.json({
      debug: {
        userEmail: session.user.email,
        profileId: profile.id,
        eventsCount: allEvents?.length || 0,
        eventsError: eventsError ? {
          message: eventsError.message,
          code: eventsError.code,
          details: eventsError.details,
          hint: eventsError.hint
        } : null,
        events: allEvents || [],
        policiesError: policiesError,
        policies: policies,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
