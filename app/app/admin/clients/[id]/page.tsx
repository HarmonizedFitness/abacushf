
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft, 
  Edit, 
  CreditCard, 
  Mail, 
  Phone, 
  Calendar, 
  Trophy, 
  Activity,
  Target,
  User,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { formatDate, formatRelativeTime, getInitials } from '@/lib/utils'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  fitnessGoals?: string
  isActive: boolean
  createdAt: string
  remainingCredits: number
  _count: {
    bookings: number
    workoutSessions: number
    personalRecords: number
    creditPurchases: number
  }
}

interface WorkoutSession {
  id: string
  date: string
  duration: number
  notes?: string
  status: string
  exercises: Array<{
    id: string
    exercise: {
      name: string
    }
  }>
}

interface PersonalRecord {
  id: string
  exerciseId: string
  weight?: number
  reps?: number
  duration?: number
  volume?: number
  achievedAt: string
  exercise: {
    name: string
  }
}

export default function ClientProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchClientData()
    }
  }, [params.id])

  const fetchClientData = async () => {
    try {
      // Fetch client details
      const clientResponse = await fetch(`/api/admin/clients/${params.id}`)
      const clientData = await clientResponse.json()

      if (clientData.success) {
        setClient(clientData.data)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch client details',
          variant: 'destructive',
        })
        router.push('/admin/clients')
        return
      }

      // Fetch workout sessions
      const workoutsResponse = await fetch(`/api/admin/clients/${params.id}/workouts`)
      const workoutsData = await workoutsResponse.json()
      if (workoutsData.success) {
        setWorkoutSessions(workoutsData.data || [])
      }

      // Fetch personal records
      const recordsResponse = await fetch(`/api/admin/clients/${params.id}/records`)
      const recordsData = await recordsResponse.json()
      if (recordsData.success) {
        setPersonalRecords(recordsData.data || [])
      }

    } catch (error) {
      console.error('Failed to fetch client data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch client details',
        variant: 'destructive',
      })
      router.push('/admin/clients')
    } finally {
      setLoading(false)
    }
  }

  const toggleClientStatus = async () => {
    if (!client) return

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !client.isActive,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setClient({ ...client, isActive: !client.isActive })
        toast({
          title: client.isActive ? 'Client deactivated' : 'Client activated',
          description: `${client.name} has been ${client.isActive ? 'deactivated' : 'activated'}.`,
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update client status',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update client status',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <LoadingState message="Loading client profile..." />
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
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Link>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button asChild variant="outline">
              <Link href={`/admin/clients/${client.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/clients/${client.id}/credits`}>
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Credits
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Client Header */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2 bg-hf-card border-hf-card">
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
                </div>
                <div className="space-y-1 text-sm text-hf-text-secondary">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDate(client.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {client.fitnessGoals && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-hf-text">
                  <Target className="h-4 w-4 text-hf-orange" />
                  <span className="font-medium">Fitness Goals</span>
                </div>
                <p className="text-hf-text-secondary">{client.fitnessGoals}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-hf-orange" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-hf-orange">
                {client.remainingCredits}
              </div>
              <p className="text-hf-text-secondary">remaining credits</p>
              <Button asChild className="w-full mt-4 btn-gradient">
                <Link href={`/admin/clients/${client.id}/credits`}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Credits
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="bg-hf-card border-hf-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-hf-text">{client._count.bookings}</div>
            <p className="text-xs text-hf-text-secondary">Total bookings</p>
          </CardContent>
        </Card>

        <Card className="bg-hf-card border-hf-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-hf-text">{client._count.workoutSessions}</div>
            <p className="text-xs text-hf-text-secondary">Completed workouts</p>
          </CardContent>
        </Card>

        <Card className="bg-hf-card border-hf-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
              <Trophy className="h-4 w-4 mr-2" />
              Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-hf-text">{client._count.personalRecords}</div>
            <p className="text-xs text-hf-text-secondary">PRs achieved</p>
          </CardContent>
        </Card>

        <Card className="bg-hf-card border-hf-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-hf-text">{client._count.creditPurchases}</div>
            <p className="text-xs text-hf-text-secondary">Credit purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Activity className="h-5 w-5 mr-2 text-hf-orange" />
              Recent Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workoutSessions.length > 0 ? (
              <div className="space-y-4">
                {workoutSessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-hf-dark rounded-lg border border-hf-card"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Badge className={session.status === 'COMPLETED' ? 'bg-hf-success/10 text-hf-success' : 'bg-hf-warning/10 text-hf-warning'}>
                          {session.status === 'COMPLETED' ? 'Completed' : session.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium text-hf-text text-sm">
                          {formatDate(session.date)}
                        </p>
                        <p className="text-xs text-hf-text-secondary">
                          {session.exercises?.length || 0} exercises • {session.duration}min
                        </p>
                      </div>
                    </div>
                    <Clock className="h-4 w-4 text-hf-text-secondary" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="No workouts yet"
                description="This client hasn't completed any workouts."
              />
            )}
          </CardContent>
        </Card>

        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-hf-orange" />
              Recent Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {personalRecords.length > 0 ? (
              <div className="space-y-4">
                {personalRecords.slice(0, 5).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-hf-dark rounded-lg border border-hf-card"
                  >
                    <div>
                      <p className="font-medium text-hf-text text-sm">
                        {record.exercise?.name}
                      </p>
                      <p className="text-xs text-hf-text-secondary">
                        {formatDate(record.achievedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-hf-orange font-bold">
                        {record.weight ? `${record.weight} lbs` : 
                         record.duration ? `${record.duration}s` : 
                         record.reps ? `${record.reps} reps` : 
                         record.volume ? `${record.volume} vol` : 'PR'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Trophy}
                title="No personal records"
                description="This client hasn't set any personal records yet."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center">
        <Button
          onClick={toggleClientStatus}
          variant={client.isActive ? 'destructive' : 'default'}
          className={client.isActive ? '' : 'btn-gradient'}
        >
          {client.isActive ? 'Deactivate Client' : 'Activate Client'}
        </Button>
      </div>
    </div>
  )
}
