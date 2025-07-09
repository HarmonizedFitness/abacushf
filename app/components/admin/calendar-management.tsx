
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  RefreshCw, 
  Settings, 
  Save, 
  Plus, 
  X, 
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Coffee,
  Ban
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface SyncStats {
  synced: number
  pending: number
  failed: number
  conflict: number
  total: number
}

interface SyncLog {
  id: string
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC'
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT'
  errorMessage?: string
  createdAt: string
  booking?: {
    id: string
    startTime: string
    endTime: string
    status: string
    user: {
      id: string
      name: string
      email: string
    }
  }
}

interface AvailabilitySetting {
  id?: string
  type: 'WORKING_HOURS' | 'BREAK' | 'BLACKOUT_DATE' | 'BLACKOUT_PERIOD'
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  breakName?: string
  blackoutDate?: string
  blackoutStart?: string
  blackoutEnd?: string
  isRecurring?: boolean
  title?: string
  description?: string
  isActive?: boolean
}

export function CalendarManagement() {
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [availabilitySettings, setAvailabilitySettings] = useState<{
    workingHours: AvailabilitySetting[]
    breaks: AvailabilitySetting[]
    blackoutDates: AvailabilitySetting[]
    blackoutPeriods: AvailabilitySetting[]
  }>({
    workingHours: [],
    breaks: [],
    blackoutDates: [],
    blackoutPeriods: []
  })
  
  const { toast } = useToast()

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ]

  // Load sync status and availability settings
  useEffect(() => {
    loadSyncStatus()
    loadAvailabilitySettings()
  }, [])

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/admin/calendar/sync')
      const result = await response.json()
      
      if (result.success) {
        setSyncStats(result.data.stats)
        setSyncLogs(result.data.recentLogs)
      }
    } catch (error) {
      console.error('Error loading sync status:', error)
    }
  }

  const loadAvailabilitySettings = async () => {
    try {
      const response = await fetch('/api/admin/availability?active=true')
      const result = await response.json()
      
      if (result.success) {
        setAvailabilitySettings(result.data.grouped)
      }
    } catch (error) {
      console.error('Error loading availability settings:', error)
    }
  }

  const handleManualSync = async (force = false) => {
    setIsSyncing(true)
    try {
      const response = await fetch(`/api/admin/calendar/sync?force=${force}`, {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: '✅ Calendar Sync Completed',
          description: result.message,
        })
        
        // Reload sync status
        await loadSyncStatus()
      } else {
        toast({
          title: '⚠️ Sync Issues',
          description: result.error || 'Some items failed to sync',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: '⚠️ Unable to sync with Google Calendar',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'SYNCED': return 'bg-green-500/20 text-green-400'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400'
      case 'FAILED': return 'bg-red-500/20 text-red-400'
      case 'CONFLICT': return 'bg-orange-500/20 text-orange-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const addBreak = () => {
    const newBreak: AvailabilitySetting = {
      type: 'BREAK',
      breakName: 'New Break',
      startTime: '12:00',
      endTime: '13:00',
      isRecurring: true,
      isActive: true
    }
    
    setAvailabilitySettings(prev => ({
      ...prev,
      breaks: [...prev.breaks, newBreak]
    }))
  }

  const addBlackoutDate = () => {
    const newBlackout: AvailabilitySetting = {
      type: 'BLACKOUT_DATE',
      blackoutDate: new Date().toISOString().split('T')[0],
      title: 'Unavailable',
      isActive: true
    }
    
    setAvailabilitySettings(prev => ({
      ...prev,
      blackoutDates: [...prev.blackoutDates, newBlackout]
    }))
  }

  const removeBreak = (index: number) => {
    setAvailabilitySettings(prev => ({
      ...prev,
      breaks: prev.breaks.filter((_, i) => i !== index)
    }))
  }

  const removeBlackoutDate = (index: number) => {
    setAvailabilitySettings(prev => ({
      ...prev,
      blackoutDates: prev.blackoutDates.filter((_, i) => i !== index)
    }))
  }

  const updateBreak = (index: number, updates: Partial<AvailabilitySetting>) => {
    setAvailabilitySettings(prev => ({
      ...prev,
      breaks: prev.breaks.map((br, i) => i === index ? { ...br, ...updates } : br)
    }))
  }

  const updateBlackoutDate = (index: number, updates: Partial<AvailabilitySetting>) => {
    setAvailabilitySettings(prev => ({
      ...prev,
      blackoutDates: prev.blackoutDates.map((bd, i) => i === index ? { ...bd, ...updates } : bd)
    }))
  }

  const saveAvailabilitySettings = async () => {
    setIsLoading(true)
    try {
      const allSettings = [
        ...availabilitySettings.workingHours,
        ...availabilitySettings.breaks,
        ...availabilitySettings.blackoutDates,
        ...availabilitySettings.blackoutPeriods
      ]

      const response = await fetch('/api/admin/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: allSettings
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: '💾 Save Availability Settings',
          description: result.message,
        })
        
        await loadAvailabilitySettings()
      } else {
        throw new Error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save availability settings.',
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
          <h2 className="text-2xl font-bold text-hf-text">Calendar Management</h2>
          <p className="text-hf-text-secondary">Manage Google Calendar integration and availability</p>
        </div>
        <Button
          onClick={() => handleManualSync(false)}
          disabled={isSyncing}
          className="bg-hf-orange text-white hover:bg-hf-orange/90"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : '🔄 Resync with Google Calendar'}
        </Button>
      </div>

      <Tabs defaultValue="sync" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
          <TabsTrigger value="availability">Adjust Availability</TabsTrigger>
          <TabsTrigger value="breaks">Breaks & Blackouts</TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-4">
          {/* Sync Statistics */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text">Sync Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {syncStats ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{syncStats.synced}</div>
                    <div className="text-sm text-hf-text-secondary">Synced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{syncStats.pending}</div>
                    <div className="text-sm text-hf-text-secondary">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{syncStats.failed}</div>
                    <div className="text-sm text-hf-text-secondary">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{syncStats.conflict}</div>
                    <div className="text-sm text-hf-text-secondary">Conflicts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-hf-text">{syncStats.total}</div>
                    <div className="text-sm text-hf-text-secondary">Total</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-hf-text-secondary">Loading sync statistics...</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sync Logs */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text">Recent Sync Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {syncLogs.length > 0 ? (
                  syncLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-hf-background rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSyncStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                        <div>
                          <div className="text-sm font-medium text-hf-text">
                            {log.operation} {log.booking ? `- ${log.booking.user.name}` : ''}
                          </div>
                          <div className="text-xs text-hf-text-secondary">
                            {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>
                      
                      {log.errorMessage && (
                        <div className="text-xs text-red-400 max-w-xs truncate">
                          {log.errorMessage}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-hf-text-secondary">
                    No recent sync activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text">Working Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-hf-text-secondary">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Use the "Adjust Availability" button in the header to manage working hours</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaks" className="space-y-4">
          {/* Breaks Management */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-hf-text">Break Times</CardTitle>
                <Button
                  onClick={addBreak}
                  size="sm"
                  className="bg-hf-orange text-white hover:bg-hf-orange/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ➕ Add Break
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {availabilitySettings.breaks.map((breakTime, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-hf-background rounded-lg">
                  <Coffee className="h-4 w-4 text-hf-orange" />
                  <Input
                    value={breakTime.breakName || ''}
                    onChange={(e) => updateBreak(index, { breakName: e.target.value })}
                    placeholder="Break name"
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    value={breakTime.startTime || ''}
                    onChange={(e) => updateBreak(index, { startTime: e.target.value })}
                    className="w-32"
                  />
                  <span className="text-hf-text-secondary">to</span>
                  <Input
                    type="time"
                    value={breakTime.endTime || ''}
                    onChange={(e) => updateBreak(index, { endTime: e.target.value })}
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBreak(index)}
                    className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {availabilitySettings.breaks.length === 0 && (
                <div className="text-center py-4 text-hf-text-secondary">
                  No breaks configured
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blackout Dates */}
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-hf-text">Blackout Dates</CardTitle>
                <Button
                  onClick={addBlackoutDate}
                  size="sm"
                  className="bg-hf-orange text-white hover:bg-hf-orange/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ➕ Add Blackout Date
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {availabilitySettings.blackoutDates.map((blackout, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-hf-background rounded-lg">
                  <Ban className="h-4 w-4 text-red-400" />
                  <Input
                    type="date"
                    value={blackout.blackoutDate || ''}
                    onChange={(e) => updateBlackoutDate(index, { blackoutDate: e.target.value })}
                    className="w-40"
                  />
                  <Input
                    value={blackout.title || ''}
                    onChange={(e) => updateBlackoutDate(index, { title: e.target.value })}
                    placeholder="Reason (optional)"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlackoutDate(index)}
                    className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {availabilitySettings.blackoutDates.length === 0 && (
                <div className="text-center py-4 text-hf-text-secondary">
                  No blackout dates configured
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveAvailabilitySettings}
              disabled={isLoading}
              className="bg-hf-orange text-white hover:bg-hf-orange/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : '💾 Save Availability Settings'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
