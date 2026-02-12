'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TripList } from '@/components/trips/TripList'
import { Plus, Plane, Calendar, Users } from 'lucide-react'

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Traveler'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Plan your next adventure</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Create your first trip</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Trips planned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborating</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Shared trips</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trips */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Trips</h2>
          <Link href="/trips">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        </div>
        <TripList limit={3} />
      </div>

      {/* Empty State / CTA */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-4 mb-4">
            <Plane className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="mb-2">Start Planning Your Trip</CardTitle>
          <CardDescription className="text-center max-w-sm mb-4">
            Create your first trip and start adding activities, inviting collaborators, and more.
          </CardDescription>
          <Link href="/trips/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Trip
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
