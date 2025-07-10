
"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, X, ChevronDown, ChevronUp, User } from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { RoleGuard } from '@/components/layout/role-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { AdvancedWorkoutForm } from '@/components/workouts/advanced-workout-form'
import { formatDate, generateWorkoutIdentifier, getAllExercises } from '@/lib/utils'
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

export default function AdminWorkoutEditPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string
  
  const [workout, setWorkout] = useState<WorkoutSession | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [detailsCollapsed, setDetailsCollapsed] = useState(true)
  
  const { toast } = useToast()

  useEffect(() => {
    if (workoutId) {
      Promise.all([fetchWorkout(), fetchClients(), fetchExercises()])
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

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients')
      const data = await response.json()
      if (data.success) {
        setClients(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      const data = await response.json()
      if (data.success) {
        setExercises(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
    }
  }

  const handleSubmit = async (formData: any) => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          duration: formData.duration,
          notes: formData.notes,
          status: formData.status,
          exercises: formData.exercises || [],
          groups: formData.groups || []
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Workout updated successfully! 🎉',
          description: 'The workout has been successfully updated.',
        })
        router.push(`/admin/workouts/${workoutId}`)
      } else {
        throw new Error(data.error || 'Failed to update workout')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update workout. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/admin/workouts/${workoutId}`)
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

  // Convert workout data to the format expected by AdvancedWorkoutForm
  const initialFormData = {
    clientId: workout.user.id,
    date: workout.date.split('T')[0],
    duration: workout.duration,
    notes: workout.notes || '',
    status: workout.status,
    groups: workout.groups?.map(group => ({
      id: group.id,
      name: group.name || '',
      type: group.type as "REGULAR" | "SUPERSET" | "CIRCUIT",
      order: group.order,
      rounds: group.rounds,
      restBetweenRounds: group.restBetweenRounds,
      exercises: group.exercises?.map(ex => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        exercise: ex.exercise,
        order: ex.order,
        orderInGroup: ex.orderInGroup,
        notes: ex.notes || '',
        sets: ex.sets?.map(set => ({
          id: set.id,
          setNumber: set.setNumber,
          reps: set.reps || 0,
          weight: set.weight || 0,
          duration: set.duration || 0,
          restTime: set.restTime || 0,
          notes: set.notes || '',
          isDropSet: set.isDropSet || false,
        })) || []
      })) || []
    })) || [],
    exercises: workout.exercises?.map(ex => ({
      id: ex.id,
      exerciseId: ex.exerciseId,
      exercise: ex.exercise,
      order: ex.order,
      notes: ex.notes || '',
      sets: ex.sets?.map(set => ({
        id: set.id,
        setNumber: set.setNumber,
        reps: set.reps || 0,
        weight: set.weight || 0,
        duration: set.duration || 0,
        restTime: set.restTime || 0,
        notes: set.notes || '',
        isDropSet: set.isDropSet || false,
      })) || []
    })) || []
  }

  return (
    <ProtectedLayout>
      <RoleGuard allowedRoles={['ADMIN']}>
        <div className="space-y-6">
          {/* Header */}
          <PageHeader
            title={`Edit ${generateWorkoutIdentifier(workout.user.name, workout.date)}`}
            description={`${formatDate(workout.date)} • ${getAllExercises(workout).length} exercises`}
            showHome={true}
            showBack={true}
            backHref={`/admin/workouts/${workoutId}`}
          >
            <Button 
              onClick={handleCancel}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </PageHeader>

          {/* Collapsible Workout & Client Details */}
          <Collapsible open={!detailsCollapsed} onOpenChange={(open) => setDetailsCollapsed(!open)}>
            <Card className="bg-hf-card border-hf-card">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-hf-dark/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-hf-text flex items-center">
                      <User className="h-5 w-5 mr-2 text-hf-orange" />
                      Workout & Client Details
                    </CardTitle>
                    {detailsCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-hf-text-secondary" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-hf-text-secondary" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {/* Client Info */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-hf-text-secondary">Client Name</Label>
                      <p className="text-hf-text font-medium">{workout.user.name}</p>
                    </div>
                    <div>
                      <Label className="text-hf-text-secondary">Email</Label>
                      <p className="text-hf-text">{workout.user.email}</p>
                    </div>
                  </div>
                  
                  {/* Current Status */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-hf-text-secondary">Current Date</Label>
                      <p className="text-hf-text">{formatDate(workout.date)}</p>
                    </div>
                    <div>
                      <Label className="text-hf-text-secondary">Current Duration</Label>
                      <p className="text-hf-text">{workout.duration} minutes</p>
                    </div>
                    <div>
                      <Label className="text-hf-text-secondary">Current Status</Label>
                      <p className="text-hf-text">{workout.status}</p>
                    </div>
                  </div>
                  
                  {workout.notes && (
                    <div>
                      <Label className="text-hf-text-secondary">Current Notes</Label>
                      <p className="text-hf-text">{workout.notes}</p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Main Edit Form */}
          <AdvancedWorkoutForm
            initialData={initialFormData}
            onSubmit={handleSubmit}
            submitting={submitting}
            clients={clients}
            exercises={exercises}
          />
        </div>
      </RoleGuard>
    </ProtectedLayout>
  )
}
