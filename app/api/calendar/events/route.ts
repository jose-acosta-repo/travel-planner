import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Build query
    let query = supabase
      .from('calendar_events')
      .select(`
        *,
        trip:trips(id, title, owner_id)
      `)
      .order('start_date', { ascending: true })

    // Filter by date range if provided
    // Get events that overlap with the date range (start before range end AND end after range start)
    if (startDate && endDate) {
      query = query
        .lte('start_date', endDate)   // Event starts before or during the range
        .gte('end_date', startDate)   // Event ends after or during the range
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    // Filter events to only include trips user has access to
    const accessibleEvents = events?.filter((event: any) => {
      // If no trip, it's a personal event
      if (!event.trip) return true

      // Check if user is owner or collaborator
      return event.trip.owner_id === profile.id
    })

    return NextResponse.json({ events: accessibleEvents || [] })
  } catch (error) {
    console.error('Error in GET /api/calendar/events:', error)
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
    const { title, description, event_type, location, start_date, end_date, trip_id } = body

    if (!title || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start_date, end_date' },
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

    // If trip_id provided, verify access
    if (trip_id) {
      const { data: trip } = await supabase
        .from('trips')
        .select('owner_id, collaborators:trip_collaborators(user_id, accepted, role)')
        .eq('id', trip_id)
        .single()

      if (!trip) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
      }

      const hasAccess =
        trip.owner_id === profile.id ||
        trip.collaborators?.some(
          (c: any) => c.user_id === profile.id && c.accepted && c.role === 'editor'
        )

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Create calendar event
    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        title,
        description,
        event_type,
        location,
        start_date,
        end_date,
        trip_id: trip_id || null,
        created_by_user_id: profile.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error in POST /api/calendar/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
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

    // Get the event to check permissions
    const { data: existingEvent } = await supabase
      .from('calendar_events')
      .select('*, trip:trips(owner_id)')
      .eq('id', eventId)
      .single()

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user has permission to edit (must be event creator or trip owner)
    if (existingEvent.created_by_user_id !== profile.id &&
        existingEvent.trip?.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update event
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.event_type !== undefined) updateData.event_type = body.event_type
    if (body.location !== undefined) updateData.location = body.location
    if (body.start_date !== undefined) updateData.start_date = body.start_date
    if (body.end_date !== undefined) updateData.end_date = body.end_date
    if (body.trip_id !== undefined) updateData.trip_id = body.trip_id

    const { data: event, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error in PATCH /api/calendar/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
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

    // Get the event to check permissions
    const { data: existingEvent } = await supabase
      .from('calendar_events')
      .select('*, trip:trips(owner_id)')
      .eq('id', eventId)
      .single()

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user has permission to delete (must be event creator or trip owner)
    if (existingEvent.created_by_user_id !== profile.id &&
        existingEvent.trip?.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete event
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('Error deleting event:', error)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/calendar/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
