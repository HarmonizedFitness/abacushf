
'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft, User, Trophy, Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { DataTable, Column } from '@/components/common/data-table'
import { formatDate, formatRelativeTime, formatPRDisplayWithHighlight, getInitials } from '@/lib/utils'
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

interface PersonalRecord {
  id: string
  weight?: number
  reps?: number
  duration?: number
  volume?: number
  notes?: string
  achievedAt: string
  isBodyweight: boolean
  calculated?: {
    maxWeight?: {
      weight: number
      reps: number
      achievedAt: string
      workoutSessionId: string
    }
    maxVolume?: {
      weight: number
      reps: number
      volume: number
      achievedAt: string
      workoutSessionId: string
    }
    userBodyWeight?: number
    totalLifetimeVolume?: number
  }
  exercise: {
    id: string
    name: string
    category: string
    muscleGroups: string[]
  }
}

export default function ClientRecordsPage() {
  const params = useParams()
  const { toast } = useToast()
  const [client, setClient] = useState<ClientProfile | null>(null)
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchClientData()
      fetchRecords()
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

  const fetchRecords = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${params.id}/records?limit=50&calculate=true`)
      const data = await response.json()

      if (data.success) {
        // FIXED: Filter out bodyweight exercises to match client view
        const filteredRecords = data.data.filter((record: PersonalRecord) => !record.isBodyweight)
        setRecords(filteredRecords)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch personal records',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to fetch personal records:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch personal records',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<PersonalRecord>[] = [
    {
      key: 'exercise',
      title: 'Exercise',
      render: (exercise) => (
        <div>
          <p className="font-medium text-hf-text">{exercise.name}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20 text-xs">
              {exercise.category}
            </Badge>
            {exercise.muscleGroups.slice(0, 2).map((muscle: string) => (
              <Badge key={muscle} variant="secondary" className="text-xs">
                {muscle}
              </Badge>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'weight',
      title: 'Weight PR',
      render: (value, record) => {
        const prDisplay = formatPRDisplayWithHighlight(
          { weight: record.weight, reps: record.reps, duration: record.duration }, 
          record.isBodyweight, 
          'weight'
        )
        return (
          <div className="text-center">
            <p className={`font-bold ${prDisplay.isWeightPR ? 'text-hf-orange font-extrabold' : 'text-hf-orange'}`}>
              {prDisplay.text}
            </p>
            <p className="text-xs text-hf-text-secondary">heaviest single</p>
          </div>
        )
      },
    },
    {
      key: 'volume',
      title: 'Volume PR',
      render: (value, record) => {
        const prDisplay = formatPRDisplayWithHighlight(
          { weight: record.weight, reps: record.reps, duration: record.duration, volume: record.volume }, 
          record.isBodyweight, 
          'volume'
        )
        return (
          <div className="text-center">
            <p className="font-bold text-hf-text">{prDisplay.text}</p>
            <p className="text-xs text-hf-text-secondary">max volume</p>
          </div>
        )
      },
    },
    {
      key: 'achievedAt',
      title: 'Achieved',
      render: (value) => (
        <div>
          <p className="text-sm text-hf-text">{formatDate(value)}</p>
          <p className="text-xs text-hf-text-secondary">{formatRelativeTime(value)}</p>
        </div>
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
    return <LoadingState message="Loading personal records..." />
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

  // Calculate categories count (distinct muscle groups)
  const categories = new Set(records.flatMap(record => record.exercise.muscleGroups)).size
  
  // FIXED: Calculate total volume properly using calculated PRs if available
  const totalVolume = records.reduce((sum, record) => {
    if (record.calculated?.maxVolume) {
      return sum + record.calculated.maxVolume.volume
    }
    return sum + (record.volume || 0)
  }, 0)

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
            </div>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-hf-text mb-2">Personal Records</CardTitle>
            <CardDescription className="text-hf-text-secondary">
              {client.name}'s personal bests and achievements across all exercises
            </CardDescription>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-hf-card border-hf-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-hf-orange" />
                <div>
                  <p className="text-sm font-medium text-hf-text-secondary">Total PRs</p>
                  <p className="text-2xl font-bold text-hf-text">{records.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-hf-orange" />
                <div>
                  <p className="text-sm font-medium text-hf-text-secondary">Categories</p>
                  <p className="text-2xl font-bold text-hf-text">{categories}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-hf-orange" />
                <div>
                  <p className="text-sm font-medium text-hf-text-secondary">Total Volume</p>
                  <p className="text-2xl font-bold text-hf-text">
                    {(() => {
                      // FIXED: Use same formatting as client view
                      if (totalVolume >= 1000000) {
                        return `${(totalVolume / 1000000).toFixed(1)}M`
                      } else if (totalVolume >= 1000) {
                        return `${(totalVolume / 1000).toFixed(1)}k`
                      } else if (totalVolume > 0) {
                        return totalVolume.toLocaleString()
                      } else {
                        return '0'
                      }
                    })()}
                    <span className="text-sm text-hf-text-secondary ml-1">lbs</span>
                  </p>
                  <p className="text-xs text-hf-text-secondary">lbs lifted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-hf-orange" />
                <div>
                  <p className="text-sm font-medium text-hf-text-secondary">Bodyweight PRs</p>
                  <p className="text-2xl font-bold text-hf-text">
                    {records.filter(r => r.isBodyweight).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Records Table */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-hf-orange" />
              Personal Records ({records.length})
            </CardTitle>
            <CardDescription className="text-hf-text-secondary">
              All personal bests achieved by {client.name}. Weight PRs are highlighted in bold orange.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No personal records yet"
                description="Complete training sessions to start setting records"
                action={
                  <Button asChild className="btn-gradient">
                    <Link href={`/admin/workouts/new?clientId=${client.id}`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Log a Workout
                    </Link>
                  </Button>
                }
              />
            ) : (
              <DataTable
                data={records}
                columns={columns}
                searchable={true}
                filterable={true}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
