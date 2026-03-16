'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { IconPlus, IconEdit, IconTrash, IconFileText, IconCheck, IconX, IconExternalLink } from '@tabler/icons-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getStructures } from '@/lib/structures-storage'

// Contract Template Interface
interface ContractTemplate {
  id: string
  name: string
  docusealUrl: string
  templateType: 'subscription' | 'lpa' | 'side-letter' | 'other'
  jurisdiction: string
  category: 'investor' | 'fund' | 'general'
  status: 'active' | 'inactive' | 'draft'
  createdAt: string
  updatedAt: string
}

// Structure Assignment Interface
interface StructureAssignment {
  id: string
  structureId: string
  structureName: string
  templateId: string
  templateName: string
  triggerPoint: 'pre_payment' | 'post_payment' | 'post_closing' | 'on_demand'
  required: boolean
  blocking: boolean
  assignedAt: string
}

// Countersignature Interface
interface Countersignature {
  id: string
  investorName: string
  contractName: string
  structureName: string
  signedAt: string
  status: 'pending' | 'approved' | 'rejected'
  documentUrl: string
}

export default function DocumentContractsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'templates' | 'assignments' | 'countersignatures'>('templates')

  // Templates State
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    docusealUrl: '',
    templateType: 'subscription' as ContractTemplate['templateType'],
    jurisdiction: 'United States',
    category: 'investor' as ContractTemplate['category'],
    status: 'active' as ContractTemplate['status'],
  })

  // Assignments State
  const [assignments, setAssignments] = useState<StructureAssignment[]>([])
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)
  const [structures, setStructures] = useState<any[]>([])
  const [assignmentForm, setAssignmentForm] = useState({
    structureId: '',
    templateId: '',
    triggerPoint: 'post_payment' as StructureAssignment['triggerPoint'],
    required: true,
    blocking: true,
  })

  // Countersignatures State
  const [countersignatures, setCountersignatures] = useState<Countersignature[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // Load structures
    setStructures(getStructures())

    // Load templates from localStorage (mock data for now)
    const storedTemplates = localStorage.getItem('contract_templates')
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates))
    } else {
      // Initialize with sample data
      const sampleTemplates: ContractTemplate[] = [
        {
          id: '1',
          name: 'Standard Subscription Agreement',
          docusealUrl: 'https://docuseal.co/templates/example-1',
          templateType: 'subscription',
          jurisdiction: 'United States',
          category: 'investor',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      setTemplates(sampleTemplates)
      localStorage.setItem('contract_templates', JSON.stringify(sampleTemplates))
    }

    // Load assignments
    const storedAssignments = localStorage.getItem('contract_assignments')
    if (storedAssignments) {
      setAssignments(JSON.parse(storedAssignments))
    }

    // Load countersignatures
    const storedCountersignatures = localStorage.getItem('contract_countersignatures')
    if (storedCountersignatures) {
      setCountersignatures(JSON.parse(storedCountersignatures))
    }
  }

  // Template CRUD Operations
  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.docusealUrl) {
      toast.error('Please fill in all required fields')
      return
    }

    if (editingTemplate) {
      // Update existing template
      const updated = templates.map(t =>
        t.id === editingTemplate.id
          ? { ...t, ...templateForm, updatedAt: new Date().toISOString() }
          : t
      )
      setTemplates(updated)
      localStorage.setItem('contract_templates', JSON.stringify(updated))
      toast.success('Template updated successfully')
    } else {
      // Create new template
      const newTemplate: ContractTemplate = {
        id: Date.now().toString(),
        ...templateForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const updated = [...templates, newTemplate]
      setTemplates(updated)
      localStorage.setItem('contract_templates', JSON.stringify(updated))
      toast.success('Template created successfully')
    }

    setShowTemplateDialog(false)
    resetTemplateForm()
  }

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id)
    setTemplates(updated)
    localStorage.setItem('contract_templates', JSON.stringify(updated))
    toast.success('Template deleted successfully')
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      name: '',
      docusealUrl: '',
      templateType: 'subscription',
      jurisdiction: 'United States',
      category: 'investor',
      status: 'active',
    })
    setEditingTemplate(null)
  }

  // Assignment Operations
  const handleSaveAssignment = () => {
    if (!assignmentForm.structureId || !assignmentForm.templateId) {
      toast.error('Please select both structure and template')
      return
    }

    const structure = structures.find(s => s.id === assignmentForm.structureId)
    const template = templates.find(t => t.id === assignmentForm.templateId)

    if (!structure || !template) {
      toast.error('Invalid structure or template')
      return
    }

    const newAssignment: StructureAssignment = {
      id: Date.now().toString(),
      structureId: assignmentForm.structureId,
      structureName: structure.name,
      templateId: assignmentForm.templateId,
      templateName: template.name,
      triggerPoint: assignmentForm.triggerPoint,
      required: assignmentForm.required,
      blocking: assignmentForm.blocking,
      assignedAt: new Date().toISOString(),
    }

    const updated = [...assignments, newAssignment]
    setAssignments(updated)
    localStorage.setItem('contract_assignments', JSON.stringify(updated))
    toast.success('Contract assigned to structure successfully')

    setShowAssignmentDialog(false)
    setAssignmentForm({
      structureId: '',
      templateId: '',
      triggerPoint: 'post_payment',
      required: true,
      blocking: true,
    })
  }

  const handleDeleteAssignment = (id: string) => {
    const updated = assignments.filter(a => a.id !== id)
    setAssignments(updated)
    localStorage.setItem('contract_assignments', JSON.stringify(updated))
    toast.success('Assignment removed successfully')
  }

  // Countersignature Operations
  const handleApproveCountersignature = (id: string) => {
    const updated = countersignatures.map(c =>
      c.id === id ? { ...c, status: 'approved' as const } : c
    )
    setCountersignatures(updated)
    localStorage.setItem('contract_countersignatures', JSON.stringify(updated))
    toast.success('Countersignature approved')
  }

  const handleRejectCountersignature = (id: string) => {
    const updated = countersignatures.map(c =>
      c.id === id ? { ...c, status: 'rejected' as const } : c
    )
    setCountersignatures(updated)
    localStorage.setItem('contract_countersignatures', JSON.stringify(updated))
    toast.success('Countersignature rejected')
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      draft: 'outline',
      pending: 'outline',
      approved: 'default',
      rejected: 'destructive',
    }
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>
  }

  const getTriggerPointLabel = (triggerPoint: string) => {
    const labels: Record<string, string> = {
      pre_payment: 'Pre-Payment',
      post_payment: 'Post-Payment',
      post_closing: 'Post-Closing',
      on_demand: 'On Demand',
    }
    return labels[triggerPoint] || triggerPoint
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contract Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage contract templates, structure assignments, and countersignatures
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="assignments">Structure Assignments ({assignments.length})</TabsTrigger>
          <TabsTrigger value="countersignatures">Countersignatures ({countersignatures.filter(c => c.status === 'pending').length})</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              resetTemplateForm()
              setShowTemplateDialog(true)
            }}>
              <IconPlus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <IconFileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Templates</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get started by creating your first contract template
                  </p>
                  <Button onClick={() => setShowTemplateDialog(true)}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell className="capitalize">{template.templateType}</TableCell>
                        <TableCell>{template.jurisdiction}</TableCell>
                        <TableCell className="capitalize">{template.category}</TableCell>
                        <TableCell>{getStatusBadge(template.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(template.docusealUrl, '_blank')}
                            >
                              <IconExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTemplate(template)
                                setTemplateForm({
                                  name: template.name,
                                  docusealUrl: template.docusealUrl,
                                  templateType: template.templateType,
                                  jurisdiction: template.jurisdiction,
                                  category: template.category,
                                  status: template.status,
                                })
                                setShowTemplateDialog(true)
                              }}
                            >
                              <IconEdit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <IconTrash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAssignmentDialog(true)}>
              <IconPlus className="w-4 h-4 mr-2" />
              Assign Contract
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <IconFileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Assign contracts to structures to automate the signing workflow
                  </p>
                  <Button onClick={() => setShowAssignmentDialog(true)}>
                    <IconPlus className="w-4 h-4 mr-2" />
                    Assign Contract
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Structure</TableHead>
                      <TableHead>Contract Template</TableHead>
                      <TableHead>Trigger Point</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Blocking</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.structureName}</TableCell>
                        <TableCell>{assignment.templateName}</TableCell>
                        <TableCell>{getTriggerPointLabel(assignment.triggerPoint)}</TableCell>
                        <TableCell>
                          {assignment.required ? (
                            <Badge variant="default">Required</Badge>
                          ) : (
                            <Badge variant="secondary">Optional</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignment.blocking ? (
                            <Badge variant="destructive">Blocking</Badge>
                          ) : (
                            <Badge variant="outline">Non-blocking</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <IconTrash className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Countersignatures Tab */}
        <TabsContent value="countersignatures" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              {countersignatures.length === 0 ? (
                <div className="text-center py-12">
                  <IconFileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Countersignatures</h3>
                  <p className="text-sm text-muted-foreground">
                    Investor signatures requiring countersignature will appear here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Investor</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Structure</TableHead>
                      <TableHead>Signed At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countersignatures.map((sig) => (
                      <TableRow key={sig.id}>
                        <TableCell className="font-medium">{sig.investorName}</TableCell>
                        <TableCell>{sig.contractName}</TableCell>
                        <TableCell>{sig.structureName}</TableCell>
                        <TableCell>{new Date(sig.signedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(sig.status)}</TableCell>
                        <TableCell className="text-right">
                          {sig.status === 'pending' && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(sig.documentUrl, '_blank')}
                              >
                                <IconExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveCountersignature(sig.id)}
                              >
                                <IconCheck className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectCountersignature(sig.id)}
                              >
                                <IconX className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? 'Update contract template details' : 'Create a new contract template'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="e.g., Standard Subscription Agreement"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docusealUrl">DocuSeal Template URL *</Label>
              <Input
                id="docusealUrl"
                value={templateForm.docusealUrl}
                onChange={(e) => setTemplateForm({ ...templateForm, docusealUrl: e.target.value })}
                placeholder="https://docuseal.co/templates/..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateType">Template Type</Label>
                <Select
                  value={templateForm.templateType}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, templateType: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="lpa">LPA</SelectItem>
                    <SelectItem value="side-letter">Side Letter</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={templateForm.category}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, category: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investor">Investor</SelectItem>
                    <SelectItem value="fund">Fund</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jurisdiction">Jurisdiction</Label>
                <Select
                  value={templateForm.jurisdiction}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, jurisdiction: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Mexico">Mexico</SelectItem>
                    <SelectItem value="Panama">Panama</SelectItem>
                    <SelectItem value="Cayman Islands">Cayman Islands</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={templateForm.status}
                  onValueChange={(value) => setTemplateForm({ ...templateForm, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Contract to Structure</DialogTitle>
            <DialogDescription>
              Select a structure and contract template to create an assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="structure">Structure *</Label>
              <Select
                value={assignmentForm.structureId}
                onValueChange={(value) => setAssignmentForm({ ...assignmentForm, structureId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select structure" />
                </SelectTrigger>
                <SelectContent>
                  {structures.map((structure) => (
                    <SelectItem key={structure.id} value={structure.id}>
                      {structure.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template">Contract Template *</Label>
              <Select
                value={assignmentForm.templateId}
                onValueChange={(value) => setAssignmentForm({ ...assignmentForm, templateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.status === 'active').map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="triggerPoint">Trigger Point *</Label>
              <Select
                value={assignmentForm.triggerPoint}
                onValueChange={(value) => setAssignmentForm({ ...assignmentForm, triggerPoint: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_payment">Pre-Payment</SelectItem>
                  <SelectItem value="post_payment">Post-Payment</SelectItem>
                  <SelectItem value="post_closing">Post-Closing</SelectItem>
                  <SelectItem value="on_demand">On Demand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={assignmentForm.required}
                  onCheckedChange={(checked) => setAssignmentForm({ ...assignmentForm, required: checked as boolean })}
                />
                <div>
                  <Label htmlFor="required" className="cursor-pointer">Required</Label>
                  <p className="text-xs text-muted-foreground">Investor must sign this contract</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="blocking"
                  checked={assignmentForm.blocking}
                  onCheckedChange={(checked) => setAssignmentForm({ ...assignmentForm, blocking: checked as boolean })}
                />
                <div>
                  <Label htmlFor="blocking" className="cursor-pointer">Blocking</Label>
                  <p className="text-xs text-muted-foreground">Block checkout until signed</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignment}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
