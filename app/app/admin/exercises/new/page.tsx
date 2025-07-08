
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/navigation/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Save, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const categories = [
  { value: 'CHEST', label: 'Chest' },
  { value: 'BACK', label: 'Back' },
  { value: 'LEGS', label: 'Legs' },
  { value: 'SHOULDERS', label: 'Shoulders' },
  { value: 'ARMS', label: 'Arms' },
  { value: 'CORE', label: 'Core' },
  { value: 'CARDIO', label: 'Cardio' },
  { value: 'FULL_BODY', label: 'Full Body' }
]



const availableMuscleGroups = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Obliques'
]

const equipmentOptions = [
  'Barbell', 'Dumbbell', 'Kettlebell', 'Cable Machine', 'Resistance Band',
  'Bodyweight', 'Medicine Ball', 'Pull-up Bar', 'Bench', 'Smith Machine'
]

interface ExerciseFormData {
  name: string
  description: string
  category: string
  muscleGroups: string[]
  equipment: string
  instructions: string
}

export default function AddExercisePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    description: '',
    category: '',
    muscleGroups: [],
    equipment: '',
    instructions: ''
  })

  const [errors, setErrors] = useState<Partial<ExerciseFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<ExerciseFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Exercise name is required'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.muscleGroups.length === 0) {
      newErrors.muscleGroups = ['At least one muscle group is required']
    }

    if (!formData.equipment) {
      newErrors.equipment = 'Equipment is required'
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Exercise added successfully!',
        })
        router.push('/admin/exercises')
      } else {
        throw new Error('Failed to add exercise')
      }
    } catch (error) {
      console.error('Error adding exercise:', error)
      toast({
        title: 'Error',
        description: 'Failed to add exercise. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMuscleGroupChange = (muscleGroup: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: checked
        ? [...prev.muscleGroups, muscleGroup]
        : prev.muscleGroups.filter(group => group !== muscleGroup)
    }))
  }

  const removeMuscleGroup = (muscleGroup: string) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.filter(group => group !== muscleGroup)
    }))
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <PageHeader 
        title="Add Exercise"
        description="Create a new exercise for the library"
        backHref="/admin/exercises"
      />

      <Card className="bg-hf-card border-hf-card">
        <CardHeader>
          <CardTitle className="text-hf-text flex items-center space-x-2">
            <Dumbbell className="h-5 w-5 text-hf-orange" />
            <span>Exercise Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Exercise Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-hf-text">Exercise Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter exercise name"
                className="bg-hf-background border-hf-border text-hf-text"
                required
              />
              {errors.name && (
                <p className="text-red-400 text-sm">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-hf-text">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the exercise"
                className="bg-hf-background border-hf-border text-hf-text"
              />
              {errors.description && (
                <p className="text-red-400 text-sm">{errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-hf-text">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="bg-hf-background border-hf-border text-hf-text">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-400 text-sm">{errors.category}</p>
              )}
            </div>

            {/* Muscle Groups */}
            <div className="space-y-2">
              <Label className="text-hf-text">Muscle Groups</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableMuscleGroups.map((muscleGroup) => (
                  <div key={muscleGroup} className="flex items-center space-x-2">
                    <Checkbox
                      id={muscleGroup}
                      checked={formData.muscleGroups.includes(muscleGroup)}
                      onCheckedChange={(checked) => handleMuscleGroupChange(muscleGroup, checked as boolean)}
                    />
                    <Label
                      htmlFor={muscleGroup}
                      className="text-hf-text-secondary text-sm cursor-pointer"
                    >
                      {muscleGroup}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.muscleGroups.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.muscleGroups.map((muscleGroup) => (
                    <Badge
                      key={muscleGroup}
                      className="bg-hf-orange/20 text-hf-orange border-hf-orange/30 cursor-pointer hover:bg-hf-orange/30"
                      onClick={() => removeMuscleGroup(muscleGroup)}
                    >
                      {muscleGroup}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              {errors.muscleGroups && (
                <p className="text-red-400 text-sm">{errors.muscleGroups[0]}</p>
              )}
            </div>

            {/* Equipment */}
            <div className="space-y-2">
              <Label htmlFor="equipment" className="text-hf-text">Equipment</Label>
              <Select value={formData.equipment} onValueChange={(value) => setFormData(prev => ({ ...prev, equipment: value }))}>
                <SelectTrigger className="bg-hf-background border-hf-border text-hf-text">
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentOptions.map((equipment) => (
                    <SelectItem key={equipment} value={equipment}>
                      {equipment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.equipment && (
                <p className="text-red-400 text-sm">{errors.equipment}</p>
              )}
            </div>



            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-hf-text">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Enter detailed exercise instructions..."
                className="bg-hf-background border-hf-border text-hf-text min-h-[100px]"
                required
              />
              {errors.instructions && (
                <p className="text-red-400 text-sm">{errors.instructions}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                className="btn-gradient flex-1"
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Adding Exercise...' : 'Add Exercise'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-hf-border text-hf-text-secondary hover:bg-hf-background"
                onClick={() => router.push('/admin/exercises')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
