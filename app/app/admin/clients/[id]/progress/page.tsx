
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { ProgressDashboard } from '@/components/progress/progress-dashboard'
import { formatDate, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface ClientProfile {
  id: string
  name: string
  email: string
  phone?: string
  fitnessGoals?: string
  isActive: boolean
  isArchived: boolean
  daysPerWeek?: number
  createdAt: string
  remainingCredits?: number
  _count?: {
    bookings: number
    workoutSessions: number
    personalRecords: number
  }
}

export default function ClientProgressPage() {
  const params = useParams()
  const { toast } = useToast()
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchClientProfile()
    }
  }, [params.id])

  const fetchClientProfile = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setClient(data.data)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch client profile',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to fetch client profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch client profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingState message="Loading client progress..." />
  }

  if (!client) {
    return (
      <EmptyState
        icon={User}
        title="Client not found"
        description="The client you're looking for doesn't exist."
        action={
          <Button asChild>
            <Link href="/admin/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/admin/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Link>
          </Button>
        </div>

        {/* Client Header */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                <AvatarFallback className="bg-gradient-orange text-white text-lg">
                  {getInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-hf-text">{client.name}</h1>
                  <Badge 
                    className={
                      client.isActive 
                        ? 'bg-hf-success/10 text-hf-success border-hf-success/20'
                        : 'bg-hf-error/10 text-hf-error border-hf-error/20'
                    }
                  >
                    {client.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {client.isArchived && (
                    <Badge className="bg-hf-warning/10 text-hf-warning border-hf-warning/20">
                      Archived
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-hf-text-secondary">
                  <span>{client.email}</span>
                  <span>•</span>
                  <span>{client.daysPerWeek || 2} days per week</span>
                  <span>•</span>
                  <span>{client.remainingCredits || 0} credits remaining</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-hf-text mb-2">Progress Tracking</CardTitle>
            <CardDescription className="text-hf-text-secondary">
              Track {client.name}'s fitness journey with detailed measurements and progress trends
            </CardDescription>
          </CardContent>
        </Card>

        {/* Progress Dashboard */}
        <ProgressDashboard 
          userId={client.id}
          readonly={false}
          showHeader={false}
        />
      </div>
    </div>
  )
}
