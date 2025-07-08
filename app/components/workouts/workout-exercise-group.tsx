
"use client"

import { useState } from 'react'
import {
  Zap,
  RotateCcw,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  Hash,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { WorkoutExerciseItem } from './workout-exercise-item'

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

interface WorkoutExerciseGroupProps {
  group: ExerciseGroup
  onUpdateGroup: (groupId: string, updates: Partial<ExerciseGroup>) => void
  onRemoveGroup: (groupId: string) => void
  onAddSet: (exerciseId: string) => void
  onRemoveSet: (exerciseId: string, setId: string) => void
  onUpdateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void
}

export function WorkoutExerciseGroup({
  group,
  onUpdateGroup,
  onRemoveGroup,
  onAddSet,
  onRemoveSet,
  onUpdateSet,
}: WorkoutExerciseGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(group.name || '')
  const [editNotes, setEditNotes] = useState(group.notes || '')
  const [editRounds, setEditRounds] = useState(group.rounds || 1)
  const [editRestBetweenRounds, setEditRestBetweenRounds] = useState(group.restBetweenRounds || 60)

  const getGroupIcon = () => {
    switch (group.type) {
      case 'SUPERSET':
        return <Zap className="h-4 w-4" />
      case 'CIRCUIT':
        return <RotateCcw className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getGroupColor = () => {
    switch (group.type) {
      case 'SUPERSET':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'CIRCUIT':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getGroupTitle = () => {
    if (group.name) return group.name
    if (group.type === 'SUPERSET') return `Superset ${group.order}`
    if (group.type === 'CIRCUIT') return `Circuit ${group.order}`
    return `Group ${group.order}`
  }

  const handleSaveEdit = () => {
    onUpdateGroup(group.id, {
      name: editName.trim() || undefined,
      notes: editNotes.trim() || undefined,
      rounds: editRounds,
      restBetweenRounds: editRestBetweenRounds,
    })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditName(group.name || '')
    setEditNotes(group.notes || '')
    setEditRounds(group.rounds || 1)
    setEditRestBetweenRounds(group.restBetweenRounds || 60)
    setIsEditing(false)
  }

  const calculateGroupStats = () => {
    const totalSets = group.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    const totalVolume = group.exercises.reduce((sum, ex) => 
      sum + ex.sets.reduce((setSum, set) => 
        setSum + ((set.weight || 0) * (set.reps || 0)), 0
      ), 0
    )
    return { totalSets, totalVolume }
  }

  const stats = calculateGroupStats()

  return (
    <Card className="bg-hf-dark border-hf-card">
      <CardHeader className="pb-3">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-auto">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <Badge className={getGroupColor()}>
                {getGroupIcon()}
                <span className="ml-1">{group.type}</span>
              </Badge>

              <div>
                <CardTitle className="text-hf-text text-lg">{getGroupTitle()}</CardTitle>
                <div className="flex items-center space-x-4 text-xs text-hf-text-secondary mt-1">
                  <span>{group.exercises.length} exercises</span>
                  <span>{stats.totalSets} sets</span>
                  <span>{stats.totalVolume.toLocaleString()} lbs</span>
                  {group.type === 'CIRCUIT' && group.rounds && (
                    <span>{group.rounds} rounds</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-hf-text-secondary hover:text-hf-text"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveGroup(group.id)}
                className="text-hf-error hover:text-hf-error"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Collapsible>
      </CardHeader>

      <CollapsibleContent>
        <CardContent className="pt-0">
          {isEditing ? (
            <div className="space-y-4 mb-4 p-4 bg-hf-card rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-hf-text-secondary">Group Name</Label>
                  <Input
                    placeholder="Optional group name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                {group.type === 'CIRCUIT' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-hf-text-secondary">Rounds</Label>
                      <Input
                        type="number"
                        value={editRounds}
                        onChange={(e) => setEditRounds(Number(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="text-xs text-hf-text-secondary">Rest Between Rounds (seconds)</Label>
                      <Input
                        type="number"
                        value={editRestBetweenRounds}
                        onChange={(e) => setEditRestBetweenRounds(Number(e.target.value))}
                        min={0}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-hf-text-secondary">Group Notes</Label>
                <Textarea
                  placeholder="Notes about this group..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={handleSaveEdit} size="sm" className="btn-gradient">
                  Save
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {group.notes && (
                <div className="mb-4 p-3 bg-hf-card rounded-lg">
                  <p className="text-sm text-hf-text-secondary">{group.notes}</p>
                </div>
              )}
              
              {group.type === 'CIRCUIT' && (
                <div className="mb-4 p-3 bg-hf-card rounded-lg">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-hf-text-secondary" />
                      <span className="text-hf-text-secondary">Rounds:</span>
                      <span className="text-hf-text">{group.rounds || 1}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-hf-text-secondary" />
                      <span className="text-hf-text-secondary">Rest between rounds:</span>
                      <span className="text-hf-text">{group.restBetweenRounds || 60}s</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-4">
            {group.exercises.map((exercise, index) => (
              <div key={exercise.id} className="relative">
                <div className="absolute left-2 top-4 z-10">
                  <Badge variant="secondary" className="text-xs">
                    {group.type === 'SUPERSET' ? `A${index + 1}` : 
                     group.type === 'CIRCUIT' ? `${index + 1}` : 
                     `${index + 1}`}
                  </Badge>
                </div>
                <WorkoutExerciseItem
                  exercise={exercise}
                  selected={false}
                  onSelect={() => {}}
                  onUpdateExercise={(id, updates) => {
                    const updatedExercises = group.exercises.map(ex =>
                      ex.id === id ? { ...ex, ...updates } : ex
                    )
                    onUpdateGroup(group.id, { exercises: updatedExercises })
                  }}
                  onRemoveExercise={() => {
                    const updatedExercises = group.exercises.filter(ex => ex.id !== exercise.id)
                    onUpdateGroup(group.id, { exercises: updatedExercises })
                  }}
                  onAddSet={() => onAddSet(exercise.id)}
                  onRemoveSet={(setId) => onRemoveSet(exercise.id, setId)}
                  onUpdateSet={(exerciseId, setId, updates) => onUpdateSet(exerciseId, setId, updates)}
                  isGrouped={true}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </CollapsibleContent>
    </Card>
  )
}
