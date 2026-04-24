// Fleet Inspection Data - Driver and Location Mapping
// This is the SINGLE SOURCE OF TRUTH for all driver/warehouse/vehicle relationships

export interface Warehouse {
  code: string
  name: string
  state: string
  stateRegion: string
}

export interface Driver {
  id: string
  name: string
  warehouseCode: string
}

export interface Vehicle {
  id: string
  plate: string
  warehouseCode: string
  type: 'standard' | 'shop' | 'spare' | 'open'
  driverId?: string // Assigned driver ID for standard vehicles
}

// Warehouse definitions
export const WAREHOUSES: Warehouse[] = [
  // Illinois (IL)
  { code: 'GN', name: 'Gurnee', state: 'IL', stateRegion: 'IL' },
  { code: 'OH', name: 'Ohare', state: 'IL', stateRegion: 'IL' },
  { code: 'BB', name: 'Bolingbrook', state: 'IL', stateRegion: 'IL' },
  // Illinois South (IL South)
  { code: 'SH', name: 'South Holland', state: 'IL', stateRegion: 'IL South' },
  { code: 'MP', name: 'McKinley Park', state: 'IL', stateRegion: 'IL South' },
  // Pennsylvania (PA)
  { code: 'SP', name: 'South Philadelphia', state: 'PA', stateRegion: 'PA' },
  { code: 'NP', name: 'Northeast Philadelphia', state: 'PA', stateRegion: 'PA' },
  // Virginia (VA)
  { code: 'VB', name: 'Virginia Beach', state: 'VA', stateRegion: 'VA' },
]

// Driver assignments - EXACT mapping per requirements
export const DRIVERS: Driver[] = [
  // Gurnee (GN)
  { id: 'brad-nettles', name: 'Brad Nettles', warehouseCode: 'GN' },
  // Ohare (OH)
  { id: 'mike-felder', name: 'Mike Felder', warehouseCode: 'OH' },
  { id: 'eric-hooten', name: 'Eric Hooten', warehouseCode: 'OH' },
  { id: 'andrew-kneeland', name: 'Andrew Kneeland', warehouseCode: 'OH' },
  // Bolingbrook (BB)
  { id: 'aaron-plante', name: 'Aaron Plante', warehouseCode: 'BB' },
  { id: 'tucker-wilson', name: 'Tucker Wilson', warehouseCode: 'BB' },
  { id: 'phil-damacio', name: 'Phil Damacio', warehouseCode: 'BB' },
  // South Holland (SH)
  { id: 'david-wheeler', name: 'David Wheeler', warehouseCode: 'SH' },
  { id: 'michael-mayer', name: 'Michael Mayer', warehouseCode: 'SH' },
  // McKinley Park (MP)
  { id: 'peter-vega', name: 'Peter Vega', warehouseCode: 'MP' },
  { id: 'tony-lacerba', name: 'Tony LaCerba', warehouseCode: 'MP' },
  // South Philadelphia (SP)
  { id: 'julio-scutt', name: 'Julio Scutt', warehouseCode: 'SP' },
  { id: 'joe-theveny', name: 'Joe Theveny', warehouseCode: 'SP' },
  // Northeast Philadelphia (NP)
  { id: 'brian-kane', name: 'Brian Kane', warehouseCode: 'NP' },
  { id: 'alex-dejesus', name: 'Alex DeJesus', warehouseCode: 'NP' },
  // Virginia Beach (VB)
  { id: 'scott-bowyer', name: 'Scott Bowyer', warehouseCode: 'VB' },
  { id: 'ron-pecoraro', name: 'Ron Pecoraro', warehouseCode: 'VB' },
  // No Warehouse
  { id: 'luis-luz', name: 'Luis Luz', warehouseCode: '' },
  { id: 'carl-britton', name: 'Carl Britton', warehouseCode: '' },
]

