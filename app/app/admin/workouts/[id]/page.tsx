

"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Dumbbell,
  Edit,
  Trophy,
  Target,
  Trash2,
  User,
  Users,
  Activity
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { RoleGuard } from '@/components/layout/role-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { ConfirmationDialog } from '@/components/common/confirmation-dialog'
import { formatDate, formatDuration, getInitials, generateWorkoutIdentifier } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/navigation/page-header'
import Link from 'next/link'

interface WorkoutSession {
  id: string
  date: string
  duration: number
  notes?: string
  status: string
  user: {
    id: string
    name: string
    email: string
  }
  groups: Array<{
    id: string
    name?: string
    type: string
    order: number
    rounds?: number
    restBetweenRounds?: number
    exercises: Array<{
      id: string
      exerciseId: string
      order: number
      orderInGroup: number
      notes?: string
      exercise: {
        id: string
        name: string
        description?: string
        category: string
        muscleGroups: string[]
        equipment?: string
      }
      sets: Array<{
        id: string
        setNumber: number
        reps?: number
        weight?: number
        duration?: number
        restTime?: number
        notes?: string
        isDropSet: boolean
      }>
    }>
  }>
  exercises: Array<{
    id: string
    exerciseId: string
    order: number
    notes?: string
    exercise: {
      id: string
      name: string
      description?: string
      category: string
      muscleGroups: string[]
      equipment?: string
    }
    sets: Array<{
      id: string
      setNumber: number
      reps?: number
      weight?: number
      duration?: number
      restTime?: number
      notes?: string
      isDropSet: boolean
    }>
  }>
}

