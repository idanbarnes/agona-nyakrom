import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, CardHeader, CardTitle } from '../components/ui/index.jsx'

function DashboardPage() {
  const navigate = useNavigate()

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold break-words md:text-2xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Welcome to the admin dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage upcoming and community events.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/events')}
              >
                View all
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/admin/events/new')}
              >
                New event
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share important updates and notices.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/admin/announcements')}
              >
                View all
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/admin/announcements/new')}
              >
                New announcement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default DashboardPage