// Vehicle assignments - each driver has their specific vehicle with license plate
export const VEHICLES: Vehicle[] = [
  // Gurnee (GN)
  { id: '506865D', plate: '506865D', warehouseCode: 'GN', type: 'standard', driverId: 'brad-nettles' },
  // Ohare (OH)
  { id: '194044C', plate: '194044C', warehouseCode: 'OH', type: 'standard', driverId: 'mike-felder' },
  { id: '194042C', plate: '194042C', warehouseCode: 'OH', type: 'standard', driverId: 'eric-hooten' },
  { id: '239078C', plate: '239078C', warehouseCode: 'OH', type: 'standard', driverId: 'andrew-kneeland' },
  // Bolingbrook (BB)
  { id: '3684898', plate: '3684898', warehouseCode: 'BB', type: 'standard', driverId: 'aaron-plante' },
  { id: '156886C', plate: '156886C', warehouseCode: 'BB', type: 'standard', driverId: 'tucker-wilson' },
  { id: '513164D', plate: '513164D', warehouseCode: 'BB', type: 'standard', driverId: 'phil-damacio' },
  { id: '113171C', plate: '113171C', warehouseCode: 'BB', type: 'spare' },
  // South Holland (SH)
  { id: '194043C', plate: '194043C', warehouseCode: 'SH', type: 'standard', driverId: 'david-wheeler' },
  { id: 'SH-MAYER', plate: 'SH-MAYER', warehouseCode: 'SH', type: 'standard', driverId: 'michael-mayer' },
  // McKinley Park (MP)
  { id: '156888', plate: '156888', warehouseCode: 'MP', type: 'standard', driverId: 'peter-vega' },
  { id: '238550C', plate: '238550C', warehouseCode: 'MP', type: 'standard', driverId: 'tony-lacerba' },
  // South Philadelphia (SP)
  { id: 'ZWZ8666', plate: 'ZWZ8666', warehouseCode: 'SP', type: 'standard', driverId: 'julio-scutt' },
  { id: 'ZWK7884', plate: 'ZWK7884', warehouseCode: 'SP', type: 'standard', driverId: 'joe-theveny' },
  { id: 'YZM8685', plate: 'YZM8685', warehouseCode: 'SP', type: 'shop' },
  // Northeast Philadelphia (NP)
  { id: '3684887b', plate: '3684887b', warehouseCode: 'NP', type: 'standard', driverId: 'brian-kane' },
  { id: '402115D', plate: '402115D', warehouseCode: 'NP', type: 'standard', driverId: 'alex-dejesus' },
  { id: 'ZWZ8664', plate: 'ZWZ8664', warehouseCode: 'NP', type: 'open' },
  // Virginia Beach (VB)
  { id: 'TFZ-7540', plate: 'TFZ-7540', warehouseCode: 'VB', type: 'standard', driverId: 'scott-bowyer' },
  { id: 'TFL-5658', plate: 'TFL-5658', warehouseCode: 'VB', type: 'standard', driverId: 'ron-pecoraro' },
  { id: '194041C', plate: '194041C', warehouseCode: 'VB', type: 'open' },
  // No Warehouse
  { id: '1613130', plate: '1613130', warehouseCode: '', type: 'standard', driverId: 'luis-luz' },
  { id: '1613125B', plate: '1613125B', warehouseCode: '', type: 'standard', driverId: 'carl-britton' },
]

// Helper functions
export function getDriverById(id: string): Driver | undefined {
  return DRIVERS.find(d => d.id === id)
}

export function getDriverByName(name: string): Driver | undefined {
  return DRIVERS.find(d => d.name === name)
}

export function getVehiclesForDriver(driverId: string): Vehicle[] {
  const driver = getDriverById(driverId)
  if (!driver) return []
  // Return driver's assigned vehicle first, then all other vehicles
  const assignedVehicle = VEHICLES.filter(v => v.driverId === driverId)
  const otherVehicles = VEHICLES.filter(v => v.driverId !== driverId)
  return [...assignedVehicle, ...otherVehicles]
}

export function getVehiclesForWarehouse(warehouseCode: string): Vehicle[] {
  return VEHICLES.filter(v => v.warehouseCode === warehouseCode)
}

export function getWarehouseByCode(code: string): Warehouse | undefined {
  return WAREHOUSES.find(w => w.code === code)
}

export function getDriversForWarehouse(warehouseCode: string): Driver[] {
  return DRIVERS.filter(d => d.warehouseCode === warehouseCode)
}

export function getDriversGroupedByWarehouse(): Record<string, Driver[]> {
  const grouped: Record<string, Driver[]> = {}
  WAREHOUSES.forEach(w => {
    grouped[w.code] = DRIVERS.filter(d => d.warehouseCode === w.code)
  })
  return grouped
}

export function getWarehousesGroupedByState(): Record<string, Warehouse[]> {
  const grouped: Record<string, Warehouse[]> = {}
  WAREHOUSES.forEach(w => {
    if (!grouped[w.stateRegion]) {
      grouped[w.stateRegion] = []
    }
    grouped[w.stateRegion].push(w)
  })
  return grouped
}
