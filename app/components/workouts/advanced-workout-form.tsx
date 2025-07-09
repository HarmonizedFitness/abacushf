
"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Save,
  Target,
  Dumbbell,
  Users,
  Calendar,
  Clock,
  GripVertical,
  Settings,
  Zap,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { WorkoutExerciseGroup } from './workout-exercise-group'
import { WorkoutExerciseItem } from './workout-exercise-item'
import { GroupCreationDialog } from './group-creation-dialog'
import { ExerciseSelectionDialog } from './exercise-selection-dialog'

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

interface WorkoutSet {
  id: string
  setNumber: number
  reps?: number
  weight?: number
  duration?: number
  restTime?: number
  notes?: string
  isDropSet?: boolean
}

interface WorkoutExercise {
  id: string
  exerciseId: string
  exercise: Exercise
  order: number
  orderInGroup?: number
  notes?: string
  sets: WorkoutSet[]
}

interface ExerciseGroup {
  id: string
  type: 'REGULAR' | 'SUPERSET' | 'CIRCUIT'
  name?: string
  notes?: string
  order: number
  rounds?: number
  restBetweenRounds?: number
  exercises: WorkoutExercise[]
}

interface AdvancedWorkoutFormProps {
  initialData?: {
    clientId?: string
    date?: string
    duration?: number
    notes?: string
    status?: string
    groups?: ExerciseGroup[]
    exercises?: WorkoutExercise[]
  }
  onSubmit: (data: any) => Promise<void>
  submitting?: boolean
  clients: Client[]
  exercises: Exercise[]
}

