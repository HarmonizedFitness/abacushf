
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Mail, Phone, FileText, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    goals: '',
    experience: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          goals: formData.goals,
          experience: formData.experience,
          notes: formData.notes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Client created successfully",
          description: `${formData.firstName} ${formData.lastName} has been added to your client list.`,
        })
        
        // Show temporary password if provided
        if (data.data?.tempPassword) {
          toast({
            title: "Temporary Password Generated",
            description: `Temporary password: ${data.data.tempPassword}. Please share this with your client.`,
            duration: 10000,
          })
        }
        
        router.push('/admin/clients')
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create client. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to create client:', error)
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/clients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-hf-text">Add New Client</h1>
        <p className="text-hf-text-secondary">Create a new client profile</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-hf-text">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="bg-hf-dark border-hf-card text-hf-text"
                  placeholder="Enter first name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-hf-text">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="bg-hf-dark border-hf-card text-hf-text"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals" className="text-hf-text">Fitness Goals</Label>
              <Textarea
                id="goals"
                name="goals"
                value={formData.goals}
                onChange={handleInputChange}
                className="bg-hf-dark border-hf-card text-hf-text"
                placeholder="Describe the client's fitness goals..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience" className="text-hf-text">Experience Level</Label>
              <Input
                id="experience"
                name="experience"
                type="text"
                value={formData.experience}
                onChange={handleInputChange}
                className="bg-hf-dark border-hf-card text-hf-text"
                placeholder="e.g., Beginner, Intermediate, Advanced"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-hf-text flex items-center space-x-2">
                <FileText className="h-4 w-4 text-hf-orange" />
                <span>Additional Notes</span>
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="bg-hf-dark border-hf-card text-hf-text"
                placeholder="Any additional notes about the client..."
                rows={3}
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="btn-gradient"
              >
                {isLoading ? 'Creating...' : 'Create Client'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/clients')}
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
