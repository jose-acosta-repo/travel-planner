'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Calendar, MoreVertical, Plus, Grid3x3, List, Mail, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getConsistentDestinationImage } from '@/lib/utils'

interface SharedTrip {
  id: string
  title: string
  location: string
  coverImage: string
  startDate: string
  endDate: string
  status: 'active' | 'shared' | 'completed'
  owner: {
    name: string
    avatar?: string
    initials: string
  }
}

export default function SharedPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sharedTrips, setSharedTrips] = useState<SharedTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  // Load shared trips from API
  useEffect(() => {
    async function loadSharedTrips() {
      try {
        const response = await fetch('/api/trips?shared=true')
        if (response.ok) {
          const data = await response.json()

          // Count pending invitations
          const pending = (data.trips || []).filter((trip: any) =>
            trip.collaborators?.some((c: any) => !c.accepted)
          ).length
          setPendingCount(pending)

          // Map trips to component format
          const trips = (data.trips || []).map((trip: any) => {
            const owner = trip.owner || {}
            return {
              id: trip.id,
              title: trip.name || 'Untitled Trip',
              location: trip.destination,
              coverImage: trip.cover_image_url || getConsistentDestinationImage(trip.destination),
              startDate: new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              endDate: new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              status: trip.status?.toLowerCase() || 'active',
              owner: {
                name: owner.name || 'Unknown',
                initials: owner.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'UK',
              },
            }
          })
          setSharedTrips(trips)
        }
      } catch (error) {
        console.error('Error loading shared trips:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSharedTrips()
  }, [])

  const statusColors = {
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    shared: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header Section */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 md:px-8 py-4 md:py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Collaborative Trips
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Explore itineraries shared with you by other travelers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6 md:py-8">
        {/* Pending Invitations Banner */}
        {pendingCount > 0 && (
          <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Pending Invitations
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have {pendingCount} new trip invitation{pendingCount !== 1 ? 's' : ''} from your friends.
                  </p>
                </div>
              </div>
              <Button variant="ghost" className="text-blue-600 dark:text-blue-400 font-semibold">
                View All
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : sharedTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No shared trips yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              When others invite you to trips, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Shared Trip Cards */}
            {sharedTrips.map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={trip.coverImage}
                      alt={trip.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge
                      className={`absolute top-3 right-3 ${statusColors[trip.status]} uppercase text-xs font-semibold`}
                    >
                      {trip.status}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <Calendar className="h-4 w-4 mt-0.5" />
                      <span>
                        {trip.startDate} - {trip.endDate}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      {trip.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={trip.owner.avatar} />
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {trip.owner.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            OWNED BY
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {trip.owner.name}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.preventDefault()
                          // Handle menu click
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
