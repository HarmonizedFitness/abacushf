
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return formatDate(date)
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m` 
      : `${hours}h`
  }
}

export function formatWeight(weight: number): string {
  return `${weight} lbs`
}

export function calculateBMI(weight: number, height: number): number {
  // weight in kg, height in cm
  const heightInMeters = height / 100
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

export function generatePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  
  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''
  
  // Ensure at least one character from each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}

export function getRandomColor(): string {
  const colors = [
    '#FF8C42', '#D65A31', '#4FD1C5', '#F56565',
    '#9F7AEA', '#38B2AC', '#ED8936', '#48BB78',
    '#4299E1', '#667EEA', '#ED64A6', '#F56565'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function parseQueryParams(url: string): Record<string, string> {
  const params = new URLSearchParams(url.split('?')[1])
  const result: Record<string, string> = {}
  
  for (const [key, value] of params) {
    result[key] = value
  }
  
  return result
}

export function buildQueryString(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString())
    }
  })
  
  return searchParams.toString()
}

export function getTimeFromDate(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return isSameDay(date, tomorrow)
}

export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(d.setDate(diff))
}

export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date)
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function chunk<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  )
}

export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch(err => {
    if (attempts <= 1) throw err
    return sleep(delay).then(() => retry(fn, attempts - 1, delay))
  })
}

export function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const formattedSize = (bytes / Math.pow(1024, i)).toFixed(2)
  
  return `${formattedSize} ${sizes[i]}`
}

export function downloadFile(data: Blob, filename: string): void {
  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

export function safeParseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function isEqual(a: any, b: any): boolean {
  if (a === b) return true
  
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false
  
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false
    if (a.length !== b.length) return false
    return a.every((item, index) => isEqual(item, b[index]))
  }
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    return keysA.every(key => isEqual(a[key], b[key]))
  }
  
  return false
}

// Workout utility functions
export function getTotalExerciseCount(workout: any): number {
  if (!workout) return 0
  
  // Count ungrouped exercises
  const ungroupedCount = workout.exercises?.length || 0
  
  // Count grouped exercises
  const groupedCount = workout.groups?.reduce((total: number, group: any) => {
    return total + (group.exercises?.length || 0)
  }, 0) || 0
  
  return ungroupedCount + groupedCount
}

export function getAllExercises(workout: any) {
  if (!workout) return []
  
  const allExercises: any[] = []
  
  // Add ungrouped exercises
  if (workout.exercises) {
    workout.exercises.forEach((ex: any) => {
      allExercises.push({
        ...ex,
        isGrouped: false
      })
    })
  }
  
  // Add grouped exercises
  if (workout.groups) {
    workout.groups.forEach((group: any) => {
      if (group.exercises) {
        group.exercises.forEach((ex: any) => {
          allExercises.push({
            ...ex,
            isGrouped: true,
            groupInfo: {
              name: group.name,
              type: group.type,
              rounds: group.rounds
            }
          })
        })
      }
    })
  }
  
  return allExercises
}

// FIXED: Generate meaningful workout filename/display name
export function generateWorkoutDisplayName(workout: any): string {
  if (!workout) return 'Unknown Workout'
  
  try {
    // Get user name and extract last name + first initial
    const userName = workout.user?.name || 'Unknown'
    const nameParts = userName.trim().split(' ')
    
    let nameCode = 'Unknown'
    if (nameParts.length >= 2) {
      const firstName = nameParts[0]
      const lastName = nameParts[nameParts.length - 1]
      nameCode = `${lastName}${firstName.charAt(0).toUpperCase()}`
    } else if (nameParts.length === 1) {
      nameCode = nameParts[0].substring(0, 8) // Use first 8 chars if only one name
    }
    
    // Format date as DDMMMYY (e.g., 10JUL25)
    const workoutDate = new Date(workout.date)
    const day = workoutDate.getDate().toString().padStart(2, '0')
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const month = monthNames[workoutDate.getMonth()]
    const year = workoutDate.getFullYear().toString().slice(-2)
    
    return `${nameCode}_${day}${month}${year}`
  } catch (error) {
    console.error('Error generating workout display name:', error)
    return `Workout_${workout.id?.substring(0, 8) || 'Unknown'}`
  }
}

// Generate workout URL slug while keeping database ID for routing
export function generateWorkoutSlug(workout: any): string {
  const displayName = generateWorkoutDisplayName(workout)
  return `${workout.id}?name=${encodeURIComponent(displayName)}`
}

export function generateWorkoutIdentifier(clientName: string, date: string): string {
  if (!clientName || !date) return 'Unknown'
  
  const workoutDate = new Date(date)
  const day = workoutDate.getDate().toString().padStart(2, '0')
  const month = workoutDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const year = workoutDate.getFullYear().toString().slice(-2)
  
  // Clean client name - take first name and first letter of last name
  const nameParts = clientName.trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastInitial = nameParts[1]?.charAt(0) || ''
  const cleanName = (firstName + lastInitial).replace(/[^a-zA-Z]/g, '')
  
  return `${cleanName}_${day}${month}${year}`
}

// Personal Records calculation utilities
export function calculatePersonalRecords(workoutSets: any[], userBodyWeight?: number) {
  const prsByExercise: Record<string, {
    exerciseId: string
    exerciseName: string
    category: string
    maxWeight: { weight: number, reps: number, achievedAt: string, workoutSessionId: string } | null
    maxVolume: { weight: number, reps: number, volume: number, achievedAt: string, workoutSessionId: string } | null
    maxReps: { reps: number, weight: number, achievedAt: string, workoutSessionId: string } | null
    isBodyweight: boolean
    totalLifetimeVolume: number
  }> = {}

  workoutSets.forEach((set: any) => {
    const exerciseId = set.workoutExercise?.exerciseId
    const exerciseName = set.workoutExercise?.exercise?.name
    const exerciseCategory = set.workoutExercise?.exercise?.category
    const exercise = set.workoutExercise?.exercise
    
    // Use the more comprehensive bodyweight detection
    const isBodyweight = isBodyweightExercise(exercise) || (!set.weight || set.weight === 0)

    if (!exerciseId || !set.reps) return

    // Initialize exercise record if not exists
    if (!prsByExercise[exerciseId]) {
      prsByExercise[exerciseId] = {
        exerciseId,
        exerciseName: exerciseName || 'Unknown Exercise',
        category: exerciseCategory || 'Unknown',
        maxWeight: null,
        maxVolume: null,
        maxReps: null,
        isBodyweight,
        totalLifetimeVolume: 0
      }
    }

    const reps = Number(set.reps) || 0
    const setWeight = Number(set.weight) || 0
    const achievedAt = set.workoutExercise?.workoutSession?.date || set.createdAt || new Date().toISOString()
    const workoutSessionId = set.workoutExercise?.workoutSessionId

    if (isBodyweight) {
      // For bodyweight exercises, track max reps as the primary PR
      if (reps > 0 && (!prsByExercise[exerciseId].maxReps || reps > prsByExercise[exerciseId].maxReps!.reps)) {
        prsByExercise[exerciseId].maxReps = {
          reps,
          weight: userBodyWeight || 0, // Store body weight for reference
          achievedAt,
          workoutSessionId
        }
      }
      
      // If additional weight is used (weighted bodyweight exercise)
      if (setWeight > 0) {
        const totalWeight = (userBodyWeight || 0) + setWeight
        
        // FIXED: Weight PR = Single heaviest weight moved (regardless of reps)
        if (!prsByExercise[exerciseId].maxWeight || totalWeight > prsByExercise[exerciseId].maxWeight!.weight) {
          prsByExercise[exerciseId].maxWeight = {
            weight: totalWeight,
            reps,
            achievedAt,
            workoutSessionId
          }
        }
        
        // FIXED: Volume PR = Highest single set volume (weight × reps for ONE set)
        const singleSetVolume = totalWeight * reps
        if (!prsByExercise[exerciseId].maxVolume || singleSetVolume > prsByExercise[exerciseId].maxVolume!.volume) {
          prsByExercise[exerciseId].maxVolume = {
            weight: totalWeight,
            reps,
            volume: singleSetVolume,
            achievedAt,
            workoutSessionId
          }
        }

        // Track total lifetime volume
        prsByExercise[exerciseId].totalLifetimeVolume += singleSetVolume
      } else {
        // For pure bodyweight, use bodyweight as weight if available
        const effectiveWeight = userBodyWeight || 0
        if (effectiveWeight > 0) {
          const singleSetVolume = effectiveWeight * reps
          prsByExercise[exerciseId].totalLifetimeVolume += singleSetVolume
        }
      }
    } else {
      // For weighted exercises, track max weight and volume
      if (setWeight > 0) {
        // FIXED: Weight PR = Single heaviest weight moved (regardless of reps)
        if (!prsByExercise[exerciseId].maxWeight || setWeight > prsByExercise[exerciseId].maxWeight!.weight) {
          prsByExercise[exerciseId].maxWeight = {
            weight: setWeight,
            reps,
            achievedAt,
            workoutSessionId
          }
        }

        // FIXED: Volume PR = Highest single set volume (weight × reps for ONE set)
        const singleSetVolume = setWeight * reps
        if (!prsByExercise[exerciseId].maxVolume || singleSetVolume > prsByExercise[exerciseId].maxVolume!.volume) {
          prsByExercise[exerciseId].maxVolume = {
            weight: setWeight,
            reps,
            volume: singleSetVolume,
            achievedAt,
            workoutSessionId
          }
        }

        // Track total lifetime volume
        prsByExercise[exerciseId].totalLifetimeVolume += singleSetVolume
      }
    }
  })

  return Object.values(prsByExercise)
}

export function formatPRDisplay(pr: any, isBodyweight: boolean = false, prType: 'weight' | 'volume' | 'reps' = 'weight'): string {
  if (!pr) return '-'
  
  if (isBodyweight) {
    if (prType === 'reps') {
      // For bodyweight exercises, show max reps achieved
      return pr.reps ? `${pr.reps} reps` : '-'
    } else if (prType === 'weight' && pr.weight > 0) {
      // For weighted bodyweight exercises (e.g., weighted pull-ups)
      const additionalWeight = pr.weight - (pr.bodyWeight || 0)
      if (additionalWeight > 0) {
        return `BW + ${additionalWeight} lbs × ${pr.reps || 1}`
      } else {
        return pr.reps ? `BW × ${pr.reps}` : 'BW'
      }
    } else {
      // Default bodyweight display
      return pr.reps ? `BW × ${pr.reps}` : 'BW'
    }
  }
  
  // For regular weighted exercises
  if (prType === 'volume' && pr.volume) {
    return `${pr.volume.toLocaleString()} lbs`
  } else if (prType === 'weight' && pr.weight) {
    // Weight PR shows heaviest single weight moved (regardless of reps)
    return `${pr.weight} lbs`
  } else if (pr.weight && pr.reps) {
    return `${pr.weight} lbs × ${pr.reps}`
  } else if (pr.weight) {
    return `${pr.weight} lbs`
  } else if (pr.reps) {
    return `${pr.reps} reps`
  }
  
  return '-'
}

export function formatPRDisplayWithHighlight(pr: any, isBodyweight: boolean = false, prType: 'weight' | 'volume' | 'reps' = 'weight'): { text: string; isWeightPR: boolean } {
  const text = formatPRDisplay(pr, isBodyweight, prType)
  const isWeightPR = prType === 'weight' && !isBodyweight && pr?.weight
  
  return { text, isWeightPR }
}

export function formatVolumeDisplay(volume: number, isBodyweight: boolean = false, reps?: number): string {
  if (!volume || volume === 0) {
    if (isBodyweight && reps) {
      return `${reps} BW×reps`
    }
    return '-'
  }
  
  if (isBodyweight) {
    return `${volume.toLocaleString()} BW×reps`
  }
  
  return `${volume.toLocaleString()} lbs`
}

export function isBodyweightExercise(exercise: any): boolean {
  if (!exercise) return false
  
  const category = exercise.category?.toLowerCase() || ''
  const equipment = exercise.equipment?.toLowerCase() || ''
  const name = exercise.name?.toLowerCase() || ''
  
  return category.includes('bodyweight') || 
         equipment.includes('bodyweight') || 
         name.includes('bodyweight') ||
         name.includes('push-up') ||
         name.includes('pull-up') ||
         name.includes('chin-up') ||
         name.includes('dip') ||
         name.includes('plank')
}

// Calculate accurate PR statistics from calculated PRs
export function calculatePRStatistics(calculatedPRs: any[]): {
  totalPRs: number
  totalLifetimeVolume: number
  categoriesCount: number
  thisMonthPRs: number
} {
  const totalPRs = calculatedPRs.length
  
  // Calculate total lifetime volume from all exercises
  const totalLifetimeVolume = calculatedPRs.reduce((sum, pr) => {
    return sum + (pr.totalLifetimeVolume || 0)
  }, 0)
  
  // Count unique categories
  const categories = new Set(calculatedPRs.map(pr => pr.category))
  const categoriesCount = categories.size
  
  // Count PRs from this month (based on maxWeight or maxVolume achievedAt)
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  
  const thisMonthPRs = calculatedPRs.filter(pr => {
    const maxWeightDate = pr.maxWeight ? new Date(pr.maxWeight.achievedAt) : null
    const maxVolumeDate = pr.maxVolume ? new Date(pr.maxVolume.achievedAt) : null
    
    const latestPRDate = maxWeightDate && maxVolumeDate 
      ? new Date(Math.max(maxWeightDate.getTime(), maxVolumeDate.getTime()))
      : maxWeightDate || maxVolumeDate
      
    return latestPRDate && latestPRDate >= oneMonthAgo
  }).length
  
  return {
    totalPRs,
    totalLifetimeVolume,
    categoriesCount,
    thisMonthPRs
  }
}

// Calculate accurate credits considering completed workouts
export async function calculateAccurateCredits(userId: string): Promise<{
  remainingCredits: number
  totalPurchased: number
  totalUsed: number
  completedWorkouts: number
}> {
  // This function would need to be called from API routes where prisma is available
  // Adding it here as a utility structure for use in API routes
  return {
    remainingCredits: 0,
    totalPurchased: 0, 
    totalUsed: 0,
    completedWorkouts: 0
  }
}
