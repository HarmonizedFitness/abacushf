
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Settings, Home, ArrowLeft, Search, Filter, Plus } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { StatusMessage } from '@/components/common/status-message'
import { MonthView, WeekView, DayView } from '@/components/schedule/calendar-views'
import { AvailabilityDialog } from '@/components/schedule/availability-management'
import { BookingDetailModal } from '@/components/schedule/booking-detail-modal'
import { useToast } from '@/hooks/use-toast'

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

type ViewType = 'month' | 'week' | 'day'

export default function AdminSchedulePage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<ViewType>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchQuery, statusFilter])

  const fetchBookings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/bookings?limit=100')
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }
      
      const data = await response.json()
      if (data.success) {
        setBookings(data.data || [])
      } else {
        throw new Error(data.error || 'Failed to fetch bookings')
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to load bookings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const filterBookings = () => {
    let filtered = bookings

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(booking => 
        booking.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    setFilteredBookings(filtered)
  }

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking)
  }

  const handleBookingEdit = (booking: Booking) => {
    // In a real app, this would open an edit modal
    toast({
      title: 'Edit Booking',
      description: 'Edit functionality will be implemented here.',
    })
  }

  const handleBookingDelete = async (bookingId: string) => {
    try {
      // In a real app, this would call the delete API
      setBookings(prev => prev.filter(b => b.id !== bookingId))
      toast({
        title: 'Booking Deleted',
        description: 'The booking has been successfully deleted.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete booking.',
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      // In a real app, this would call the update API
      setBookings(prev => 
        prev.map(b => 
          b.id === bookingId 
            ? { ...b, status: newStatus as any }
            : b
        )
      )
      toast({
        title: 'Status Updated',
        description: `Booking status changed to ${newStatus.toLowerCase()}.`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update booking status.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <StatusMessage
          type="error"
          title="Error Loading Schedule"
          message={error}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/dashboard')}
              className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <AvailabilityDialog>
              <Button className="bg-hf-orange text-white hover:bg-hf-orange/90">
                <Settings className="h-4 w-4 mr-2" />
                Manage Availability
              </Button>
            </AvailabilityDialog>
            <Button
              variant="outline"
              className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-hf-text mb-2">Schedule</h1>
          <p className="text-hf-text-secondary">Manage your training sessions and availability</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-hf-card border-hf-card mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-hf-text-secondary" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-hf-background rounded-lg p-1">
              <Button
                variant={currentView === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('month')}
                className={currentView === 'month' ? 'bg-hf-orange text-white' : ''}
              >
                Month
              </Button>
              <Button
                variant={currentView === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('week')}
                className={currentView === 'week' ? 'bg-hf-orange text-white' : ''}
              >
                Week
              </Button>
              <Button
                variant={currentView === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('day')}
                className={currentView === 'day' ? 'bg-hf-orange text-white' : ''}
              >
                Day
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Views */}
      <div className="mb-6">
        {currentView === 'month' && (
          <MonthView
            bookings={filteredBookings}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onBookingClick={handleBookingClick}
          />
        )}
        {currentView === 'week' && (
          <WeekView
            bookings={filteredBookings}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onBookingClick={handleBookingClick}
          />
        )}
        {currentView === 'day' && (
          <DayView
            bookings={filteredBookings}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onBookingClick={handleBookingClick}
          />
        )}
      </div>

      {/* Session Summary */}
      <Card className="bg-hf-card border-hf-card">
        <CardHeader>
          <CardTitle className="text-hf-text flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-hf-text">{filteredBookings.length}</div>
              <div className="text-sm text-hf-text-secondary">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {filteredBookings.filter(b => b.status === 'CONFIRMED').length}
              </div>
              <div className="text-sm text-hf-text-secondary">Confirmed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {filteredBookings.filter(b => b.status === 'PENDING').length}
              </div>
              <div className="text-sm text-hf-text-secondary">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {filteredBookings.filter(b => b.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-hf-text-secondary">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {filteredBookings.filter(b => b.status === 'CANCELLED').length}
              </div>
              <div className="text-sm text-hf-text-secondary">Cancelled</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onEdit={handleBookingEdit}
        onDelete={handleBookingDelete}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
