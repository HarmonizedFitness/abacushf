
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Clock, Settings, Save, Plus, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
  isRecurring: boolean
  dayOfWeek?: number // 0 = Sunday, 1 = Monday, etc.
}

interface AvailabilityManagementProps {
  onClose?: () => void
}

export function AvailabilityManagement({ onClose }: AvailabilityManagementProps) {
  const [availability, setAvailability] = useState<{ [key: string]: TimeSlot[] }>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const daysOfWeek = [
    { key: 'sunday', label: 'Sunday', value: 0 },
    { key: 'monday', label: 'Monday', value: 1 },
    { key: 'tuesday', label: 'Tuesday', value: 2 },
    { key: 'wednesday', label: 'Wednesday', value: 3 },
    { key: 'thursday', label: 'Thursday', value: 4 },
    { key: 'friday', label: 'Friday', value: 5 },
    { key: 'saturday', label: 'Saturday', value: 6 }
  ]

  // Initialize with default availability
  useEffect(() => {
    const defaultAvailability: { [key: string]: TimeSlot[] } = {}
    
    daysOfWeek.forEach(day => {
      defaultAvailability[day.key] = [
        {
          id: `${day.key}-morning`,
          startTime: '09:00',
          endTime: '12:00',
          isAvailable: true,
          isRecurring: true,
          dayOfWeek: day.value
        },
        {
          id: `${day.key}-afternoon`,
          startTime: '14:00',
          endTime: '18:00',
          isAvailable: true,
          isRecurring: true,
          dayOfWeek: day.value
        }
      ]
    })
    
    setAvailability(defaultAvailability)
  }, [])

  const addTimeSlot = (dayKey: string) => {
    const newSlot: TimeSlot = {
      id: `${dayKey}-${Date.now()}`,
      startTime: '09:00',
      endTime: '10:00',
      isAvailable: true,
      isRecurring: true,
      dayOfWeek: daysOfWeek.find(d => d.key === dayKey)?.value
    }
    
    setAvailability(prev => ({
      ...prev,
      [dayKey]: [...(prev[dayKey] || []), newSlot]
    }))
  }

  const removeTimeSlot = (dayKey: string, slotId: string) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: prev[dayKey]?.filter(slot => slot.id !== slotId) || []
    }))
  }

  const updateTimeSlot = (dayKey: string, slotId: string, updates: Partial<TimeSlot>) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: prev[dayKey]?.map(slot => 
        slot.id === slotId ? { ...slot, ...updates } : slot
      ) || []
    }))
  }

  const toggleDayAvailability = (dayKey: string, isAvailable: boolean) => {
    setAvailability(prev => ({
      ...prev,
      [dayKey]: prev[dayKey]?.map(slot => ({ ...slot, isAvailable })) || []
    }))
  }

  const saveAvailability = async () => {
    setIsLoading(true)
    try {
      // Convert availability data to API format
      const availabilitySettings = []
      
      for (const [dayKey, daySlots] of Object.entries(availability)) {
        const day = daysOfWeek.find(d => d.key === dayKey)
        if (!day) continue
        
        for (const slot of daySlots) {
          if (slot.isAvailable) {
            availabilitySettings.push({
              type: 'WORKING_HOURS',
              dayOfWeek: day.value,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isActive: true,
              isRecurring: true,
              title: `${day.label} Working Hours`
            })
          }
        }
      }
      
      // Save to database
      const response = await fetch('/api/admin/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: availabilitySettings
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: '💾 Availability Settings Updated',
          description: 'Your availability schedule has been saved successfully.',
        })
        
        onClose?.()
      } else {
        throw new Error(result.error || 'Failed to save availability')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save availability. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-hf-text">Manage Availability</h2>
          <p className="text-hf-text-secondary">Set your working hours and availability</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={saveAvailability}
            disabled={isLoading}
            className="bg-hf-orange text-white hover:bg-hf-orange/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        {daysOfWeek.map(day => {
          const daySlots = availability[day.key] || []
          const hasAvailableSlots = daySlots.some(slot => slot.isAvailable)
          
          return (
            <Card key={day.key} className="bg-hf-card border-hf-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-hf-text">{day.label}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`${day.key}-toggle`} className="text-sm text-hf-text-secondary">
                      Available
                    </Label>
                    <Switch
                      id={`${day.key}-toggle`}
                      checked={hasAvailableSlots}
                      onCheckedChange={(checked) => toggleDayAvailability(day.key, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {daySlots.map(slot => (
                  <div key={slot.id} className="flex items-center space-x-4 p-3 bg-hf-background rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-hf-orange" />
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(day.key, slot.id, { startTime: e.target.value })}
                        className="w-24"
                      />
                      <span className="text-hf-text-secondary">to</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(day.key, slot.id, { endTime: e.target.value })}
                        className="w-24"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={slot.isAvailable}
                        onCheckedChange={(checked) => updateTimeSlot(day.key, slot.id, { isAvailable: checked })}
                      />
                      <Badge variant={slot.isAvailable ? 'default' : 'secondary'}>
                        {slot.isAvailable ? 'Available' : 'Blocked'}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeSlot(day.key, slot.id)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTimeSlot(day.key)}
                  className="w-full border-hf-orange text-hf-orange hover:bg-hf-orange hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Slot
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export function AvailabilityDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Manage Availability</DialogTitle>
        </DialogHeader>
        <AvailabilityManagement onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
