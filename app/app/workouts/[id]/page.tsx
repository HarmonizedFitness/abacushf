
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
  Trash2
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { ConfirmationDialog } from '@/components/common/confirmation-dialog'
import { formatDate, formatDuration } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface WorkoutSession {
  id: string
  date: string
  duration: number
  notes?: string
  status: string
  exercises: Array<{
    id: string
    exerciseId: string
    sets: number
    reps: number
    weight?: number
    duration?: number
    restTime?: number
    notes?: string
    order: number
    exercise: {
      id: string
      name: string
      description?: string
      category: string
      muscleGroups: string[]
      equipment?: string
    }
  }>
}

export default function WorkoutDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string
  
  const [workout, setWorkout] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
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
      router.push('/workouts')
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
        router.push('/workouts')
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

  const calculateTotalVolume = () => {
    if (!workout) return 0
    return workout.exercises.reduce((total, ex) => {
      if (ex.weight && ex.reps) {
        return total + (ex.weight * ex.reps * ex.sets)
      }
      return total
    }, 0)
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

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingState message="Loading workout details..." />
      </ProtectedLayout>
    )
  }

  if (!workout) {
    return (
      <ProtectedLayout>
        <EmptyState
          title="Workout not found"
          description="The workout you're looking for doesn't exist."
          action={
            <Button asChild className="btn-gradient">
              <Link href="/workouts">Back to Workouts</Link>
            </Button>
          }
        />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/workouts">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workouts
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-hf-text mt-2">
              Workout Details
            </h1>
            <p className="text-hf-text-secondary">
              {formatDate(workout.date)} • {workout.exercises.length} exercises
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild variant="outline" className="border-hf-card">
              <Link href={`/workouts/${workout.id}/edit`}>
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
        </div>

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
              <Badge className={getStatusColor(workout.status)}>
                {workout.status}
              </Badge>
              <p className="text-xs text-hf-text-secondary mt-1">
                {workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)} total sets
              </p>
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
              Exercises ({workout.exercises.length})
            </CardTitle>
            <CardDescription className="text-hf-text-secondary">
              Detailed breakdown of your training session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {workout.exercises
                .sort((a, b) => a.order - b.order)
                .map((exercise, index) => (
                  <div key={exercise.id} className="p-4 bg-hf-dark rounded-lg border border-hf-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-hf-text text-lg">
                          {index + 1}. {exercise.exercise.name}
                        </h4>
                        <p className="text-sm text-hf-text-secondary">
                          {exercise.exercise.category}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {exercise.exercise.muscleGroups.map((muscle) => (
                            <Badge key={muscle} variant="secondary" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {exercise.weight && exercise.reps && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-hf-orange">
                            {(exercise.weight * exercise.reps * exercise.sets).toLocaleString()} lbs
                          </div>
                          <div className="text-xs text-hf-text-secondary">Total Volume</div>
                        </div>
                      )}
                    </div>

                    {/* Exercise Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center p-3 bg-hf-card rounded-lg">
                        <div className="text-xl font-bold text-hf-text">{exercise.sets}</div>
                        <div className="text-xs text-hf-text-secondary">Sets</div>
                      </div>
                      <div className="text-center p-3 bg-hf-card rounded-lg">
                        <div className="text-xl font-bold text-hf-text">{exercise.reps}</div>
                        <div className="text-xs text-hf-text-secondary">Reps</div>
                      </div>
                      {exercise.weight && (
                        <div className="text-center p-3 bg-hf-card rounded-lg">
                          <div className="text-xl font-bold text-hf-text">{exercise.weight}</div>
                          <div className="text-xs text-hf-text-secondary">Weight (lbs)</div>
                        </div>
                      )}
                      {exercise.restTime && (
                        <div className="text-center p-3 bg-hf-card rounded-lg">
                          <div className="text-xl font-bold text-hf-text">{exercise.restTime}</div>
                          <div className="text-xs text-hf-text-secondary">Rest (sec)</div>
                        </div>
                      )}
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
                ))}
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
    </ProtectedLayout>
  )
}
