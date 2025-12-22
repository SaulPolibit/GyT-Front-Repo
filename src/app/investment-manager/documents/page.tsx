'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  IconFileDescription,
  IconUpload,
  IconSearch,
  IconDownload,
  IconEye,
  IconTrash,
  IconFolder,
  IconBuilding,
  IconUsers,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileSpreadsheet,
  IconCalendar,
  IconBriefcase
} from '@tabler/icons-react'
import { Loader2 } from 'lucide-react'
import { API_CONFIG, getApiUrl } from '@/lib/api-config'
import { getAuthToken, getAuthState } from '@/lib/auth-storage'
import { toast } from 'sonner'

interface Document {
  id: string
  documentName: string
  documentType: string
  entityType: string
  entityId: string
  entityName?: string
  filePath: string
  fileSize?: number
  tags?: string | string[]
  notes?: string
  createdAt: string
  uploadedBy?: string
}

interface Structure {
  id: string
  name: string
}

interface Investor {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email?: string
}

interface Investment {
  id: string
  name: string
  type?: string
}

export default function DocumentsPage() {
  // Check if user is guest
  const authState = getAuthState()
  const currentUserRole = authState.user?.role ?? null
  const isGuest = currentUserRole === 4

  const [documents, setDocuments] = useState<Document[]>([])
  const [structures, setStructures] = useState<Structure[]>([])
  const [investors, setInvestors] = useState<Investor[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStructure, setSelectedStructure] = useState<string>('all')
  const [selectedInvestor, setSelectedInvestor] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadEntityType, setUploadEntityType] = useState<'Structure' | 'Investor' | 'Investment'>('Structure')
  const [uploadEntityId, setUploadEntityId] = useState('')
  const [uploadDocumentType, setUploadDocumentType] = useState('')
  const [uploadDocumentName, setUploadDocumentName] = useState('')
  const [uploadTags, setUploadTags] = useState('')
  const [uploadMetadata, setUploadMetadata] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken()

      if (!token) {
        toast.error('Authentication required. Please log in.')
        setIsLoading(false)
        return
      }

      let fetchedDocuments: Document[] = []
      let fetchedStructures: Structure[] = []
      let fetchedInvestors: Investor[] = []
      let fetchedInvestments: Investment[] = []

      // Fetch documents
      const documentsUrl = getApiUrl(API_CONFIG.endpoints.getAllDocuments)
      const documentsResponse = await fetch(documentsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (documentsResponse.ok) {
        const result = await documentsResponse.json()
        if (result.success && Array.isArray(result.data)) {
          fetchedDocuments = result.data
        }
      }

      // Fetch structures
      const structuresUrl = getApiUrl(API_CONFIG.endpoints.getAllStructures)
      const structuresResponse = await fetch(structuresUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (structuresResponse.ok) {
        const result = await structuresResponse.json()
        if (result.success && Array.isArray(result.data)) {
          fetchedStructures = result.data
          setStructures(result.data)
        }
      }

      // Fetch investors
      const investorsUrl = getApiUrl(API_CONFIG.endpoints.getAllInvestorsWithStructures)
      const investorsResponse = await fetch(investorsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (investorsResponse.ok) {
        const result = await investorsResponse.json()
        if (result.success && Array.isArray(result.data)) {
          fetchedInvestors = result.data
          setInvestors(result.data)
        }
      }

      // Fetch investments
      const investmentsUrl = getApiUrl(API_CONFIG.endpoints.getAllInvestments)
      const investmentsResponse = await fetch(investmentsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (investmentsResponse.ok) {
        const result = await investmentsResponse.json()
        if (result.success && Array.isArray(result.data)) {
          fetchedInvestments = result.data
          setInvestments(result.data)
        }
      }

      // Enrich documents with entity names
      const enrichedDocuments = fetchedDocuments.map(doc => {
        if (doc.entityType === 'Structure') {
          const structure = fetchedStructures.find(s => s.id === doc.entityId)
          return {
            ...doc,
            entityName: structure?.name || doc.entityName
          }
        } else if (doc.entityType === 'Investor') {
          const investor = fetchedInvestors.find(inv => inv.id === doc.entityId)
          const investorName = investor?.name ||
            `${investor?.firstName || ''} ${investor?.lastName || ''}`.trim() ||
            investor?.email
          return {
            ...doc,
            entityName: investorName || doc.entityName
          }
        } else if (doc.entityType === 'Investment') {
          const investment = fetchedInvestments.find(inv => inv.id === doc.entityId)
          return {
            ...doc,
            entityName: investment?.name || doc.entityName
          }
        }
        return doc
      })

      setDocuments(enrichedDocuments)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
      setIsLoading(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <IconFileTypePdf className="w-8 h-8 text-red-500" />
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <IconFileSpreadsheet className="w-8 h-8 text-green-600" />
      case 'doc':
      case 'docx':
        return <IconFileTypeDoc className="w-8 h-8 text-blue-600" />
      default:
        return <IconFileDescription className="w-8 h-8 text-muted-foreground" />
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(2)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(2)} MB`
  }

  const handleDownloadDocument = (doc: Document) => {
    if (!doc.filePath) {
      toast.error('Document file path not available')
      return
    }

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = doc.filePath
    link.download = doc.documentName || 'document'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Download started')
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const deleteUrl = getApiUrl(API_CONFIG.endpoints.deleteDocument(documentId))
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Remove document from state
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId))
        toast.success('Document deleted successfully')
      } else {
        const result = await response.json()
        toast.error(result.message || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      // Auto-fill document name from file name
      if (!uploadDocumentName) {
        setUploadDocumentName(file.name)
      }
    }
  }

  const resetUploadForm = () => {
    setUploadFile(null)
    setUploadEntityType('Structure')
    setUploadEntityId('')
    setUploadDocumentType('')
    setUploadDocumentName('')
    setUploadTags('')
    setUploadMetadata('')
  }

  const handleUploadDocument = async () => {
    if (!uploadFile) {
      toast.error('Please select a file')
      return
    }

    if (!uploadEntityId) {
      toast.error('Please select an entity')
      return
    }

    try {
      setIsUploading(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('entityType', uploadEntityType)
      formData.append('entityId', uploadEntityId)
      formData.append('documentType', uploadDocumentType || 'Document')
      formData.append('documentName', uploadDocumentName || uploadFile.name)
      if (uploadTags) formData.append('tags', uploadTags)

      const uploadUrl = getApiUrl(API_CONFIG.endpoints.uploadDocument)
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        await response.json()
        toast.success('Document uploaded successfully')
        setUploadDialogOpen(false)
        resetUploadForm()
        // Refresh documents list
        fetchData()
      } else {
        const result = await response.json()
        toast.error(result.message || 'Failed to upload document')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error('Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStructure = selectedStructure === 'all' || doc.entityId === selectedStructure
    const matchesInvestor = selectedInvestor === 'all' || doc.entityId === selectedInvestor
    const matchesCategory = selectedCategory === 'all' ||
      (selectedCategory === 'Structure Documents' && doc.entityType === 'Structure') ||
      (selectedCategory === 'Investor Documents' && doc.entityType === 'Investor') ||
      (selectedCategory === 'Asset Documents' && doc.entityType === 'Investment')

    return matchesSearch && matchesStructure && matchesInvestor && matchesCategory
  })

  const structureDocs = filteredDocuments.filter(doc => doc.entityType === 'Structure')
  const investorDocs = filteredDocuments.filter(doc => doc.entityType === 'Investor')
  const investmentDocs = filteredDocuments.filter(doc => doc.entityType === 'Investment')

  // Group investor documents by investor
  const investorDocsGrouped = investorDocs.reduce((acc, doc) => {
    if (!acc[doc.entityId]) {
      acc[doc.entityId] = {
        investorName: doc.entityName || `Investor ${doc.entityId}`,
        documents: []
      }
    }
    acc[doc.entityId].documents.push(doc)
    return acc
  }, {} as Record<string, { investorName: string; documents: Document[] }>)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
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
          <h2 className="text-2xl font-bold tracking-tight">Document Center</h2>
          <p className="text-muted-foreground">
            Manage structure and investor documents organized by fund
          </p>
        </div>
        {!isGuest && (
          <Button onClick={() => setUploadDialogOpen(true)}>
            <IconUpload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">{documents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Structure Documents</CardDescription>
            <CardTitle className="text-3xl">{structureDocs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Investor Documents</CardDescription>
            <CardTitle className="text-3xl">{investorDocs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Asset Documents</CardDescription>
            <CardTitle className="text-3xl">{investmentDocs.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedStructure} onValueChange={setSelectedStructure}>
              <SelectTrigger>
                <SelectValue placeholder="All Structures" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Structures</SelectItem>
                {structures.map(structure => (
                  <SelectItem key={structure.id} value={structure.id}>
                    {structure.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedInvestor} onValueChange={setSelectedInvestor}>
              <SelectTrigger>
                <SelectValue placeholder="All Investors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Investors</SelectItem>
                {investors.map(investor => (
                  <SelectItem key={investor.id} value={investor.id}>
                    {investor.name || `${investor.firstName || ''} ${investor.lastName || ''}`.trim() || investor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Structure Documents">Structure Documents</SelectItem>
                <SelectItem value="Investor Documents">Investor Documents</SelectItem>
                <SelectItem value="Asset Documents">Asset Documents</SelectItem>
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
            Structure Documents ({structureDocs.length})
          </TabsTrigger>
          <TabsTrigger value="investor">
            <IconUsers className="w-4 h-4 mr-2" />
            Investor Documents ({investorDocs.length})
          </TabsTrigger>
          <TabsTrigger value="investment">
            <IconBriefcase className="w-4 h-4 mr-2" />
            Asset Documents ({investmentDocs.length})
          </TabsTrigger>
        </TabsList>

        {/* Structure Documents Tab */}
        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Structure-Level Documents</CardTitle>
              <CardDescription>
                Fund documents, financial reports, and legal agreements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {structureDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <IconFolder className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No structure documents found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {structureDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {getFileIcon(doc.documentName)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{doc.documentName}</p>
                            <Badge variant="outline">{doc.documentType}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <IconBuilding className="w-3 h-3" />
                              {doc.entityName || 'Unknown Structure'}
                            </span>
                            {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                            <span className="flex items-center gap-1">
                              <IconCalendar className="w-3 h-3" />
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                            {doc.uploadedBy && <span>by {doc.uploadedBy}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (doc.filePath) {
                              window.open(doc.filePath, '_blank')
                            } else {
                              toast.error('Document file path not available')
                            }
                          }}
                        >
                          <IconEye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          <IconDownload className="w-4 h-4" />
                        </Button>
                        {!isGuest && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <IconTrash className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investor Documents Tab */}
        <TabsContent value="investor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investor-Level Documents</CardTitle>
              <CardDescription>
                Documents organized by investor within each structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(investorDocsGrouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <IconUsers className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No investor documents found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(investorDocsGrouped).map(([investorId, data]) => (
                    <div key={investorId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <IconUsers className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-lg">{data.investorName}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {data.documents.length} document{data.documents.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <IconUpload className="w-4 h-4 mr-2" />
                          Upload for Investor
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {data.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {getFileIcon(doc.documentName)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">{doc.documentName}</p>
                                  <Badge variant="secondary" className="text-xs">
                                    {doc.documentType}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                                  <span className="flex items-center gap-1">
                                    <IconCalendar className="w-3 h-3" />
                                    {new Date(doc.createdAt).toLocaleDateString()}
                                  </span>
                                  {doc.uploadedBy && <span>by {doc.uploadedBy}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (doc.filePath) {
                                    window.open(doc.filePath, '_blank')
                                  } else {
                                    toast.error('Document file path not available')
                                  }
                                }}
                              >
                                <IconEye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadDocument(doc)}
                              >
                                <IconDownload className="w-4 h-4" />
                              </Button>
                              {!isGuest && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <IconTrash className="w-4 h-4" />
                                </Button>
                              )}
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

        {/* Asset Documents Tab */}
        <TabsContent value="investment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment-Level Documents</CardTitle>
              <CardDescription>
                Documents related to specific portfolio investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {investmentDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <IconBriefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No investment documents found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {investmentDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {getFileIcon(doc.documentName)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{doc.documentName}</p>
                            <Badge variant="outline">{doc.documentType}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <IconBriefcase className="w-3 h-3" />
                              {doc.entityName || 'Unknown Investment'}
                            </span>
                            {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                            <span className="flex items-center gap-1">
                              <IconCalendar className="w-3 h-3" />
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                            {doc.uploadedBy && <span>by {doc.uploadedBy}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (doc.filePath) {
                              window.open(doc.filePath, '_blank')
                            } else {
                              toast.error('Document file path not available')
                            }
                          }}
                        >
                          <IconEye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          <IconDownload className="w-4 h-4" />
                        </Button>
                        {!isGuest && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <IconTrash className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document for a structure, investor, or asset
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              {uploadFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadFile.name}
                </p>
              )}
            </div>

            {/* Entity Type */}
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type *</Label>
              <Select
                value={uploadEntityType}
                onValueChange={(value: 'Structure' | 'Investor' | 'Investment') => {
                  setUploadEntityType(value)
                  setUploadEntityId('') // Reset entity ID when type changes
                }}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Structure">Structure</SelectItem>
                  <SelectItem value="Investor">Investor</SelectItem>
                  <SelectItem value="Investment">Asset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity Selection */}
            <div className="space-y-2">
              <Label htmlFor="entityId">
                {uploadEntityType === 'Structure' ? 'Structure' : uploadEntityType === 'Investor' ? 'Investor' : 'Asset'} *
              </Label>
              <Select
                value={uploadEntityId}
                onValueChange={setUploadEntityId}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${uploadEntityType.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {uploadEntityType === 'Structure' ? (
                    structures.map(structure => (
                      <SelectItem key={structure.id} value={structure.id}>
                        {structure.name}
                      </SelectItem>
                    ))
                  ) : uploadEntityType === 'Investor' ? (
                    investors.map(investor => (
                      <SelectItem key={investor.id} value={investor.id}>
                        {investor.name || `${investor.firstName || ''} ${investor.lastName || ''}`.trim() || investor.email}
                      </SelectItem>
                    ))
                  ) : (
                    investments.map(investment => (
                      <SelectItem key={investment.id} value={investment.id}>
                        {investment.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Document Name */}
            <div className="space-y-2">
              <Label htmlFor="documentName">Document Name</Label>
              <Input
                id="documentName"
                value={uploadDocumentName}
                onChange={(e) => setUploadDocumentName(e.target.value)}
                placeholder="Auto-filled from file name"
                disabled={isUploading}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="Comma-separated tags"
                disabled={isUploading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false)
                resetUploadForm()
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
