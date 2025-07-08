
"use client"

import { useEffect, useState } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CreditCard,
  Calendar,
  Trophy,
  Mail,
  Phone,
  MoreHorizontal,
} from 'lucide-react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, Column } from '@/components/common/data-table'
import { LoadingState, EmptyState } from '@/components/common/status-message'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDate, formatRelativeTime, getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '@/components/navigation/page-header'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  createdAt: string
  fitnessGoals?: string
  _count: {
    bookings: number
    workoutSessions: number
    personalRecords: number
    creditPurchases: number
  }
  remainingCredits?: number
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
  }, [searchQuery, statusFilter, currentPage])

  const fetchClients = async () => {
    try {
      // In a real app, you'd fetch from /api/admin/clients
      // For now, we'll simulate the data
      const mockClients: Client[] = [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@fitness.com',
          phone: '+1-555-0124',
          role: 'CLIENT',
          isActive: true,
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          fitnessGoals: 'Lose weight and build strength',
          _count: {
            bookings: 12,
            workoutSessions: 8,
            personalRecords: 5,
            creditPurchases: 2,
          },
          remainingCredits: 8,
        },
        {
          id: '2',
          name: 'Bob Smith',
          email: 'bob@fitness.com',
          phone: '+1-555-0125',
          role: 'CLIENT',
          isActive: true,
          createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
          fitnessGoals: 'Build muscle mass and improve endurance',
          _count: {
            bookings: 8,
            workoutSessions: 6,
            personalRecords: 3,
            creditPurchases: 1,
          },
          remainingCredits: 3,
        },
        {
          id: '3',
          name: 'Carol Williams',
          email: 'carol@fitness.com',
          phone: '+1-555-0126',
          role: 'CLIENT',
          isActive: true,
          createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
          fitnessGoals: 'Improve flexibility and maintain fitness',
          _count: {
            bookings: 15,
            workoutSessions: 12,
            personalRecords: 8,
            creditPurchases: 3,
          },
          remainingCredits: 12,
        },
      ]

      setClients(mockClients)
      setTotalPages(1)
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleClientStatus = async (clientId: string, currentStatus: boolean) => {
    try {
      // In a real app, you'd make API call to update client status
      setClients(clients.map(client => 
        client.id === clientId 
          ? { ...client, isActive: !currentStatus }
          : client
      ))
      
      toast({
        title: currentStatus ? 'Client deactivated' : 'Client activated',
        description: `Client account has been ${currentStatus ? 'deactivated' : 'activated'}.`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update client status.',
        variant: 'destructive',
      })
    }
  }

  const columns: Column<Client>[] = [
    {
      key: 'name',
      title: 'Client',
      render: (value, client) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
            <AvatarFallback className="bg-gradient-orange text-white">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-hf-text">{client.name}</p>
            <div className="flex items-center space-x-2 text-xs text-hf-text-secondary">
              <Mail className="h-3 w-3" />
              <span>{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex items-center space-x-2 text-xs text-hf-text-secondary">
                <Phone className="h-3 w-3" />
                <span>{client.phone}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'remainingCredits',
      title: 'Credits',
      render: (value) => (
        <div className="text-center">
          <span className="text-lg font-bold text-hf-orange">{value || 0}</span>
          <p className="text-xs text-hf-text-secondary">remaining</p>
        </div>
      ),
    },
    {
      key: '_count',
      title: 'Activity',
      render: (count) => (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-hf-text-secondary">Sessions:</span>
            <span className="text-hf-text font-medium">{count.bookings}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-hf-text-secondary">Workouts:</span>
            <span className="text-hf-text font-medium">{count.workoutSessions}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-hf-text-secondary">PRs:</span>
            <span className="text-hf-text font-medium">{count.personalRecords}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      title: 'Joined',
      sortable: true,
      render: (value) => (
        <div>
          <p className="text-sm text-hf-text">{formatDate(value)}</p>
          <p className="text-xs text-hf-text-secondary">{formatRelativeTime(value)}</p>
        </div>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      filterable: true,
      render: (value) => (
        <Badge 
          className={
            value 
              ? 'bg-hf-success/10 text-hf-success border-hf-success/20'
              : 'bg-hf-error/10 text-hf-error border-hf-error/20'
          }
        >
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && client.isActive) ||
                         (statusFilter === 'inactive' && !client.isActive)
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <ProtectedLayout requireRole="ADMIN">
        <LoadingState message="Loading clients..." />
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout requireRole="ADMIN">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Client Management"
          description="Manage your fitness clients and their accounts"
          showHome={true}
          showBack={false}
        >
          <Button asChild className="btn-gradient">
            <Link href="/admin/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">{clients.length}</div>
              <p className="text-xs text-hf-text-secondary">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">
                {clients.filter(c => c.isActive).length}
              </div>
              <p className="text-xs text-hf-text-secondary">Currently training</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">
                {clients.reduce((sum, c) => sum + (c.remainingCredits || 0), 0)}
              </div>
              <p className="text-xs text-hf-text-secondary">Across all clients</p>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-hf-text-secondary flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-hf-text">
                {clients.reduce((sum, c) => sum + c._count.bookings, 0)}
              </div>
              <p className="text-xs text-hf-text-secondary">All time bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-hf-text-secondary" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clients Table */}
        {filteredClients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients found"
            description={
              searchQuery || statusFilter !== 'all'
                ? "No clients match your current filters"
                : "Start by adding your first client"
            }
            action={
              <Button asChild className="btn-gradient">
                <Link href="/admin/clients/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Client
                </Link>
              </Button>
            }
          />
        ) : (
          <DataTable
            data={filteredClients}
            columns={columns}
            searchable={false}
            filterable={false}
            actions={(client) => (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Link href={`/admin/clients/${client.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Link href={`/admin/clients/${client.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Link href={`/admin/clients/${client.id}/credits`}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Credits
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => toggleClientStatus(client.id, client.isActive)}
                >
                  {client.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </>
            )}
          />
        )}

        {/* Client Performance Summary */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-hf-orange" />
                Top Performers
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Clients with the most activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients
                  .sort((a, b) => b._count.workoutSessions - a._count.workoutSessions)
                  .slice(0, 5)
                  .map((client, index) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-hf-dark rounded-lg border border-hf-card"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-hf-orange font-bold">#{index + 1}</div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                          <AvatarFallback className="bg-gradient-orange text-white text-xs">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-hf-text text-sm">{client.name}</p>
                          <p className="text-xs text-hf-text-secondary">
                            {client._count.workoutSessions} workouts
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-hf-orange/10 text-hf-orange border-hf-orange/20">
                        {client._count.personalRecords} PRs
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-hf-card border-hf-card">
            <CardHeader>
              <CardTitle className="text-hf-text flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-hf-orange" />
                Credit Overview
              </CardTitle>
              <CardDescription className="text-hf-text-secondary">
                Clients with their remaining credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients
                  .sort((a, b) => (b.remainingCredits || 0) - (a.remainingCredits || 0))
                  .slice(0, 5)
                  .map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-hf-dark rounded-lg border border-hf-card"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`} />
                          <AvatarFallback className="bg-gradient-orange text-white text-xs">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-hf-text text-sm">{client.name}</p>
                          <p className="text-xs text-hf-text-secondary">
                            {client._count.creditPurchases} purchases
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-hf-orange">
                          {client.remainingCredits || 0}
                        </div>
                        <div className="text-xs text-hf-text-secondary">credits</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  )
}
