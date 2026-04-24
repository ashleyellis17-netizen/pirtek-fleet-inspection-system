import { NextResponse } from 'next/server'
import { calculateInspectionScore, getLightsStatus, type InspectionSection } from '@/lib/inspection-types'

interface InspectionPayload {
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
  notes?: string
}

export async function POST(request: Request) {
  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL

  if (!GOOGLE_SCRIPT_URL) {
    console.error('[v0] GOOGLE_SCRIPT_URL environment variable is not set')
    return NextResponse.json(
      { success: false, error: 'Server configuration error: Google Script URL not configured' },
      { status: 500 }
    )
  }

  try {
    const body: InspectionPayload = await request.json()

    // Calculate score and status
    const scoreData = calculateInspectionScore(body.sections)
    const lightsStatus = getLightsStatus(body.sections)

    // Build the full inspection object
    const inspection = {
      id: `insp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      ...scoreData,
      lightsStatus,
      submittedAt: new Date().toISOString(),
    }

    // Forward to Google Sheets
    console.log('[v0] Submitting inspection to Google Sheets:', inspection.id)
    console.log('[v0] Using GOOGLE_SCRIPT_URL:', GOOGLE_SCRIPT_URL.substring(0, 50) + '...')
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(inspection),
    })

    const responseText = await response.text()
    console.log('[v0] Google Sheets POST response status:', response.status)
    console.log('[v0] Google Sheets POST response text:', responseText.substring(0, 500))

    if (!response.ok) {
      console.error('[v0] Google Sheets API error:', response.status, responseText)
      
      let errorMessage = `Failed to save inspection (${response.status})`
      if (response.status === 401) {
        errorMessage = 'Google Script authentication error. Please ensure the script is deployed with "Anyone" access.'
      } else if (response.status === 403) {
        errorMessage = 'Google Script access denied. Please check deployment permissions.'
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      )
    }

    // Parse response from Google Script
    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      // If response is not JSON, treat as success if status was ok
      console.log('[v0] Response not JSON, treating as success')
      result = { success: true }
    }

    return NextResponse.json({
      success: true,
      inspection,
      googleResponse: result,
    })
  } catch (error) {
    console.error('[v0] Error submitting inspection:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to submit inspection' },
      { status: 500 }
    )
  }
}
