import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  const SCRIPT_URL = process.env.NEXT_PUBLIC_INSPECTION_SCRIPT_URL
  
  if (!SCRIPT_URL) {
    return NextResponse.json(
      { success: false, error: 'Google Script URL not configured' },
      { status: 500 }
    )
  }

  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Inspection ID is required' },
        { status: 400 }
      )
    }

    // Build URL with delete action
    const url = new URL(SCRIPT_URL)
    url.searchParams.set('action', 'delete')
    url.searchParams.set('id', String(id))

    console.log('[v0] Delete request - ID:', id, 'Type:', typeof id)
    console.log('[v0] Delete URL:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'GET', // Google Apps Script web apps handle params via GET
      redirect: 'follow',
    })

    const responseText = await response.text()
    console.log('[v0] Delete response:', responseText.substring(0, 500))

    if (!response.ok) {
      let errorMessage = `Failed to delete inspection (${response.status})`
      if (response.status === 401) {
        errorMessage = 'Google Script authentication error.'
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      )
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { success: true }
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('[v0] Delete inspection error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete inspection' },
      { status: 500 }
    )
  }
}
