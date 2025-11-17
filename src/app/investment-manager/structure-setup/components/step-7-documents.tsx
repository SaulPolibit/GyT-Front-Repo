"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Trash2, CheckCircle } from "lucide-react"

interface DocumentEntry {
  type: string
  file: File | null
  uploadDate: string
}

interface Step7Props {
  data: DocumentEntry[]
  onAdd: (doc: DocumentEntry) => void
}

export function Step7Documents({ data, onAdd }: Step7Props) {
  const [selectedType, setSelectedType] = useState<string>("PPM")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const documentTypes = [
    { value: "PPM", label: "Private Placement Memorandum (PPM)", required: true },
    { value: "LPA", label: "Limited Partnership Agreement (LPA)", required: true },
    { value: "Subscription", label: "Subscription Agreement Template", required: true },
    { value: "Operating", label: "Operating Agreement", required: false },
    { value: "Side Letter", label: "Side Letter Template", required: false },
    { value: "Tax", label: "Tax Documents", required: false },
    { value: "Compliance", label: "Compliance & Regulatory Documents", required: false },
    { value: "Other", label: "Other Fund Documents", required: false },
  ]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = () => {
    if (!selectedFile || !selectedType) return

    onAdd({
      type: selectedType,
      file: selectedFile,
      uploadDate: new Date().toISOString(),
    })

    // Reset form
    setSelectedFile(null)
    const fileInput = document.getElementById("documentFile") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const getDocumentTypeLabel = (type: string) => {
    return documentTypes.find((dt) => dt.value === type)?.label || type
  }

  const isDocumentTypeUploaded = (type: string) => {
    return data.some((doc) => doc.type === type)
  }

  const requiredDocuments = documentTypes.filter((dt) => dt.required)
  const uploadedRequiredCount = requiredDocuments.filter((dt) =>
    isDocumentTypeUploaded(dt.value)
  ).length

  return (
    <div className="space-y-6">
      {/* Upload Progress */}
      <Card className={uploadedRequiredCount === requiredDocuments.length ? "bg-green-500/5 border-green-500/50" : "bg-primary/5 border-primary/20"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Required Documents Progress</span>
            <Badge variant={uploadedRequiredCount === requiredDocuments.length ? "default" : "secondary"}>
              {uploadedRequiredCount} / {requiredDocuments.length}
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                uploadedRequiredCount === requiredDocuments.length ? "bg-green-600" : "bg-primary"
              }`}
              style={{
                width: `${(uploadedRequiredCount / requiredDocuments.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {uploadedRequiredCount === requiredDocuments.length
              ? "All required documents uploaded"
              : `${requiredDocuments.length - uploadedRequiredCount} required document(s) remaining`}
          </p>
        </CardContent>
      </Card>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Fund Documents
          </CardTitle>
          <CardDescription>
            Upload legal and operational documents for your fund
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger id="documentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((docType) => (
                  <SelectItem key={docType.value} value={docType.value}>
                    <div className="flex items-center gap-2">
                      {isDocumentTypeUploaded(docType.value) && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <span>{docType.label}</span>
                      {docType.required && (
                        <Badge variant="destructive" className="ml-2">
                          Required
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentFile">Select File</Label>
            <Input
              id="documentFile"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}
          </div>

          <Button onClick={handleUpload} disabled={!selectedFile} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </CardContent>
      </Card>

      {/* Document Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Document Checklist</CardTitle>
          <CardDescription>Required and optional fund documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documentTypes.map((docType) => {
              const isUploaded = isDocumentTypeUploaded(docType.value)
              return (
                <div
                  key={docType.value}
                  className={`flex items-center justify-between p-3 rounded ${
                    isUploaded ? "bg-green-500/10" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isUploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{docType.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {isUploaded ? "Uploaded" : "Not uploaded"}
                      </div>
                    </div>
                  </div>
                  {docType.required && !isUploaded && (
                    <Badge variant="destructive">Required</Badge>
                  )}
                  {!docType.required && <Badge variant="secondary">Optional</Badge>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      {data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents ({data.length})</CardTitle>
            <CardDescription>Documents ready for your fund</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium text-sm">{getDocumentTypeLabel(doc.type)}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc.file?.name || "Unknown file"} •{" "}
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <div className="bg-primary/5 border-l-4 border-primary p-4 rounded">
        <h4 className="font-semibold mb-2">Document requirements</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • <strong>Required documents</strong> (PPM, LPA, Subscription Agreement) are needed to
            complete onboarding
          </li>
          <li>
            • <strong>Accepted formats:</strong> PDF, DOC, DOCX
          </li>
          <li>
            • <strong>Security:</strong> All documents are encrypted and stored securely
          </li>
          <li>
            • <strong>Optional documents</strong> can be uploaded later from your dashboard
          </li>
        </ul>
      </div>
    </div>
  )
}
