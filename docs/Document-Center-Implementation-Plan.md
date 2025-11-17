# Document Center Implementation Plan

**Last Updated:** November 2025
**Status:** Pending Implementation

---

## Current State Analysis

### What's Working (UI)
- Clean interface with 4 metric cards (Total, Structure Docs, Investor Docs, Active Structures)
- Filter section with search and 3 dropdowns (Structures, Investors, Categories)
- Two tabs: Structure Documents (4) and Investor Documents (4)
- Document list showing 4 items with metadata (name, type badge, fund, size, date, uploader)
- Action buttons per document (view, download, delete)

### What's Static/Dummy
- All document data is hardcoded
- No actual file storage/upload
- Filters don't work
- Actions (view/download/delete) are non-functional

---

## Implementation Strategy

### 1. Data Storage Layer

**File:** `/src/lib/documents-storage.ts`

**Data Structure:**
```typescript
interface Document {
  id: string
  name: string
  type: 'Financial Report' | 'Legal Document' | 'Investor Document' | 'KYC/AML' | 'Tax Document' | 'Other'
  category: string // For the badge
  fileSize: number // in bytes
  uploadDate: string
  uploadedBy: string

  // Association
  structureId?: string // If structure document
  investorId?: string // If investor document

  // File reference
  fileUrl?: string // Could be base64, blob URL, or external storage URL
  fileType: string // 'pdf', 'xlsx', 'docx', etc.

  // Metadata
  description?: string
  tags?: string[]
  isPublic?: boolean // For investor portal access
}
```

**CRUD Functions:**
- `getDocuments(): Document[]`
- `getDocumentById(id: string): Document | null`
- `getDocumentsByStructureId(structureId: string): Document[]`
- `getDocumentsByInvestorId(investorId: string): Document[]`
- `uploadDocument(document: Omit<Document, 'id'>): Document`
- `updateDocument(id: string, updates: Partial<Document>): Document | null`
- `deleteDocument(id: string): boolean`
- `searchDocuments(query: string, filters: Filters): Document[]`

---

### 2. File Upload Strategy

#### Option A: Base64 in localStorage (Simple, Demo-friendly)
- Convert uploaded files to base64 strings
- Store directly in localStorage with document metadata
- **Pros**: No backend needed, works immediately
- **Cons**: localStorage 5-10MB limit, not scalable
- **Best for**: Demo/prototype with <5 documents

#### Option B: File API + IndexedDB (Better)
- Use browser's File API to handle uploads
- Store files in IndexedDB (supports larger files)
- Store metadata in localStorage
- **Pros**: Can handle larger files (50MB+), still no backend
- **Cons**: More complex implementation
- **Best for**: Production-ready demo

#### Option C: External Storage (Future)
- Upload to S3/Cloudinary/similar
- Store URL reference in localStorage
- **Pros**: Scalable, production-ready
- **Cons**: Requires backend/API keys
- **Best for**: Real production deployment

**Recommendation**: Start with **Option A** (base64) for immediate functionality, migrate to Option B later.

---

### 3. Upload Document Modal

**Component:** `/src/components/upload-document-modal.tsx`

**Form Fields:**
1. **File Upload** (drag-and-drop or click to browse)
2. **Document Name** (auto-fill from filename, editable)
3. **Document Type** (dropdown: Financial Report, Legal Document, etc.)
4. **Association Type** (radio: Structure Document or Investor Document)
5. **Select Structure** (dropdown, shown if Structure Document selected)
6. **Select Investor** (dropdown, shown if Investor Document selected)
7. **Description** (optional textarea)
8. **Tags** (optional, multi-select or comma-separated)
9. **Investor Access** (checkbox: "Make available in Investor Portal")

**Validation:**
- File size limit (e.g., 10MB for localStorage approach)
- Allowed file types (PDF, XLSX, DOCX, PNG, JPG)
- Required: name, type, file, association

**Upload Flow:**
1. User selects file
2. Convert to base64 (if using Option A)
3. Extract metadata (size, type, name)
4. User fills form
5. Click "Upload" → Save to localStorage
6. Refresh document list

---

### 4. Filtering & Search

**Search Bar:**
- Filter by document name (case-insensitive)
- Search through description and tags
- Real-time filtering as user types

**Structure Dropdown:**
- "All Structures" (default)
- List all structures from structures-storage
- Filter to show only documents with matching `structureId`

**Investor Dropdown:**
- "All Investors" (default)
- List all investors from investors-storage
- Filter to show only documents with matching `investorId`

**Category Dropdown:**
- "All Categories" (default)
- Financial Report, Legal Document, Tax Document, etc.
- Filter by `type` field

**Combined Filtering:**
- Apply all active filters simultaneously
- Update document count in real-time

---

