// Inspection Form Types and Schema
// Updated per requirements - NO Mirrors, Horn, Seatbelts, or Safety Equipment section

export type InspectionStatus = 'pass' | 'fail' | 'na'

export interface InspectionItem {
  id: string
  label: string
  description?: string
  status: InspectionStatus
  notes?: string
  required: boolean
}

export interface InspectionSection {
  id: string
  title: string
  items: InspectionItem[]
}

// Tire tread depth measurements (in 32nds of an inch)
export interface TireTreadDepth {
  id: string
  label: string
  short: string
  depth: string // kept as string for controlled inputs; empty = not measured
}

// Legal minimum tread depth (32nds of an inch)
export const TREAD_MIN_LEGAL = 2
// Recommended replacement threshold (32nds of an inch)
export const TREAD_MIN_WARN = 4

export function createTireTreadDepths(): TireTreadDepth[] {
  return [
    { id: 'lf', label: 'Left Front', short: 'LF', depth: '' },
    { id: 'rf', label: 'Right Front', short: 'RF', depth: '' },
    { id: 'lr', label: 'Left Rear', short: 'LR', depth: '' },
    { id: 'rr', label: 'Right Rear', short: 'RR', depth: '' },
    { id: 'spare', label: 'Spare', short: 'SP', depth: '' },
  ]
}

export type TreadSeverity = 'ok' | 'warn' | 'critical' | 'empty'

export function getTreadSeverity(depth: string | number | undefined): TreadSeverity {
  if (depth === '' || depth === undefined || depth === null) return 'empty'
  const value = typeof depth === 'number' ? depth : Number.parseFloat(depth)
  if (Number.isNaN(value)) return 'empty'
  if (value <= TREAD_MIN_LEGAL) return 'critical'
  if (value < TREAD_MIN_WARN) return 'warn'
  return 'ok'
}

export interface Inspection {
  id: string
  driverId: string
  driverName: string
  vehicleId: string
  vehicleName: string
  warehouseCode: string
  warehouseName: string
  date: string
  time: string
  mileage: number
  sections: InspectionSection[]
  tireTreadDepths?: TireTreadDepth[]
  overallStatus: 'pass' | 'fail'
  score: number
  totalItems: number
  passedItems: number
  failedItems: number
  lightsStatus: InspectionStatus // Critical KPI - warning lights on vehicle
  notes?: string
  submittedAt: string
}

// Inspection sections definition - per updated requirements
export function createInspectionSections(): InspectionSection[] {
  return [
    {
      id: 'exterior',
      title: 'Exterior Inspection',
      items: [
        { id: 'body-condition', label: 'Body Condition', description: 'Dents, scratches, rust, damage', status: 'pass', required: true },
        { id: 'windshield-windows', label: 'Windshield & Windows', description: 'Cracks, chips, visibility, all windows intact', status: 'pass', required: true },
        { id: 'headlights', label: 'Headlights', description: 'Working, clean, proper alignment', status: 'pass', required: true },
        { id: 'taillights', label: 'Tail Lights', description: 'Working, clean, visible', status: 'pass', required: true },
        { id: 'turn-signals', label: 'Turn Signals', description: 'Front and rear working', status: 'pass', required: true },
        { id: 'brake-lights', label: 'Brake Lights', description: 'All brake lights functional', status: 'pass', required: true },
      ]
    },
    {
      id: 'tires-wheels',
      title: 'Tires & Wheels',
      items: [
        { id: 'tire-condition', label: 'Tire Condition', description: 'Tread depth, wear pattern, damage', status: 'pass', required: true },
        { id: 'tire-pressure', label: 'Tire Pressure', description: 'All tires properly inflated', status: 'pass', required: true },
        { id: 'wheel-condition', label: 'Wheel Condition', description: 'No damage, cracks, or bends', status: 'pass', required: true },
      ]
    },
    {
      id: 'electrical-visibility',
      title: 'Electrical & Visibility',
      items: [
        { id: 'lights-warning', label: 'Lights (Check Engine, ABS, Battery, etc.)', description: 'PASS = No warning lights on | FAIL = Any warning lights illuminated', status: 'pass', required: true },
        { id: 'wipers', label: 'Windshield Wipers', description: 'Blades good, fluid full', status: 'pass', required: true },
        { id: 'climate-control', label: 'Defrost / AC / Heat', description: 'Climate control and defrost functional', status: 'pass', required: true },
      ]
    },
    {
      id: 'mechanical-fluids',
      title: 'Mechanical & Fluids',
      items: [
        { id: 'oil-level', label: 'Oil Level', description: 'Within proper range', status: 'pass', required: true },
        { id: 'coolant-level', label: 'Coolant Level', description: 'Within proper range', status: 'pass', required: true },
        { id: 'brake-fluid', label: 'Brake Fluid', description: 'Within proper range', status: 'pass', required: true },
        { id: 'leaks', label: 'Leaks', description: 'No fluid leaks under vehicle', status: 'pass', required: true },
        { id: 'brakes', label: 'Brakes', description: 'Responsive, no grinding or squealing', status: 'pass', required: true },
        { id: 'steering', label: 'Steering', description: 'Responsive, no play or vibration', status: 'pass', required: true },
        { id: 'suspension', label: 'Suspension', description: 'Shocks, ride quality, unusual bounce/noise', status: 'pass', required: true },
        { id: 'engine-condition', label: 'Engine Condition', description: 'Idle quality, knocking, performance', status: 'pass', required: true },
        { id: 'emissions', label: 'Emissions', description: 'Smoke, exhaust issues, abnormal smell', status: 'pass', required: true },
      ]
    },
    {
      id: 'interior',
      title: 'Interior Inspection',
      items: [
        { id: 'cleanliness', label: 'Cleanliness', description: 'Cab clean and organized', status: 'pass', required: true },
        { id: 'seat-condition', label: 'Seat Condition', description: 'No tears, adjustments work', status: 'pass', required: true },
      ]
    },
    {
      id: 'documentation',
      title: 'Documentation',
      items: [
        { id: 'registration-insurance', label: 'Registration & Insurance', description: 'Current and in vehicle', status: 'pass', required: true },
      ]
    },
  ]
}

// Calculate inspection score
export function calculateInspectionScore(sections: InspectionSection[]): {
  score: number
  totalItems: number
  passedItems: number
  failedItems: number
  overallStatus: 'pass' | 'fail'
} {
  let totalItems = 0
  let passedItems = 0
  let failedItems = 0

  sections.forEach(section => {
    section.items.forEach(item => {
      if (item.required) {
        totalItems++
        if (item.status === 'pass') {
          passedItems++
        } else if (item.status === 'fail') {
          failedItems++
        }
      }
    })
  })

  const score = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 100
  const overallStatus = failedItems > 0 ? 'fail' : 'pass'

  return { score, totalItems, passedItems, failedItems, overallStatus }
}

// Get lights status from inspection - critical KPI
export function getLightsStatus(sections: InspectionSection[]): InspectionStatus {
  const electricalSection = sections.find(s => s.id === 'electrical-visibility')
  if (!electricalSection) return 'pass'
  
  const lightsItem = electricalSection.items.find(i => i.id === 'lights-warning')
  return lightsItem?.status ?? 'pass'
}
