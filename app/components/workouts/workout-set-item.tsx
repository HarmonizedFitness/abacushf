
"use client"

import { useState } from 'react'
import {
  Trash2,
  MoreHorizontal,
  TrendingDown,
  Clock,
  Hash,
  Weight,
  StickyNote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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

interface WorkoutSetItemProps {
  set: WorkoutSet
  setIndex: number
  onUpdateSet: (updates: Partial<WorkoutSet>) => void
  onRemoveSet: () => void
  canRemove: boolean
}

export function WorkoutSetItem({
  set,
  setIndex,
  onUpdateSet,
  onRemoveSet,
  canRemove,
}: WorkoutSetItemProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [editNotes, setEditNotes] = useState(set.notes || '')

  const handleNotesChange = (notes: string) => {
    setEditNotes(notes)
    onUpdateSet({ notes: notes.trim() || undefined })
  }

  const formatTime = (seconds?: number) => {
    if (!seconds) return ''
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  return (
    <div className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border ${
      set.isDropSet ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-hf-card bg-hf-dark'
    }`}>
      {/* Set Number */}
      <div className="col-span-1 flex items-center space-x-1">
        <span className="text-sm text-hf-text font-medium">{set.setNumber}</span>
        {set.isDropSet && (
          <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
            Drop
          </Badge>
        )}
      </div>

      {/* Reps */}
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="0"
          value={set.reps || ''}
          onChange={(e) => onUpdateSet({ reps: e.target.value ? Number(e.target.value) : undefined })}
          className="text-sm"
          min={0}
        />
      </div>

      {/* Weight */}
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="0"
          value={set.weight || ''}
          onChange={(e) => onUpdateSet({ weight: e.target.value ? Number(e.target.value) : undefined })}
          className="text-sm"
          min={0}
          step={0.5}
        />
      </div>

      {/* Rest Time */}
      <div className="col-span-2">
        <Input
          type="number"
          placeholder="60"
          value={set.restTime || ''}
          onChange={(e) => onUpdateSet({ restTime: e.target.value ? Number(e.target.value) : undefined })}
          className="text-sm"
          min={0}
        />
      </div>

      {/* Notes */}
      <div className="col-span-4">
        <Input
          placeholder="Set notes..."
          value={set.notes || ''}
          onChange={(e) => onUpdateSet({ notes: e.target.value.trim() || undefined })}
          className="text-sm"
        />
      </div>

      {/* Actions */}
      <div className="col-span-1 flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowAdvanced(true)}>
              <StickyNote className="h-4 w-4 mr-2" />
              Advanced Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onUpdateSet({ isDropSet: !set.isDropSet })}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              {set.isDropSet ? 'Remove Drop Set' : 'Mark as Drop Set'}
            </DropdownMenuItem>
            {canRemove && (
              <DropdownMenuItem onClick={onRemoveSet} className="text-hf-error">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Set
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Advanced Settings Dialog */}
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent className="bg-hf-card border-hf-card">
          <DialogHeader>
            <DialogTitle className="text-hf-text">
              Advanced Set Settings - Set {set.setNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Duration (for time-based exercises) */}
            <div className="space-y-2">
              <Label className="text-hf-text flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Duration (seconds)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={set.duration || ''}
                onChange={(e) => onUpdateSet({ duration: e.target.value ? Number(e.target.value) : undefined })}
                min={0}
              />
              <p className="text-xs text-hf-text-secondary">
                For time-based exercises like planks or cardio
              </p>
            </div>

            {/* Rest Time (detailed) */}
            <div className="space-y-2">
              <Label className="text-hf-text flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Rest Time (seconds)
              </Label>
              <Input
                type="number"
                placeholder="60"
                value={set.restTime || ''}
                onChange={(e) => onUpdateSet({ restTime: e.target.value ? Number(e.target.value) : undefined })}
                min={0}
              />
              <p className="text-xs text-hf-text-secondary">
                Current: {formatTime(set.restTime)}
              </p>
            </div>

            {/* Drop Set Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={set.isDropSet || false}
                onCheckedChange={(checked) => onUpdateSet({ isDropSet: checked })}
              />
              <Label className="text-hf-text flex items-center">
                <TrendingDown className="h-4 w-4 mr-2" />
                Drop Set
              </Label>
            </div>

            {/* Detailed Notes */}
            <div className="space-y-2">
              <Label className="text-hf-text flex items-center">
                <StickyNote className="h-4 w-4 mr-2" />
                Detailed Notes
              </Label>
              <Textarea
                placeholder="Detailed notes about this set (form cues, RPE, etc.)"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Set Statistics */}
            <div className="space-y-2">
              <Label className="text-hf-text">Set Statistics</Label>
              <div className="grid grid-cols-2 gap-4 p-3 bg-hf-dark rounded-lg">
                <div className="text-sm">
                  <span className="text-hf-text-secondary">Volume:</span>
                  <span className="text-hf-text ml-2">
                    {((set.weight || 0) * (set.reps || 0)).toLocaleString()} lbs
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-hf-text-secondary">Rest:</span>
                  <span className="text-hf-text ml-2">
                    {formatTime(set.restTime) || 'Not set'}
                  </span>
                </div>
                {set.duration && (
                  <div className="text-sm col-span-2">
                    <span className="text-hf-text-secondary">Duration:</span>
                    <span className="text-hf-text ml-2">
                      {formatTime(set.duration)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  handleNotesChange(editNotes)
                  setShowAdvanced(false)
                }}
                className="btn-gradient"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
