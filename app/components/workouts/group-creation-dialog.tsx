
"use client"

import { useState } from 'react'
import {
  Zap,
  RotateCcw,
  Target,
  Hash,
  Clock,
  StickyNote,
  Plus,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  notes?: string
  sets: any[]
}

interface GroupCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedExercises: WorkoutExercise[]
  onCreateGroup: (groupData: {
    type: 'SUPERSET' | 'CIRCUIT'
    name?: string
    notes?: string
    rounds?: number
    restBetweenRounds?: number
    exerciseIds: string[]
  }) => void
}

export function GroupCreationDialog({
  open,
  onOpenChange,
  selectedExercises,
  onCreateGroup,
}: GroupCreationDialogProps) {
  const [groupType, setGroupType] = useState<'SUPERSET' | 'CIRCUIT'>('SUPERSET')
  const [groupName, setGroupName] = useState('')
  const [groupNotes, setGroupNotes] = useState('')
  const [rounds, setRounds] = useState(1)
  const [restBetweenRounds, setRestBetweenRounds] = useState(60)

  const handleCreateGroup = () => {
    if (selectedExercises.length < 2) {
      return
    }

    onCreateGroup({
      type: groupType,
      name: groupName.trim() || undefined,
      notes: groupNotes.trim() || undefined,
      rounds: groupType === 'CIRCUIT' ? rounds : undefined,
      restBetweenRounds: groupType === 'CIRCUIT' ? restBetweenRounds : undefined,
      exerciseIds: selectedExercises.map(ex => ex.id),
    })

    // Reset form
    setGroupName('')
    setGroupNotes('')
    setRounds(1)
    setRestBetweenRounds(60)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setGroupName('')
    setGroupNotes('')
    setRounds(1)
    setRestBetweenRounds(60)
    onOpenChange(false)
  }

  const getGroupTypeInfo = (type: 'SUPERSET' | 'CIRCUIT') => {
    switch (type) {
      case 'SUPERSET':
        return {
          icon: <Zap className="h-4 w-4" />,
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          title: 'Superset',
          description: 'Perform exercises back-to-back with minimal rest between them',
          example: 'A1: Bench Press → A2: Bent Over Row → Rest → Repeat',
        }
      case 'CIRCUIT':
        return {
          icon: <RotateCcw className="h-4 w-4" />,
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          title: 'Circuit',
          description: 'Perform exercises in sequence for multiple rounds',
          example: 'Round 1: Ex1 → Ex2 → Ex3 → Rest → Round 2: Ex1 → Ex2 → Ex3',
        }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-hf-card border-hf-card max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-hf-text">
            Create Exercise Group ({selectedExercises.length} exercises)
          </DialogTitle>
        </DialogHeader>

        <Tabs value={groupType} onValueChange={(value) => setGroupType(value as 'SUPERSET' | 'CIRCUIT')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="SUPERSET" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Superset</span>
            </TabsTrigger>
            <TabsTrigger value="CIRCUIT" className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4" />
              <span>Circuit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="SUPERSET" className="space-y-4">
            <Card className="bg-hf-dark border-hf-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-hf-text flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-purple-400" />
                  Superset Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <p className="text-sm text-purple-400 mb-2">How it works:</p>
                  <p className="text-xs text-hf-text-secondary">
                    Perform exercises back-to-back with minimal rest between them. 
                    Rest only after completing all exercises in the superset.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-hf-text">Group Name (Optional)</Label>
                  <Input
                    placeholder="e.g., Upper Body Superset"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-hf-text">Group Notes (Optional)</Label>
                  <Textarea
                    placeholder="e.g., Superset: A1 & A2 — 4 rounds, no rest between exercises"
                    value={groupNotes}
                    onChange={(e) => setGroupNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="CIRCUIT" className="space-y-4">
            <Card className="bg-hf-dark border-hf-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-hf-text flex items-center">
                  <RotateCcw className="h-5 w-5 mr-2 text-blue-400" />
                  Circuit Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-blue-400 mb-2">How it works:</p>
                  <p className="text-xs text-hf-text-secondary">
                    Perform exercises in sequence for multiple rounds. 
                    Rest between rounds, not between individual exercises.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-hf-text flex items-center">
                      <Hash className="h-4 w-4 mr-2" />
                      Number of Rounds
                    </Label>
                    <Input
                      type="number"
                      value={rounds}
                      onChange={(e) => setRounds(Number(e.target.value))}
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-hf-text flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Rest Between Rounds (seconds)
                    </Label>
                    <Input
                      type="number"
                      value={restBetweenRounds}
                      onChange={(e) => setRestBetweenRounds(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-hf-text">Group Name (Optional)</Label>
                  <Input
                    placeholder="e.g., HIIT Circuit"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-hf-text">Group Notes (Optional)</Label>
                  <Textarea
                    placeholder={`e.g., Circuit: ${rounds} rounds, ${restBetweenRounds}s rest between rounds`}
                    value={groupNotes}
                    onChange={(e) => setGroupNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Selected Exercises Preview */}
        <div className="space-y-2">
          <Label className="text-hf-text">Selected Exercises</Label>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {selectedExercises.map((exercise, index) => (
              <Card key={exercise.id} className="bg-hf-dark border-hf-card">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="text-xs">
                        {groupType === 'SUPERSET' ? `A${index + 1}` : `${index + 1}`}
                      </Badge>
                      <div>
                        <p className="font-medium text-hf-text">{exercise.exercise.name}</p>
                        <p className="text-xs text-hf-text-secondary">
                          {exercise.exercise.category} • {exercise.sets.length} sets
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {exercise.exercise.muscleGroups.slice(0, 2).map((muscle) => (
                        <Badge key={muscle} variant="outline" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGroup}
            disabled={selectedExercises.length < 2}
            className="btn-gradient"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create {groupType === 'SUPERSET' ? 'Superset' : 'Circuit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