### 5. Tabs Implementation

**Structure Documents Tab:**
- Show documents where `structureId` is set
- Group by structure (optional: collapsible sections)
- Count: number of structure documents

**Investor Documents Tab:**
- Show documents where `investorId` is set
- Group by investor (optional: collapsible sections)
- Count: number of investor documents

**State Management:**
```typescript
const [activeTab, setActiveTab] = useState<'structure' | 'investor'>('structure')
const filteredDocs = documents.filter(doc =>
  activeTab === 'structure' ? doc.structureId : doc.investorId
)
```

---

### 6. Document Actions

#### View/Preview (Eye Icon)
- **For PDFs**: Open in modal with `<embed>` or `<iframe>` tag using base64 data URL
- **For Images**: Display in modal
- **For Excel/Word**: Show "Download to view" message (can't preview in browser easily)

#### Download (Download Icon)
```typescript
const handleDownload = (doc: Document) => {
  const link = document.createElement('a')
  link.href = doc.fileUrl // base64 data URL
  link.download = doc.name
  link.click()
}
```

#### Delete (Trash Icon)
- Show confirmation dialog
- Delete from localStorage
- Refresh list
- Update counts

---

### 7. Metric Cards Updates

Calculate dynamically from actual data:

```typescript
const totalDocuments = documents.length
const structureDocuments = documents.filter(d => d.structureId).length
const investorDocuments = documents.filter(d => d.investorId).length
const activeStructures = getStructures().length // from structures-storage
```

---

### 8. Integration Points

#### Link from Structure Detail Page
- Add "Documents" section showing structure's documents
- "View All Documents" button → navigates to Document Center with structure filter pre-applied

#### Link from Investor Detail Page
- Add "Documents" section showing investor's documents
- Upload button to add investor-specific docs
- "View All Documents" button → navigates to Document Center with investor filter pre-applied

#### Document Upload in Context
- When viewing a structure, "Upload Document" should pre-select that structure
- When viewing an investor, "Upload Document" should pre-select that investor

---

### 9. File Organization

```
src/
├── lib/
│   ├── documents-storage.ts          # Core storage logic
│   └── file-utils.ts                 # File conversion (base64, size formatting)
├── components/
│   ├── upload-document-modal.tsx     # Upload dialog
│   ├── document-preview-modal.tsx    # Preview dialog
│   └── document-list-item.tsx        # Individual document row
└── app/
    └── investment-manager/
        └── documents/
            └── page.tsx               # Document Center page
```

---

### 10. Challenges & Considerations

#### localStorage Size Limits
- Typical limit: 5-10MB total across all data
- Current data (structures, investors, investments) likely using 1-2MB
- **Solution**: Limit file uploads to 1-2MB each, max 5-10 files
- **Alternative**: Migrate to IndexedDB for larger capacity

#### File Type Support
- PDFs: Can preview with `<embed>` tag
- Images: Easy to display
- Excel/Word: Cannot preview in browser (download only)
- **Solution**: Show appropriate UI based on file type

#### Real File Storage
- Current approach stores entire file in localStorage
- Not suitable for production at scale
- **Future**: Migrate to cloud storage (S3, Cloudinary) with backend API

#### Search Performance
- Linear search through all documents
- Fine for <100 documents
- **Future**: Consider client-side search library (Fuse.js) for better UX

---

## Recommended Implementation Order

### Phase 1 - Basic Storage (1-2 hours)
- Create `documents-storage.ts` with CRUD functions
- Seed with 4-5 sample documents
- Display real data in Document Center

### Phase 2 - Upload (2-3 hours)
- Create upload modal component
- Implement file-to-base64 conversion
- Handle file size validation
- Save uploaded documents to localStorage

### Phase 3 - Filtering (1-2 hours)
- Implement search bar functionality
- Wire up structure/investor/category dropdowns
- Apply combined filtering logic

### Phase 4 - Actions (2-3 hours)
- Implement download functionality
- Implement delete with confirmation
- Implement preview modal (PDF/images only)

### Phase 5 - Tabs (1 hour)
- Implement tab switching
- Filter documents by type
- Update counts dynamically

### Phase 6 - Integration (2 hours)
- Add document sections to Structure detail page
- Add document sections to Investor detail page
- Pre-fill upload modal when triggered from these pages

---

## Effort Estimates

**Total effort**: 8-12 hours for fully functional demo version

**Key decision**: Choose file storage approach (base64 vs IndexedDB vs cloud) based on:
- Demo vs production needs
- Expected file sizes
- Number of documents

---

## Next Steps

1. Review and approve implementation plan
2. Choose file storage approach (Option A, B, or C)
3. Begin Phase 1 implementation
4. Test with sample documents
5. Iterate based on feedback

---

**End of Document**
