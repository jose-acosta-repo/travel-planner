import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
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

    // Check trip access
    const { data: trip } = await supabase
      .from('trips')
      .select('owner_id, collaborators:trip_collaborators(user_id, accepted)')
      .eq('id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const hasAccess =
      trip.owner_id === profile.id ||
      trip.collaborators?.some((c: any) => c.user_id === profile.id && c.accepted)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch messages for the trip
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Error in GET /api/trips/[tripId]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createServiceClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check trip access
    const { data: trip } = await supabase
      .from('trips')
      .select('owner_id, collaborators:trip_collaborators(user_id, accepted)')
      .eq('id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const hasAccess =
      trip.owner_id === profile.id ||
      trip.collaborators?.some((c: any) => c.user_id === profile.id && c.accepted)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        trip_id: tripId,
        user_id: profile.id,
        user_name: profile.name || session.user.name || 'Unknown',
        message: body.message,
        is_ai: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error in POST /api/trips/[tripId]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
