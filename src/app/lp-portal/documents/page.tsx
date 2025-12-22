'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  IconFileDescription,
  IconSearch,
  IconDownload,
  IconEye,
  IconFolder,
  IconBuilding,
  IconUser,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileSpreadsheet,
  IconCalendar,
  IconUpload,
  IconFile,
} from '@tabler/icons-react'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken, getCurrentUser, logout } from '@/lib/auth-storage'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Document {
  id: string
  entityType: string
  entityId: string
  documentType: string
  documentName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  version: number
  isActive: boolean
  createdAt: string
}

export default function LPDocumentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStructure, setSelectedStructure] = useState<string>('all')
  const [userDocuments, setUserDocuments] = useState<Document[]>([])
  const [structureDocuments, setStructureDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('all')

  // Document upload state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState('')
  const [documentTags, setDocumentTags] = useState('')
  const [documentNotes, setDocumentNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [investors, setInvestors] = useState<any[]>([])
  const [selectedInvestorId, setSelectedInvestorId] = useState('')
  const [loadingInvestors, setLoadingInvestors] = useState(false)

  useEffect(() => {
    loadDocuments()
    loadInvestors()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    const token = getAuthToken()

    if (!token) {
      toast.error('Authentication required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(getApiUrl(API_CONFIG.endpoints.getCombinedDocuments), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {
        console.log('[Documents] 401 Unauthorized - clearing session and redirecting to login')
        logout()
        router.push('/lp-portal/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load documents')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setUserDocuments(result.data.userDocuments || [])
        setStructureDocuments(result.data.structureDocuments || [])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Failed to load documents')
      setUserDocuments([])
      setStructureDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const loadInvestors = async () => {
    setLoadingInvestors(true)
    const token = getAuthToken()

    if (!token) {
      console.error('No authentication token found')
      setLoadingInvestors(false)
      return
    }

    try {
      const response = await fetch(getApiUrl('/api/investors/me/with-structures'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {
        console.log('[Documents] 401 Unauthorized - clearing session and redirecting to login')
        logout()
        router.push('/lp-portal/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load investors')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setInvestors(result.data)
        // Auto-select first investor if available
        if (result.data.length > 0) {
          setSelectedInvestorId(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading investors:', error)
      setInvestors([])
    } finally {
      setLoadingInvestors(false)
    }
  }

  const handleDocumentUpload = async () => {
    if (!documentFile || !documentType) {
      toast.error('Please select a file and document type')
      return
    }

    if (!selectedInvestorId) {
      toast.error('Please select an investor')
      return
    }

    const user = getCurrentUser()
    if (!user?.email) {
      toast.error('Please log in to upload documents')
      return
    }

    setIsUploading(true)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Create FormData
      const formData = new FormData()
      formData.append('file', documentFile)
      formData.append('entityType', 'investor')
      formData.append('entityId', selectedInvestorId) // Using selected investor ID
      formData.append('documentType', documentType)
      formData.append('documentName', documentFile.name)
      formData.append('tags', documentTags)
      formData.append('metadata', JSON.stringify({
        uploadedBy: user.email,
        uploadedAt: new Date().toISOString(),
      }))
      formData.append('notes', documentNotes)

      const response = await fetch(getApiUrl('/api/documents'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      // Handle 401 Unauthorized - session expired or invalid
      if (response.status === 401) {
        console.log('[Documents] 401 Unauthorized - clearing session and redirecting to login')
        logout()
        router.push('/lp-portal/login')
        return
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to upload document')
      }

      toast.success('Document uploaded successfully')

      // Reset form
      setDocumentFile(null)
      setDocumentType('')
      setDocumentTags('')
      setDocumentNotes('')
      setIsUploadDialogOpen(false)

      // Reload documents to show the newly uploaded one
      await loadDocuments()
    } catch (err) {
      console.error('[Documents] Error uploading document:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <IconFileTypePdf className="w-8 h-8 text-red-500" />
    } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return <IconFileSpreadsheet className="w-8 h-8 text-green-600" />
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return <IconFileTypeDoc className="w-8 h-8 text-blue-600" />
    } else {
      return <IconFileDescription className="w-8 h-8 text-muted-foreground" />
    }
  }

  const handleDownload = (doc: Document) => {
    window.open(doc.filePath, '_blank')
  }

  const handleView = (doc: Document) => {
    window.open(doc.filePath, '_blank')
  }

  // Get unique structure IDs for filter
  const uniqueStructureIds = Array.from(
    new Set([
      ...structureDocuments.map(doc => doc.entityId),
      ...userDocuments.filter(doc => doc.entityType === 'Structure').map(doc => doc.entityId)
    ])
  )

  // Filter documents
  const filteredUserDocs = userDocuments.filter(doc => {
    const matchesSearch = doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStructure = selectedStructure === 'all' || doc.entityId === selectedStructure
    const matchesType = documentTypeFilter === 'all' || doc.documentType === documentTypeFilter

    return matchesSearch && matchesStructure && matchesType && doc.isActive
  })

  const filteredStructureDocs = structureDocuments.filter(doc => {
    const matchesSearch = doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStructure = selectedStructure === 'all' || doc.entityId === selectedStructure
    const matchesType = documentTypeFilter === 'all' || doc.documentType === documentTypeFilter

    return matchesSearch && matchesStructure && matchesType && doc.isActive
  })

  // Group structure documents by entityId
  const structureDocsGrouped = filteredStructureDocs.reduce((acc, doc) => {
    if (!acc[doc.entityId]) {
      acc[doc.entityId] = {
        structureName: doc.entityId, // Could be enhanced with actual structure names
        documents: []
      }
    }
    acc[doc.entityId].documents.push(doc)
    return acc
  }, {} as Record<string, { structureName: string; documents: Document[] }>)

  // Group user documents by entityId
  const userDocsGrouped = filteredUserDocs.reduce((acc, doc) => {
    const groupKey = doc.entityType === 'Structure' ? doc.entityId : 'personal'
    if (!acc[groupKey]) {
      acc[groupKey] = {
        structureName: groupKey === 'personal' ? 'Personal Documents' : doc.entityId,
        documents: []
      }
    }
    acc[groupKey].documents.push(doc)
    return acc
  }, {} as Record<string, { structureName: string; documents: Document[] }>)

  // Get unique document types for filter
  const documentTypes = Array.from(
    new Set([
      ...userDocuments.map(doc => doc.documentType),
      ...structureDocuments.map(doc => doc.documentType)
    ])
  ).sort()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Access fund documents and your personal investor documents
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">{userDocuments.length + structureDocuments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Structure Documents</CardDescription>
            <CardTitle className="text-3xl">{structureDocuments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>My Documents</CardDescription>
            <CardTitle className="text-3xl">{userDocuments.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStructure} onValueChange={setSelectedStructure}>
              <SelectTrigger>
                <SelectValue placeholder="All Funds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {uniqueStructureIds.map(structureId => (
                  <SelectItem key={structureId} value={structureId}>
                    {structureId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Document Tabs */}
      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="structure">
            <IconBuilding className="w-4 h-4 mr-2" />
            Structure Documents ({filteredStructureDocs.length})
          </TabsTrigger>
          <TabsTrigger value="personal">
            <IconUser className="w-4 h-4 mr-2" />
            My Documents ({filteredUserDocs.length})
          </TabsTrigger>
        </TabsList>

        {/* Structure Documents Tab */}
        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fund-Level Documents</CardTitle>
              <CardDescription>
                Financial reports, legal agreements, and fund updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(structureDocsGrouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <IconFolder className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No structure documents found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(structureDocsGrouped).map(([structureId, data]) => (
                    <div key={structureId} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <IconBuilding className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">{data.structureName}</h3>
                        <Badge variant="secondary">{data.documents.length} documents</Badge>
                      </div>

                      <div className="space-y-2">
                        {data.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {getFileIcon(doc.mimeType)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">{doc.documentName}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {doc.documentType}
                                  </Badge>
                                  {doc.version > 1 && (
                                    <Badge variant="secondary" className="text-xs">
                                      v{doc.version}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                  <span className="flex items-center gap-1">
                                    <IconCalendar className="w-3 h-3" />
                                    {new Date(doc.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleView(doc)}>
                                <IconEye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                                <IconDownload className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Documents Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Personal Documents</CardTitle>
              <CardDescription>
                K-1 forms, subscription agreements, capital calls, and distributions specific to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(userDocsGrouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <IconUser className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No personal documents found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete onboarding to receive your investor documents
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(userDocsGrouped).map(([groupKey, data]) => (
                    <div key={groupKey} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <IconBuilding className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">{data.structureName}</h3>
                        <Badge variant="secondary">{data.documents.length} documents</Badge>
                      </div>

                      <div className="space-y-2">
                        {data.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {getFileIcon(doc.mimeType)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">{doc.documentName}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {doc.documentType}
                                  </Badge>
                                  {doc.version > 1 && (
                                    <Badge variant="secondary" className="text-xs">
                                      v{doc.version}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                  <span className="flex items-center gap-1">
                                    <IconCalendar className="w-3 h-3" />
                                    {new Date(doc.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleView(doc)}>
                                <IconEye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                                <IconDownload className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
