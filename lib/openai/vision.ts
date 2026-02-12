import OpenAI from 'openai'
import { ExtractedActivity, ActivityCategory } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

Respond in JSON format with an array of extracted activities:
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
      "confidence": 0.95
    }
  ]
}

If no travel-related information is found, return an empty activities array.
Include a confidence score (0-1) for each extraction based on how clearly the information is visible.`

export async function extractActivitiesFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ExtractedActivity[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return []
    }

    const parsed = JSON.parse(content)
    const activities: ExtractedActivity[] = (parsed.activities || []).map((activity: any) => ({
      title: activity.title || 'Untitled Activity',
      description: activity.description,
      date: activity.date,
      start_time: activity.start_time,
      end_time: activity.end_time,
      location: activity.location,
      category: validateCategory(activity.category),
      confidence: activity.confidence || 0.5,
    }))

    return activities
  } catch (error) {
    console.error('Error extracting activities from image:', error)
    throw new Error('Failed to extract activities from image')
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

Include 3-5 activities per day.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return []
    }

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
