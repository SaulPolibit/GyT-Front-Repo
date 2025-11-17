'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  IconFilter
} from '@tabler/icons-react'
import { getStructures } from '@/lib/structures-storage'
import { getInvestors } from '@/lib/investors-storage'

const mockDocuments = [
  {
    id: '1',
    name: 'Q4 2024 Quarterly Report.pdf',
    type: 'Financial Report',
    category: 'Structure Documents',
    structureId: '1',
    structureName: 'Vanguard Real Estate Fund I',
    size: '2.4 MB',
    uploadedBy: 'Gabriela Mena',
    uploadedDate: '2024-12-15',
    fileType: 'pdf'
  },
  {
    id: '2',
    name: 'Limited Partnership Agreement.pdf',
    type: 'Legal Document',
    category: 'Structure Documents',
    structureId: '1',
    structureName: 'Vanguard Real Estate Fund I',
    size: '5.1 MB',
    uploadedBy: 'Gabriela Mena',
    uploadedDate: '2024-01-10',
    fileType: 'pdf'
  },
  {
    id: '3',
    name: 'Private Placement Memorandum.pdf',
    type: 'Legal Document',
    category: 'Structure Documents',
    structureId: '1',
    structureName: 'Vanguard Real Estate Fund I',
    size: '8.7 MB',
    uploadedBy: 'Gabriela Mena',
    uploadedDate: '2024-01-05',
    fileType: 'pdf'
  },
  {
    id: '4',
    name: 'K-1 Tax Form 2024 - John Smith.pdf',
    type: 'Tax Document',
    category: 'Investor Documents',
    structureId: '1',
    structureName: 'Vanguard Real Estate Fund I',
    investorId: '1',
    investorName: 'John Smith',
    size: '145 KB',
    uploadedBy: 'System Generated',
    uploadedDate: '2024-03-15',
    fileType: 'pdf'
  },
  {
    id: '5',
    name: 'Subscription Agreement - Maria Garcia.pdf',
    type: 'Legal Document',
    category: 'Investor Documents',
    structureId: '1',
    structureName: 'Vanguard Real Estate Fund I',
    investorId: '2',
    investorName: 'Maria Garcia',
    size: '892 KB',
    uploadedBy: 'Maria Garcia',
    uploadedDate: '2024-02-20',
    fileType: 'pdf'
  },
  {
    id: '6',
    name: 'Capital Call Notice #5.pdf',
    type: 'Capital Call',
    category: 'Investor Documents',
    structureId: '1',
    structureName: 'Vanguard Real Estate Fund I',
    investorId: '1',
    investorName: 'John Smith',
    size: '234 KB',
    uploadedBy: 'Gabriela Mena',
    uploadedDate: '2024-11-01',
    fileType: 'pdf'
  },
  {
    id: '7',
    name: 'Distribution Notice #3.pdf',
    type: 'Distribution',
    category: 'Investor Documents',
    structureId: '1',
    structureName: 'Vanguard Real Estate Fund I',
    investorId: '2',
    investorName: 'Maria Garcia',
    size: '198 KB',
    uploadedBy: 'System Generated',
    uploadedDate: '2024-10-15',
    fileType: 'pdf'
  },
  {
    id: '8',
    name: 'Annual Financial Statements 2024.xlsx',
    type: 'Financial Report',
    category: 'Structure Documents',
    structureId: '2',
    structureName: 'Tech Growth SPV',
    size: '1.2 MB',
    uploadedBy: 'Gabriela Mena',
    uploadedDate: '2024-12-20',
    fileType: 'excel'
  },
]

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStructure, setSelectedStructure] = useState<string>('all')
  const [selectedInvestor, setSelectedInvestor] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [structures, setStructures] = useState<any[]>([])
  const [investors, setInvestors] = useState<any[]>([])

  useEffect(() => {
    setStructures(getStructures())
    setInvestors(getInvestors())
  }, [])

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <IconFileTypePdf className="w-8 h-8 text-red-500" />
      case 'excel':
        return <IconFileSpreadsheet className="w-8 h-8 text-green-600" />
      case 'word':
        return <IconFileTypeDoc className="w-8 h-8 text-blue-600" />
      default:
        return <IconFileDescription className="w-8 h-8 text-muted-foreground" />
    }
  }

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStructure = selectedStructure === 'all' || doc.structureId === selectedStructure
    const matchesInvestor = selectedInvestor === 'all' || doc.investorId === selectedInvestor
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory

    return matchesSearch && matchesStructure && matchesInvestor && matchesCategory
  })

  const structureDocs = filteredDocuments.filter(doc => doc.category === 'Structure Documents')
  const investorDocs = filteredDocuments.filter(doc => doc.category === 'Investor Documents')

  // Group investor documents by investor
  const investorDocsGrouped = investorDocs.reduce((acc, doc) => {
    if (!doc.investorId) return acc
    if (!acc[doc.investorId]) {
      acc[doc.investorId] = {
        investorName: doc.investorName || '',
        structureName: doc.structureName,
        documents: []
      }
    }
    acc[doc.investorId].documents.push(doc)
    return acc
  }, {} as Record<string, { investorName: string; structureName: string; documents: typeof mockDocuments }>)

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
        <Button>
          <IconUpload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">{mockDocuments.length}</CardTitle>
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
            <CardDescription>Active Structures</CardDescription>
            <CardTitle className="text-3xl">{structures.length}</CardTitle>
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
                {investors
                  .filter(inv => selectedStructure === 'all' || inv.fundOwnerships?.[0]?.fundId === selectedStructure)
                  .map(investor => (
                    <SelectItem key={investor.id} value={investor.id}>
                      {investor.name}
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
                        {getFileIcon(doc.fileType)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{doc.name}</p>
                            <Badge variant="outline">{doc.type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <IconBuilding className="w-3 h-3" />
                              {doc.structureName}
                            </span>
                            <span>{doc.size}</span>
                            <span className="flex items-center gap-1">
                              <IconCalendar className="w-3 h-3" />
                              {new Date(doc.uploadedDate).toLocaleDateString()}
                            </span>
                            <span>by {doc.uploadedBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <IconEye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <IconDownload className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <IconTrash className="w-4 h-4" />
                        </Button>
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
                            {data.structureName} • {data.documents.length} documents
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
                              {getFileIcon(doc.fileType)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">{doc.name}</p>
                                  <Badge variant="secondary" className="text-xs">
                                    {doc.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{doc.size}</span>
                                  <span className="flex items-center gap-1">
                                    <IconCalendar className="w-3 h-3" />
                                    {new Date(doc.uploadedDate).toLocaleDateString()}
                                  </span>
                                  <span>by {doc.uploadedBy}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm">
                                <IconEye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <IconDownload className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <IconTrash className="w-4 h-4" />
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
