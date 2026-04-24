'use client'

import { useState } from 'react'
import { Dashboard } from '@/components/dashboard'
import { InspectionForm } from '@/components/inspection-form'
import { InspectionHistory } from '@/components/inspection-history'
import { Toaster } from '@/components/ui/sonner'

type AppView = 'dashboard' | 'inspection' | 'history'

export default function FleetInspectionApp() {
  const [view, setView] = useState<AppView>('dashboard')

  const handleStartInspection = () => {
    setView('inspection')
  }

  const handleInspectionComplete = () => {
    setView('dashboard')
  }

  const handleCancelInspection = () => {
    setView('dashboard')
  }

  const handleViewHistory = () => {
    setView('history')
  }

  const handleBackFromHistory = () => {
    setView('dashboard')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 pb-20">
        {view === 'dashboard' && (
          <Dashboard 
            onStartInspection={handleStartInspection}
            onViewHistory={handleViewHistory}
          />
        )}
        
        {view === 'inspection' && (
          <InspectionForm
            onComplete={handleInspectionComplete}
            onCancel={handleCancelInspection}
          />
        )}
        
        {view === 'history' && (
          <InspectionHistory
            onBack={handleBackFromHistory}
          />
        )}
      </div>
      <Toaster position="top-center" />
    </main>
  )
}
