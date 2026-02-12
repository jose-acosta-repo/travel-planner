import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceClient } from '@/lib/supabase/server'

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

    // Update budget data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Handle different budget update types
    if (body.member_budgets !== undefined) {
      updateData.member_budgets = body.member_budgets
    }

    if (body.category_goals !== undefined) {
      updateData.category_goals = body.category_goals
    }

    if (body.split_method !== undefined) {
      updateData.split_method = body.split_method
    }

    if (body.custom_split_percentages !== undefined) {
      updateData.custom_split_percentages = body.custom_split_percentages
    }

    if (body.total_budget !== undefined) {
      updateData.total_budget = body.total_budget
    }

    const { data: updatedTrip, error } = await supabase
      .from('trips')
      .update(updateData)
      .eq('id', tripId)
      .select()
      .single()

    if (error) {
      console.error('Error updating trip budget:', error)
      return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 })
    }

    return NextResponse.json({ trip: updatedTrip })
  } catch (error) {
    console.error('Error in PATCH /api/trips/[tripId]/budget:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
