
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { CalendarManagement } from '@/components/admin/calendar-management'
import { AvailabilityDialog, AvailabilityManagement } from '@/components/schedule/availability-management'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

export default function AdminCalendarPage() {
  return (
    <ProtectedLayout requireRole="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-hf-text">Calendar & Availability</h1>
            <p className="text-hf-text-secondary">
              Manage Google Calendar integration and availability settings
            </p>
          </div>
          <AvailabilityDialog>
            <Button className="bg-hf-orange text-white hover:bg-hf-orange/90">
              <Settings className="h-4 w-4 mr-2" />
              Adjust Availability
            </Button>
          </AvailabilityDialog>
        </div>

        <CalendarManagement />
      </div>
    </ProtectedLayout>
  )
}
