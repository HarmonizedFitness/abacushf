
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dumbbell, Target, Users, Plus, Edit, Trash2, Eye, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Exercise {
  id: string
  name: string
  description?: string
  instructions?: string
  category: string
  muscleGroups: string[]
  equipment?: string
  imageUrl?: string
  videoUrl?: string
  isActive: boolean
  _count: {
    favoritedBy: number
    workoutExercises: number
  }
}

interface ExerciseLibraryClientProps {
  exercises: Exercise[]
}

export function ExerciseLibraryClient({ exercises }: ExerciseLibraryClientProps) {
  const [viewingExercises, setViewingExercises] = useState<Set<string>>(new Set())
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [deleteExercise, setDeleteExercise] = useState<Exercise | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      CHEST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      BACK: 'bg-green-500/20 text-green-400 border-green-500/30',
      LEGS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      SHOULDERS: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      ARMS: 'bg-red-500/20 text-red-400 border-red-500/30',
      CORE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
    return <Badge className={colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>{category}</Badge>
  }

  const toggleView = (exerciseId: string) => {
    const newViewingExercises = new Set(viewingExercises)
    if (newViewingExercises.has(exerciseId)) {
      newViewingExercises.delete(exerciseId)
    } else {
      newViewingExercises.add(exerciseId)
    }
    setViewingExercises(newViewingExercises)
  }

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise)
  }

  const handleDelete = (exercise: Exercise) => {
    setDeleteExercise(exercise)
  }

  const handleEditSubmit = async (formData: FormData) => {
    if (!editingExercise) return

    setIsEditing(true)
    try {
      const response = await fetch(`/api/exercises/${editingExercise.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          instructions: formData.get('instructions'),
          category: formData.get('category'),
          muscleGroups: formData.get('muscleGroups')?.toString().split(',').map(s => s.trim()).filter(Boolean),
          equipment: formData.get('equipment'),
          imageUrl: formData.get('imageUrl'),
          videoUrl: formData.get('videoUrl'),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update exercise')
      }

      toast({
        title: 'Success',
        description: 'Exercise updated successfully',
      })
      
      setEditingExercise(null)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error updating exercise:', error)
      toast({
        title: 'Error',
        description: 'Failed to update exercise',
        variant: 'destructive',
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteExercise) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/exercises/${deleteExercise.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete exercise')
      }

      toast({
        title: 'Success',
        description: 'Exercise deleted successfully',
      })
      
      setDeleteExercise(null)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error deleting exercise:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete exercise',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (exercises?.length === 0) {
    return (
      <div className="grid gap-6">
        <Card className="bg-hf-card border-hf-card">
          <CardContent className="text-center py-12">
            <Dumbbell className="h-12 w-12 mx-auto text-hf-text-secondary mb-4" />
            <p className="text-hf-text-secondary mb-2">No exercises found</p>
            <p className="text-sm text-hf-text-secondary mb-4">
              Start building your exercise library by adding your first exercise
            </p>
            <Link href="/admin/exercises/new">
              <Button className="btn-gradient">
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4">
        {exercises?.map((exercise) => {
          const isViewing = viewingExercises.has(exercise.id)
          return (
            <Card key={exercise.id} className="bg-hf-card border-hf-card">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-orange rounded-lg flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-hf-text text-lg">{exercise.name}</CardTitle>
                      <p className="text-hf-text-secondary text-sm">{exercise.equipment || 'No equipment specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getCategoryBadge(exercise.category)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleView(exercise.id)}
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10 px-2 py-1 h-auto text-xs"
                    >
                      {isViewing ? (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          hide
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          view
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isViewing && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-hf-orange" />
                      <span className="text-hf-text-secondary text-sm">
                        {exercise.muscleGroups?.length > 0 ? exercise.muscleGroups.join(', ') : 'No muscle groups specified'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-hf-orange" />
                      <span className="text-hf-text-secondary text-sm">
                        Used by {exercise._count?.favoritedBy || 0} clients • {exercise._count?.workoutExercises || 0} workouts
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-hf-text-secondary text-sm mb-4">
                    {exercise.description || exercise.instructions || 'No description available'}
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
                      onClick={() => handleEdit(exercise)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDelete(exercise)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingExercise} onOpenChange={() => setEditingExercise(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
          </DialogHeader>
          
          {editingExercise && (
            <form action={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Exercise Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingExercise.name}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingExercise.category}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHEST">Chest</SelectItem>
                      <SelectItem value="BACK">Back</SelectItem>
                      <SelectItem value="LEGS">Legs</SelectItem>
                      <SelectItem value="SHOULDERS">Shoulders</SelectItem>
                      <SelectItem value="ARMS">Arms</SelectItem>
                      <SelectItem value="CORE">Core</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment</Label>
                <Input
                  id="equipment"
                  name="equipment"
                  defaultValue={editingExercise.equipment || ''}
                  placeholder="e.g., Barbell, Dumbbells, Bodyweight"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="muscleGroups">Muscle Groups (comma-separated)</Label>
                <Input
                  id="muscleGroups"
                  name="muscleGroups"
                  defaultValue={editingExercise.muscleGroups?.join(', ') || ''}
                  placeholder="e.g., Chest, Triceps, Front Delts"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingExercise.description || ''}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  defaultValue={editingExercise.instructions || ''}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    defaultValue={editingExercise.imageUrl || ''}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    name="videoUrl"
                    type="url"
                    defaultValue={editingExercise.videoUrl || ''}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingExercise(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isEditing}
                  className="btn-gradient"
                >
                  {isEditing ? 'Updating...' : 'Update Exercise'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteExercise} onOpenChange={() => setDeleteExercise(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteExercise?.name}"? This action cannot be undone.
              {deleteExercise?._count?.workoutExercises && deleteExercise._count.workoutExercises > 0 && (
                <span className="block mt-2 text-yellow-600 font-medium">
                  Note: This exercise is used in {deleteExercise?._count?.workoutExercises} workout(s). It will be deactivated instead of deleted.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
