
import { User, Booking, Exercise, WorkoutSession, PersonalRecord, CreditPurchase } from '@prisma/client'

export type UserRole = 'CLIENT' | 'ADMIN'

export interface UserWithStats extends User {
  _count?: {
    bookings?: number
    workoutSessions?: number
    personalRecords?: number
    creditPurchases?: number
  }
  totalCredits?: number
  usedCredits?: number
  remainingCredits?: number
}

export interface BookingWithUser extends Booking {
  user: User
}

export interface WorkoutSessionWithExercises extends WorkoutSession {
  exercises: Exercise[]
}

export interface PersonalRecordWithExercise extends PersonalRecord {
  exercise: Exercise
}

export interface CreditPurchaseWithUser extends CreditPurchase {
  user: User
}

export interface DashboardStats {
  totalRevenue: number
  totalClients: number
  totalBookings: number
  totalWorkouts: number
  recentBookings: BookingWithUser[]
  topExercises: Array<{
    exercise: Exercise
    count: number
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
  }>
}

export interface ClientDashboardStats {
  remainingCredits: number
  upcomingBookings: BookingWithUser[]
  recentWorkouts: WorkoutSessionWithExercises[]
  personalRecords: PersonalRecordWithExercise[]
  totalWorkouts: number
  totalPRs: number
}

export interface TimeSlot {
  id: string
  startTime: Date
  endTime: Date
  isAvailable: boolean
  isBooked: boolean
  bookingId?: string
}

export interface WorkoutExercise {
  exerciseId: string
  exercise: Exercise
  sets: number
  reps: number
  weight?: number
  duration?: number
  notes?: string
}

export interface WorkoutLog {
  id: string
  date: Date
  duration: number
  exercises: WorkoutExercise[]
  notes?: string
  clientId: string
}

export interface ExerciseCategory {
  id: string
  name: string
  description?: string
}

export interface ExerciseWithCategory extends Omit<Exercise, 'category'> {
  category?: ExerciseCategory
}

export interface NotificationData {
  id: string
  type: 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'WORKOUT_REMINDER' | 'CREDIT_LOW' | 'PERSONAL_RECORD'
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  userId: string
}

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  pricePerSession: number
  isPopular?: boolean
  features: string[]
}

export interface BusinessHours {
  monday: { start: string; end: string; isOpen: boolean }
  tuesday: { start: string; end: string; isOpen: boolean }
  wednesday: { start: string; end: string; isOpen: boolean }
  thursday: { start: string; end: string; isOpen: boolean }
  friday: { start: string; end: string; isOpen: boolean }
  saturday: { start: string; end: string; isOpen: boolean }
  sunday: { start: string; end: string; isOpen: boolean }
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface FormErrors {
  [key: string]: string | undefined
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  image?: string
  createdAt: Date
}

export interface SessionUser extends AuthUser {
  remainingCredits?: number
  isActive?: boolean
}

// Form validation schemas
export interface LoginFormData {
  email: string
  password: string
}

export interface SignUpFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface BookingFormData {
  date: string
  time: string
  notes?: string
}

export interface WorkoutFormData {
  date: string
  duration: number
  exercises: Array<{
    exerciseId: string
    sets: number
    reps: number
    weight?: number
    duration?: number
    notes?: string
  }>
  notes?: string
}

export interface ExerciseFormData {
  name: string
  description?: string
  category?: string
  instructions?: string
  muscleGroups: string[]
  equipment?: string
}

export interface UserProfileFormData {
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  fitnessGoals?: string
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

// Chart data types
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
    fill?: boolean
  }>
}

export interface ProgressChartData {
  date: string
  weight: number
  reps: number
  sets: number
  volume: number
}

export interface RevenueChartData {
  month: string
  revenue: number
  clients: number
  sessions: number
}

export interface ExerciseStatsData {
  exerciseName: string
  totalSessions: number
  totalVolume: number
  averageWeight: number
  personalRecord: number
}

// Utility types
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

// Status types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type WorkoutStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED'

// Google Calendar Integration Types
export interface GoogleCalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export interface AvailabilitySlot {
  start: Date
  end: Date
  isAvailable: boolean
  reason?: string
}

export interface WorkingHours {
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export interface BreakTime {
  name: string
  startTime: string
  endTime: string
  dayOfWeek?: number
  isRecurring: boolean
}

export interface BlackoutPeriod {
  start: Date
  end: Date
  reason?: string
  isRecurring: boolean
}

export interface CalendarSyncResult {
  success: boolean
  eventId?: string
  error?: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC'
}

export interface AvailabilitySettings {
  workingHours: WorkingHours[]
  breaks: BreakTime[]
  blackoutPeriods: BlackoutPeriod[]
}

// Database-aligned types
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT'
export type AvailabilityType = 'WORKING_HOURS' | 'BREAK' | 'BLACKOUT_DATE' | 'BLACKOUT_PERIOD'
export type RecurringType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC'
