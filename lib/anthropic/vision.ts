import Anthropic from '@anthropic-ai/sdk'
import { ExtractedActivity, ActivityCategory } from '@/types'

const EXTRACTION_PROMPT = `You are a travel itinerary assistant. Analyze this image and extract travel-related information.

The image may contain:
- Flight tickets or boarding passes
- Hotel reservations or confirmations
- Restaurant reservations
- Tour or activity bookings
- Transportation tickets (train, bus, etc.)
- Event tickets
- Meeting invitations
- Travel brochures or itineraries

Extract the following information if present:
1. Title/Name of the activity or booking
2. Description (brief details)
3. Date (in YYYY-MM-DD format)
4. Start time (in HH:MM 24-hour format)
5. End time (in HH:MM 24-hour format, if applicable)
6. Location/Venue
7. Category: one of "flight", "hotel", "restaurant", "activity", "transport", "meeting", or "other"

Additionally, extract category-specific details in a "metadata" field:

FLIGHTS - Include in metadata:
- airline: Airline name (e.g., "American Airlines")
- flightNumber: Flight number (e.g., "AA 5027")
- confirmationCode: Booking/confirmation reference
- departureAirport: Origin airport code (e.g., "PHL")
- arrivalAirport: Destination airport code (e.g., "IND")
- seat: Seat number if visible
- gate: Gate number if visible
- terminal: Terminal if visible

HOTELS - Include in metadata:
- hotelName: Name of hotel
- confirmationCode: Reservation/confirmation number
- checkInDate: Check-in date (YYYY-MM-DD)
- checkOutDate: Check-out date (YYYY-MM-DD)
- roomType: Type of room (e.g., "King Suite")
- numberOfGuests: Number of guests

RESTAURANTS - Include in metadata:
- reservationName: Name on reservation
- partySize: Number of people
- phoneNumber: Restaurant contact number
- cuisineType: Type of cuisine
- priceRange: Price range ($, $$, $$$, or $$$$)

ACTIVITIES - Include in metadata:
- provider: Company/provider name
- bookingReference: Booking reference number
- difficultyLevel: Difficulty (Easy, Moderate, Hard, Expert)
- duration: Activity duration
- pricePerPerson: Price per person if visible

TRANSPORT - Include in metadata:
- operator: Transport operator name
- vehicleType: Type of vehicle (Car, Bus, Train, Ferry, etc.)
- bookingReference: Booking reference
- pickupLocation: Pickup location
- dropoffLocation: Dropoff location

MEETINGS - Include in metadata:
- meetingLink: Meeting URL/link
- organizer: Meeting organizer name
- attendees: Attendees list or count
- roomNumber: Room number or location

Respond in JSON format:
{
  "activities": [
    {
      "title": "Activity name",
      "description": "Brief description",
      "date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "location": "Location name or address",
      "category": "category_type",
      "confidence": 0.95,
      "metadata": {
        // Category-specific fields here
      }
    }
  ]
}

If no travel-related information is found, return an empty activities array.
Include a confidence score (0-1) for each extraction based on how clearly the information is visible.
Only include metadata fields that are visible in the image - omit fields that aren't present.

IMPORTANT: Respond ONLY with valid JSON, no other text.`

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }
  return new Anthropic({ apiKey })
}

export async function extractActivitiesFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ExtractedActivity[]> {
  try {
    const anthropic = getAnthropicClient()

    // Map mime type to Anthropic's expected format
    const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    })

    console.log('Anthropic API response:', JSON.stringify(response, null, 2))

    // Extract text content from response
    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      console.log('No text content found in response')
      return []
    }

    let content = textContent.text
    console.log('Extracted content:', content)

    // Strip markdown code blocks if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    console.log('Cleaned content:', content)

    // Parse JSON from response
    const parsed = JSON.parse(content)
    console.log('Parsed JSON:', parsed)
    const activities: ExtractedActivity[] = (parsed.activities || []).map((activity: any) => ({
      title: activity.title || 'Untitled Activity',
      description: activity.description,
      date: activity.date,
      start_time: activity.start_time,
      end_time: activity.end_time,
      location: activity.location,
      category: validateCategory(activity.category),
      confidence: activity.confidence || 0.5,
      metadata: activity.metadata || {},
    }))

    return activities
  } catch (error) {
    console.error('Error extracting activities from image:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}

function validateCategory(category: string): ActivityCategory {
  const validCategories: ActivityCategory[] = [
    'flight',
    'hotel',
    'restaurant',
    'activity',
    'transport',
    'meeting',
    'other',
  ]
  return validCategories.includes(category as ActivityCategory)
    ? (category as ActivityCategory)
    : 'other'
}

export async function generateTripSuggestions(
  destination: string,
  tripType: string,
  duration: number
): Promise<ExtractedActivity[]> {
  try {
    const anthropic = getAnthropicClient()

    const prompt = `Generate a suggested itinerary for a ${duration}-day ${tripType} trip to ${destination}.

Create realistic, practical suggestions including:
- Popular attractions and activities
- Recommended restaurants
- Transportation suggestions
- For business trips: meeting-friendly venues, business centers

Return as JSON with an array of activities:
{
  "activities": [
    {
      "title": "Activity name",
      "description": "Brief description of why this is recommended",
      "day_number": 1,
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "location": "Location name",
      "category": "activity|restaurant|transport|hotel|meeting|other",
      "confidence": 1.0
    }
  ]
}

Include 3-5 activities per day.

IMPORTANT: Respond ONLY with valid JSON, no other text.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return []
    }

    let content = textContent.text
    // Strip markdown code blocks if present
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(content)

    return (parsed.activities || []).map((activity: any) => ({
      title: activity.title || 'Suggested Activity',
      description: activity.description,
      start_time: activity.start_time,
      end_time: activity.end_time,
      location: activity.location,
      category: validateCategory(activity.category),
      confidence: 1.0,
      day_number: activity.day_number,
    }))
  } catch (error) {
    console.error('Error generating trip suggestions:', error)
    throw new Error('Failed to generate trip suggestions')
  }
}
