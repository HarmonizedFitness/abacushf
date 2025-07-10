
"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Trophy,
  Target,
  Activity,
  Calendar,
  Filter,
  BarChart3,
  LineChart as LineChartIcon,
  Award,
  Flame,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, Column } from '@/components/common/data-table'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { ChartContainer } from '@/components/common/chart-container'
import { ResponsiveContainer, LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface ProgressEntry {
  id: string
  type: string
  value: number
  unit?: string
  notes?: string
  recordedAt: string
  recordedBy?: string
  user?: {
    id: string
    name: string
    email: string
  }
}

interface ProgressSummary {
  type: string
  _count: {
    id: number
  }
}

interface ProgressDashboardProps {
  userId?: string
  readonly?: boolean
  showHeader?: boolean
}

const PROGRESS_TYPES = {
  BODY_WEIGHT: { label: 'Body Weight', unit: 'lbs', icon: Activity, color: 'bg-blue-500' },
  BMI: { label: 'BMI', unit: 'kg/m²', icon: Target, color: 'bg-green-500' },
  BODY_FAT_PERCENTAGE: { label: 'Body Fat %', unit: '%', icon: TrendingDown, color: 'bg-orange-500' },
  MUSCLE_MASS: { label: 'Muscle Mass', unit: 'lbs', icon: TrendingUp, color: 'bg-purple-500' },
  CHEST_MEASUREMENT: { label: 'Chest', unit: 'inches', icon: Activity, color: 'bg-red-500' },
  WAIST_MEASUREMENT: { label: 'Waist', unit: 'inches', icon: Activity, color: 'bg-yellow-500' },
  HIP_MEASUREMENT: { label: 'Hip', unit: 'inches', icon: Activity, color: 'bg-pink-500' },
  ARM_MEASUREMENT: { label: 'Arm', unit: 'inches', icon: Activity, color: 'bg-indigo-500' },
  THIGH_MEASUREMENT: { label: 'Thigh', unit: 'inches', icon: Activity, color: 'bg-teal-500' },
  NECK_MEASUREMENT: { label: 'Neck', unit: 'inches', icon: Activity, color: 'bg-cyan-500' },
  STRENGTH_SCORE: { label: 'Strength Score', unit: 'points', icon: Trophy, color: 'bg-amber-500' },
  CARDIO_SCORE: { label: 'Cardio Score', unit: 'points', icon: Activity, color: 'bg-lime-500' },
  FLEXIBILITY_SCORE: { label: 'Flexibility Score', unit: 'points', icon: Target, color: 'bg-emerald-500' },
  CUSTOM_MEASUREMENT: { label: 'Custom', unit: 'units', icon: Star, color: 'bg-gray-500' },
}

export function ProgressDashboard({ userId, readonly = false, showHeader = true }: ProgressDashboardProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [progressSummary, setProgressSummary] = useState<ProgressSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ProgressEntry | null>(null)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [formData, setFormData] = useState({
    type: 'BODY_WEIGHT',
    value: '',
    unit: '',
    notes: '',
    recordedAt: new Date().toISOString().split('T')[0],
  })

  const isAdmin = session?.user?.role === 'ADMIN'
  const canEdit = !readonly && (isAdmin || !userId || userId === session?.user?.id)

  useEffect(() => {
    fetchProgressData()
  }, [selectedType, currentPage, userId])

  const fetchProgressData = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })
      
      if (selectedType !== 'all') {
        params.append('type', selectedType)
      }
      
      if (userId) {
        params.append('userId', userId)
      }

      const response = await fetch(`/api/progress?${params}`)
      const data = await response.json()

      if (data.success) {
        setProgressEntries(data.data)
        setProgressSummary(data.summary)
        setTotalPages(data.pagination.totalPages)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch progress data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to fetch progress data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch progress data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = async () => {
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          userId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowAddDialog(false)
        setFormData({
          type: 'BODY_WEIGHT',
          value: '',
          unit: '',
          notes: '',
          recordedAt: new Date().toISOString().split('T')[0],
        })
        fetchProgressData()
        toast({
          title: 'Success',
          description: 'Progress entry added successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to add progress entry',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to add progress entry:', error)
      toast({
        title: 'Error',
        description: 'Failed to add progress entry',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry) return

    try {
      const response = await fetch(`/api/progress/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setEditingEntry(null)
        setFormData({
          type: 'BODY_WEIGHT',
          value: '',
          unit: '',
          notes: '',
          recordedAt: new Date().toISOString().split('T')[0],
        })
        fetchProgressData()
        toast({
          title: 'Success',
          description: 'Progress entry updated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update progress entry',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to update progress entry:', error)
      toast({
        title: 'Error',
        description: 'Failed to update progress entry',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/progress/${entryId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        fetchProgressData()
        toast({
          title: 'Success',
          description: 'Progress entry deleted successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete progress entry',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to delete progress entry:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete progress entry',
        variant: 'destructive',
      })
    }
  }

  const startEdit = (entry: ProgressEntry) => {
    setEditingEntry(entry)
    setFormData({
      type: entry.type,
      value: entry.value.toString(),
      unit: entry.unit || '',
      notes: entry.notes || '',
      recordedAt: entry.recordedAt.split('T')[0],
    })
  }

  const getTrendColor = (entries: ProgressEntry[]) => {
    if (entries.length < 2) return 'text-hf-text-secondary'
    const latest = entries[0]?.value || 0
    const previous = entries[1]?.value || 0
    return latest > previous ? 'text-hf-success' : latest < previous ? 'text-hf-error' : 'text-hf-text-secondary'
  }

  const getTrendIcon = (entries: ProgressEntry[]) => {
    if (entries.length < 2) return Activity
    const latest = entries[0]?.value || 0
    const previous = entries[1]?.value || 0
    return latest > previous ? TrendingUp : latest < previous ? TrendingDown : Activity
  }

  const getStreak = (entries: ProgressEntry[]) => {
    let streak = 0
    let lastDate = new Date()
    
    for (const entry of entries) {
      const entryDate = new Date(entry.recordedAt)
      const diffDays = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 3600 * 24))
      
      if (diffDays <= 7) {
        streak++
        lastDate = entryDate
      } else {
        break
      }
    }
    
    return streak
  }

  const getChartData = () => {
    if (selectedType === 'all') return []
    
    const filteredEntries = progressEntries
      .filter(entry => entry.type === selectedType)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-10) // Show last 10 entries

    return filteredEntries.map(entry => ({
      date: formatDate(entry.recordedAt),
      value: entry.value,
      fullDate: entry.recordedAt,
    }))
  }

  const columns: Column<ProgressEntry>[] = [
    {
      key: 'type',
      title: 'Measurement',
      render: (value, entry) => {
        const config = PROGRESS_TYPES[value as keyof typeof PROGRESS_TYPES]
        const Icon = config?.icon || Activity
        return (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${config?.color || 'bg-gray-500'}`} />
            <Icon className="h-4 w-4 text-hf-text-secondary" />
            <span className="text-hf-text">{config?.label || value}</span>
          </div>
        )
      },
    },
    {
      key: 'value',
      title: 'Value',
      render: (value, entry) => {
        const config = PROGRESS_TYPES[entry.type as keyof typeof PROGRESS_TYPES]
        return (
          <div className="text-center">
            <span className="text-lg font-bold text-hf-text">{value}</span>
            <span className="text-sm text-hf-text-secondary ml-1">
              {entry.unit || config?.unit}
            </span>
          </div>
        )
      },
    },
    {
      key: 'recordedAt',
      title: 'Date',
      render: (value) => (
        <div>
          <p className="text-sm text-hf-text">{formatDate(value)}</p>
          <p className="text-xs text-hf-text-secondary">{formatRelativeTime(value)}</p>
        </div>
      ),
    },
    {
      key: 'notes',
      title: 'Notes',
      render: (value) => (
        <span className="text-hf-text-secondary text-sm">
          {value || 'No notes'}
        </span>
      ),
    },
  ]

  if (loading) {
    return <LoadingState message="Loading progress data..." />
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-hf-text">Progress Dashboard</h2>
            <p className="text-hf-text-secondary">
              Track your fitness journey with detailed measurements and trends
            </p>
          </div>
          {canEdit && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="btn-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Progress Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Measurement Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PROGRESS_TYPES).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="Enter value"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit (optional)</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., lbs, kg, inches"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordedAt">Date</Label>
                    <Input
                      id="recordedAt"
                      type="date"
                      value={formData.recordedAt}
                      onChange={(e) => setFormData({ ...formData, recordedAt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Add any notes about this measurement..."
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleAddEntry} className="btn-gradient">
                      Add Entry
                    </Button>
                    <Button onClick={() => setShowAddDialog(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {/* Progress Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {progressSummary.slice(0, 4).map((summary) => {
          const config = PROGRESS_TYPES[summary.type as keyof typeof PROGRESS_TYPES]
          const Icon = config?.icon || Activity
          const typeEntries = progressEntries.filter(e => e.type === summary.type)
          const streak = getStreak(typeEntries)
          const TrendIcon = getTrendIcon(typeEntries)
          
          return (
            <Card key={summary.type} className="bg-hf-card border-hf-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-hf-orange" />
                    <div>
                      <p className="text-sm font-medium text-hf-text">{config?.label || summary.type}</p>
                      <p className="text-xs text-hf-text-secondary">{summary._count.id} entries</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendIcon className={`h-4 w-4 ${getTrendColor(typeEntries)}`} />
                    {streak > 0 && (
                      <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
                        <Flame className="h-3 w-3 mr-1" />
                        {streak}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters and Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-hf-card border-hf-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-hf-text flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-hf-orange" />
                Progress Trends
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select measurement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Measurements</SelectItem>
                    {Object.entries(PROGRESS_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}
                >
                  {chartType === 'line' ? <LineChartIcon className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedType === 'all' || getChartData().length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Select a measurement type"
                description="Choose a specific measurement to view progress trends"
              />
            ) : (
              <ChartContainer>
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'line' ? (
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-hf-card border-hf-card">
          <CardHeader>
            <CardTitle className="text-hf-text flex items-center">
              <Award className="h-5 w-5 mr-2 text-hf-orange" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {progressSummary.slice(0, 3).map((summary) => {
              const config = PROGRESS_TYPES[summary.type as keyof typeof PROGRESS_TYPES]
              const typeEntries = progressEntries.filter(e => e.type === summary.type)
              const streak = getStreak(typeEntries)
              
              return (
                <div
                  key={summary.type}
                  className="flex items-center justify-between p-3 bg-hf-dark rounded-lg border border-hf-card"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${config?.color || 'bg-gray-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-hf-text">{config?.label}</p>
                      <p className="text-xs text-hf-text-secondary">{summary._count.id} entries</p>
                    </div>
                  </div>
                  {streak > 0 && (
                    <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
                      <Flame className="h-3 w-3 mr-1" />
                      {streak}
                    </Badge>
                  )}
                </div>
              )
            })}
            
            {progressSummary.length === 0 && (
              <EmptyState
                icon={Award}
                title="No achievements yet"
                description="Start tracking your progress to earn achievements"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress Table */}
      <Card className="bg-hf-card border-hf-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-hf-text flex items-center">
              <Activity className="h-5 w-5 mr-2 text-hf-orange" />
              Progress History
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(PROGRESS_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Filter className="h-4 w-4 text-hf-text-secondary" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {progressEntries.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No progress entries found"
              description={
                selectedType === 'all'
                  ? "No progress entries have been recorded yet"
                  : `No entries found for ${PROGRESS_TYPES[selectedType as keyof typeof PROGRESS_TYPES]?.label}`
              }
              action={
                canEdit ? (
                  <Button onClick={() => setShowAddDialog(true)} className="btn-gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Entry
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <DataTable
                data={progressEntries}
                columns={columns}
                searchable={false}
                filterable={false}
                actions={canEdit ? (entry) => (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => startEdit(entry)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-hf-error"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                ) : undefined}
              />
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-hf-text-secondary">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingEntry && (
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Progress Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Measurement Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROGRESS_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-value">Value</Label>
                <Input
                  id="edit-value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Enter value"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit (optional)</Label>
                <Input
                  id="edit-unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., lbs, kg, inches"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-recordedAt">Date</Label>
                <Input
                  id="edit-recordedAt"
                  type="date"
                  value={formData.recordedAt}
                  onChange={(e) => setFormData({ ...formData, recordedAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes (optional)</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any notes about this measurement..."
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleUpdateEntry} className="btn-gradient">
                  Update Entry
                </Button>
                <Button onClick={() => setEditingEntry(null)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
