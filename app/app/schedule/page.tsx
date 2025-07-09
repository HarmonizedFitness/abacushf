
"use client"

import { useEffect, useState } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LoadingState, StatusMessage } from '@/components/common/status-message'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatTime } from '@/lib/utils'

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  duration: number
  isAvailable: boolean
}

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  notes?: string
  creditsUsed: number
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingDialog, setBookingDialog] = useState<{
    open: boolean
    slot?: TimeSlot
  }>({ open: false })
  const [bookingNotes, setBookingNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [userCredits, setUserCredits] = useState(0)

  const { toast } = useToast()

  useEffect(() => {
    fetchAvailableSlots()
    fetchBookings()
    fetchUserCredits()
  }, [selectedDate])

  const fetchAvailableSlots = async () => {
    try {
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const response = await fetch('/api/calendar/freebusy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          slotDuration: 60 // 60 minutes slots
        })
      })
      
      const data = await response.json()

      if (data.success) {
        // Convert availability slots to time slots format
        const availableSlots = data.data?.availableSlots || []
        
        const formattedSlots: TimeSlot[] = availableSlots.map((slot: any, index: number) => ({
          id: `slot-${index}`,
          startTime: slot.start,
          endTime: slot.end,
          duration: 60, // Default 60 minutes
          isAvailable: slot.isAvailable
        }))
        
        setTimeSlots(formattedSlots)
      } else {
        console.error('Failed to fetch availability:', data.error)
        setTimeSlots([])
      }
    } catch (error) {
      console.error('Failed to fetch time slots:', error)
      setTimeSlots([])
    }
  }

  const fetchBookings = async () => {
    try {
      const startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)

      const response = await fetch(
        `/api/bookings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      const data = await response.json()

      if (data.success) {
        setBookings(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/credits')
      const data = await response.json()
      
      if (data.success) {
        setUserCredits(data.data?.remainingCredits || 0)
      }
    } catch (error) {
      console.error('Failed to fetch user credits:', error)
    }
  }

  const handleBookSession = async () => {
    if (!bookingDialog.slot) return

    if (userCredits < 1) {
      toast({
        title: 'Insufficient Credits',
        description: 'You need at least 1 credit to book a session.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: bookingDialog.slot.startTime,
          endTime: bookingDialog.slot.endTime,
          notes: bookingNotes.trim() || undefined,
          creditsUsed: 1,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Confirm Your Session',
          description: 'Your session has been booked and added to our schedule. See you soon!',
        })
        setBookingDialog({ open: false })
        setBookingNotes('')
        fetchAvailableSlots()
        fetchBookings()
        fetchUserCredits()
      } else {
        throw new Error(data.error || 'Failed to book session')
      }
    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to book session. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setSelectedDate(newDate)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingState message="Loading schedule..." />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-hf-text">Schedule</h1>
            <p className="text-hf-text-secondary">Book your training sessions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-hf-text-secondary">Credits: </span>
              <span className="font-bold text-hf-orange">{userCredits}</span>
            </div>
            {userCredits < 3 && (
              <Button asChild variant="outline" size="sm" className="border-hf-orange text-hf-orange">
                <a href="/credits">Buy Credits</a>
              </Button>
            )}
          </div>
        </div>

        {/* Credit Warning */}
        {userCredits === 0 && (
          <StatusMessage
            type="warning"
            title="No Credits Available"
            message="You need credits to book training sessions. Purchase credits to get started."
          />
        )}

        {/* Date Navigator */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-hf-text flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-hf-orange" />
                  {formatDate(selectedDate)}
                  {isToday(selectedDate) && (
                    <Badge className="ml-2 bg-hf-orange/10 text-hf-orange border-hf-orange/20">
                      Today
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-hf-text-secondary">
                  Select a date to view available time slots
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate('prev')}
                  className="border-hf-card"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(new Date())}
                  className="border-hf-card"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate('next')}
                  className="border-hf-card"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Time Slots Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {timeSlots.length === 0 ? (
            <div className="col-span-full">
              <Card className="bg-hf-card border-hf-card">
                <CardContent className="py-12 text-center">
                  <XCircle className="h-12 w-12 text-hf-text-secondary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-hf-text mb-2">
                    {isPastDate(selectedDate) ? 'Date has passed' : 'No availability'}
                  </h3>
                  <p className="text-hf-text-secondary">
                    {isPastDate(selectedDate)
                      ? 'Please select a future date to book sessions.'
                      : 'There are no available time slots for this date.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            timeSlots.map((slot) => {
              const isBooked = bookings.some(
                (booking) =>
                  new Date(booking.startTime).getTime() === new Date(slot.startTime).getTime()
              )
              
              const booking = bookings.find(
                (b) => new Date(b.startTime).getTime() === new Date(slot.startTime).getTime()
              )

              return (
                <Card
                  key={slot.id}
                  className={`bg-hf-card border-hf-card transition-all duration-200 ${
                    slot.isAvailable && !isBooked && !isPastDate(selectedDate)
                      ? 'hover:border-hf-orange/50 cursor-pointer card-hover'
                      : ''
                  }`}
                  onClick={() => {
                    if (slot.isAvailable && !isBooked && !isPastDate(selectedDate) && userCredits > 0) {
                      setBookingDialog({ open: true, slot })
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-hf-text-secondary" />
                        <span className="font-medium text-hf-text">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                      </div>
                      <div className="text-sm text-hf-text-secondary">
                        {slot.duration} min
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        {isBooked ? (
                          <Badge className="bg-hf-success/10 text-hf-success border-hf-success/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Booked
                          </Badge>
                        ) : slot.isAvailable && !isPastDate(selectedDate) ? (
                          <Badge className="bg-hf-success/10 text-hf-success border-hf-success/20">
                            ✅ Available
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
                            {isPastDate(selectedDate) ? '❌ Past' : '❌ Unavailable'}
                          </Badge>
                        )}
                      </div>

                      {slot.isAvailable && !isBooked && !isPastDate(selectedDate) && (
                        <Button
                          size="sm"
                          className="btn-gradient"
                          disabled={userCredits === 0}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Book
                        </Button>
                      )}
                    </div>

                    {isBooked && booking && (
                      <div className="mt-3 pt-3 border-t border-hf-card">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-hf-text-secondary">Status:</span>
                          <Badge
                            className={
                              booking.status === 'CONFIRMED'
                                ? 'bg-hf-success/10 text-hf-success'
                                : 'bg-hf-error/10 text-hf-error'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        {booking.notes && (
                          <div className="mt-2">
                            <span className="text-xs text-hf-text-secondary">Notes:</span>
                            <p className="text-sm text-hf-text mt-1">{booking.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Current Bookings */}
        {bookings.length > 0 && (
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text">Your Bookings for {formatDate(selectedDate)}</CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Manage your scheduled sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-hf-dark rounded-lg border border-hf-card"
                  >
                    <div>
                      <p className="font-medium text-hf-text">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </p>
                      {booking.notes && (
                        <p className="text-sm text-hf-text-secondary mt-1">
                          {booking.notes}
                        </p>
                      )}
                      <div className="flex items-center mt-2 gap-2">
                        <Badge
                          className={
                            booking.status === 'CONFIRMED'
                              ? 'bg-hf-success/10 text-hf-success border-hf-success/20'
                              : 'bg-hf-error/10 text-hf-error border-hf-error/20'
                          }
                        >
                          {booking.status}
                        </Badge>
                        <span className="text-xs text-hf-text-secondary">
                          {booking.creditsUsed} credit{booking.creditsUsed !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="border-hf-card">
                        <a href={`/bookings/${booking.id}`}>View</a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Dialog */}
        <Dialog open={bookingDialog.open} onOpenChange={(open) => setBookingDialog({ open })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-hf-text">Book Training Session</DialogTitle>
              <DialogDescription className="text-hf-text-secondary">
                {bookingDialog.slot && (
                  <>
                    {formatDate(selectedDate)} at{' '}
                    {formatTime(bookingDialog.slot.startTime)} - {formatTime(bookingDialog.slot.endTime)}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-hf-card rounded-lg">
                <span className="text-hf-text-secondary">Session Duration:</span>
                <span className="font-medium text-hf-text">
                  {bookingDialog.slot?.duration} minutes
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-hf-card rounded-lg">
                <span className="text-hf-text-secondary">Credits Required:</span>
                <span className="font-medium text-hf-text">1 credit</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-hf-card rounded-lg">
                <span className="text-hf-text-secondary">Your Credits:</span>
                <span className={`font-medium ${userCredits > 0 ? 'text-hf-orange' : 'text-hf-error'}`}>
                  {userCredits} available
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-hf-text">
                  Session Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific goals or requirements for this session..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setBookingDialog({ open: false })}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBookSession}
                disabled={submitting || userCredits === 0}
                className="btn-gradient"
              >
                {submitting ? 'Booking...' : 'Book Session'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedLayout>
  )
}
