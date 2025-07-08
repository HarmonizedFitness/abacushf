
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Trash2, 
  Clock,
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
import { Badge } from '@/components/ui/badge'
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

interface WorkoutExercise {
  exerciseId: string
  exerciseName: string
  sets: number
  reps: number
  weight: number | null
  duration: number | null
  restTime: number | null
  notes: string
  order: number
}

export default function NewWorkoutPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([])
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState<number>(60)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [exercisesLoading, setExercisesLoading] = useState(true)
  const [selectedExerciseId, setSelectedExerciseId] = useState('')

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchExercises()
  }, [])

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
      setExercisesLoading(false)
    }
  }

  const addExercise = () => {
    if (!selectedExerciseId) return

    const exercise = exercises.find(e => e.id === selectedExerciseId)
    if (!exercise) return

    const newWorkoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 3,
      reps: 10,
      weight: null,
      duration: null,
      restTime: 60,
      notes: '',
      order: workoutExercises.length + 1,
    }

    setWorkoutExercises([...workoutExercises, newWorkoutExercise])
    setSelectedExerciseId('')
  }

  const updateExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
    const updated = [...workoutExercises]
    updated[index] = { ...updated[index], [field]: value }
    setWorkoutExercises(updated)
  }

  const removeExercise = (index: number) => {
    const updated = workoutExercises.filter((_, i) => i !== index)
    // Reorder remaining exercises
    const reordered = updated.map((ex, i) => ({ ...ex, order: i + 1 }))
    setWorkoutExercises(reordered)
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === workoutExercises.length - 1)
    ) {
      return
    }

    const updated = [...workoutExercises]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap exercises
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    // Update order
    updated[index].order = index + 1
    updated[newIndex].order = newIndex + 1

    setWorkoutExercises(updated)
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

    setLoading(true)
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: workoutDate,
          duration,
          notes,
          status: 'COMPLETED',
          exercises: workoutExercises.map(ex => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            duration: ex.duration,
            restTime: ex.restTime,
            notes: ex.notes,
            order: ex.order,
          })),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Workout Logged! 🎉',
          description: data.data?.newPersonalRecords > 0 
            ? `Workout saved with ${data.data.newPersonalRecords} new personal record${data.data.newPersonalRecords > 1 ? 's' : ''}!`
            : 'Your workout has been successfully logged.',
        })
        router.push('/workouts')
      } else {
        throw new Error(data.error || 'Failed to save workout')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save workout. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalVolume = () => {
    return workoutExercises.reduce((total, ex) => {
      if (ex.weight && ex.reps) {
        return total + (ex.weight * ex.reps * ex.sets)
      }
      return total
    }, 0)
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
            <h1 className="text-3xl font-bold text-hf-text mt-2">Log New Workout</h1>
            <p className="text-hf-text-secondary">Track your training session and progress</p>
          </div>
          <Button 
            onClick={saveWorkout} 
            disabled={loading || workoutExercises.length === 0}
            className="btn-gradient"
          >
            {loading ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Workout
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
                  Basic information about your workout
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
                        {workoutExercises.reduce((sum, ex) => sum + ex.sets, 0)}
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
                  Add exercises and track your sets, reps, and weights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Exercise */}
                <div className="flex gap-2">
                  <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select an exercise..." />
                    </SelectTrigger>
                    <SelectContent>
                      {exercisesLoading ? (
                        <SelectItem value="loading">Loading exercises...</SelectItem>
                      ) : (
                        exercises.map((exercise) => (
                          <SelectItem key={exercise.id} value={exercise.id}>
                            {exercise.name} - {exercise.category}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={addExercise} 
                    disabled={!selectedExerciseId || exercisesLoading}
                    className="btn-gradient"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Exercise List */}
                {workoutExercises.length === 0 ? (
                  <div className="text-center py-12 text-hf-text-secondary">
                    <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No exercises added yet</p>
                    <p className="text-sm">Select an exercise above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workoutExercises.map((exercise, index) => (
                      <div key={`${exercise.exerciseId}-${index}`} className="p-4 bg-hf-dark rounded-lg border border-hf-card">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-hf-text">{exercise.exerciseName}</h4>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveExercise(index, 'up')}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveExercise(index, 'down')}
                              disabled={index === workoutExercises.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExercise(index)}
                              className="text-hf-error hover:text-hf-error"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-hf-text-secondary">Sets</Label>
                            <Input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, 'sets', Number(e.target.value))}
                              min={1}
                              max={20}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-hf-text-secondary">Reps</Label>
                            <Input
                              type="number"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(index, 'reps', Number(e.target.value))}
                              min={1}
                              max={100}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-hf-text-secondary">Weight (lbs)</Label>
                            <Input
                              type="number"
                              value={exercise.weight || ''}
                              onChange={(e) => updateExercise(index, 'weight', e.target.value ? Number(e.target.value) : null)}
                              min={0}
                              step={0.5}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-hf-text-secondary">Rest (sec)</Label>
                            <Input
                              type="number"
                              value={exercise.restTime || ''}
                              onChange={(e) => updateExercise(index, 'restTime', e.target.value ? Number(e.target.value) : null)}
                              min={0}
                              placeholder="60"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <Label className="text-xs text-hf-text-secondary">Exercise Notes</Label>
                          <Input
                            value={exercise.notes}
                            onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                            placeholder="Form notes, observations..."
                            className="mt-1"
                          />
                        </div>

                        {exercise.weight && exercise.reps && (
                          <div className="mt-3 text-sm text-hf-text-secondary">
                            Volume: <span className="text-hf-orange font-medium">
                              {(exercise.weight * exercise.reps * exercise.sets).toLocaleString()} lbs
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
