import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plane, Users, Camera, Calendar, Globe, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Plane className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">TripPlanner</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Plan Your Perfect Trip
            <span className="text-blue-600"> Together</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create detailed travel itineraries, collaborate with friends and family,
            and use AI to turn your photos into plans. All in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Start Planning Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Plan
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="h-10 w-10 text-blue-600" />}
              title="Day-by-Day Planning"
              description="Organize your trip with a beautiful timeline view. Add activities, set times, and keep everything organized."
            />
            <FeatureCard
              icon={<Camera className="h-10 w-10 text-blue-600" />}
              title="AI Photo Recognition"
              description="Snap a photo of a ticket, reservation, or brochure. Our AI extracts the details and adds them to your itinerary."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-blue-600" />}
              title="Real-time Collaboration"
              description="Invite friends and family to plan together. See changes in real-time and leave comments on activities."
            />
            <FeatureCard
              icon={<Globe className="h-10 w-10 text-blue-600" />}
              title="Share Your Plans"
              description="Generate a shareable link for your itinerary. Perfect for group trips or sharing with guides."
            />
            <FeatureCard
              icon={<Sparkles className="h-10 w-10 text-blue-600" />}
              title="Smart Suggestions"
              description="Get AI-powered recommendations for restaurants, activities, and attractions at your destination."
            />
            <FeatureCard
              icon={<Plane className="h-10 w-10 text-blue-600" />}
              title="Personal & Business"
              description="Whether it's a family vacation or a business trip, organize everything in one place."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Planning?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of travelers who plan their trips with TripPlanner.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Create Your First Trip
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Plane className="h-6 w-6 text-blue-500" />
            <span className="text-white font-semibold">TripPlanner</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} TripPlanner. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-xl border bg-gray-50 hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
