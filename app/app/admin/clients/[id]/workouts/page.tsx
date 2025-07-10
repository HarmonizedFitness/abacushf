
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, User, Target, Plus, Calendar, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { DataTable, Column } from '@/components/common/data-table'
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
  daysPerWeek?: number
  remainingCredits?: number
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

export default function ClientWorkoutsPage() {
  const params = useParams()
  const { toast } = useToast()
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchClientData()
      fetchWorkouts()
    }
  }, [params.id])

  const fetchClientData = async () => {
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
    }
  }

  const fetchWorkouts = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${params.id}/workouts?limit=50`)
      const data = await response.json()

      if (data.success) {
        setWorkouts(data.data)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch workouts',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to fetch workouts:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch workouts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<WorkoutSession>[] = [
    {
      key: 'date',
      title: 'Date',
      render: (value) => (
        <div>
          <p className="font-medium text-hf-text">{formatDate(value)}</p>
          <p className="text-xs text-hf-text-secondary">Workout session</p>
        </div>
      ),
    },
    {
      key: 'exercises',
      title: 'Exercises',
      render: (exercises) => (
        <div>
          <p className="font-medium text-hf-text">{exercises?.length || 0} exercises</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {exercises?.slice(0, 3).map((ex: any) => (
              <Badge key={ex.id} variant="secondary" className="text-xs">
                {ex.exercise?.name}
              </Badge>
            ))}
            {(exercises?.length || 0) > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{(exercises?.length || 0) - 3} more
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'duration',
      title: 'Duration',
      render: (value) => (
        <div className="text-center">
          <span className="text-lg font-bold text-hf-text">{value}</span>
          <p className="text-xs text-hf-text-secondary">minutes</p>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
          {value}
        </Badge>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      render: (value) => (
        <span className="text-hf-text-secondary text-sm">
          {value || 'No notes'}
        </span>
      ),
    },
  ]

  if (loading) {
    return <LoadingState message="Loading client workouts..." />
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
                </div>
                <div className="flex items-center space-x-4 text-sm text-hf-text-secondary">
                  <span>{client.email}</span>
                  <span>•</span>
                  <span>{client.daysPerWeek || 2} days per week</span>
                  <span>•</span>
                  <span>{client.remainingCredits || 0} credits remaining</span>
                </div>
              </div>
              <Button asChild className="btn-gradient">
                <Link href={`/admin/workouts/new?clientId=${client.id}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log New Workout
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-hf-text mb-2">Workout History</CardTitle>
            <CardDescription className="text-hf-text-secondary">
              Complete workout session history for {client.name}
            </CardDescription>
          </CardContent>
        </Card>

        {/* Workouts Table */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Target className="h-5 w-5 mr-2 text-hf-orange" />
              Workout Sessions ({workouts.length})
            </CardTitle>
            <CardDescription className="text-hf-text-secondary">
              All workout sessions completed by {client.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workouts.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No workouts logged"
                description="No workout sessions have been logged for this client yet"
                action={
                  <Button asChild className="btn-gradient">
                    <Link href={`/admin/workouts/new?clientId=${client.id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Log First Workout
                    </Link>
                  </Button>
                }
              />
            ) : (
              <DataTable
                data={workouts}
                columns={columns}
                searchable={false}
                filterable={false}
                actions={(workout) => (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Link href={`/admin/workouts/${workout.id}`}>
                        <Target className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Link href={`/admin/workouts/${workout.id}/edit`}>
                        <Target className="h-4 w-4 mr-2" />
                        Edit Workout
                      </Link>
                    </Button>
                  </>
                )}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
