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
} from '@tabler/icons-react'
import {
  getInvestorByEmail,
  getCurrentInvestorEmail,
} from '@/lib/lp-portal-helpers'
import { getStructures } from '@/lib/structures-storage'

export default function LPDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStructure, setSelectedStructure] = useState<string>('all')
  const [investorStructures, setInvestorStructures] = useState<any[]>([])
  const [currentInvestorName, setCurrentInvestorName] = useState('')

  useEffect(() => {
    const email = getCurrentInvestorEmail()
    const investor = getInvestorByEmail(email)

    if (investor) {
      setCurrentInvestorName(investor.name)

      // Get all structures the investor is involved with (regardless of onboarding status)
      const allStructures = getStructures()
      const structures = investor.fundOwnerships.map(ownership => {
        const structure = allStructures.find(s => s.id === ownership.fundId)
        return structure ? {
          id: structure.id,
          name: ownership.fundName,
          type: structure.type,
        } : null
      }).filter(s => s !== null)

      setInvestorStructures(structures)
    }
  }, [])

  // Generate mock documents dynamically based on investor's structures
  const mockDocuments = React.useMemo(() => {
    const docs: any[] = []
    let docId = 1

    investorStructures.forEach((structure) => {
      // Structure Documents
      docs.push(
        {
          id: `${docId++}`,
          name: 'Q4 2024 Quarterly Report.pdf',
          type: 'Financial Report',
          category: 'Structure Documents',
          structureId: structure.id,
          structureName: structure.name,
          size: '2.4 MB',
          uploadedBy: 'Gabriela Mena',
          uploadedDate: '2024-12-15',
          fileType: 'pdf'
        },
        {
          id: `${docId++}`,
          name: 'Limited Partnership Agreement.pdf',
          type: 'Legal Document',
          category: 'Structure Documents',
          structureId: structure.id,
          structureName: structure.name,
          size: '5.1 MB',
          uploadedBy: 'Gabriela Mena',
          uploadedDate: '2024-01-10',
          fileType: 'pdf'
        },
        {
          id: `${docId++}`,
          name: 'Private Placement Memorandum.pdf',
          type: 'Legal Document',
          category: 'Structure Documents',
          structureId: structure.id,
          structureName: structure.name,
          size: '8.7 MB',
          uploadedBy: 'Gabriela Mena',
          uploadedDate: '2024-01-05',
          fileType: 'pdf'
        },
        {
          id: `${docId++}`,
          name: `NAV Report - October 2024.pdf`,
          type: 'Financial Report',
          category: 'Structure Documents',
          structureId: structure.id,
          structureName: structure.name,
          size: '1.8 MB',
          uploadedBy: 'Gabriela Mena',
          uploadedDate: '2024-11-01',
          fileType: 'pdf'
        }
      )

      // Investor Documents for current investor
      docs.push(
        {
          id: `${docId++}`,
          name: `K-1 Tax Form 2024 - ${currentInvestorName}.pdf`,
          type: 'Tax Document',
          category: 'My Documents',
          structureId: structure.id,
          structureName: structure.name,
          investorName: currentInvestorName,
          size: '145 KB',
          uploadedBy: 'System Generated',
          uploadedDate: '2024-03-15',
          fileType: 'pdf'
        },
        {
          id: `${docId++}`,
          name: `Subscription Agreement - ${currentInvestorName}.pdf`,
          type: 'Legal Document',
          category: 'My Documents',
          structureId: structure.id,
          structureName: structure.name,
          investorName: currentInvestorName,
          size: '892 KB',
          uploadedBy: currentInvestorName,
          uploadedDate: '2024-02-20',
          fileType: 'pdf'
        },
        {
          id: `${docId++}`,
          name: `Capital Call Notice #5 - ${currentInvestorName}.pdf`,
          type: 'Capital Call',
          category: 'My Documents',
          structureId: structure.id,
          structureName: structure.name,
          investorName: currentInvestorName,
          size: '234 KB',
          uploadedBy: 'Gabriela Mena',
          uploadedDate: '2024-11-01',
          fileType: 'pdf'
        },
        {
          id: `${docId++}`,
          name: `Distribution Notice #3 - ${currentInvestorName}.pdf`,
          type: 'Distribution',
          category: 'My Documents',
          structureId: structure.id,
          structureName: structure.name,
          investorName: currentInvestorName,
          size: '198 KB',
          uploadedBy: 'System Generated',
          uploadedDate: '2024-10-15',
          fileType: 'pdf'
        },
        {
          id: `${docId++}`,
          name: `KYC Documentation - ${currentInvestorName}.pdf`,
          type: 'Identity Verification',
          category: 'My Documents',
          structureId: structure.id,
          structureName: structure.name,
          investorName: currentInvestorName,
          size: '1.5 MB',
          uploadedBy: currentInvestorName,
          uploadedDate: '2024-02-15',
          fileType: 'pdf'
        }
      )
    })

    return docs
  }, [investorStructures, currentInvestorName])

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

  // Filter documents by investor's structures and current investor name
  const investorStructureIds = investorStructures.map(s => s.id)
  const availableDocuments = mockDocuments.filter(doc =>
    investorStructureIds.includes(doc.structureId) &&
    (doc.category === 'Structure Documents' || doc.investorName === currentInvestorName)
  )

  const filteredDocuments = availableDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStructure = selectedStructure === 'all' || doc.structureId === selectedStructure

    return matchesSearch && matchesStructure
  })

  const structureDocs = filteredDocuments.filter(doc => doc.category === 'Structure Documents')
  const myDocs = filteredDocuments.filter(doc => doc.category === 'My Documents')

  // Group structure documents by structure
  const structureDocsGrouped = structureDocs.reduce((acc, doc) => {
    if (!acc[doc.structureId]) {
      acc[doc.structureId] = {
        structureName: doc.structureName,
        documents: []
      }
    }
    acc[doc.structureId].documents.push(doc)
    return acc
  }, {} as Record<string, { structureName: string; documents: typeof mockDocuments }>)

  // Group investor documents by structure
  const myDocsGrouped = myDocs.reduce((acc, doc) => {
    if (!acc[doc.structureId]) {
      acc[doc.structureId] = {
        structureName: doc.structureName,
        documents: []
      }
    }
    acc[doc.structureId].documents.push(doc)
    return acc
  }, {} as Record<string, { structureName: string; documents: typeof mockDocuments }>)

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
            <CardTitle className="text-3xl">{availableDocuments.length}</CardTitle>
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
            <CardDescription>My Documents</CardDescription>
            <CardTitle className="text-3xl">{myDocs.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <SelectValue placeholder="All Funds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {investorStructures.map(structure => (
                  <SelectItem key={structure.id} value={structure.id}>
                    {structure.name}
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
            Structure Documents ({structureDocs.length})
          </TabsTrigger>
          <TabsTrigger value="personal">
            <IconUser className="w-4 h-4 mr-2" />
            My Documents ({myDocs.length})
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
                              {getFileIcon(doc.fileType)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">{doc.name}</p>
                                  <Badge variant="outline" className="text-xs">
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
              {Object.keys(myDocsGrouped).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <IconUser className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No personal documents found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete onboarding to receive your investor documents
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(myDocsGrouped).map(([structureId, data]) => (
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
                              {getFileIcon(doc.fileType)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">{doc.name}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {doc.type}
                                  </Badge>
                                  {doc.status === 'pending' && (
                                    <Badge variant="secondary" className="text-xs">
                                      Pending Signature
                                    </Badge>
                                  )}
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
