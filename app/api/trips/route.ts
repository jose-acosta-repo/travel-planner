import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateShareToken } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')

    const supabase = await createServiceClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ trips: [] })
    }

    // Get trips where user is owner
    const { data: ownedTrips, error: ownedError } = await supabase
      .from('trips')
      .select(`
        *,
        owner:profiles!trips_owner_id_fkey(id, name, email, avatar_url),
        collaborators:trip_collaborators(
          id, role, accepted,
          user:profiles(id, name, email, avatar_url)
        )
      `)
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })

    if (ownedError) {
      console.error('Error fetching owned trips:', ownedError)
      return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
    }

    // Get trips where user is a collaborator
    const { data: collaboratorData, error: collabError } = await supabase
      .from('trip_collaborators')
      .select(`
        trip_id
      `)
      .eq('user_id', profile.id)

    if (collabError) {
      console.error('Error fetching collaborator trips:', collabError)
      return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
    }

    // Get full trip data for collaborator trips
    let collaboratorTrips = []
    if (collaboratorData && collaboratorData.length > 0) {
      const collabTripIds = collaboratorData.map(c => c.trip_id)
      const { data: collabTripsData, error: collabTripsError } = await supabase
        .from('trips')
        .select(`
          *,
          owner:profiles!trips_owner_id_fkey(id, name, email, avatar_url),
          collaborators:trip_collaborators(
            id, role, accepted,
            user:profiles(id, name, email, avatar_url)
          )
        `)
        .in('id', collabTripIds)
        .order('created_at', { ascending: false })

      if (collabTripsError) {
        console.error('Error fetching collaborator trip details:', collabTripsError)
      } else {
        collaboratorTrips = collabTripsData || []
      }
    }

    // Combine and deduplicate trips
    const allTrips = [...(ownedTrips || []), ...collaboratorTrips]
    const uniqueTripsMap = new Map()
    allTrips.forEach(trip => {
      if (!uniqueTripsMap.has(trip.id)) {
        uniqueTripsMap.set(trip.id, trip)
      }
    })
    let trips = Array.from(uniqueTripsMap.values())
    trips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply limit if specified
    if (limit) {
      trips = trips.slice(0, parseInt(limit))
    }

    return NextResponse.json({ trips: trips || [] })
  } catch (error) {
    console.error('Error in GET /api/trips:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, destination, start_date, end_date, trip_type, cover_image_url } = body

    if (!title || !destination || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // Get or create user profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!profile) {
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: session.user.email,
          name: session.user.name,
          avatar_url: session.user.image,
        })
        .select('id')
        .single()

      if (profileError) {
        console.error('Profile creation error:', profileError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
      profile = newProfile
    }

    // Create trip
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        owner_id: profile.id,
        title,
        description,
        destination,
        start_date,
        end_date,
        trip_type: trip_type || 'personal',
        cover_image_url,
        status: 'planning',
        is_public: false,
        share_token: generateShareToken(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating trip:', error)
      console.error('Trip insert data:', {
        owner_id: profile.id,
        title,
        description,
        destination,
        start_date,
        end_date,
        trip_type: trip_type || 'personal',
      })
      return NextResponse.json({ error: 'Failed to create trip', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Error in POST /api/trips:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
