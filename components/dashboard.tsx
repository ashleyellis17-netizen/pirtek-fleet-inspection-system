'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type Inspection } from '@/lib/inspection-types'
import { toast } from 'sonner'
import { 
  Calendar,
  TrendingUp,
  ClipboardList,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Loader2
} from 'lucide-react'

interface DashboardProps {
  onStartInspection: () => void
  onViewHistory: () => void
}

// Dashboard statistics interface
interface DashboardStats {
  totalInspections: number
  todayInspections: number
  passRate: number
  activeIssuesLightsOn: number
}

// Calculate dashboard stats from inspections
function calculateDashboardStats(inspections: Inspection[]): DashboardStats {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const todayInspections = inspections.filter(i => i.date === today)
  const recentInspections = inspections.filter(i => new Date(i.submittedAt) >= thirtyDaysAgo)

  // Get unique vehicles with their most recent inspection
  const vehicleLatestInspection = new Map<string, Inspection>()
  inspections.forEach(insp => {
    const existing = vehicleLatestInspection.get(insp.vehicleId)
    if (!existing || new Date(insp.submittedAt) > new Date(existing.submittedAt)) {
      vehicleLatestInspection.set(insp.vehicleId, insp)
    }
  })

  // Count vehicles with active warning lights
  let activeIssuesLightsOn = 0
  vehicleLatestInspection.forEach((insp) => {
    if (insp.lightsStatus === 'fail') {
      activeIssuesLightsOn++
    }
  })

  const passedRecent = recentInspections.filter(i => i.overallStatus === 'pass').length
  const passRate = recentInspections.length > 0 
    ? Math.round((passedRecent / recentInspections.length) * 100) 
    : 0

  return {
    totalInspections: inspections.length,
    todayInspections: todayInspections.length,
    passRate,
    activeIssuesLightsOn,
  }
}

export function Dashboard({ onStartInspection, onViewHistory }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/inspection-history')
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load data')
      }
      
      const inspections: Inspection[] = data.inspections || []
      const dashboardStats = calculateDashboardStats(inspections)
      setStats(dashboardStats)
      setRecentInspections(inspections.slice(0, 5))
    } catch (err) {
      console.error('[v0] Error loading dashboard data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data'
      setError(errorMessage)
      toast.error('Failed to load dashboard data')
      // Set empty stats on error
      setStats({
        totalInspections: 0,
        todayInspections: 0,
        passRate: 0,
        activeIssuesLightsOn: 0,
      })
      setRecentInspections([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Inspection</h1>
          <p className="text-muted-foreground text-sm">Pirtek Mobile Service</p>
        </div>
        <Button 
          onClick={loadData} 
          variant="ghost" 
          size="icon"
          disabled={isLoading}
          className="text-muted-foreground"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Connection Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Connection Error</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadData}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action - Start New Inspection */}
      <Button 
        onClick={onStartInspection} 
        className="w-full h-14 text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
        size="lg"
        disabled={isLoading}
      >
        <ClipboardList className="w-5 h-5 mr-2" />
        Start New Inspection
      </Button>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-8 h-6 bg-muted animate-pulse rounded" />
                      <div className="w-12 h-3 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats?.todayInspections ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats?.passRate ?? 0}%</div>
                    <div className="text-xs text-muted-foreground">Pass Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-100 rounded-lg">
                    <ClipboardList className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats?.totalInspections ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats?.activeIssuesLightsOn ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Lights On</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Inspections */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Recent Inspections</CardTitle>
                <Button variant="ghost" size="sm" onClick={onViewHistory} className="text-sm text-muted-foreground hover:text-foreground">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentInspections.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No inspections yet</p>
                  <p className="text-xs">Start your first inspection above</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentInspections.map(inspection => (
                    <div key={inspection.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          inspection.overallStatus === 'pass' ? 'bg-red-50' : 'bg-red-50'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            inspection.overallStatus === 'pass' ? 'bg-red-400' : 'bg-red-500'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-foreground">{inspection.vehicleName}</div>
                          <div className="text-xs text-muted-foreground">
                            {inspection.driverName} <span className="mx-1">•</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold text-foreground">{inspection.score ?? 100}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
