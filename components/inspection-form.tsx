'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DRIVERS, WAREHOUSES, getVehiclesForDriver, getDriverById, getWarehouseByCode, type Driver, type Vehicle } from '@/lib/fleet-data'
import { createInspectionSections, type InspectionSection, type InspectionStatus, type InspectionItem, type Inspection } from '@/lib/inspection-types'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, MinusCircle, ChevronRight, ChevronLeft, AlertTriangle, Truck, User, Building2, Gauge, Loader2 } from 'lucide-react'

interface InspectionFormProps {
  onComplete: (inspection: Inspection) => void
  onCancel: () => void
}

type FormStep = 'driver' | 'vehicle' | 'mileage' | 'inspection' | 'review'

export function InspectionForm({ onComplete, onCancel }: InspectionFormProps) {
  const [step, setStep] = useState<FormStep>('driver')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [mileage, setMileage] = useState('')
  const [sections, setSections] = useState<InspectionSection[]>(createInspectionSections())
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update available vehicles when driver changes
  useEffect(() => {
    if (selectedDriver) {
      const vehicles = getVehiclesForDriver(selectedDriver.id)
      setAvailableVehicles(vehicles)
      setSelectedVehicle(null) // Reset vehicle selection
    } else {
      setAvailableVehicles([])
      setSelectedVehicle(null)
    }
  }, [selectedDriver])

  const handleDriverSelect = (driverId: string) => {
    const driver = getDriverById(driverId)
    setSelectedDriver(driver || null)
  }

  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = availableVehicles.find(v => v.id === vehicleId)
    setSelectedVehicle(vehicle || null)
  }

  const updateItemStatus = (sectionId: string, itemId: string, status: InspectionStatus) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section
      return {
        ...section,
        items: section.items.map(item => {
          if (item.id !== itemId) return item
          return { ...item, status }
        })
      }
    }))
  }

  const updateItemNotes = (sectionId: string, itemId: string, itemNotes: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section
      return {
        ...section,
        items: section.items.map(item => {
          if (item.id !== itemId) return item
          return { ...item, notes: itemNotes }
        })
      }
    }))
  }

  const handleSubmit = async () => {
    if (!selectedDriver || !selectedVehicle) return
    
    setIsSubmitting(true)
    
    const warehouse = getWarehouseByCode(selectedDriver.warehouseCode)
    const now = new Date()
    
    const payload = {
      driverId: selectedDriver.id,
      driverName: selectedDriver.name,
      vehicleId: selectedVehicle.id,
      vehicleName: selectedVehicle.plate,
      warehouseCode: selectedDriver.warehouseCode,
      warehouseName: warehouse?.name || selectedDriver.warehouseCode,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].slice(0, 5),
      mileage: parseInt(mileage) || 0,
      sections,
      notes: notes || undefined,
    }
    
    try {
      const response = await fetch('/api/submit-inspection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit inspection')
      }
      
      toast.success('Inspection submitted successfully')
      onComplete(result.inspection)
    } catch (error) {
      console.error('[v0] Error submitting inspection:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit inspection. Please try again.')
      setIsSubmitting(false)
    }
  }

  const canProceedFromDriver = selectedDriver !== null
  const canProceedFromVehicle = selectedVehicle !== null
  const canProceedFromMileage = mileage.length > 0 && parseInt(mileage) > 0

  const currentSection = sections[currentSectionIndex]
  const isLastSection = currentSectionIndex === sections.length - 1
  const isFirstSection = currentSectionIndex === 0

  // Group drivers by warehouse for easier selection
  const driversGroupedByWarehouse = WAREHOUSES.map(warehouse => ({
    warehouse,
    drivers: DRIVERS.filter(d => d.warehouseCode === warehouse.code)
  })).filter(group => group.drivers.length > 0)

  // Drivers without a warehouse assignment
  const unassignedDrivers = DRIVERS.filter(d => !d.warehouseCode)

  // Calculate section progress
  const getSectionStatus = (section: InspectionSection): 'pass' | 'fail' | 'incomplete' => {
    const requiredItems = section.items.filter(i => i.required)
    const hasFailure = requiredItems.some(i => i.status === 'fail')
    if (hasFailure) return 'fail'
    return 'pass'
  }

  const renderStepIndicator = () => {
    const steps = [
      { id: 'driver', label: 'Driver', icon: User },
      { id: 'vehicle', label: 'Vehicle', icon: Truck },
      { id: 'mileage', label: 'Mileage', icon: Gauge },
      { id: 'inspection', label: 'Inspect', icon: CheckCircle2 },
      { id: 'review', label: 'Submit', icon: CheckCircle2 },
    ]
    const currentIndex = steps.findIndex(s => s.id === step)
    
    return (
      <div className="flex items-center justify-center gap-1 mb-6 overflow-x-auto px-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              i < currentIndex 
                ? 'bg-green-100 text-green-700' 
                : i === currentIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
            }`}>
              <s.icon className="w-3 h-3" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {renderStepIndicator()}
      
      {/* Step 1: Driver Selection */}
      {step === 'driver' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Select Driver
            </CardTitle>
            <CardDescription>Choose your name to begin the inspection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedDriver?.id || ''} onValueChange={handleDriverSelect}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select your name..." />
              </SelectTrigger>
              <SelectContent>
                {driversGroupedByWarehouse.map(group => (
                  <div key={group.warehouse.code}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      {group.warehouse.stateRegion} - {group.warehouse.name} ({group.warehouse.code})
                    </div>
                    {group.drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id} className="pl-4 py-3">
                        {driver.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
                {unassignedDrivers.length > 0 && (
                  <div key="unassigned">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                      Other Drivers
                    </div>
                    {unassignedDrivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id} className="pl-4 py-3">
                        {driver.name}
                      </SelectItem>
                    ))}
                  </div>
                )}
              </SelectContent>
            </Select>
            
            {selectedDriver && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Warehouse:</span>
                  <span className="font-medium">
                    {selectedDriver.warehouseCode 
                      ? `${getWarehouseByCode(selectedDriver.warehouseCode)?.name} (${selectedDriver.warehouseCode})`
                      : 'Not Assigned'}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => setStep('vehicle')} 
                disabled={!canProceedFromDriver}
                className="flex-1"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Vehicle Selection */}
      {step === 'vehicle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Select Vehicle
            </CardTitle>
            <CardDescription>
              Choose the vehicle you are inspecting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedVehicle?.id || ''} onValueChange={handleVehicleSelect}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select vehicle..." />
              </SelectTrigger>
              <SelectContent>
                {/* Driver's assigned vehicle first */}
                {availableVehicles.filter(v => v.driverId === selectedDriver?.id).length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Your Assigned Vehicle
                    </div>
                    {availableVehicles.filter(v => v.driverId === selectedDriver?.id).map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id} className="py-3">
                        <span className="font-medium">{vehicle.plate}</span>
                      </SelectItem>
                    ))}
                  </>
                )}
                {/* All other standard vehicles */}
                {availableVehicles.filter(v => v.type === 'standard' && v.driverId !== selectedDriver?.id).length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      All Vehicles
                    </div>
                    {availableVehicles.filter(v => v.type === 'standard' && v.driverId !== selectedDriver?.id).map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id} className="py-3">
                        <span>{vehicle.plate}</span>
                      </SelectItem>
                    ))}
                  </>
                )}
                {/* Shop vehicles */}
                {availableVehicles.filter(v => v.type === 'shop').length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Shop Vehicles
                    </div>
                    {availableVehicles.filter(v => v.type === 'shop').map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id} className="py-3">
                        <span>{vehicle.plate} (Shop)</span>
                      </SelectItem>
                    ))}
                  </>
                )}
                {/* Spare vehicles */}
                {availableVehicles.filter(v => v.type === 'spare').length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Spare Vehicles
                    </div>
                    {availableVehicles.filter(v => v.type === 'spare').map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id} className="py-3">
                        <span>{vehicle.plate} (SPARE)</span>
                      </SelectItem>
                    ))}
                  </>
                )}
                {/* Open vehicles */}
                {availableVehicles.filter(v => v.type === 'open').length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Open / Available
                    </div>
                    {availableVehicles.filter(v => v.type === 'open').map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id} className="py-3">
                        <span>{vehicle.plate} (OPEN)</span>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            
            {selectedVehicle && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Plate:</span>
                  <span className="font-medium font-mono">{selectedVehicle.plate}</span>
                  <Badge variant="outline" className="text-xs">
                    {selectedVehicle.type === 'shop' ? 'Shop' : selectedVehicle.type === 'spare' ? 'SPARE' : selectedVehicle.type === 'open' ? 'OPEN' : 'Assigned'}
                  </Badge>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('driver')} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button 
                onClick={() => setStep('mileage')} 
                disabled={!canProceedFromVehicle}
                className="flex-1"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Mileage */}
      {step === 'mileage' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Current Mileage
            </CardTitle>
            <CardDescription>Enter the current odometer reading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter mileage..."
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="h-14 text-xl text-center font-mono"
              autoFocus
            />
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('vehicle')} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button 
                onClick={() => setStep('inspection')} 
                disabled={!canProceedFromMileage}
                className="flex-1"
              >
                Start Inspection
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Inspection */}
      {step === 'inspection' && currentSection && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{currentSection.title}</CardTitle>
                <CardDescription>
                  Section {currentSectionIndex + 1} of {sections.length}
                </CardDescription>
              </div>
              <Badge variant={getSectionStatus(currentSection) === 'fail' ? 'destructive' : 'secondary'}>
                {getSectionStatus(currentSection) === 'fail' ? 'Has Issues' : 'OK'}
              </Badge>
            </div>
            {/* Section progress dots */}
            <div className="flex gap-1 pt-2">
              {sections.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSectionIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentSectionIndex 
                      ? 'w-6 bg-primary' 
                      : getSectionStatus(sections[i]) === 'fail'
                        ? 'w-2 bg-destructive'
                        : 'w-2 bg-muted hover:bg-muted-foreground/30'
                  }`}
                  aria-label={`Go to section ${i + 1}`}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentSection.items.map((item) => (
              <InspectionItemRow
                key={item.id}
                item={item}
                sectionId={currentSection.id}
                onStatusChange={updateItemStatus}
                onNotesChange={updateItemNotes}
              />
            ))}
            
            <Separator className="my-4" />
            
            <div className="flex gap-3">
              {isFirstSection ? (
                <Button variant="outline" onClick={() => setStep('mileage')} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setCurrentSectionIndex(prev => prev - 1)} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
              
              {isLastSection ? (
                <Button onClick={() => setStep('review')} className="flex-1">
                  Review & Submit
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={() => setCurrentSectionIndex(prev => prev + 1)} className="flex-1">
                  Next Section
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review & Submit */}
      {step === 'review' && (
        <Card>
          <CardHeader>
            <CardTitle>Review Inspection</CardTitle>
            <CardDescription>Confirm all details before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-muted-foreground text-xs">Driver</div>
                <div className="font-medium">{selectedDriver?.name}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-muted-foreground text-xs">Vehicle (Plate)</div>
                <div className="font-medium font-mono">{selectedVehicle?.plate}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-muted-foreground text-xs">Warehouse</div>
                <div className="font-medium">{getWarehouseByCode(selectedDriver?.warehouseCode || '')?.name}</div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-muted-foreground text-xs">Mileage</div>
                <div className="font-medium font-mono">{parseInt(mileage).toLocaleString()}</div>
              </div>
            </div>
            
            {/* Section summary */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Inspection Results</h4>
              {sections.map((section, i) => {
                const status = getSectionStatus(section)
                const failedItems = section.items.filter(item => item.status === 'fail')
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setCurrentSectionIndex(i)
                      setStep('inspection')
                    }}
                    className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {status === 'fail' ? (
                        <XCircle className="w-4 h-4 text-destructive" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                    {status === 'fail' && (
                      <Badge variant="destructive" className="text-xs">
                        {failedItems.length} issue{failedItems.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
            
            {/* Warning lights alert */}
            {sections.find(s => s.id === 'electrical-visibility')?.items.find(i => i.id === 'lights-warning')?.status === 'fail' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-800">Warning Lights Active</h4>
                    <p className="text-sm text-red-700 mt-1">
                      This vehicle has active warning lights. This will be flagged for immediate attention.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Additional notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes (Optional)</label>
              <Textarea
                placeholder="Any additional comments or observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <Separator />
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCurrentSectionIndex(sections.length - 1)
                  setStep('inspection')
                }} 
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Individual inspection item component
interface InspectionItemRowProps {
  item: InspectionItem
  sectionId: string
  onStatusChange: (sectionId: string, itemId: string, status: InspectionStatus) => void
  onNotesChange: (sectionId: string, itemId: string, notes: string) => void
}

function InspectionItemRow({ item, sectionId, onStatusChange, onNotesChange }: InspectionItemRowProps) {
  const [showNotes, setShowNotes] = useState(false)

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{item.label}</span>
            {item.required && <span className="text-red-500 text-xs">*</span>}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
          )}
        </div>
      </div>
      
      {/* Status buttons - large touch targets for mobile */}
      <div className="flex gap-2">
        <button
          onClick={() => onStatusChange(sectionId, item.id, 'pass')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
            item.status === 'pass'
              ? 'bg-green-600 text-white'
              : 'bg-muted hover:bg-green-100 text-muted-foreground hover:text-green-700'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          Pass
        </button>
        <button
          onClick={() => {
            onStatusChange(sectionId, item.id, 'fail')
            setShowNotes(true)
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
            item.status === 'fail'
              ? 'bg-red-600 text-white'
              : 'bg-muted hover:bg-red-100 text-muted-foreground hover:text-red-700'
          }`}
        >
          <XCircle className="w-5 h-5" />
          Fail
        </button>
        {!item.required && (
          <button
            onClick={() => onStatusChange(sectionId, item.id, 'na')}
            className={`flex items-center justify-center gap-1 py-3 px-3 rounded-lg font-medium text-sm transition-colors ${
              item.status === 'na'
                ? 'bg-gray-600 text-white'
                : 'bg-muted hover:bg-gray-200 text-muted-foreground'
            }`}
          >
            <MinusCircle className="w-4 h-4" />
            N/A
          </button>
        )}
      </div>
      
      {/* Notes section for failed items */}
      {(item.status === 'fail' || showNotes) && (
        <div className="pt-2">
          <Textarea
            placeholder="Describe the issue..."
            value={item.notes || ''}
            onChange={(e) => onNotesChange(sectionId, item.id, e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>
      )}
    </div>
  )
}
