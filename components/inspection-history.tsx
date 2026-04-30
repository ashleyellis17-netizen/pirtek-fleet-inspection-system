'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { type Inspection } from '@/lib/inspection-types'
import { WAREHOUSES, DRIVERS } from '@/lib/fleet-data'
import { toast } from 'sonner'
import { 
  XCircle, 
  ArrowLeft,
  Search,
  Filter,
  User,
  Building2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Trash2
} from 'lucide-react'

interface InspectionHistoryProps {
  onBack: () => void
}

export function InspectionHistory({ onBack }: InspectionHistoryProps) {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all')
  const [selectedDriver, setSelectedDriver] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchInspections = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/inspection-history')
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load inspections')
      }
      
      setInspections(data.inspections || [])
      setFilteredInspections(data.inspections || [])
    } catch (err) {
      console.error('[v0] Error fetching inspections:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inspections'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInspections()
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!id) {
      toast.error('Inspection ID is missing')
      return
    }
    
    if (!confirm('Are you sure you want to delete this inspection?')) {
      return
    }
    
    setDeletingId(id)
    
    try {
      const response = await fetch('/api/delete-inspection', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete inspection')
      }
      
      toast.success('Inspection deleted')
      setInspections(prev => prev.filter(i => i.id !== id))
      setFilteredInspections(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('[v0] Error deleting inspection:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete inspection')
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    let filtered = inspections

    if (selectedWarehouse !== 'all') {
      filtered = filtered.filter(i => i.warehouseCode === selectedWarehouse)
    }

    if (selectedDriver !== 'all') {
      filtered = filtered.filter(i => i.driverId === selectedDriver)
    }

    if (selectedStatus !== 'all') {
      if (selectedStatus === 'pass') {
        filtered = filtered.filter(i => i.overallStatus === 'pass')
      } else if (selectedStatus === 'fail') {
        filtered = filtered.filter(i => i.overallStatus === 'fail')
      } else if (selectedStatus === 'lights-on') {
        filtered = filtered.filter(i => i.lightsStatus === 'fail')
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(i => 
        i.vehicleName.toLowerCase().includes(query) ||
        i.driverName.toLowerCase().includes(query) ||
        i.warehouseName.toLowerCase().includes(query)
      )
    }

    setFilteredInspections(filtered)
  }, [inspections, selectedWarehouse, selectedDriver, selectedStatus, searchQuery])

  const toggleExpanded = (id: string) => {
    setExpandedInspection(prev => prev === id ? null : id)
  }

  const availableDrivers = selectedWarehouse === 'all' 
    ? DRIVERS 
    : DRIVERS.filter(d => d.warehouseCode === selectedWarehouse)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Inspection History</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${filteredInspections.length} of ${inspections.length} inspections`}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchInspections}
          disabled={isLoading}
          className="text-muted-foreground"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search vehicle, driver, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          
          {/* Filter row */}
          <div className="grid grid-cols-3 gap-2">
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="h-10">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="All Locations" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {WAREHOUSES.map(w => (
                  <SelectItem key={w.code} value={w.code}>
                    {w.code} - {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="h-10">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="All Drivers" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {availableDrivers.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-10">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="All Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pass">Passed</SelectItem>
                <SelectItem value="fail">Failed</SelectItem>
                <SelectItem value="lights-on">Lights On</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspection List */}
      <div className="space-y-2">
        {isLoading ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading inspections...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive opacity-70" />
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchInspections} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredInspections.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium text-foreground">No inspections found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredInspections.map(inspection => (
            <Card key={inspection.id} className="border-border overflow-hidden">
              <CardContent className="p-0">
                {/* Summary row */}
                <button
                  onClick={() => toggleExpanded(inspection.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${
                        inspection.overallStatus === 'pass' ? 'bg-red-400' : 'bg-red-500'
                      }`} />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{inspection.vehicleName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>{inspection.driverName}</span>
                        <span className="mx-1">•</span>
                        <span>{inspection.date || inspection.submittedAt?.split('T')[0]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold text-foreground">{inspection.score ?? 100}%</div>
                      {inspection.warehouseCode && (
                        <div className="text-xs text-muted-foreground">{inspection.warehouseCode}</div>
                      )}
                    </div>
                    {expandedInspection === inspection.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {expandedInspection === inspection.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20">
                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="p-2.5 bg-background rounded-lg border border-border">
                        <div className="text-muted-foreground mb-0.5">Mileage</div>
                        <div className="font-mono font-medium text-foreground">
                          {(inspection.mileage ?? 0).toLocaleString()} mi
                        </div>
                      </div>
                      <div className="p-2.5 bg-background rounded-lg border border-border">
                        <div className="text-muted-foreground mb-0.5">Time</div>
                        <div className="font-medium text-foreground">{inspection.time}</div>
                      </div>
                      <div className="p-2.5 bg-background rounded-lg border border-border">
                        <div className="text-muted-foreground mb-0.5">Location</div>
                        <div className="font-medium text-foreground">{inspection.warehouseName}</div>
                      </div>
                      <div className="p-2.5 bg-background rounded-lg border border-border">
                        <div className="text-muted-foreground mb-0.5">Items</div>
                        <div className="font-medium">
                          <span className="text-green-600">{inspection.passedItems ?? 0} passed</span>
                          {' / '}
                          <span className="text-red-600">{inspection.failedItems ?? 0} failed</span>
                        </div>
                      </div>
                    </div>

                    {/* Lights warning */}
                    {inspection.lightsStatus === 'fail' && (
                      <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Warning lights active</span>
                        </div>
                      </div>
                    )}

                    {/* Failed items */}
                    {(inspection.failedItems ?? 0) > 0 && (
                      <div className="space-y-2 mb-3">
                        <div className="text-xs font-medium text-red-700 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          Failed Items ({inspection.failedItems ?? 0})
                        </div>
                        <div className="space-y-1.5">
                          {inspection.sections ? inspection.sections.flatMap(section =>
                            section.items
                              .filter(item => item.status === 'fail')
                              .map(item => (
                                <div 
                                  key={item.id} 
                                  className="p-2.5 bg-red-50 rounded-lg text-xs border border-red-100"
                                >
                                  <div className="font-medium text-red-800">{item.label}</div>
                                  <div className="text-red-600 text-[11px]">{section.title}</div>
                                  {item.notes && (
                                    <div className="mt-1.5 text-red-700 italic">
                                      &quot;{item.notes}&quot;
                                    </div>
                                  )}
                                </div>
                              ))
                          ) : (
                            <div className="p-2.5 bg-red-50 rounded-lg text-xs border border-red-100">
                              <div className="font-medium text-red-800">Issues detected in inspection</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {inspection.notes && (
                      <div className="mb-3 p-2.5 bg-background rounded-lg text-xs border border-border">
                        <div className="text-muted-foreground mb-1">Notes</div>
                        <div className="text-foreground">{inspection.notes}</div>
                      </div>
                    )}

                    {/* Delete button */}
                    <div className="pt-3 border-t border-border flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleDelete(inspection.id, e)}
                        disabled={deletingId === inspection.id}
                        className="text-xs"
                      >
                        {deletingId === inspection.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Delete Inspection
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
