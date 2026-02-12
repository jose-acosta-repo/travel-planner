import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatTime, getDaysBetween, getDateForDay, categoryColors } from '@/lib/utils'
import {
  Plane,
  Hotel,
  Utensils,
  MapPin,
  Car,
  Briefcase,
  Circle,
  Calendar,
  Users,
  Globe,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PrintButton } from '@/components/trips/PrintButton'

const categoryIcons: Record<string, React.ComponentType<any>> = {
  flight: Plane,
  hotel: Hotel,
  restaurant: Utensils,
  activity: MapPin,
  transport: Car,
  meeting: Briefcase,
  other: Circle,
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      *,
      owner:profiles!trips_owner_id_fkey(id, name, email, avatar_url),
      items:itinerary_items(*)
    `)
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (error || !trip) {
    notFound()
  }

  const totalDays = getDaysBetween(trip.start_date, trip.end_date)
  const itemsByDay = trip.items?.reduce((acc: Record<number, any[]>, item: any) => {
    if (!acc[item.day_number]) {
      acc[item.day_number] = []
    }
    acc[item.day_number].push(item)
    return acc
  }, {}) || {}

  // Sort items within each day
  Object.keys(itemsByDay).forEach((day) => {
    itemsByDay[parseInt(day)].sort((a: any, b: any) => {
      if (!a.start_time) return 1
      if (!b.start_time) return -1
      return a.start_time.localeCompare(b.start_time)
    })
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900">TripPlanner</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Globe className="h-4 w-4" />
              Shared Itinerary
            </div>
            <PrintButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Trip Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{trip.title}</h1>
            <Badge variant={trip.trip_type === 'personal' ? 'default' : 'secondary'}>
              {trip.trip_type}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {trip.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              By {trip.owner?.name || 'Anonymous'}
            </span>
          </div>
          {trip.description && (
            <p className="mt-4 text-gray-600">{trip.description}</p>
          )}
        </div>

        {/* Days */}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
          const date = getDateForDay(trip.start_date, day)
          const items = itemsByDay[day] || []

          return (
            <div key={day} className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                  <div className="text-sm font-medium">Day {day}</div>
                  <div className="text-xs opacity-90">
                    {date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {items.length === 0 ? (
                <Card className="border-dashed bg-white">
                  <CardContent className="py-8 text-center text-gray-500">
                    No activities planned for this day
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {items.map((item: any) => {
                    const Icon = categoryIcons[item.category] || Circle
                    const colors = categoryColors[item.category] || categoryColors.other

                    return (
                      <Card key={item.id} className="bg-white border border-gray-200">
                        <div className="flex">
                          <div className="w-24 flex-shrink-0 bg-gray-50 p-4 flex flex-col items-center justify-center border-r">
                            {item.start_time ? (
                              <>
                                <span className="text-lg font-semibold text-gray-900">
                                  {formatTime(item.start_time)}
                                </span>
                                {item.end_time && (
                                  <span className="text-sm text-gray-500">
                                    to {formatTime(item.end_time)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">No time</span>
                            )}
                          </div>
                          <CardContent className="flex-1 p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${colors.bg}`}>
                                <Icon className={`h-5 w-5 ${colors.text}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${colors.text} ${colors.border}`}
                                  >
                                    {item.category}
                                  </Badge>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                )}
                                {item.location && (
                                  <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                                    <MapPin className="h-4 w-4" />
                                    {item.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* CTA */}
        <Card className="bg-blue-50 border-blue-100 print:hidden">
          <CardContent className="py-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Plan your own trip with TripPlanner
            </h3>
            <p className="text-gray-600 mb-4">
              Create itineraries, collaborate with friends, and use AI to scan tickets and
              reservations.
            </p>
            <Link href="/login">
              <Button>Get Started Free</Button>
            </Link>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8 mt-12 print:hidden">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          Created with{' '}
          <Link href="/" className="text-blue-600 hover:underline">
            TripPlanner
          </Link>
        </div>
      </footer>
    </div>
  )
}
