import { NextResponse } from 'next/server'
import type { Inspection } from '@/lib/inspection-types'

export async function GET() {
  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL

  if (!GOOGLE_SCRIPT_URL) {
    console.error('[v0] GOOGLE_SCRIPT_URL environment variable is not set')
    return NextResponse.json(
      { success: false, error: 'Server configuration error: Google Script URL not configured', inspections: [] },
      { status: 500 }
    )
  }

  try {
    // Append action=get to fetch inspections
    const url = new URL(GOOGLE_SCRIPT_URL)
    url.searchParams.set('action', 'get')

    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
    })

    const responseText = await response.text()
    console.log('[v0] Google Sheets GET response status:', response.status)
    console.log('[v0] Google Sheets GET response text (first 500 chars):', responseText.substring(0, 500))

    if (!response.ok) {
      console.error('[v0] Google Sheets API error:', response.status, responseText)
      
      let errorMessage = `Failed to fetch inspections (${response.status})`
      if (response.status === 401) {
        errorMessage = 'Google Script authentication error. Please ensure the script is deployed with "Anyone" access.'
      } else if (response.status === 403) {
        errorMessage = 'Google Script access denied. Please check deployment permissions.'
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage, inspections: [] },
        { status: response.status }
      )
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('[v0] Failed to parse Google Sheets response as JSON:', parseError)
      console.error('[v0] Raw response:', responseText)
      // If the response is empty or just whitespace, treat as empty array
      if (!responseText.trim() || responseText.trim() === '[]') {
        data = []
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid response format from Google Sheets', inspections: [] },
          { status: 500 }
        )
      }
    }

    // Handle different response formats from Google Sheets
    let inspections: Inspection[] = []
    
    if (Array.isArray(data)) {
      inspections = data
    } else if (data.inspections && Array.isArray(data.inspections)) {
      inspections = data.inspections
    } else if (data.data && Array.isArray(data.data)) {
      inspections = data.data
    }

    // Log first inspection to see field names
    if (inspections.length > 0) {
      console.log('[v0] First inspection fields:', Object.keys(inspections[0]))
      console.log('[v0] First inspection data:', JSON.stringify(inspections[0]).substring(0, 500))
    }

    // Ensure each inspection has an ID (use row number or generate one if missing)
    inspections = inspections.map((insp, index) => ({
      ...insp,
      id: insp.id || insp.rowNumber || insp.row || `inspection-${index}-${insp.date || Date.now()}`,
    }))

    // Sort by submittedAt descending (newest first)
    inspections.sort((a, b) => {
      const dateA = new Date(a.submittedAt || a.date || 0).getTime()
      const dateB = new Date(b.submittedAt || b.date || 0).getTime()
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      inspections,
    })
  } catch (error) {
    console.error('[v0] Error fetching inspection history:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch inspections', inspections: [] },
      { status: 500 }
    )
  }
}
