
"use client"

import { useState } from 'react'
import {
  Dumbbell,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  GripVertical,
  Target,
  Clock,
  Hash,
  ChevronDown,
  ChevronRight,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { WorkoutSetItem } from './workout-set-item'

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
  exercise: {
    id: string
    name: string
    category: string
    muscleGroups: string[]
    equipment?: string
  }
  order: number
  orderInGroup?: number
  notes?: string
  sets: WorkoutSet[]
}

interface WorkoutExerciseItemProps {
  exercise: WorkoutExercise
  selected: boolean
  onSelect: (selected: boolean) => void
  onUpdateExercise: (id: string, updates: Partial<WorkoutExercise>) => void
  onRemoveExercise: (id: string) => void
  onAddSet: (exerciseId: string) => void
  onRemoveSet: (exerciseId: string, setId: string) => void
  onUpdateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void
  isGrouped?: boolean
  isBodyWeight?: boolean
  currentBodyWeight?: number
  isCompleted?: boolean
  onToggleCompletion?: (exerciseId: string) => void
}

export function WorkoutExerciseItem({
  exercise,
  selected,
  onSelect,
  onUpdateExercise,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
  isGrouped = false,
  isBodyWeight = false,
  currentBodyWeight = 0,
  isCompleted = false,
  onToggleCompletion,
}: WorkoutExerciseItemProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editNotes, setEditNotes] = useState(exercise.notes || '')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSaveNotes = () => {
    onUpdateExercise(exercise.id, { notes: editNotes.trim() || undefined })
    setIsEditingNotes(false)
  }

  const handleCompletedToggle = () => {
    if (onToggleCompletion) {
      onToggleCompletion(exercise.id)
      if (!isCompleted) {
        // When marking as completed, collapse the exercise
        setIsExpanded(false)
      }
    }
  }

  const handleExpandToggle = () => {
    if (!isCompleted) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleBodyWeightSet = (setId: string, updates: Partial<WorkoutSet>) => {
    // For body weight exercises, set weight to current body weight if not already set
    if (isBodyWeight && currentBodyWeight > 0 && !updates.weight) {
      updates.weight = currentBodyWeight
    }
    onUpdateSet(exercise.id, setId, updates)
  }

  const handleCancelNotes = () => {
    setEditNotes(exercise.notes || '')
    setIsEditingNotes(false)
  }

  const calculateExerciseStats = () => {
    const totalSets = exercise.sets.length
    const totalReps = exercise.sets.reduce((sum, set) => sum + (set.reps || 0), 0)
    const totalVolume = exercise.sets.reduce((sum, set) => 
      sum + ((set.weight || 0) * (set.reps || 0)), 0
    )
    const avgWeight = exercise.sets.reduce((sum, set) => sum + (set.weight || 0), 0) / totalSets
    const dropSets = exercise.sets.filter(set => set.isDropSet).length

    return { totalSets, totalReps, totalVolume, avgWeight, dropSets }
  }

  const stats = calculateExerciseStats()

  return (
    <Card className={`bg-hf-card border-hf-card ${selected ? 'ring-2 ring-hf-orange' : ''} ${isGrouped ? 'ml-8' : ''} ${isCompleted ? 'ring-2 ring-green-500' : ''} transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isGrouped && (
              <>
                <GripVertical className="h-4 w-4 text-hf-text-secondary cursor-grab" />
                <Checkbox
                  checked={selected}
                  onCheckedChange={onSelect}
                  className="border-2 border-hf-orange data-[state=checked]:bg-hf-orange data-[state=checked]:border-hf-orange h-5 w-5 hover:border-hf-orange/80 focus:ring-2 focus:ring-hf-orange/50"
                />
              </>
            )}
            
            {/* Completed Checkbox */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCompletedToggle}
              className={`p-1 ${isCompleted ? 'text-green-500' : 'text-hf-text-secondary'}`}
            >
              <CheckCircle className={`h-5 w-5 ${isCompleted ? 'fill-green-500' : ''}`} />
            </Button>
            
            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandToggle}
              className={`p-1 ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isCompleted}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-hf-text-secondary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-hf-text-secondary" />
              )}
            </Button>
            
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className={`text-hf-text text-lg ${isCompleted ? 'line-through opacity-75' : ''}`}>
                  {exercise.exercise.name}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {exercise.exercise.category}
                </Badge>
                {isBodyWeight && (
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                    BW
                  </Badge>
                )}
                {isCompleted && (
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                    ✓ Completed
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-hf-text-secondary mt-1">
                <span>{stats.totalSets} sets</span>
                <span>{stats.totalReps} reps</span>
                <span>
                  {isBodyWeight && stats.totalVolume > 0 
                    ? `${stats.totalVolume.toLocaleString()} lbs (BW)`
                    : isBodyWeight 
                      ? `BW × ${stats.totalReps}`
                      : `${stats.totalVolume.toLocaleString()} lbs`
                  }
                </span>
                {stats.avgWeight > 0 && (
                  <span>
                    avg {isBodyWeight ? `${stats.avgWeight.toFixed(1)} lbs (BW)` : `${stats.avgWeight.toFixed(1)} lbs`}
                  </span>
                )}
                {stats.dropSets > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {stats.dropSets} drop sets
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {exercise.exercise.muscleGroups.slice(0, 3).map((muscle) => (
                  <Badge key={muscle} variant="outline" className="text-xs">
                    {muscle}
                  </Badge>
                ))}
                {exercise.exercise.muscleGroups.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{exercise.exercise.muscleGroups.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddSet(exercise.id)}
              className="text-hf-text-secondary hover:text-hf-text"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveExercise(exercise.id)}
              className="text-hf-error hover:text-hf-error"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Exercise Notes */}
          <div className="mb-4">
          {isEditingNotes ? (
            <div className="space-y-2">
              <Label className="text-xs text-hf-text-secondary">Exercise Notes</Label>
              <Textarea
                placeholder="Exercise-specific notes..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
              />
              <div className="flex items-center space-x-2">
                <Button onClick={handleSaveNotes} size="sm" className="btn-gradient">
                  <Check className="h-4 w-4" />
                </Button>
                <Button onClick={handleCancelNotes} variant="outline" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {exercise.notes ? (
                  <p className="text-sm text-hf-text-secondary">{exercise.notes}</p>
                ) : (
                  <p className="text-sm text-hf-text-secondary italic">No exercise notes</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingNotes(true)}
                className="text-hf-text-secondary hover:text-hf-text"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Set Headers */}
        <div className="grid grid-cols-12 gap-2 mb-2 px-3 py-2 bg-hf-dark rounded-lg">
          <div className="col-span-1 text-xs text-hf-text-secondary font-medium">Set</div>
          <div className="col-span-2 text-xs text-hf-text-secondary font-medium">Reps</div>
          <div className="col-span-2 text-xs text-hf-text-secondary font-medium">Weight</div>
          <div className="col-span-2 text-xs text-hf-text-secondary font-medium">Rest</div>
          <div className="col-span-4 text-xs text-hf-text-secondary font-medium">Notes</div>
          <div className="col-span-1 text-xs text-hf-text-secondary font-medium">Action</div>
        </div>

        {/* Sets */}
        <div className="space-y-2">
          {exercise.sets.map((set, index) => (
            <WorkoutSetItem
              key={set.id}
              set={set}
              setIndex={index}
              onUpdateSet={(updates) => onUpdateSet(exercise.id, set.id, updates)}
              onRemoveSet={() => onRemoveSet(exercise.id, set.id)}
              canRemove={exercise.sets.length > 1}
            />
          ))}
        </div>

        {/* Add Set Button */}
        <Button
          onClick={() => onAddSet(exercise.id)}
          variant="outline"
          size="sm"
          className="w-full mt-3 border-dashed border-hf-card text-hf-text-secondary hover:text-hf-text"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Set
        </Button>
        </CardContent>
      )}
    </Card>
  )
}
