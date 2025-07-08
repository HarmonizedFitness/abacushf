
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, User, DollarSign } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/loading-spinner'

async function BookingsContent() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Mock data for now - in a real app, this would come from the database
  const bookings = [
    {
      id: 1,
      clientName: 'Alice Johnson',
      clientEmail: 'alice@fitness.com',
      date: '2024-01-15',
      time: '10:00 AM',
      status: 'CONFIRMED',
      credits: 1
    },
    {
      id: 2,
      clientName: 'Bob Smith',
      clientEmail: 'bob@fitness.com',
      date: '2024-01-15',
      time: '2:00 PM',
      status: 'PENDING',
      credits: 1
    },
    {
      id: 3,
      clientName: 'Carol Davis',
      clientEmail: 'carol@fitness.com',
      date: '2024-01-16',
      time: '9:00 AM',
      status: 'CONFIRMED',
      credits: 1
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmed</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-hf-text mb-2">Booking Management</h1>
        <p className="text-hf-text-secondary">Manage all client bookings and sessions</p>
      </div>

      <div className="grid gap-6">
        {bookings?.map((booking) => (
          <Card key={booking.id} className="bg-hf-card border-hf-card">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-hf-text text-lg">{booking.clientName}</CardTitle>
                  <p className="text-hf-text-secondary text-sm">{booking.clientEmail}</p>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-hf-orange" />
                  <span className="text-hf-text-secondary">{booking.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-hf-orange" />
                  <span className="text-hf-text-secondary">{booking.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-hf-orange" />
                  <span className="text-hf-text-secondary">{booking.credits} credit</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white">
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookingsContent />
    </Suspense>
  )
}
