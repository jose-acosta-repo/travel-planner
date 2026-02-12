'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, Download, Loader2 } from 'lucide-react'
import { CollaboratorList } from './CollaboratorList'
import { DiscussionPanel } from './DiscussionPanel'
import type { Trip } from '@/types'

interface CollaboratorsViewProps {
  trip: Trip
  onInvite: () => void
  onRefresh: () => void
}

export function CollaboratorsView({ trip, onInvite, onRefresh }: CollaboratorsViewProps) {
  const [exportingPDF, setExportingPDF] = useState(false)

  const handleShareItinerary = () => {
    const shareUrl = `${window.location.origin}/trips/${trip.id}`
    const shareText = `Check out my trip to ${trip.destination}!\n${trip.name}\n${shareUrl}`

    navigator.clipboard.writeText(shareText)
    alert('Trip itinerary link copied to clipboard!')
  }

  const handleExportPDF = async () => {
    setExportingPDF(true)
    try {
      // Generate PDF content
      const tripData = {
        name: trip.name,
        destination: trip.destination,
        dates: `${new Date(trip.start_date).toLocaleDateString()} - ${new Date(trip.end_date).toLocaleDateString()}`,
        budget: trip.budget,
        days: trip.itinerary?.length || 0,
      }

      // For now, we'll open a print dialog which allows saving as PDF
      // In production, you'd want to use a library like jsPDF or generate server-side
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${trip.name} - Trip Itinerary</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
                .trip-info { margin: 20px 0; }
                .trip-info p { margin: 8px 0; }
                .label { font-weight: bold; color: #4b5563; }
                @media print { body { padding: 20px; } }
              </style>
            </head>
            <body>
              <h1>${trip.name}</h1>
              <div class="trip-info">
                <p><span class="label">Destination:</span> ${trip.destination}</p>
                <p><span class="label">Dates:</span> ${tripData.dates}</p>
                <p><span class="label">Budget:</span> $${trip.budget}</p>
                <p><span class="label">Duration:</span> ${tripData.days} days</p>
              </div>
              <p style="margin-top: 40px; color: #6b7280; font-size: 14px;">
                Generated from Travel Planner on ${new Date().toLocaleDateString()}
              </p>
            </body>
          </html>
        `)
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setExportingPDF(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Collaborators & Actions */}
      <div className="lg:col-span-1 space-y-6">
        {/* Action Buttons Card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Button
              className="w-full"
              variant="default"
              onClick={handleShareItinerary}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Itinerary
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={handleExportPDF}
              disabled={exportingPDF}
            >
              {exportingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export to PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Collaborators List */}
        <CollaboratorList
          trip={trip}
          onInvite={onInvite}
          onRefresh={onRefresh}
        />
      </div>

      {/* Right Column - Discussion */}
      <div className="lg:col-span-2">
        <DiscussionPanel tripId={trip.id} />
      </div>
    </div>
  )
}
