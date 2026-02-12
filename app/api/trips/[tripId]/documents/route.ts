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

    // Fetch documents for the trip
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    console.error('Error in GET /api/trips/[tripId]/documents:', error)
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

    // Create document
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        trip_id: tripId,
        uploaded_by_user_id: profile.id,
        uploaded_by_name: profile.name || session.user.name || 'Unknown',
        ...body,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating document:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error in POST /api/trips/[tripId]/documents:', error)
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
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
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

    // Delete document
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('trip_id', tripId)

    if (error) {
      console.error('Error deleting document:', error)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/trips/[tripId]/documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
