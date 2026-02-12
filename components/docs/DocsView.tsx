'use client'

import { useState, useEffect, useRef } from 'react'
import JSZip from 'jszip'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Upload,
  FileText,
  MoreVertical,
  Download,
  Share2,
  Eye,
  Check,
  Sparkles,
  Loader2,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

interface DocsViewProps {
  tripId: string
}

interface Document {
  id: string
  name: string
  type: 'flight' | 'hotel' | 'identity' | 'other'
  uploadedBy: string
  uploadedAt: string
  thumbnail?: string
  hasPreview: boolean
  file_url?: string
}

interface Activity {
  id: string
  user: string
  action: string
  target: string
  timestamp: string
  isAI?: boolean
}

export function DocsView({ tripId }: DocsViewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedType, setSelectedType] = useState<'flight' | 'hotel' | 'identity' | 'other'>('other')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents from API
  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/documents`)
      if (response.ok) {
        const data = await response.json()
        const mappedDocs = (data.documents || []).map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          uploadedBy: doc.uploaded_by_name,
          uploadedAt: formatTimestamp(doc.created_at),
          thumbnail: doc.file_url,
          hasPreview: doc.mime_type?.startsWith('image/'),
          file_url: doc.file_url,
        }))
        setDocuments(mappedDocs)
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [tripId])

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Derive recent activities from documents
  const activities: Activity[] = documents.slice(0, 5).map((doc) => ({
    id: doc.id,
    user: doc.uploadedBy,
    action: 'uploaded',
    target: doc.name,
    timestamp: doc.uploadedAt,
    isAI: false,
  }))

  const typeColors = {
    flight: 'bg-blue-500 text-white',
    hotel: 'bg-orange-500 text-white',
    identity: 'bg-red-500 text-white',
    other: 'bg-gray-500 text-white',
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const file = files[0]
      // Show dialog to select document type
      setSelectedFile(file)
      setShowTypeDialog(true)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      // Show dialog to select document type
      setSelectedFile(file)
      setShowTypeDialog(true)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) return // Prevent multiple uploads

    setUploading(true)
    setShowTypeDialog(false)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', selectedType)

      const response = await fetch(`/api/trips/${tripId}/documents/upload`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        // Reset form first
        setSelectedFile(null)
        setSelectedType('other')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Then reload documents
        await loadDocuments()
      } else {
        const errorText = await response.text()
        console.error('Upload failed:', errorText)
        try {
          const error = JSON.parse(errorText)
          alert(`Upload failed: ${error.error || errorText}`)
        } catch {
          alert(`Upload failed: ${errorText}`)
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleShareVault = () => {
    const shareUrl = `${window.location.origin}/trips/${tripId}?tab=docs`
    navigator.clipboard.writeText(shareUrl)
    alert('Document vault link copied to clipboard!')
  }

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/trips/${tripId}/documents?id=${docId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadDocuments()
      } else {
        const errorText = await response.text()
        console.error('Delete failed:', errorText)
        alert('Failed to delete document. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document. Please try again.')
    }
  }

  const handleDownloadAll = async () => {
    if (documents.length === 0) {
      alert('No documents to download')
      return
    }

    setDownloading(true)
    try {
      const zip = new JSZip()

      // Fetch and add each document to the ZIP
      for (const doc of documents) {
        if (doc.file_url) {
          try {
            // Fetch the file as a blob
            const response = await fetch(doc.file_url)
            const blob = await response.blob()

            // Add to ZIP with original filename
            zip.file(doc.name, blob)
          } catch (error) {
            console.error(`Failed to fetch ${doc.name}:`, error)
          }
        }
      }

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })

      // Create download link for the ZIP
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = `trip-documents-${new Date().getTime()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the object URL
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Error creating ZIP:', error)
      alert('Failed to download documents. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Documents */}
      <div className="lg:col-span-2 space-y-6">
        {/* Upload Area */}
        <Card>
          <CardContent className="p-12">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Upload Documents
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Drag and drop files here, or click to browse. We support
                <br />
                PDF, JPG, and PNG files.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Choose Files'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-200 border-2 hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer"
              onClick={() => {
                if (doc.file_url) {
                  window.open(doc.file_url, '_blank')
                }
              }}
            >
              {/* Document Preview/Thumbnail */}
              <div className="relative h-56 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900">
                {doc.hasPreview && doc.thumbnail ? (
                  <Image
                    src={doc.thumbnail}
                    alt={doc.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6">
                    {/* File type icon with color */}
                    <div className={`p-4 rounded-2xl mb-3 ${
                      doc.type === 'flight' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      doc.type === 'hotel' ? 'bg-orange-100 dark:bg-orange-900/30' :
                      doc.type === 'identity' ? 'bg-red-100 dark:bg-red-900/30' :
                      'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <FileText className={`h-12 w-12 ${
                        doc.type === 'flight' ? 'text-blue-600 dark:text-blue-400' :
                        doc.type === 'hotel' ? 'text-orange-600 dark:text-orange-400' :
                        doc.type === 'identity' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    {/* File extension */}
                    <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {doc.name.split('.').pop()}
                    </span>
                  </div>
                )}

                {/* Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={`${typeColors[doc.type]} shadow-lg`}>
                    {doc.type.toUpperCase()}
                  </Badge>
                </div>

                {/* Click to View Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-white/95 dark:bg-gray-800/95 px-6 py-3 rounded-lg shadow-2xl">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                      <Eye className="h-5 w-5" />
                      <span>Click to view</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Info */}
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate mb-2">
                      {doc.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {doc.uploadedBy[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Uploaded by {doc.uploadedBy}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (doc.file_url) {
                          const link = document.createElement('a')
                          link.href = doc.file_url
                          link.download = doc.name
                          link.target = '_blank'
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 hover:bg-red-100 dark:hover:bg-red-900 text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDocument(doc.id, doc.name)
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Column - Activity */}
      <div className="space-y-6">
        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  {activity.isAI ? (
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {activity.user[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">{activity.user}</span>{' '}
                      {activity.action}{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {activity.target}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={handleShareVault}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Vault
          </Button>
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={handleDownloadAll}
            disabled={downloading || documents.length === 0}
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download All ({documents.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Document Type Selection Dialog */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Select the type of document you're uploading: {selectedFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-type">Document Type</Label>
              <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
                <SelectTrigger id="doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="identity">Identity</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
