'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function PrintButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Download className="h-4 w-4 mr-2" />
      Export PDF
    </Button>
  )
}
