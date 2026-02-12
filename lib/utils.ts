import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

export function getDateForDay(startDate: string, dayNumber: number): Date {
  const date = new Date(startDate)
  date.setDate(date.getDate() + dayNumber - 1)
  return date
}

export const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  flight: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  hotel: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  restaurant: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  activity: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  transport: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  meeting: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
}

export const categoryIcons: Record<string, string> = {
  flight: 'Plane',
  hotel: 'Hotel',
  restaurant: 'Utensils',
  activity: 'MapPin',
  transport: 'Car',
  meeting: 'Briefcase',
  other: 'Circle',
}

/**
 * Generates a destination-specific image URL from Unsplash
 * @param destination - The destination name (e.g., "Philadelphia, PA")
 * @param width - Image width (default: 1600)
 * @param height - Image height (default: 900)
 * @returns URL to destination image
 */
export function getDestinationImageUrl(
  destination: string,
  width: number = 1600,
  height: number = 900
): string {
  // Clean up the destination for better search results
  // Remove state abbreviations and common suffixes
  const cleanDestination = destination
    .replace(/,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$/i, '')
    .trim()

  // URL encode the destination for the query
  const query = encodeURIComponent(cleanDestination + ' city travel')

  // Use Unsplash Source API for random destination images
  return `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=${width}&h=${height}&fit=crop&q=80`
}

/**
 * Gets a destination-matched image based on location keywords
 * Uses Pexels for actual city skyline photos
 * @param destination - The destination name
 * @returns Image URL
 */
export function getConsistentDestinationImage(destination: string): string {
  const destinationLower = destination.toLowerCase()

  // Destination-specific photo mappings using Pexels
  const cityMappings: Record<string, string> = {
    // Major US Cities - Actual city skyline photos
    'new york': 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // NYC skyline
    'nyc': 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
    'manhattan': 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
    'los angeles': 'https://images.pexels.com/photos/259526/pexels-photo-259526.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // LA skyline
    'la': 'https://images.pexels.com/photos/259526/pexels-photo-259526.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1',
    'chicago': 'https://images.pexels.com/photos/1823680/pexels-photo-1823680.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Chicago skyline
    'san francisco': 'https://images.pexels.com/photos/208745/pexels-photo-208745.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // SF Golden Gate
    'miami': 'https://images.pexels.com/photos/186296/pexels-photo-186296.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Miami beach
    'boston': 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Boston skyline
    'philadelphia': 'https://images.pexels.com/photos/280173/pexels-photo-280173.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Philadelphia city skyline
    'seattle': 'https://images.pexels.com/photos/1117210/pexels-photo-1117210.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Seattle Space Needle
    'las vegas': 'https://images.pexels.com/photos/161772/las-vegas-nevada-cities-urban-161772.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Vegas strip
    'austin': 'https://images.pexels.com/photos/1637542/pexels-photo-1637542.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Austin skyline
    'denver': 'https://images.pexels.com/photos/2539381/pexels-photo-2539381.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Denver
    'portland': 'https://images.pexels.com/photos/2539395/pexels-photo-2539395.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Portland
    'washington': 'https://images.pexels.com/photos/208701/pexels-photo-208701.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // DC Capitol
    'nashville': 'https://images.pexels.com/photos/1325776/pexels-photo-1325776.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Nashville

    // International Cities
    'paris': 'https://images.pexels.com/photos/532826/pexels-photo-532826.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Paris Eiffel
    'london': 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // London Big Ben
    'tokyo': 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Tokyo skyline
    'dubai': 'https://images.pexels.com/photos/1470502/pexels-photo-1470502.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Dubai
    'rome': 'https://images.pexels.com/photos/1797161/pexels-photo-1797161.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Rome Colosseum
    'barcelona': 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Barcelona
    'amsterdam': 'https://images.pexels.com/photos/208733/pexels-photo-208733.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Amsterdam
    'singapore': 'https://images.pexels.com/photos/777059/pexels-photo-777059.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Singapore
    'hong kong': 'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Hong Kong
    'sydney': 'https://images.pexels.com/photos/783682/pexels-photo-783682.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Sydney Opera
    'bangkok': 'https://images.pexels.com/photos/1031659/pexels-photo-1031659.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Bangkok
    'istanbul': 'https://images.pexels.com/photos/1440484/pexels-photo-1440484.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1', // Istanbul
  }

  // Check for exact city matches
  for (const [city, imageUrl] of Object.entries(cityMappings)) {
    if (destinationLower.includes(city)) {
      return imageUrl
    }
  }

  // Category-based matching for generic destinations
  const categoryMappings = [
    { keywords: ['beach', 'coast', 'island', 'tropical', 'hawaii', 'caribbean', 'bahamas'], url: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1' }, // Beach
    { keywords: ['mountain', 'alps', 'rockies', 'ski', 'aspen'], url: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1' }, // Mountains
    { keywords: ['desert', 'arizona', 'utah', 'grand canyon', 'sedona'], url: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1' }, // Desert
    { keywords: ['lake', 'tahoe'], url: 'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1' }, // Lake
    { keywords: ['national park', 'yellowstone', 'yosemite'], url: 'https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1' }, // Park
  ]

  for (const category of categoryMappings) {
    if (category.keywords.some(keyword => destinationLower.includes(keyword))) {
      return category.url
    }
  }

  // Default fallback - NYC skyline
  return 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900&dpr=1'
}
