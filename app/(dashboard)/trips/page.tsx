'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TripList } from '@/components/trips/TripList'
import { Plus, Search, Grid3x3, List, Archive, RotateCcw, Trash2, MapPin, ImageOff, Loader2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Image from 'next/image'
import { getConsistentDestinationImage } from '@/lib/utils'

interface ArchivedTrip {
  id: string
  title: string
  location: string
  coverImage?: string
  startDate: string
  endDate: string
  status: 'personal' | 'completed' | 'canceled' | 'hidden'
  collaborators: { id: string; name: string; avatar?: string }[]
}

export default function TripsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [tripFilter, setTripFilter] = useState<'all' | 'personal' | 'business' | 'past'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [archivedTrips, setArchivedTrips] = useState<ArchivedTrip[]>([])
  const [loading, setLoading] = useState(false)

  // Load archived trips when Past tab is selected
  useEffect(() => {
    if (tripFilter === 'past') {
      loadArchivedTrips()
    }
  }, [tripFilter])

  async function loadArchivedTrips() {
    try {
      setLoading(true)
      const response = await fetch('/api/trips?status=archived')
      if (response.ok) {
        const data = await response.json()
        const trips = (data.trips || [])
          .filter((trip: any) => {
            const status = (trip.status || '').toLowerCase()
            return status === 'completed' || status === 'canceled'
          })
          .map((trip: any) => ({
            id: trip.id,
            title: trip.title || 'Untitled Trip',
            location: trip.destination,
            coverImage: trip.cover_image_url || getConsistentDestinationImage(trip.destination),
            startDate: new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            endDate: new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: (trip.status || 'personal').toLowerCase(),
            collaborators: (trip.collaborators || []).map((c: any) => ({
              id: c.user_id,
              name: c.user?.name || 'Unknown',
              avatar: c.user?.name?.substring(0, 1).toUpperCase() || 'U',
            })),
          }))
        setArchivedTrips(trips)
      }
    } catch (error) {
      console.error('Error loading archived trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    personal: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    canceled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    hidden: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }

  const filteredArchivedTrips = archivedTrips.filter((trip) =>
    trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header Section */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 md:px-8 py-4 md:py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Trips</h1>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search trips, destinations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6 md:py-8">
        {tripFilter !== 'past' && (
          <>
            {/* Adventure Awaits */}
            <div className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Adventure Awaits
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You have 3 upcoming trips in the next 30 days.
              </p>
            </div>
          </>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <Tabs value={tripFilter} onValueChange={(value) => setTripFilter(value as any)}>
            <TabsList>
              <TabsTrigger value="all">All Trips</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="past">Past Trips</TabsTrigger>
            </TabsList>
          </Tabs>

          {tripFilter !== 'past' && (
            <div className="flex items-center gap-4">
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
              <Link href="/trips/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Trip
                </Button>
              </Link>
            </div>
          )}
        </div>

        {tripFilter !== 'past' ? (
          <>
            {/* Upcoming Trips Section */}
            <div className="mb-12">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                UPCOMING TRIPS
              </h3>
              <TripList
                filter={tripFilter === 'all' ? 'all' : tripFilter}
                searchQuery={searchQuery}
                viewMode={viewMode}
                status="upcoming"
              />
            </div>
          </>
        ) : (
          <>
            {/* Past Trips Section */}
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="col-span-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Trip Details
                </div>
                <div className="col-span-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Date
                </div>
                <div className="col-span-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Collaborators
                </div>
                <div className="col-span-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Actions
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : filteredArchivedTrips.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Archive className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'No past trips match your search.' : 'No past trips yet.'}
                    </p>
                  </div>
                ) : (
                  filteredArchivedTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                    >
                      {/* Trip Details */}
                      <div className="col-span-5 flex items-center gap-4">
                        {trip.status === 'canceled' ? (
                          <div className="h-16 w-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <ImageOff className="h-6 w-6 text-gray-400" />
                          </div>
                        ) : (
                          <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={trip.coverImage || '/api/placeholder/400/400'}
                              alt={trip.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {trip.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{trip.location}</span>
                            <span>•</span>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${statusColors[trip.status]}`}
                            >
                              {trip.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Date */}
                      <div className="col-span-3 flex items-center">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {trip.startDate} - {trip.endDate}
                        </span>
                      </div>

                      {/* Collaborators */}
                      <div className="col-span-2 flex items-center">
                        <div className="flex -space-x-2">
                          {trip.collaborators.map((collab) => (
                            <Avatar
                              key={collab.id}
                              className="h-8 w-8 border-2 border-white dark:border-gray-950"
                            >
                              <AvatarFallback className="bg-blue-600 text-white text-xs">
                                {collab.avatar}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
