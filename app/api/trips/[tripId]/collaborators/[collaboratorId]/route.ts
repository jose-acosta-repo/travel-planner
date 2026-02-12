import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tripId: string; collaboratorId: string }> }
) {
  try {
    const { tripId, collaboratorId } = await params
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Allow owner or the collaborator themselves to remove
    const { data: collaborator } = await supabase
      .from('trip_collaborators')
      .select('user_id')
      .eq('id', collaboratorId)
      .single()

    const isOwner = trip.owner_id === currentUser.id
    const isSelf = collaborator?.user_id === currentUser.id

    if (!isOwner && !isSelf) {
      return NextResponse.json(
        { error: 'Only the trip owner can remove collaborators' },
        { status: 403 }
      )
    }

    // Delete collaborator
    const { error } = await supabase
      .from('trip_collaborators')
      .delete()
      .eq('id', collaboratorId)
      .eq('trip_id', tripId)

    if (error) {
      console.error('Error deleting collaborator:', error)
      return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/trips/[tripId]/collaborators/[collaboratorId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tripId: string; collaboratorId: string }> }
) {
  try {
    const { tripId, collaboratorId } = await params
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { role } = body

    if (role && !['editor', 'viewer'].includes(role)) {
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
        { error: 'Only the trip owner can update collaborator roles' },
        { status: 403 }
      )
    }

    // Update collaborator
    const { data: collaborator, error } = await supabase
      .from('trip_collaborators')
      .update({ role })
      .eq('id', collaboratorId)
      .eq('trip_id', tripId)
      .select()
      .single()

    if (error) {
      console.error('Error updating collaborator:', error)
      return NextResponse.json({ error: 'Failed to update collaborator' }, { status: 500 })
    }

    return NextResponse.json({ collaborator })
  } catch (error) {
    console.error('Error in PATCH /api/trips/[tripId]/collaborators/[collaboratorId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
