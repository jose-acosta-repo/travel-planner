import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  try {
    const { tripId, itemId } = await params
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

    // Update item
    const allowedFields = [
      'day_number',
      'start_time',
      'end_time',
      'title',
      'description',
      'location',
      'location_lat',
      'location_lng',
      'category',
      'metadata',
      'order_index',
    ]

    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    updateData.updated_at = new Date().toISOString()

    const { data: item, error } = await supabase
      .from('itinerary_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('trip_id', tripId)
      .select()
      .single()

    if (error) {
      console.error('Error updating item:', error)
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error in PATCH /api/trips/[tripId]/items/[itemId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  try {
    const { tripId, itemId } = await params
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

    // Delete item
    const { error } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', itemId)
      .eq('trip_id', tripId)

    if (error) {
      console.error('Error deleting item:', error)
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/trips/[tripId]/items/[itemId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
