
"use client"

import { useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  Dumbbell,
  Target,
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Exercise {
  id: string
  name: string
  category: string
  muscleGroups: string[]
  equipment?: string
}

interface ExerciseSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercises: Exercise[]
  onSelectExercise: (exercise: Exercise) => void
}

export function ExerciseSelectionDialog({
  open,
  onOpenChange,
  exercises,
  onSelectExercise,
}: ExerciseSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('all')

  // Get unique categories and muscle groups
  const categories = Array.from(new Set(exercises.map(ex => ex.category))).sort()
  const muscleGroups = Array.from(new Set(exercises.flatMap(ex => ex.muscleGroups))).sort()

  // Filter exercises
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         exercise.muscleGroups.some(muscle => 
                           muscle.toLowerCase().includes(searchQuery.toLowerCase())
                         )
    
    const matchesCategory = categoryFilter === 'all' || exercise.category === categoryFilter
    const matchesMuscleGroup = muscleGroupFilter === 'all' || 
                              exercise.muscleGroups.includes(muscleGroupFilter)
    
    return matchesSearch && matchesCategory && matchesMuscleGroup
  })

  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise)
    onOpenChange(false)
    setSearchQuery('')
    setCategoryFilter('all')
    setMuscleGroupFilter('all')
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setMuscleGroupFilter('all')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-hf-card border-hf-card max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-hf-text flex items-center">
            <Dumbbell className="h-5 w-5 mr-2 text-hf-orange" />
            Select Exercise
          </DialogTitle>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-hf-text-secondary" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {(searchQuery || categoryFilter !== 'all' || muscleGroupFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-hf-card"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by muscle group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Muscle Groups</SelectItem>
                {muscleGroups.map((muscle) => (
                  <SelectItem key={muscle} value={muscle}>
                    {muscle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-hf-text-secondary">
              {filteredExercises.length} exercises found
            </p>
            {filteredExercises.length > 0 && (
              <p className="text-sm text-hf-text-secondary">
                Click to add
              </p>
            )}
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-3 bg-hf-dark rounded-lg border border-hf-card cursor-pointer hover:bg-hf-card/50 transition-colors"
                  onClick={() => handleSelectExercise(exercise)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-hf-text">{exercise.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {exercise.category}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {exercise.muscleGroups.slice(0, 3).map((muscle) => (
                        <Badge key={muscle} variant="outline" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                      {exercise.muscleGroups.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{exercise.muscleGroups.length - 3}
                        </Badge>
                      )}
                    </div>
                    {exercise.equipment && (
                      <p className="text-xs text-hf-text-secondary mt-1">
                        Equipment: {exercise.equipment}
                      </p>
                    )}
                  </div>
                  <Plus className="h-4 w-4 text-hf-orange" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Empty State */}
        {filteredExercises.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-hf-text-secondary mb-4" />
            <p className="text-hf-text-secondary">No exercises found</p>
            <p className="text-sm text-hf-text-secondary mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
