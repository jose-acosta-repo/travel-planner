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

    const supabase = await createServiceClient()

    // First check if trip is public
    const { data: trip, error } = await supabase
      .from('trips')
      .select(`
        *,
        owner:profiles!trips_owner_id_fkey(id, name, email, avatar_url),
        collaborators:trip_collaborators(
          id, role, accepted, invited_email,
          user:profiles(id, name, email, avatar_url)
        ),
        items:itinerary_items(
          *,
          creator:profiles(id, name, avatar_url),
          comments(
            *,
            user:profiles(id, name, avatar_url)
          )
        )
      `)
      .eq('id', tripId)
      .single()

    if (error || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Check access
    if (!trip.is_public && session?.user?.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', session.user.email)
        .single()

      if (profile) {
        const isOwner = trip.owner_id === profile.id
        const isCollaborator = trip.collaborators?.some(
          (c: any) => c.user?.id === profile.id && c.accepted
        )

        if (!isOwner && !isCollaborator) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      } else if (!trip.is_public) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    } else if (!trip.is_public && !session) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Sort items by day and order
    if (trip.items) {
      trip.items.sort((a: any, b: any) => {
        if (a.day_number !== b.day_number) {
          return a.day_number - b.day_number
        }
        return a.order_index - b.order_index
      })
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Error in GET /api/trips/[tripId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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

    // Update trip
    const allowedFields = [
      'title',
      'description',
      'destination',
      'start_date',
      'end_date',
      'trip_type',
      'cover_image_url',
      'status',
      'is_public',
    ]

    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }
    updateData.updated_at = new Date().toISOString()

    const { data: updatedTrip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', tripId)
      .select()
      .single()

    if (error) {
      console.error('Error updating trip:', error)
      return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
    }

    return NextResponse.json({ trip: updatedTrip })
  } catch (error) {
    console.error('Error in PATCH /api/trips/[tripId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Check ownership
    const { data: trip } = await supabase
      .from('trips')
      .select('owner_id')
      .eq('id', tripId)
      .single()

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Only the owner can delete this trip' }, { status: 403 })
    }

    // Delete trip (cascades to collaborators and items)
    const { error } = await supabase.from('trips').delete().eq('id', tripId)

    if (error) {
      console.error('Error deleting trip:', error)
      return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/trips/[tripId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
