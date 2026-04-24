'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type Inspection } from '@/lib/inspection-types'
import { getWarehouseByCode } from '@/lib/fleet-data'
import { toast } from 'sonner'
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  ClipboardList, 
  TrendingUp,
  Calendar,
  AlertCircle,
  ChevronRight,
  RefreshCw
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
  failedInspections: number
  activeIssuesLightsOn: number
  vehiclesWithIssues: Array<{
    vehicleId: string
    vehicleName: string
    warehouseCode: string
    lightsStatus: 'fail'
    lastInspectionDate: string
  }>
  recentFailures: Inspection[]
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
  const vehiclesWithIssues: DashboardStats['vehiclesWithIssues'] = []
  vehicleLatestInspection.forEach((insp) => {
    if (insp.lightsStatus === 'fail') {
      vehiclesWithIssues.push({
        vehicleId: insp.vehicleId,
        vehicleName: insp.vehicleName,
        warehouseCode: insp.warehouseCode,
        lightsStatus: 'fail',
        lastInspectionDate: insp.date,
      })
    }
  })

  const passedRecent = recentInspections.filter(i => i.overallStatus === 'pass').length
  const passRate = recentInspections.length > 0 
    ? Math.round((passedRecent / recentInspections.length) * 100) 
    : 100

  const recentFailures = recentInspections
    .filter(i => i.overallStatus === 'fail')
    .slice(0, 10)

  return {
    totalInspections: inspections.length,
    todayInspections: todayInspections.length,
    passRate,
    failedInspections: recentInspections.filter(i => i.overallStatus === 'fail').length,
    activeIssuesLightsOn: vehiclesWithIssues.length,
    vehiclesWithIssues,
    recentFailures,
  }
}

export function Dashboard({ onStartInspection, onViewHistory }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
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
    } catch (error) {
      console.error('[v0] Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
      // Set empty stats on error
      setStats({
        totalInspections: 0,
        todayInspections: 0,
        passRate: 100,
        failedInspections: 0,
        activeIssuesLightsOn: 0,
        vehiclesWithIssues: [],
        recentFailures: [],
      })
      setRecentInspections([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet Inspection</h1>
          <p className="text-muted-foreground">Pirtek Mobile Service</p>
        </div>
        <Button onClick={loadData} variant="ghost" size="icon">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* CRITICAL KPI: Active Issues (Lights On) */}
      {stats.activeIssuesLightsOn > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 text-lg">
                  Active Issues (Lights On)
                </h3>
                <p className="text-red-700 text-sm mt-1">
                  {stats.activeIssuesLightsOn} vehicle{stats.activeIssuesLightsOn !== 1 ? 's have' : ' has'} active warning lights
                </p>
                <div className="mt-3 space-y-2">
                  {stats.vehiclesWithIssues.map(vehicle => (
                    <div 
                      key={vehicle.vehicleId}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-red-200"
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-sm">{vehicle.vehicleName}</span>
                        <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                          {vehicle.warehouseCode}
                        </Badge>
                      </div>
                      <span className="text-xs text-red-600">
                        {vehicle.lastInspectionDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action */}
      <Button 
        onClick={onStartInspection} 
        className="w-full h-14 text-lg font-semibold"
        size="lg"
      >
        <ClipboardList className="w-5 h-5 mr-2" />
        Start New Inspection
      </Button>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.todayInspections}</div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.passRate}%</div>
                <div className="text-xs text-muted-foreground">Pass Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <ClipboardList className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalInspections}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.activeIssuesLightsOn > 0 ? 'border-red-200' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.activeIssuesLightsOn > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertCircle className={`w-5 h-5 ${stats.activeIssuesLightsOn > 0 ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${stats.activeIssuesLightsOn > 0 ? 'text-red-600' : ''}`}>
                  {stats.activeIssuesLightsOn}
                </div>
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
            <CardTitle className="text-base">Recent Inspections</CardTitle>
            <Button variant="ghost" size="sm" onClick={onViewHistory} className="text-xs">
              View All
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentInspections.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No inspections yet</p>
              <p className="text-xs">Start your first inspection above</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentInspections.map(inspection => (
                <div key={inspection.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${
                      inspection.overallStatus === 'pass' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {inspection.overallStatus === 'pass' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{inspection.vehicleName}</div>
                      <div className="text-xs text-muted-foreground">
                        {inspection.driverName} • {inspection.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-medium">{inspection.score ?? 100}%</div>
                    {inspection.lightsStatus === 'fail' && (
                      <Badge variant="destructive" className="text-[10px] px-1">
                        Lights On
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Failures */}
      {stats.recentFailures.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Recent Failed Inspections
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {stats.recentFailures.slice(0, 5).map(inspection => (
                <div key={inspection.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{inspection.vehicleName}</div>
                      <div className="text-xs text-muted-foreground">
                        {inspection.driverName} • {getWarehouseByCode(inspection.warehouseCode)?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{inspection.date}</div>
                      <Badge variant="destructive" className="text-xs">
                        {inspection.failedItems ?? 0} failed
                      </Badge>
                    </div>
                  </div>
                  {/* Show failed items */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {inspection.sections ? (
                      <>
                        {inspection.sections.flatMap(s => 
                          s.items.filter(i => i.status === 'fail').map(i => (
                            <Badge key={i.id} variant="outline" className="text-[10px] border-red-200 text-red-700">
                              {i.label}
                            </Badge>
                          ))
                        ).slice(0, 4)}
                        {(inspection.failedItems ?? 0) > 4 && (
                          <Badge variant="outline" className="text-[10px]">
                            +{(inspection.failedItems ?? 0) - 4} more
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-red-200 text-red-700">
                        Issues detected
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
