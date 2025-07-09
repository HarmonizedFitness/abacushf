
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, User, Phone, Mail, CreditCard, FileText, Edit, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
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

interface BookingDetailModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (booking: Booking) => void
  onDelete?: (bookingId: string) => void
  onStatusChange?: (bookingId: string, status: string) => void
}

export function BookingDetailModal({ 
  booking, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: BookingDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  if (!booking) return null

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

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    try {
      await onStatusChange?.(booking.id, newStatus)
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return
    }

    setIsLoading(true)
    try {
      await onDelete?.(booking.id)
      toast({
        title: 'Booking Deleted',
        description: 'The booking has been successfully deleted.',
      })
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete booking.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const duration = calculateDuration(booking.startTime, booking.endTime)
  const startDate = parseISO(booking.startTime)
  const endDate = parseISO(booking.endTime)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-hf-text">Session Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-hf-text">
                __{duration}__ min session with {booking.user.name}
              </h3>
              <p className="text-hf-text-secondary">
                {format(startDate, 'EEEE, MMMM d, yyyy')} • {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
              </p>
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status}
            </Badge>
          </div>

          <Separator />

          {/* Client Information */}
          <Card className="bg-hf-card border-hf-card">
            <CardContent className="pt-6">
              <h4 className="font-medium text-hf-text mb-4 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Client Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-hf-orange" />
                  <span className="text-hf-text-secondary">{booking.user.email}</span>
                </div>
                {booking.user.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-hf-orange" />
                    <span className="text-hf-text-secondary">{booking.user.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Session Details */}
          <Card className="bg-hf-card border-hf-card">
            <CardContent className="pt-6">
              <h4 className="font-medium text-hf-text mb-4 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Session Details
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-hf-orange" />
                  <span className="text-hf-text-secondary">
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')} ({duration} minutes)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-hf-orange" />
                  <span className="text-hf-text-secondary">
                    {booking.creditsUsed} credit{booking.creditsUsed !== 1 ? 's' : ''} used
                  </span>
                </div>
                {booking.notes && (
                  <div className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-hf-orange mt-1" />
                    <div>
                      <p className="text-hf-text-secondary font-medium">Notes:</p>
                      <p className="text-hf-text-secondary">{booking.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => onEdit?.(booking)}
                disabled={isLoading}
                className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isLoading}
                className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            <div className="flex space-x-2">
              {booking.status === 'PENDING' && (
                <Button
                  onClick={() => handleStatusChange('CONFIRMED')}
                  disabled={isLoading}
                  className="bg-green-500 text-white hover:bg-green-600"
                >
                  Confirm
                </Button>
              )}
              {booking.status === 'CONFIRMED' && (
                <>
                  <Button
                    onClick={() => handleStatusChange('COMPLETED')}
                    disabled={isLoading}
                    className="bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Mark Complete
                  </Button>
                  <Button
                    onClick={() => handleStatusChange('NO_SHOW')}
                    disabled={isLoading}
                    variant="outline"
                    className="border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white"
                  >
                    No Show
                  </Button>
                </>
              )}
              {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                <Button
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={isLoading}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