export function AdvancedWorkoutForm({
  initialData,
  onSubmit,
  submitting = false,
  clients,
  exercises,
}: AdvancedWorkoutFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || '')
  const [workoutDate, setWorkoutDate] = useState(
    initialData?.date || new Date().toISOString().split('T')[0]
  )
  const [duration, setDuration] = useState<number | ''>(initialData?.duration || '')
  const [status, setStatus] = useState(initialData?.status || 'COMPLETED')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>(
    initialData?.groups || []
  )
  const [ungroupedExercises, setUngroupedExercises] = useState<WorkoutExercise[]>(
    initialData?.exercises || []
  )
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false)
  const [currentBodyWeight, setCurrentBodyWeight] = useState<number>(0)
  const [bodyWeightExercises, setBodyWeightExercises] = useState<Set<string>>(new Set())

  // Generate unique IDs
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9)

  // Fetch current body weight from progress API
  const fetchCurrentBodyWeight = async () => {
    if (!selectedClientId) return
    
    try {
      const response = await fetch(`/api/progress?userId=${selectedClientId}&type=BODY_WEIGHT&limit=1`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.length > 0) {
          setCurrentBodyWeight(data.data[0].value)
        }
      }
    } catch (error) {
      console.error('Error fetching body weight:', error)
    }
  }

  // Fetch body weight when client is selected
  React.useEffect(() => {
    if (selectedClientId) {
      fetchCurrentBodyWeight()
    }
  }, [selectedClientId])

  // Toggle body weight for exercise
  const toggleBodyWeight = (exerciseId: string) => {
    const newBodyWeightExercises = new Set(bodyWeightExercises)
    if (newBodyWeightExercises.has(exerciseId)) {
      newBodyWeightExercises.delete(exerciseId)
    } else {
      newBodyWeightExercises.add(exerciseId)
    }
    setBodyWeightExercises(newBodyWeightExercises)
  }

  // Add new exercise (ungrouped)
  const addExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      id: generateId(),
      exerciseId: exercise.id,
      exercise,
      order: ungroupedExercises.length + exerciseGroups.length + 1,
      notes: '',
      sets: [
        { id: generateId(), setNumber: 1, reps: 8, weight: 0, restTime: 60 },
        { id: generateId(), setNumber: 2, reps: 8, weight: 0, restTime: 60 },
        { id: generateId(), setNumber: 3, reps: 8, weight: 0, restTime: 60 },
      ],
    }
    setUngroupedExercises([...ungroupedExercises, newExercise])
  }

  // Remove exercise
  const removeExercise = (exerciseId: string) => {
    setUngroupedExercises(ungroupedExercises.filter(ex => ex.id !== exerciseId))
  }

  // Update exercise
  const updateExercise = (exerciseId: string, updates: Partial<WorkoutExercise>) => {
    setUngroupedExercises(ungroupedExercises.map(ex =>
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    ))
  }

  // Add set to exercise
  const addSet = (exerciseId: string) => {
    const exercise = ungroupedExercises.find(ex => ex.id === exerciseId)
    if (!exercise) return

    const newSet: WorkoutSet = {
      id: generateId(),
      setNumber: exercise.sets.length + 1,
      reps: 8,
      weight: 0,
      restTime: 60,
    }

    updateExercise(exerciseId, {
      sets: [...exercise.sets, newSet],
    })
  }

  // Remove set from exercise
  const removeSet = (exerciseId: string, setId: string) => {
    const exercise = ungroupedExercises.find(ex => ex.id === exerciseId)
    if (!exercise || exercise.sets.length <= 1) return

    const updatedSets = exercise.sets
      .filter(set => set.id !== setId)
      .map((set, index) => ({ ...set, setNumber: index + 1 }))

    updateExercise(exerciseId, { sets: updatedSets })
  }

  // Update set
  const updateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    const exercise = ungroupedExercises.find(ex => ex.id === exerciseId)
    if (!exercise) return

    const updatedSets = exercise.sets.map(set =>
      set.id === setId ? { ...set, ...updates } : set
    )

    updateExercise(exerciseId, { sets: updatedSets })
  }

  // Group management
  const addGroup = (groupData: {
    type: 'SUPERSET' | 'CIRCUIT'
    name?: string
    notes?: string
    rounds?: number
    restBetweenRounds?: number
    exerciseIds: string[]
  }) => {
    const selectedExercisesToGroup = ungroupedExercises.filter(ex =>
      groupData.exerciseIds.includes(ex.id)
    )

    const newGroup: ExerciseGroup = {
      id: generateId(),
      type: groupData.type,
      name: groupData.name,
      notes: groupData.notes,
      order: exerciseGroups.length + 1,
      rounds: groupData.rounds,
      restBetweenRounds: groupData.restBetweenRounds,
      exercises: selectedExercisesToGroup.map((ex, index) => ({
        ...ex,
        orderInGroup: index + 1,
      })),
    }

    setExerciseGroups([...exerciseGroups, newGroup])
    setUngroupedExercises(ungroupedExercises.filter(ex =>
      !groupData.exerciseIds.includes(ex.id)
    ))
    setSelectedExercises([])
  }

  // Remove group
  const removeGroup = (groupId: string) => {
    const group = exerciseGroups.find(g => g.id === groupId)
    if (!group) return

    // Move exercises back to ungrouped
    const exercisesToMove = group.exercises.map(ex => ({
      ...ex,
      orderInGroup: undefined,
    }))

    setUngroupedExercises([...ungroupedExercises, ...exercisesToMove])
    setExerciseGroups(exerciseGroups.filter(g => g.id !== groupId))
  }

  // Update group
  const updateGroup = (groupId: string, updates: Partial<ExerciseGroup>) => {
    setExerciseGroups(exerciseGroups.map(group =>
      group.id === groupId ? { ...group, ...updates } : group
    ))
  }

  // Calculate total stats
  const calculateStats = () => {
    const allExercises = [
      ...ungroupedExercises,
      ...exerciseGroups.flatMap(g => g.exercises)
    ]

    const totalExercises = allExercises.length
    const totalSets = allExercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    const totalVolume = allExercises.reduce((sum, ex) => 
      sum + ex.sets.reduce((setSum, set) => 
        setSum + ((set.weight || 0) * (set.reps || 0)), 0
      ), 0
    )

    return { totalExercises, totalSets, totalVolume }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast({
        title: 'Error',
        description: 'Please select a client.',
        variant: 'destructive',
      })
      return
    }

    if (exerciseGroups.length === 0 && ungroupedExercises.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one exercise.',
        variant: 'destructive',
      })
      return
    }

    const formData = {
      clientId: selectedClientId,
      date: workoutDate,
      duration: duration || 60,
      status,
      notes,
      groups: exerciseGroups.map(group => ({
        type: group.type,
        name: group.name,
        notes: group.notes,
        order: group.order,
        rounds: group.rounds,
        restBetweenRounds: group.restBetweenRounds,
        exercises: group.exercises.map(ex => ({
          exerciseId: ex.exerciseId,
          order: ex.order,
          orderInGroup: ex.orderInGroup,
          notes: ex.notes,
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
      })),
      exercises: ungroupedExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        order: ex.order,
        notes: ex.notes,
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
    }

    await onSubmit(formData)
  }

  const stats = calculateStats()

  return (
    <div className="space-y-6">
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
              <Label className="text-hf-text">Workout Notes</Label>
              <Textarea
                placeholder="Overall workout notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Workout Summary */}
            <div className="pt-4 border-t border-hf-card">
              <h3 className="font-medium text-hf-text mb-3">Workout Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-hf-text-secondary">Exercises:</span>
                  <span className="text-hf-text">{stats.totalExercises}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hf-text-secondary">Total Sets:</span>
                  <span className="text-hf-text">{stats.totalSets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hf-text-secondary">Total Volume:</span>
                  <span className="text-hf-text">{stats.totalVolume.toLocaleString()} lbs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hf-text-secondary">Duration:</span>
                  <span className="text-hf-text">{duration || 60} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hf-text-secondary">Groups:</span>
                  <span className="text-hf-text">{exerciseGroups.length}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              <Button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="btn-gradient w-full"
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
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="w-full border-hf-card"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Exercises and Groups */}
        <Card className="bg-hf-card border-hf-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-hf-text flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-hf-orange" />
                Exercises & Groups
              </CardTitle>
              <div className="flex items-center space-x-2">
                {selectedExercises.length > 1 && (
                  <Button
                    onClick={() => setGroupDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Group ({selectedExercises.length})
                  </Button>
                )}
                <Button
                  onClick={() => setExerciseDialogOpen(true)}
                  className="btn-gradient"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Exercise
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Exercise Groups */}
              {exerciseGroups.map((group) => (
                <WorkoutExerciseGroup
                  key={group.id}
                  group={group}
                  onUpdateGroup={updateGroup}
                  onRemoveGroup={removeGroup}
                  onAddSet={(exerciseId) => {
                    // Handle adding set to grouped exercise
                    const updatedGroup = {
                      ...group,
                      exercises: group.exercises.map(ex =>
                        ex.id === exerciseId
                          ? {
                              ...ex,
                              sets: [
                                ...ex.sets,
                                {
                                  id: generateId(),
                                  setNumber: ex.sets.length + 1,
                                  reps: 8,
                                  weight: 0,
                                  restTime: 60,
                                },
                              ],
                            }
                          : ex
                      ),
                    }
                    updateGroup(group.id, updatedGroup)
                  }}
                  onRemoveSet={(exerciseId, setId) => {
                    // Handle removing set from grouped exercise
                    const updatedGroup = {
                      ...group,
                      exercises: group.exercises.map(ex =>
                        ex.id === exerciseId
                          ? {
                              ...ex,
                              sets: ex.sets
                                .filter(set => set.id !== setId)
                                .map((set, index) => ({ ...set, setNumber: index + 1 })),
                            }
                          : ex
                      ),
                    }
                    updateGroup(group.id, updatedGroup)
                  }}
                  onUpdateSet={(exerciseId, setId, updates) => {
                    // Handle updating set in grouped exercise
                    const updatedGroup = {
                      ...group,
                      exercises: group.exercises.map(ex =>
                        ex.id === exerciseId
                          ? {
                              ...ex,
                              sets: ex.sets.map(set =>
                                set.id === setId ? { ...set, ...updates } : set
                              ),
                            }
                          : ex
                      ),
                    }
                    updateGroup(group.id, updatedGroup)
                  }}
                  bodyWeightExercises={bodyWeightExercises}
                  currentBodyWeight={currentBodyWeight}
                  onToggleBodyWeight={toggleBodyWeight}
                />
              ))}

              {/* Ungrouped Exercises */}
              {ungroupedExercises.map((exercise) => (
                <div key={exercise.id} className="relative">
                  {/* Superset/Circuit Visual Indicators */}
                  {selectedExercises.includes(exercise.id) && selectedExercises.length > 1 && (
                    <div className={`absolute -left-2 top-0 bottom-0 w-1 rounded-full ${
                      selectedExercises.length === 2 ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                  )}
                  
                  {/* Body Weight Toggle */}
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      variant={bodyWeightExercises.has(exercise.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleBodyWeight(exercise.id)}
                      className={`text-xs px-2 py-1 ${
                        bodyWeightExercises.has(exercise.id) 
                          ? 'bg-blue-500 text-white' 
                          : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      BW
                    </Button>
                  </div>
                  
                  <WorkoutExerciseItem
                    exercise={exercise}
                    selected={selectedExercises.includes(exercise.id)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedExercises([...selectedExercises, exercise.id])
                      } else {
                        setSelectedExercises(selectedExercises.filter(id => id !== exercise.id))
                      }
                    }}
                    onUpdateExercise={updateExercise}
                    onRemoveExercise={removeExercise}
                    onAddSet={addSet}
                    onRemoveSet={removeSet}
                    onUpdateSet={updateSet}
                    isBodyWeight={bodyWeightExercises.has(exercise.id)}
                    currentBodyWeight={currentBodyWeight}
                  />
                </div>
              ))}

              {/* Superset/Circuit Group Indicators */}
              {selectedExercises.length > 1 && (
                <div className="mt-4 p-4 bg-hf-dark rounded-lg border border-hf-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedExercises.length === 2 ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <Badge variant="outline" className={`text-xs ${
                        selectedExercises.length === 2 
                          ? 'bg-green-100 text-green-800 border-green-300' 
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}>
                        {selectedExercises.length === 2 ? 'Superset' : 'Circuit'}
                      </Badge>
                      <span className="text-sm text-hf-text-secondary">
                        {selectedExercises.length} exercises selected
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setGroupDialogOpen(true)}
                        variant="outline"
                        size="sm"
                        className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Create Group
                      </Button>
                      <Button
                        onClick={() => setSelectedExercises([])}
                        variant="outline"
                        size="sm"
                        className="border-hf-card text-hf-text-secondary hover:bg-hf-card"
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {exerciseGroups.length === 0 && ungroupedExercises.length === 0 && (
                <div className="text-center py-12">
                  <Dumbbell className="h-12 w-12 mx-auto text-hf-text-secondary mb-4" />
                  <p className="text-hf-text-secondary mb-2">No exercises added yet</p>
                  <p className="text-sm text-hf-text-secondary">
                    Click "Add Exercise" to get started with your workout
                  </p>
                </div>
              )}

              {/* Bottom Add Exercise Button */}
              {(exerciseGroups.length > 0 || ungroupedExercises.length > 0) && (
                <div className="mt-6 pt-4 border-t border-hf-card">
                  <Button
                    onClick={() => setExerciseDialogOpen(true)}
                    className="btn-gradient w-full"
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Exercise
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Creation Dialog */}
      <GroupCreationDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        selectedExercises={selectedExercises.map(id => 
          ungroupedExercises.find(ex => ex.id === id)!
        ).filter(Boolean)}
        onCreateGroup={addGroup}
      />

      {/* Exercise Selection Dialog */}
      <ExerciseSelectionDialog
        open={exerciseDialogOpen}
        onOpenChange={setExerciseDialogOpen}
        exercises={exercises}
        onSelectExercise={addExercise}
      />
    </div>
  )
}
