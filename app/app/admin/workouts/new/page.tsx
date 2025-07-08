
"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  X,
  Calendar,
  Clock,
  Users,
  Dumbbell,
  Target,
  Save,
  ArrowLeft,
  GripVertical,
  Trash2,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { RoleGuard } from '@/components/layout/role-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/common/status-message'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/navigation/page-header'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email: string
}

interface Exercise {
  id: string
  name: string
  category: string
  muscleGroups: string[]
  equipment?: string
}

interface WorkoutExercise {
  id: string
  exerciseId: string
  exercise: Exercise
  sets: number
  reps: number
  weight?: number
  duration?: number
  restTime?: number
  notes?: string
}

export default function NewWorkoutPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false)
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState('')
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState<number | ''>('')
  const [status, setStatus] = useState('COMPLETED')
  const [notes, setNotes] = useState('')
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([fetchClients(), fetchExercises()])
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients')
      const data = await response.json()
      if (data.success) {
        setClients(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises?limit=100')
      const data = await response.json()
      if (data.success) {
        setExercises(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error)
    }
  }

  const addExercise = (exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      exercise,
      sets: 1,
      reps: 1,
      weight: undefined,
      duration: undefined,
      restTime: undefined,
      notes: '',
    }
    setWorkoutExercises([...workoutExercises, newWorkoutExercise])
    setExerciseDialogOpen(false)
  }

  const updateExercise = (id: string, updates: Partial<WorkoutExercise>) => {
    setWorkoutExercises(workoutExercises.map(ex => 
      ex.id === id ? { ...ex, ...updates } : ex
    ))
  }

  const removeExercise = (id: string) => {
    setWorkoutExercises(workoutExercises.filter(ex => ex.id !== id))
  }

  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast({
        title: 'Error',
        description: 'Please select a client.',
        variant: 'destructive',
      })
      return
    }

    if (workoutExercises.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one exercise.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          date: workoutDate,
          duration: duration || 60,
          status,
          notes,
          exercises: workoutExercises.map(ex => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            duration: ex.duration,
            restTime: ex.restTime,
            notes: ex.notes,
          })),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Workout logged successfully! 🎉',
          description: 'The workout has been saved and personal records updated.',
        })
        router.push('/admin/workouts')
      } else {
        throw new Error(data.error || 'Failed to log workout')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log workout. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const calculateTotalVolume = () => {
    return workoutExercises.reduce((total, ex) => {
      const weight = ex.weight || 0
      const sets = ex.sets || 0
      const reps = ex.reps || 0
      return total + (weight * sets * reps)
    }, 0)
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <RoleGuard allowedRoles={['ADMIN']}>
          <LoadingState message="Loading workout form..." />
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
            title="Log Client Workout"
            description="Record a training session for a client"
            showBack={true}
            backHref="/admin/workouts"
            backLabel="Back to Workouts"
          >
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/workouts')}
              className="border-hf-card"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="btn-gradient"
            >
              {submitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Workout
                </>
              )}
            </Button>
          </PageHeader>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Workout Details */}
            <Card className="bg-hf-card border-hf-card lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-hf-text flex items-center">
                  <Target className="h-5 w-5 mr-2 text-hf-orange" />
                  Workout Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-hf-text">Client</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-xs text-hf-text-secondary">{client.email}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-hf-text">Date</Label>
                  <Input
                    type="date"
                    value={workoutDate}
                    onChange={(e) => setWorkoutDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-hf-text">Duration (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : '')}
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-hf-text">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="SKIPPED">Skipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-hf-text">Notes</Label>
                  <Textarea
                    placeholder="Workout notes, client feedback, etc..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Workout Summary */}
                <div className="pt-4 border-t border-hf-card">
                  <h3 className="font-medium text-hf-text mb-2">Workout Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-hf-text-secondary">Exercises:</span>
                      <span className="text-hf-text">{workoutExercises.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hf-text-secondary">Total Volume:</span>
                      <span className="text-hf-text">{calculateTotalVolume().toLocaleString()} lbs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hf-text-secondary">Duration:</span>
                      <span className="text-hf-text">{duration || 60} minutes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercises */}
            <Card className="bg-hf-card border-hf-card lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-hf-text flex items-center">
                    <Dumbbell className="h-5 w-5 mr-2 text-hf-orange" />
                    Exercises ({workoutExercises.length})
                  </CardTitle>
                  <Dialog open={exerciseDialogOpen} onOpenChange={setExerciseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-gradient">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Exercise
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-hf-card border-hf-card max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-hf-text">Add Exercise</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="grid gap-2">
                          {exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="flex items-center justify-between p-3 bg-hf-dark rounded-lg border border-hf-card cursor-pointer hover:bg-hf-card/50"
                              onClick={() => addExercise(exercise)}
                            >
                              <div>
                                <p className="font-medium text-hf-text">{exercise.name}</p>
                                <p className="text-xs text-hf-text-secondary">{exercise.category}</p>
                                <div className="flex gap-1 mt-1">
                                  {exercise.muscleGroups.slice(0, 2).map((muscle) => (
                                    <Badge key={muscle} variant="secondary" className="text-xs">
                                      {muscle}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Plus className="h-4 w-4 text-hf-orange" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {workoutExercises.length === 0 ? (
                  <div className="text-center py-8">
                    <Dumbbell className="h-12 w-12 mx-auto text-hf-text-secondary mb-4" />
                    <p className="text-hf-text-secondary">No exercises added yet</p>
                    <p className="text-sm text-hf-text-secondary mt-1">
                      Click "Add Exercise" to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workoutExercises.map((workoutExercise, index) => (
                      <Card key={workoutExercise.id} className="bg-hf-dark border-hf-card">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <GripVertical className="h-4 w-4 text-hf-text-secondary" />
                                <span className="text-sm text-hf-text-secondary">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-medium text-hf-text">
                                  {workoutExercise.exercise.name}
                                </h4>
                                <p className="text-xs text-hf-text-secondary">
                                  {workoutExercise.exercise.category}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(workoutExercise.id)}
                              className="text-hf-error hover:text-hf-error"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-hf-text-secondary">Sets</Label>
                              <Input
                                type="number"
                                placeholder="1"
                                value={workoutExercise.sets}
                                onChange={(e) => updateExercise(workoutExercise.id, { 
                                  sets: Number(e.target.value) 
                                })}
                                min={1}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-hf-text-secondary">Reps</Label>
                              <Input
                                type="number"
                                placeholder="1"
                                value={workoutExercise.reps}
                                onChange={(e) => updateExercise(workoutExercise.id, { 
                                  reps: Number(e.target.value) 
                                })}
                                min={1}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-hf-text-secondary">Weight (lbs)</Label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={workoutExercise.weight || ''}
                                onChange={(e) => updateExercise(workoutExercise.id, { 
                                  weight: e.target.value ? Number(e.target.value) : undefined 
                                })}
                                min={0}
                                step={0.5}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-hf-text-secondary">Rest (sec)</Label>
                              <Input
                                type="number"
                                placeholder="60"
                                value={workoutExercise.restTime || ''}
                                onChange={(e) => updateExercise(workoutExercise.id, { 
                                  restTime: e.target.value ? Number(e.target.value) : undefined 
                                })}
                                min={0}
                              />
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <Label className="text-xs text-hf-text-secondary">Notes</Label>
                            <Textarea
                              placeholder="Exercise notes..."
                              value={workoutExercise.notes || ''}
                              onChange={(e) => updateExercise(workoutExercise.id, { 
                                notes: e.target.value 
                              })}
                              rows={2}
                            />
                          </div>

                          {/* Exercise Stats */}
                          <div className="mt-4 pt-3 border-t border-hf-card">
                            <div className="flex justify-between text-xs text-hf-text-secondary">
                              <span>Volume: {
                                ((workoutExercise.weight || 0) * workoutExercise.sets * workoutExercise.reps).toLocaleString()
                              } lbs</span>
                              <span>Total Reps: {workoutExercise.sets * workoutExercise.reps}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </RoleGuard>
    </ProtectedLayout>
  )
}
