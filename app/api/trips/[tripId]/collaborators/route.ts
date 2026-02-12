import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const supabase = await createServiceClient()

    const { data: collaborators, error } = await supabase
      .from('trip_collaborators')
      .select(`
        *,
        user:profiles(id, name, email, avatar_url)
      `)
      .eq('trip_id', tripId)

    if (error) {
      console.error('Error fetching collaborators:', error)
      return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 })
    }

    return NextResponse.json({ collaborators })
  } catch (error) {
    console.error('Error in GET /api/trips/[tripId]/collaborators:', error)
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
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    if (!['editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be editor or viewer' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Get current user profile
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if current user is the owner
    const { data: trip } = await supabase
      .from('trips')
      .select('owner_id')
      .eq('id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.owner_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Only the trip owner can invite collaborators' },
        { status: 403 }
      )
    }

    // Check if already a collaborator
    const { data: existing } = await supabase
      .from('trip_collaborators')
      .select('id')
      .eq('trip_id', tripId)
      .eq('invited_email', email)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'This person is already a collaborator' },
        { status: 400 }
      )
    }

    // Check if invited user exists
    const { data: invitedUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    // Create collaborator
    const { data: collaborator, error } = await supabase
      .from('trip_collaborators')
      .insert({
        trip_id: tripId,
        user_id: invitedUser?.id || null,
        role,
        invited_email: email,
        accepted: !!invitedUser, // Auto-accept if user exists
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating collaborator:', error)
      return NextResponse.json({ error: 'Failed to invite collaborator' }, { status: 500 })
    }

    return NextResponse.json({ collaborator })
  } catch (error) {
    console.error('Error in POST /api/trips/[tripId]/collaborators:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
