
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Mail, Phone, FileText, ArrowLeft, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { LoadingState } from '@/components/common/status-message'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  fitnessGoals?: string
}

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    fitnessGoals: '',
  })

  useEffect(() => {
    if (params.id) {
      fetchClient()
    }
  }, [params.id])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${params.id}`)
      const data = await response.json()

      if (data.success) {
        const clientData = data.data
        setClient(clientData)
        setFormData({
          name: clientData.name || '',
          email: clientData.email || '',
          phone: clientData.phone || '',
          fitnessGoals: clientData.fitnessGoals || '',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch client details',
          variant: 'destructive',
        })
        router.push('/admin/clients')
      }
    } catch (error) {
      console.error('Failed to fetch client:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch client details',
        variant: 'destructive',
      })
      router.push('/admin/clients')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/clients/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Client updated successfully',
          description: `${formData.name} has been updated.`,
        })
        router.push(`/admin/clients/${params.id}`)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update client',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Failed to update client:', error)
      toast({
        title: 'Error',
        description: 'Failed to update client',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return <LoadingState message="Loading client details..." />
  }

  if (!client) {
    return null
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" asChild>
            <Link href={`/admin/clients/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-hf-text">Edit Client</h1>
        <p className="text-hf-text-secondary">Update {client.name}'s information</p>
      </div>

      <Card className="bg-hf-card border-hf-card">
        <CardHeader>
          <CardTitle className="text-hf-text flex items-center space-x-2">
            <User className="h-5 w-5 text-hf-orange" />
            <span>Client Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-hf-text">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="bg-hf-dark border-hf-card text-hf-text"
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-hf-text flex items-center space-x-2">
                <Mail className="h-4 w-4 text-hf-orange" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="bg-hf-dark border-hf-card text-hf-text"
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-hf-text flex items-center space-x-2">
                <Phone className="h-4 w-4 text-hf-orange" />
                <span>Phone Number</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="bg-hf-dark border-hf-card text-hf-text"
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fitnessGoals" className="text-hf-text flex items-center space-x-2">
                <FileText className="h-4 w-4 text-hf-orange" />
                <span>Fitness Goals</span>
              </Label>
              <Textarea
                id="fitnessGoals"
                name="fitnessGoals"
                value={formData.fitnessGoals}
                onChange={handleInputChange}
                className="bg-hf-dark border-hf-card text-hf-text"
                placeholder="Describe the client's fitness goals..."
                rows={4}
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="btn-gradient"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/clients/${params.id}`)}
                className="border-hf-card text-hf-text hover:bg-hf-card"
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
