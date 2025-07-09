
"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Plus, 
  Trash2, 
  Save,
  ArrowLeft,
  Target,
  Dumbbell
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingState } from '@/components/common/status-message'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Exercise {
  id: string
  name: string
  category: string
  muscleGroups: string[]
  equipment: string
}

interface WorkoutSet {
  id?: string
  setNumber: number
  reps: number
  weight: number | null
  duration: number | null
  restTime: number | null
  notes: string
  isDropSet: boolean
}

interface WorkoutExercise {
  id?: string
  exerciseId: string
  exerciseName: string
  notes: string
  order: number
  sets: WorkoutSet[]
}

interface WorkoutSession {
  id: string
  date: string
  duration: number
  notes?: string
  status: string
  exercises: Array<{
    id: string
    exerciseId: string
    notes?: string
    order: number
    sets: WorkoutSet[]
    exercise: {
      id: string
      name: string
      category: string
      muscleGroups: string[]
    }
  }>
}

export default function EditWorkoutPage() {
  const params = useParams()
  const router = useRouter()
  const workoutId = params.id as string
  
  const [workout, setWorkout] = useState<WorkoutSession | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [workoutDate, setWorkoutDate] = useState('')
  const [duration, setDuration] = useState<number>(60)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('COMPLETED')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState('')

  const { toast } = useToast()

  useEffect(() => {
    if (workoutId) {
      Promise.all([fetchWorkout(), fetchExercises()])
    }
  }, [workoutId])

  const fetchWorkout = async () => {
    try {
      const response = await fetch(`/api/workouts/${workoutId}`)
      const data = await response.json()

      if (data.success) {
        const workoutData = data.data
        setWorkout(workoutData)
        setWorkoutDate(workoutData.date.split('T')[0])
        setDuration(workoutData.duration)
        setNotes(workoutData.notes || '')
        setStatus(workoutData.status)
        
        // Convert workout exercises to editable format
        const exercises = workoutData.exercises.map((ex: any) => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exercise.name,
          notes: ex.notes || '',
          order: ex.order,
          sets: ex.sets.map((set: any) => ({
            id: set.id,
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            duration: set.duration,
            restTime: set.restTime,
            notes: set.notes || '',
            isDropSet: set.isDropSet || false,
          })),
        }))
        setWorkoutExercises(exercises)
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
    } finally {
      setLoading(false)
    }
  }

  const addExercise = () => {
    if (!selectedExerciseId) return

    const exercise = exercises.find(e => e.id === selectedExerciseId)
    if (!exercise) return

    const newWorkoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      notes: '',
      order: workoutExercises.length + 1,
      sets: [
        {
          setNumber: 1,
          reps: 10,
          weight: null,
          duration: null,
          restTime: 60,
          notes: '',
          isDropSet: false,
        },
        {
          setNumber: 2,
          reps: 10,
          weight: null,
          duration: null,
          restTime: 60,
          notes: '',
          isDropSet: false,
        },
        {
          setNumber: 3,
          reps: 10,
          weight: null,
          duration: null,
          restTime: 60,
          notes: '',
          isDropSet: false,
        },
      ],
    }

    setWorkoutExercises([...workoutExercises, newWorkoutExercise])
    setSelectedExerciseId('')
  }

  const updateExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
    const updated = [...workoutExercises]
    updated[index] = { ...updated[index], [field]: value }
    setWorkoutExercises(updated)
  }

  const addSet = (exerciseIndex: number) => {
    const updated = [...workoutExercises]
    const exercise = updated[exerciseIndex]
    const newSet: WorkoutSet = {
      setNumber: exercise.sets.length + 1,
      reps: 10,
      weight: null,
      duration: null,
      restTime: 60,
      notes: '',
      isDropSet: false,
    }
    exercise.sets.push(newSet)
    setWorkoutExercises(updated)
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updated = [...workoutExercises]
    const exercise = updated[exerciseIndex]
    if (exercise.sets.length > 1) {
      exercise.sets.splice(setIndex, 1)
      // Renumber remaining sets
      exercise.sets.forEach((set, index) => {
        set.setNumber = index + 1
      })
      setWorkoutExercises(updated)
    }
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: any) => {
    const updated = [...workoutExercises]
    updated[exerciseIndex].sets[setIndex] = { 
      ...updated[exerciseIndex].sets[setIndex], 
      [field]: value 
    }
    setWorkoutExercises(updated)
  }

  const removeExercise = (index: number) => {
    const updated = workoutExercises.filter((_, i) => i !== index)
    // Reorder remaining exercises
    const reordered = updated.map((ex, i) => ({ ...ex, order: i + 1 }))
    setWorkoutExercises(reordered)
  }

  const saveWorkout = async () => {
    if (workoutExercises.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one exercise to your workout.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: workoutDate,
          duration,
          notes,
          status,
          exercises: workoutExercises.map(ex => ({
            exerciseId: ex.exerciseId,
            notes: ex.notes,
            order: ex.order,
            sets: ex.sets.map(set => ({
              setNumber: set.setNumber,
              reps: set.reps,
              weight: set.weight,
              duration: set.duration,
              restTime: set.restTime,
              notes: set.notes,
              isDropSet: set.isDropSet,
            })),
          })),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Workout Updated! ✅',
          description: 'Your workout has been successfully updated.',
        })
        router.push(`/workouts/${workoutId}`)
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
      setSaving(false)
    }
  }

  const calculateTotalVolume = () => {
    return workoutExercises.reduce((total, ex) => {
      const exerciseVolume = ex.sets.reduce((setTotal, set) => {
        if (set.weight && set.reps) {
          return setTotal + (set.weight * set.reps)
        }
        return setTotal
      }, 0)
      return total + exerciseVolume
    }, 0)
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <LoadingState message="Loading workout details..." />
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
                <Link href={`/workouts/${workoutId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Workout
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-hf-text mt-2">Edit Workout</h1>
            <p className="text-hf-text-secondary">Update your training session details</p>
          </div>
          <Button 
            onClick={saveWorkout} 
            disabled={saving || workoutExercises.length === 0}
            className="btn-gradient"
          >
            {saving ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Workout Details */}
          <div className="lg:col-span-1">
            <Card className="bg-hf-card border-hf-card">
              <CardHeader>
                <CardTitle className="text-hf-text flex items-center">
                  <Target className="h-5 w-5 mr-2 text-hf-orange" />
                  Workout Details
                </CardTitle>
                <CardDescription className="text-hf-text-secondary">
                  Update basic information about your workout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-hf-text">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={workoutDate}
                    onChange={(e) => setWorkoutDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-hf-text">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min={1}
                    max={300}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-hf-text">Status</Label>
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
                  <Label htmlFor="notes" className="text-hf-text">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="How did the workout feel? Any observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                {/* Quick Stats */}
                <div className="pt-4 border-t border-hf-card">
                  <h4 className="font-medium text-hf-text mb-3">Quick Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-hf-text-secondary">Exercises:</span>
                      <span className="text-hf-text">{workoutExercises.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hf-text-secondary">Total Sets:</span>
                      <span className="text-hf-text">
                        {workoutExercises.reduce((sum, ex) => sum + ex.sets.length, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-hf-text-secondary">Total Volume:</span>
                      <span className="text-hf-text">{calculateTotalVolume().toLocaleString()} lbs</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exercises */}
          <div className="lg:col-span-2">
            <Card className="bg-hf-card border-hf-card">
              <CardHeader>
                <CardTitle className="text-hf-text flex items-center">
                  <Dumbbell className="h-5 w-5 mr-2 text-hf-orange" />
                  Exercises
                </CardTitle>
                <CardDescription className="text-hf-text-secondary">
                  Update exercises and track your sets, reps, and weights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Exercise */}
                <div className="flex gap-2">
                  <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add another exercise..." />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((exercise) => (
                        <SelectItem key={exercise.id} value={exercise.id}>
                          {exercise.name} - {exercise.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={addExercise} 
                    disabled={!selectedExerciseId}
                    className="btn-gradient"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Exercise List */}
                <div className="space-y-4">
                  {workoutExercises.map((exercise, exerciseIndex) => (
                    <div key={`${exercise.exerciseId}-${exerciseIndex}`} className="p-4 bg-hf-dark rounded-lg border border-hf-card">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-hf-text">{exercise.exerciseName}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExercise(exerciseIndex)}
                          className="text-hf-error hover:text-hf-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Exercise Notes */}
                      <div className="mb-4">
                        <Label className="text-xs text-hf-text-secondary">Exercise Notes</Label>
                        <Input
                          value={exercise.notes}
                          onChange={(e) => updateExercise(exerciseIndex, 'notes', e.target.value)}
                          placeholder="Form notes, observations..."
                          className="mt-1"
                        />
                      </div>

                      {/* Sets */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-hf-text">Sets ({exercise.sets.length})</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addSet(exerciseIndex)}
                            className="text-hf-orange border-hf-orange hover:bg-hf-orange hover:text-white"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Set
                          </Button>
                        </div>

                        {exercise.sets.map((set, setIndex) => (
                          <div key={setIndex} className="grid grid-cols-4 md:grid-cols-6 gap-2 items-center p-3 bg-hf-background rounded border border-hf-card">
                            <div className="text-xs text-hf-text-secondary font-medium">
                              Set {set.setNumber}
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-hf-text-secondary">Reps</Label>
                              <Input
                                type="number"
                                value={set.reps}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', Number(e.target.value))}
                                min={1}
                                max={100}
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-hf-text-secondary">Weight</Label>
                              <Input
                                type="number"
                                value={set.weight || ''}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value ? Number(e.target.value) : null)}
                                min={0}
                                step={0.5}
                                placeholder="0"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-hf-text-secondary">Rest (s)</Label>
                              <Input
                                type="number"
                                value={set.restTime || ''}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'restTime', e.target.value ? Number(e.target.value) : null)}
                                min={0}
                                placeholder="60"
                                className="h-8"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-hf-text-secondary">Notes</Label>
                              <Input
                                value={set.notes}
                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'notes', e.target.value)}
                                placeholder="Set notes"
                                className="h-8"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSet(exerciseIndex, setIndex)}
                                className="text-hf-error hover:text-hf-error h-8 w-8 p-0"
                                disabled={exercise.sets.length <= 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Exercise Volume */}
                      <div className="mt-3 text-sm text-hf-text-secondary">
                        Volume: <span className="text-hf-orange font-medium">
                          {exercise.sets.reduce((total, set) => {
                            if (set.weight && set.reps) {
                              return total + (set.weight * set.reps)
                            }
                            return total
                          }, 0).toLocaleString()} lbs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