export default function AdminWorkoutDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string
  
  const [workout, setWorkout] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    if (workoutId) {
      fetchWorkout()
    }
  }, [workoutId])

  const fetchWorkout = async () => {
    try {
      const response = await fetch(`/api/workouts/${workoutId}`)
      const data = await response.json()

      if (data.success) {
        setWorkout(data.data)
      } else {
        throw new Error(data.error || 'Workout not found')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load workout details.',
        variant: 'destructive',
      })
      router.push('/admin/workouts')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Workout deleted',
          description: 'The workout has been successfully deleted.',
        })
        router.push('/admin/workouts')
      } else {
        throw new Error('Failed to delete workout')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workout. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteDialog(false)
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setStatusUpdating(true)
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const data = await response.json()
        setWorkout(data.data)
        toast({
          title: 'Status updated',
          description: `Workout status changed to ${newStatus.toLowerCase()}.`,
        })
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update workout status.',
        variant: 'destructive',
      })
    } finally {
      setStatusUpdating(false)
    }
  }

  const calculateTotalVolume = () => {
    if (!workout) return 0
    let total = 0
    
    // Calculate volume from ungrouped exercises
    workout.exercises?.forEach(ex => {
      ex.sets?.forEach(set => {
        if (set.weight && set.reps) {
          total += Number(set.weight) * set.reps
        }
      })
    })
    
    // Calculate volume from grouped exercises
    workout.groups?.forEach(group => {
      group.exercises?.forEach(ex => {
        ex.sets?.forEach(set => {
          if (set.weight && set.reps) {
            total += Number(set.weight) * set.reps
          }
        })
      })
    })
    
    return total
  }

  const getStatusColor = (status: string) => {
    const colors = {
      COMPLETED: 'bg-hf-success/10 text-hf-success border-hf-success/20',
      IN_PROGRESS: 'bg-hf-orange/10 text-hf-orange border-hf-orange/20',
      PLANNED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      SKIPPED: 'bg-hf-error/10 text-hf-error border-hf-error/20',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500/10 text-gray-400'
  }

  const getAllExercises = () => {
    if (!workout) return []
    
    const allExercises: Array<{
      id: string
      exercise: {
        id: string
        name: string
        description?: string
        category: string
        muscleGroups: string[]
        equipment?: string
      }
      sets: Array<{
        id: string
        setNumber: number
        reps?: number
        weight?: number
        duration?: number
        restTime?: number
        notes?: string
        isDropSet: boolean
      }>
      notes?: string
      groupInfo?: {
        name?: string
        type: string
        rounds?: number
      }
    }> = []

    // Add ungrouped exercises
    workout.exercises?.forEach((ex, index) => {
      allExercises.push({
        id: ex.id,
        exercise: ex.exercise,
        sets: ex.sets || [],
        notes: ex.notes
      })
    })

    // Add grouped exercises
    workout.groups?.forEach((group) => {
      group.exercises?.forEach((ex) => {
        allExercises.push({
          id: ex.id,
          exercise: ex.exercise,
          sets: ex.sets || [],
          notes: ex.notes,
          groupInfo: {
            name: group.name,
            type: group.type,
            rounds: group.rounds
          }
        })
      })
    })

    return allExercises
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <RoleGuard allowedRoles={['ADMIN']}>
          <LoadingState message="Loading workout details..." />
        </RoleGuard>
      </ProtectedLayout>
    )
  }

  if (!workout) {
    return (
      <ProtectedLayout>
        <RoleGuard allowedRoles={['ADMIN']}>
          <EmptyState
            icon={Dumbbell}
            title="Workout not found"
            description="The workout you're looking for doesn't exist."
            action={
              <Button asChild className="btn-gradient">
                <Link href="/admin/workouts">Back to Workouts</Link>
              </Button>
            }
          />
        </RoleGuard>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <RoleGuard allowedRoles={['ADMIN']}>
        <div className="space-y-6">
          {/* Header */}
          <PageHeader
            title={generateWorkoutIdentifier(workout.user.name, workout.date)}
            description={`${formatDate(workout.date)} • ${getAllExercises().length} exercises`}
            showHome={true}
            showBack={true}
            backHref="/admin/workouts"
          >
            <div className="flex items-center space-x-2">
              <Button asChild variant="outline" className="border-hf-card">
                <Link href={`/admin/workouts/${workout.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="border-hf-error text-hf-error hover:bg-hf-error hover:text-white"
                onClick={() => setDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </PageHeader>

          {/* Client Info */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <User className="h-5 w-5 mr-2 text-hf-orange" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${workout.user.name}`} />
                  <AvatarFallback className="bg-gradient-orange text-white">
                    {getInitials(workout.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-hf-text">{workout.user.name}</h3>
                  <p className="text-hf-text-secondary">{workout.user.email}</p>
                </div>
                <Button asChild variant="outline" className="ml-auto">
                  <Link href={`/admin/clients/${workout.user.id}`}>
                    <Users className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-hf-card border-hf-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-hf-text">
                  {new Date(workout.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <p className="text-xs text-hf-text-secondary">
                  {new Date(workout.date).toLocaleDateString('en-US', { 
                    weekday: 'long' 
                  })}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-hf-card border-hf-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-hf-text">
                  {workout.duration}
                  <span className="text-sm text-hf-text-secondary ml-1">min</span>
                </div>
                <p className="text-xs text-hf-text-secondary">Training time</p>
              </CardContent>
            </Card>

            <Card className="bg-hf-card border-hf-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Total Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-hf-text">
                  {calculateTotalVolume().toLocaleString()}
                  <span className="text-sm text-hf-text-secondary ml-1">lbs</span>
                </div>
                <p className="text-xs text-hf-text-secondary">Weight × Reps</p>
              </CardContent>
            </Card>

            <Card className="bg-hf-card border-hf-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-hf-text-secondary">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge className={getStatusColor(workout.status)}>
                    {workout.status}
                  </Badge>
                  <div className="flex space-x-1">
                    {workout.status !== 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate('COMPLETED')}
                        disabled={statusUpdating}
                        className="text-xs"
                      >
                        Mark Complete
                      </Button>
                    )}
                    {workout.status !== 'PLANNED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate('PLANNED')}
                        disabled={statusUpdating}
                        className="text-xs"
                      >
                        Mark Planned
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workout Notes */}
          {workout.notes && (
            <Card className="bg-hf-card border-hf-card">
              <CardHeader>
                <CardTitle className="text-hf-text">Workout Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-hf-text-secondary">{workout.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Exercises */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-hf-orange" />
                Exercises ({getAllExercises().length})
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Detailed breakdown of the training session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {getAllExercises().map((exercise, index) => {
                  const exerciseVolume = exercise.sets.reduce((total, set) => {
                    if (set.weight && set.reps) {
                      return total + (Number(set.weight) * set.reps)
                    }
                    return total
                  }, 0)

                  return (
                    <div key={exercise.id} className="p-4 bg-hf-dark rounded-lg border border-hf-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-hf-text text-lg">
                            {index + 1}. {exercise.exercise.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-hf-text-secondary">
                              {exercise.exercise.category}
                            </p>
                            {exercise.groupInfo && (
                              <Badge variant="outline" className="text-xs">
                                {exercise.groupInfo.type} {exercise.groupInfo.name && `- ${exercise.groupInfo.name}`}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {exercise.exercise.muscleGroups?.map((muscle) => (
                              <Badge key={muscle} variant="secondary" className="text-xs">
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {exerciseVolume > 0 && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-hf-orange">
                              {exerciseVolume.toLocaleString()} lbs
                            </div>
                            <div className="text-xs text-hf-text-secondary">Total Volume</div>
                          </div>
                        )}
                      </div>

                      {/* Sets Details */}
                      <div className="space-y-3 mb-3">
                        <div className="text-sm font-medium text-hf-text">Sets ({exercise.sets.length})</div>
                        <div className="grid gap-3">
                          {exercise.sets.map((set, setIndex) => (
                            <div key={set.id} className="flex items-center justify-between p-3 bg-hf-card rounded-lg">
                              <div className="flex items-center space-x-4">
                                <div className="text-sm font-medium text-hf-text">
                                  Set {set.setNumber}
                                </div>
                                {set.isDropSet && (
                                  <Badge variant="secondary" className="text-xs">
                                    Drop Set
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm">
                                {set.reps && (
                                  <div className="text-center">
                                    <div className="font-bold text-hf-text">{set.reps}</div>
                                    <div className="text-xs text-hf-text-secondary">reps</div>
                                  </div>
                                )}
                                {set.weight && (
                                  <div className="text-center">
                                    <div className="font-bold text-hf-text">{set.weight}</div>
                                    <div className="text-xs text-hf-text-secondary">lbs</div>
                                  </div>
                                )}
                                {set.duration && (
                                  <div className="text-center">
                                    <div className="font-bold text-hf-text">{set.duration}</div>
                                    <div className="text-xs text-hf-text-secondary">sec</div>
                                  </div>
                                )}
                                {set.restTime && (
                                  <div className="text-center">
                                    <div className="font-bold text-hf-text">{set.restTime}</div>
                                    <div className="text-xs text-hf-text-secondary">rest</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Exercise Notes */}
                      {exercise.notes && (
                        <div className="mt-3 p-3 bg-hf-card rounded-lg">
                          <div className="text-xs text-hf-text-secondary mb-1">Notes:</div>
                          <div className="text-sm text-hf-text">{exercise.notes}</div>
                        </div>
                      )}

                      {/* Exercise Description */}
                      {exercise.exercise.description && (
                        <div className="mt-3 p-3 bg-hf-card rounded-lg">
                          <div className="text-xs text-hf-text-secondary mb-1">Exercise Description:</div>
                          <div className="text-sm text-hf-text-secondary">{exercise.exercise.description}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          <ConfirmationDialog
            open={deleteDialog}
            onOpenChange={setDeleteDialog}
            title="Delete Workout"
            description="Are you sure you want to delete this workout? This action cannot be undone and will remove all exercise data."
            confirmText="Delete Workout"
            variant="destructive"
            onConfirm={handleDelete}
            loading={deleting}
          />
        </div>
      </RoleGuard>
    </ProtectedLayout>
  )
}

