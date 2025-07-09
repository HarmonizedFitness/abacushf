
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns'

interface Booking {
  id: string
  user: {
    id: string
    name: string
    email: string
    phone?: string
  }
  startTime: string
  endTime: string
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  notes?: string
  creditsUsed: number
}

interface CalendarViewProps {
  bookings: Booking[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onBookingClick?: (booking: Booking) => void
}

export function MonthView({ bookings, currentDate, onDateChange, onBookingClick }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = useMemo(() => {
    const days = []
    let day = startDate
    
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    
    return days
  }, [startDate, endDate])

  const getBookingsForDate = (date: Date) => {
    return bookings?.filter(booking => {
      const bookingDate = parseISO(booking.startTime)
      return isSameDay(bookingDate, date)
    }) ?? []
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/20 text-green-400'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400'
      case 'CANCELLED': return 'bg-red-500/20 text-red-400'
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400'
      case 'NO_SHOW': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = parseISO(startTime)
    const end = parseISO(endTime)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-hf-text">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addMonths(currentDate, -1))}
            className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(new Date())}
            className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addMonths(currentDate, 1))}
            className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-hf-card border-hf-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-hf-text-secondary py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dayBookings = getBookingsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isDayToday = isToday(day)
              
              return (
                <div
                  key={day.toString()}
                  className={`min-h-[100px] p-2 border rounded-lg ${
                    isCurrentMonth ? 'bg-hf-background border-hf-card' : 'bg-hf-card/50 border-hf-card'
                  } ${isDayToday ? 'ring-2 ring-hf-orange' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-hf-text' : 'text-hf-text-secondary'
                  } ${isDayToday ? 'text-hf-orange' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayBookings.map(booking => {
                      const duration = calculateDuration(booking.startTime, booking.endTime)
                      const startTime = format(parseISO(booking.startTime), 'h:mm a')
                      
                      return (
                        <div
                          key={booking.id}
                          className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(booking.status)}`}
                          onClick={() => onBookingClick?.(booking)}
                        >
                          <div className="font-medium">__{duration}__ min</div>
                          <div className="truncate">{booking.user.name}</div>
                          <div>{startTime}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function WeekView({ bookings, currentDate, onDateChange, onBookingClick }: CalendarViewProps) {
  const startDate = startOfWeek(currentDate)
  const endDate = endOfWeek(currentDate)
  
  const days = useMemo(() => {
    const days = []
    let day = startDate
    
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }
    
    return days
  }, [startDate, endDate])

  const getBookingsForDate = (date: Date) => {
    return bookings?.filter(booking => {
      const bookingDate = parseISO(booking.startTime)
      return isSameDay(bookingDate, date)
    }) ?? []
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'CANCELLED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'NO_SHOW': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = parseISO(startTime)
    const end = parseISO(endTime)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-hf-text">
          {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addWeeks(currentDate, -1))}
            className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(new Date())}
            className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addWeeks(currentDate, 1))}
            className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-hf-card border-hf-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-4">
            {days.map(day => {
              const dayBookings = getBookingsForDate(day)
              const isDayToday = isToday(day)
              
              return (
                <div key={day.toString()} className="space-y-2">
                  <div className={`text-center p-2 rounded ${
                    isDayToday ? 'bg-hf-orange text-white' : 'bg-hf-background text-hf-text'
                  }`}>
                    <div className="font-medium">{format(day, 'EEE')}</div>
                    <div className="text-sm">{format(day, 'd')}</div>
                  </div>
                  
                  <div className="space-y-2 min-h-[300px]">
                    {dayBookings.map(booking => {
                      const duration = calculateDuration(booking.startTime, booking.endTime)
                      const startTime = format(parseISO(booking.startTime), 'h:mm a')
                      
                      return (
                        <Card
                          key={booking.id}
                          className={`cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(booking.status)}`}
                          onClick={() => onBookingClick?.(booking)}
                        >
                          <CardContent className="p-3">
                            <div className="font-medium text-sm">__{duration}__ min session</div>
                            <div className="text-sm">{booking.user.name}</div>
                            <div className="text-xs opacity-75">{startTime}</div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function DayView({ bookings, currentDate, onDateChange, onBookingClick }: CalendarViewProps) {
  const dayBookings = useMemo(() => {
    return bookings?.filter(booking => {
      const bookingDate = parseISO(booking.startTime)
      return isSameDay(bookingDate, currentDate)
    })?.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) ?? []
  }, [bookings, currentDate])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'CANCELLED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'NO_SHOW': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = parseISO(startTime)
    const end = parseISO(endTime)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-hf-text">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addDays(currentDate, -1))}
            className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(new Date())}
            className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(addDays(currentDate, 1))}
            className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-hf-card border-hf-card">
        <CardContent className="p-6">
          {dayBookings.length === 0 ? (
            <div className="text-center py-8 text-hf-text-secondary">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sessions scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayBookings.map(booking => {
                const duration = calculateDuration(booking.startTime, booking.endTime)
                const startTime = format(parseISO(booking.startTime), 'h:mm a')
                const endTime = format(parseISO(booking.endTime), 'h:mm a')
                
                return (
                  <Card
                    key={booking.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(booking.status)}`}
                    onClick={() => onBookingClick?.(booking)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-lg text-hf-text mb-1">
                            __{duration}__ min session with {booking.user.name}
                          </div>
                          <div className="text-sm text-hf-text-secondary mb-2">
                            {format(currentDate, 'MMMM d')} • {startTime} - {endTime}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-hf-text-secondary">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{booking.user.email}</span>
                            </div>
                            {booking.user.phone && (
                              <div className="flex items-center space-x-1">
                                <span>📞</span>
                                <span>{booking.user.phone}</span>
                              </div>
                            )}
                          </div>
                          {booking.notes && (
                            <div className="mt-2 text-sm text-hf-text-secondary">
                              <strong>Notes:</strong> {booking.notes}
                            </div>
                          )}
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
