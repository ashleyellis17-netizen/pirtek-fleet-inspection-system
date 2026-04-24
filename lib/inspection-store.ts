// Inspection data store with localStorage persistence
// Maintains history tracking and scoring system

import { Inspection, InspectionSection, calculateInspectionScore, getLightsStatus } from './inspection-types'
export type { Inspection } from './inspection-types'

const STORAGE_KEY = 'pirtek-fleet-inspections'

// Get all inspections from storage
export function getInspections(): Inspection[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored) as Inspection[]
  } catch {
    return []
  }
}

// Save inspections to storage
export function saveInspections(inspections: Inspection[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections))
}

// Add new inspection
export function addInspection(inspection: Omit<Inspection, 'id' | 'score' | 'totalItems' | 'passedItems' | 'failedItems' | 'overallStatus' | 'lightsStatus' | 'submittedAt'>): Inspection {
  const inspections = getInspections()
  
  const scoreData = calculateInspectionScore(inspection.sections)
  const lightsStatus = getLightsStatus(inspection.sections)
  
  const newInspection: Inspection = {
    ...inspection,
    id: `insp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...scoreData,
    lightsStatus,
    submittedAt: new Date().toISOString(),
  }
  
  inspections.unshift(newInspection) // Add to beginning for newest first
  saveInspections(inspections)
  
  return newInspection
}

// Get inspection by ID
export function getInspectionById(id: string): Inspection | undefined {
  const inspections = getInspections()
  return inspections.find(i => i.id === id)
}

// Get inspections for a specific vehicle
export function getInspectionsForVehicle(vehicleId: string): Inspection[] {
  const inspections = getInspections()
  return inspections.filter(i => i.vehicleId === vehicleId)
}

// Get inspections for a specific driver
export function getInspectionsForDriver(driverId: string): Inspection[] {
  const inspections = getInspections()
  return inspections.filter(i => i.driverId === driverId)
}

// Get inspections for a specific warehouse
export function getInspectionsForWarehouse(warehouseCode: string): Inspection[] {
  const inspections = getInspections()
  return inspections.filter(i => i.warehouseCode === warehouseCode)
}

// Get recent inspections (last 30 days)
export function getRecentInspections(): Inspection[] {
  const inspections = getInspections()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return inspections.filter(i => new Date(i.submittedAt) >= thirtyDaysAgo)
}

// Get today's inspections
export function getTodayInspections(): Inspection[] {
  const inspections = getInspections()
  const today = new Date().toISOString().split('T')[0]
  
  return inspections.filter(i => i.date === today)
}

// Dashboard statistics
export interface DashboardStats {
  totalInspections: number
  todayInspections: number
  passRate: number
  failedInspections: number
  activeIssuesLightsOn: number // Critical KPI - vehicles with warning lights
  vehiclesWithIssues: Array<{
    vehicleId: string
    vehicleName: string
    warehouseCode: string
    lightsStatus: 'fail'
    lastInspectionDate: string
  }>
  recentFailures: Inspection[]
}

export function getDashboardStats(): DashboardStats {
  const inspections = getInspections()
  const recentInspections = getRecentInspections()
  const todayInspections = getTodayInspections()
  
  // Get unique vehicles with their most recent inspection
  const vehicleLatestInspection = new Map<string, Inspection>()
  inspections.forEach(insp => {
    const existing = vehicleLatestInspection.get(insp.vehicleId)
    if (!existing || new Date(insp.submittedAt) > new Date(existing.submittedAt)) {
      vehicleLatestInspection.set(insp.vehicleId, insp)
    }
  })
  
  // Count vehicles with active warning lights (FAIL on lights check)
  const vehiclesWithLightsOn: DashboardStats['vehiclesWithIssues'] = []
  vehicleLatestInspection.forEach((insp) => {
    if (insp.lightsStatus === 'fail') {
      vehiclesWithLightsOn.push({
        vehicleId: insp.vehicleId,
        vehicleName: insp.vehicleName,
        warehouseCode: insp.warehouseCode,
        lightsStatus: 'fail',
        lastInspectionDate: insp.date,
      })
    }
  })
  
  // Calculate pass rate from recent inspections
  const passedRecent = recentInspections.filter(i => i.overallStatus === 'pass').length
  const passRate = recentInspections.length > 0 
    ? Math.round((passedRecent / recentInspections.length) * 100) 
    : 100
  
  // Get recent failures
  const recentFailures = recentInspections
    .filter(i => i.overallStatus === 'fail')
    .slice(0, 10)
  
  return {
    totalInspections: inspections.length,
    todayInspections: todayInspections.length,
    passRate,
    failedInspections: recentInspections.filter(i => i.overallStatus === 'fail').length,
    activeIssuesLightsOn: vehiclesWithLightsOn.length,
    vehiclesWithIssues: vehiclesWithLightsOn,
    recentFailures,
  }
}

// Get latest inspection for a vehicle
export function getLatestInspectionForVehicle(vehicleId: string): Inspection | undefined {
  const inspections = getInspectionsForVehicle(vehicleId)
  return inspections[0] // Already sorted newest first
}

// Delete inspection (for admin purposes)
export function deleteInspection(id: string): boolean {
  const inspections = getInspections()
  const index = inspections.findIndex(i => i.id === id)
  if (index === -1) return false
  
  inspections.splice(index, 1)
  saveInspections(inspections)
  return true
}

// Clear all inspections (for testing/reset)
export function clearAllInspections(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
