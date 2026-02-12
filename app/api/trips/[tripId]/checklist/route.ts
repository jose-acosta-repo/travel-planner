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

    // Fetch checklist items for the trip
    const { data: items, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching checklist items:', error)
      return NextResponse.json({ error: 'Failed to fetch checklist items' }, { status: 500 })
    }

    return NextResponse.json({ items: items || [] })
  } catch (error) {
    console.error('Error in GET /api/trips/[tripId]/checklist:', error)
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
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check ownership or editor access
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

    let calendarEventId = null

    // If there's a due_date, create a calendar event
    if (body.due_date) {
      const eventStartDate = new Date(body.due_date)
      const eventEndDate = new Date(eventStartDate)
      eventEndDate.setHours(eventEndDate.getHours() + 1) // 1 hour duration

      const { data: calendarEvent, error: calendarError } = await supabase
        .from('calendar_events')
        .insert({
          trip_id: tripId,
          created_by_user_id: profile.id,
          title: body.title,
          description: body.description || null,
          start_date: eventStartDate.toISOString(),
          end_date: eventEndDate.toISOString(),
          event_type: 'other',
        })
        .select()
        .single()

      if (calendarError) {
        console.error('Error creating calendar event:', calendarError)
      } else {
        calendarEventId = calendarEvent.id
      }
    }

    // Create checklist item
    const { data: item, error } = await supabase
      .from('checklist_items')
      .insert({
        trip_id: tripId,
        created_by_user_id: profile.id,
        title: body.title,
        description: body.description || null,
        due_date: body.due_date || null,
        category: body.category || 'other',
        completed: false,
        calendar_event_id: calendarEventId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating checklist item:', error)
      return NextResponse.json({ error: 'Failed to create checklist item' }, { status: 500 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error in POST /api/trips/[tripId]/checklist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
    }

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

    // Update checklist item
    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.completed !== undefined) updateData.completed = body.completed
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.category !== undefined) updateData.category = body.category

    updateData.updated_at = new Date().toISOString()

    const { data: item, error } = await supabase
      .from('checklist_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .select()
      .single()

    if (error) {
      console.error('Error updating checklist item:', error)
      return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error in PATCH /api/trips/[tripId]/checklist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 })
    }

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

    // Get the checklist item to find associated calendar event
    const { data: checklistItem } = await supabase
      .from('checklist_items')
      .select('calendar_event_id')
      .eq('id', itemId)
      .single()

    // Delete associated calendar event if exists
    if (checklistItem?.calendar_event_id) {
      await supabase
        .from('calendar_events')
        .delete()
        .eq('id', checklistItem.calendar_event_id)
    }

    // Delete checklist item
    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', itemId)
      .eq('trip_id', tripId)

    if (error) {
      console.error('Error deleting checklist item:', error)
      return NextResponse.json({ error: 'Failed to delete checklist item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/trips/[tripId]/checklist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
