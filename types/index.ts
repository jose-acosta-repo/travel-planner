export type TripType =
  | 'personal'
  | 'business'
  | 'road-trip'
  | 'beach-vacation'
  | 'city-break'
  | 'adventure'
  | 'weekend-getaway'
  | 'cruise'
  | 'backpacking'
  | 'ski-trip'
  | 'cultural-tour'
  | 'honeymoon'
  | 'family-vacation'
  | 'solo-travel'
export type TripStatus = 'planning' | 'active' | 'completed'
export type CollaboratorRole = 'editor' | 'viewer'
export type ActivityCategory = 'flight' | 'hotel' | 'restaurant' | 'activity' | 'transport' | 'meeting' | 'other'

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Trip {
  id: string
  owner_id: string
  title: string
  description: string | null
  destination: string
  start_date: string
  end_date: string
  trip_type: TripType
  cover_image_url: string | null
  status: TripStatus
  is_public: boolean
  share_token: string | null
  created_at: string
  updated_at: string
  owner?: Profile
  collaborators?: TripCollaborator[]
  items?: ItineraryItem[]
}

export interface TripCollaborator {
  id: string
  trip_id: string
  user_id: string | null
  role: CollaboratorRole
  invited_email: string
  accepted: boolean
  created_at: string
  user?: Profile
}

// Category-specific metadata types
export interface FlightMetadata {
  airline?: string
  flightNumber?: string
  confirmationCode?: string
  departureAirport?: string
  arrivalAirport?: string
  seat?: string
  gate?: string
  terminal?: string
}

export interface HotelMetadata {
  hotelName?: string
  confirmationCode?: string
  checkInDate?: string
  checkOutDate?: string
  roomType?: string
  numberOfGuests?: number
}

export interface RestaurantMetadata {
  reservationName?: string
  partySize?: number
  phoneNumber?: string
  cuisineType?: string
  priceRange?: string
}

export interface ActivityMetadata {
  provider?: string
  bookingReference?: string
  difficultyLevel?: string
  duration?: string
  pricePerPerson?: number
}

export interface TransportMetadata {
  operator?: string
  vehicleType?: string
  bookingReference?: string
  pickupLocation?: string
  dropoffLocation?: string
}

export interface MeetingMetadata {
  meetingLink?: string
  organizer?: string
  attendees?: string
  roomNumber?: string
}

export type CategoryMetadata =
  | FlightMetadata
  | HotelMetadata
  | RestaurantMetadata
  | ActivityMetadata
  | TransportMetadata
  | MeetingMetadata
  | Record<string, never>

export interface ItineraryItem {
  id: string
  trip_id: string
  day_number: number
  start_time: string | null
  end_time: string | null
  title: string
  description: string | null
  location: string | null
  location_lat: number | null
  location_lng: number | null
  category: ActivityCategory
  metadata?: CategoryMetadata
  order_index: number
  created_by: string
  created_at: string
  updated_at: string
  comments?: Comment[]
  creator?: Profile
}

export interface Comment {
  id: string
  item_id: string
  user_id: string
  content: string
  created_at: string
  user?: Profile
}

export interface ExtractedActivity {
  title: string
  description?: string
  date?: string
  start_time?: string
  end_time?: string
  location?: string
  category: ActivityCategory
  confidence: number
  metadata?: CategoryMetadata
}

export interface CreateTripInput {
  title: string
  description?: string
  destination: string
  start_date: string
  end_date: string
  trip_type: TripType
  cover_image_url?: string
}

export interface UpdateTripInput extends Partial<CreateTripInput> {
  status?: TripStatus
  is_public?: boolean
}

export interface CreateItineraryItemInput {
  trip_id: string
  day_number: number
  start_time?: string
  end_time?: string
  title: string
  description?: string
  location?: string
  location_lat?: number
  location_lng?: number
  category: ActivityCategory
  order_index: number
}

export interface UpdateItineraryItemInput extends Partial<Omit<CreateItineraryItemInput, 'trip_id'>> {}

export interface InviteCollaboratorInput {
  trip_id: string
  email: string
  role: CollaboratorRole
}
