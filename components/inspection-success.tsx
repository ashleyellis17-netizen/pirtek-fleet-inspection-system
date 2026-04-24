'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type Inspection } from '@/lib/inspection-types'
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react'

interface InspectionSuccessProps {
  inspection: Inspection
  onContinue: () => void
}

export function InspectionSuccess({ inspection, onContinue }: InspectionSuccessProps) {
  const isPassing = inspection.overallStatus === 'pass'
  const hasLightsOn = inspection.lightsStatus === 'fail'

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="w-full">
        <CardContent className="p-6 text-center space-y-4">
          {/* Status icon */}
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
            isPassing ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isPassing ? (
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold">
              {isPassing ? 'Inspection Complete' : 'Inspection Submitted'}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {inspection.vehicleName} • {inspection.date}
            </p>
          </div>

          {/* Score */}
          <div className="py-4">
            <div className={`text-5xl font-bold font-mono ${
              isPassing ? 'text-green-600' : 'text-red-600'
            }`}>
              {inspection.score ?? 100}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {inspection.passedItems ?? 0} of {inspection.totalItems ?? 0} items passed
            </div>
          </div>

          {/* Alerts */}
          {hasLightsOn && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium text-sm">Warning lights active</span>
              </div>
            </div>
          )}

          {!isPassing && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-700">Failed Items:</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {inspection.sections ? inspection.sections.flatMap(s => 
                  s.items.filter(i => i.status === 'fail').map(i => (
                    <Badge key={i.id} variant="destructive" className="text-xs">
                      {i.label}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Issues detected
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div className="p-2 bg-muted rounded">
              <div className="text-muted-foreground">Driver</div>
              <div className="font-medium">{inspection.driverName}</div>
            </div>
            <div className="p-2 bg-muted rounded">
              <div className="text-muted-foreground">Mileage</div>
              <div className="font-medium font-mono">{(inspection.mileage ?? 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Continue button */}
          <Button onClick={onContinue} className="w-full mt-4" size="lg">
            Continue to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
