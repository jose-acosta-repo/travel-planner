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

    const { data: items, error } = await supabase
      .from('itinerary_items')
      .select(`
        *,
        creator:profiles(id, name, avatar_url),
        comments(
          *,
          user:profiles(id, name, avatar_url)
        )
      `)
      .eq('trip_id', tripId)
      .order('day_number')
      .order('order_index')

    if (error) {
      console.error('Error fetching items:', error)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error in GET /api/trips/[tripId]/items:', error)
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
    const {
      day_number,
      start_time,
      end_time,
      title,
      description,
      location,
      location_lat,
      location_lng,
      category,
      metadata = {},
    } = body

    if (!title || !day_number) {
      return NextResponse.json(
        { error: 'Title and day number are required' },
        { status: 400 }
      )
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

    // Check access
    const { data: trip } = await supabase
      .from('trips')
      .select('owner_id, collaborators:trip_collaborators(user_id, role, accepted)')
      .eq('id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const isOwner = trip.owner_id === profile.id
    const isEditor = trip.collaborators?.some(
      (c: any) => c.user_id === profile.id && c.role === 'editor' && c.accepted
    )

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get max order_index for this day
    const { data: maxOrder } = await supabase
      .from('itinerary_items')
      .select('order_index')
      .eq('trip_id', tripId)
      .eq('day_number', day_number)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()

    const order_index = (maxOrder?.order_index ?? -1) + 1

    // Create item
    const { data: item, error } = await supabase
      .from('itinerary_items')
      .insert({
        trip_id: tripId,
        day_number,
        start_time: start_time || null,
        end_time: end_time || null,
        title,
        description: description || null,
        location: location || null,
        location_lat: location_lat || null,
        location_lng: location_lng || null,
        category: category || 'other',
        metadata: metadata || {},
        order_index,
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating item:', error)
      return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error in POST /api/trips/[tripId]/items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
