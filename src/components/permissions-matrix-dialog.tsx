"use client"

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IconCheck, IconX } from '@tabler/icons-react'
import { getPermissionsForRole } from '@/lib/user-management-storage'

interface PermissionsMatrixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CheckIcon = () => <IconCheck className="h-4 w-4 text-green-600 mx-auto" />
const XIcon = () => <IconX className="h-4 w-4 text-red-600 mx-auto" />

export function PermissionsMatrixDialog({ open, onOpenChange }: PermissionsMatrixDialogProps) {
  const adminPerms = getPermissionsForRole('admin')
  const fmPerms = getPermissionsForRole('fund-manager')
  const opsPerms = getPermissionsForRole('operations')
  const roPerms = getPermissionsForRole('read-only')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Role Permissions Matrix</DialogTitle>
          <DialogDescription>
            Each role has specific permissions. For example, only Admins can modify settings,
            but both Admins and Fund Managers can create new structures.
          </DialogDescription>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Feature/Action</TableHead>
              <TableHead className="text-center">Admin</TableHead>
              <TableHead className="text-center">Fund Manager</TableHead>
              <TableHead className="text-center">Operations</TableHead>
              <TableHead className="text-center">Read-Only</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Structures */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={5} className="font-semibold">Structures</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>View Structures</TableCell>
              <TableCell className="text-center">{adminPerms.viewStructures ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.viewStructures ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.viewStructures ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.viewStructures ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Create Structure</TableCell>
              <TableCell className="text-center">{adminPerms.createStructure ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.createStructure ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.createStructure ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.createStructure ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Edit Structure</TableCell>
              <TableCell className="text-center">{adminPerms.editStructure ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.editStructure ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.editStructure ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.editStructure ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Delete Structure</TableCell>
              <TableCell className="text-center">{adminPerms.deleteStructure ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.deleteStructure ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.deleteStructure ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.deleteStructure ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>

            {/* Investors */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={5} className="font-semibold">Investors</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>View Investors</TableCell>
              <TableCell className="text-center">{adminPerms.viewInvestors ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.viewInvestors ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.viewInvestors ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.viewInvestors ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Add Investor</TableCell>
              <TableCell className="text-center">{adminPerms.addInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.addInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.addInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.addInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Edit Investor</TableCell>
              <TableCell className="text-center">{adminPerms.editInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.editInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.editInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.editInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Delete Investor</TableCell>
              <TableCell className="text-center">{adminPerms.deleteInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.deleteInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.deleteInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.deleteInvestor ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>

            {/* Investments */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={5} className="font-semibold">Investments</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>View Investments</TableCell>
              <TableCell className="text-center">{adminPerms.viewInvestments ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.viewInvestments ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.viewInvestments ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.viewInvestments ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Add Investment</TableCell>
              <TableCell className="text-center">{adminPerms.addInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.addInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.addInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.addInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Edit Investment</TableCell>
              <TableCell className="text-center">{adminPerms.editInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.editInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.editInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.editInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Delete Investment</TableCell>
              <TableCell className="text-center">{adminPerms.deleteInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.deleteInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.deleteInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.deleteInvestment ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>

            {/* Capital Operations */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={5} className="font-semibold">Capital Operations</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Issue Capital Call</TableCell>
              <TableCell className="text-center">{adminPerms.issueCapitalCall ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.issueCapitalCall ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.issueCapitalCall ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.issueCapitalCall ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Execute Distribution</TableCell>
              <TableCell className="text-center">{adminPerms.executeDistribution ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.executeDistribution ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.executeDistribution ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.executeDistribution ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>

            {/* Reports */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={5} className="font-semibold">Reports</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Generate Reports</TableCell>
              <TableCell className="text-center">{adminPerms.generateReports ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.generateReports ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.generateReports ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.generateReports ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>View Reports</TableCell>
              <TableCell className="text-center">{adminPerms.viewReports ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.viewReports ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.viewReports ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.viewReports ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>

            {/* Documents */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={5} className="font-semibold">Documents</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>View Documents</TableCell>
              <TableCell className="text-center">{adminPerms.viewDocuments ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.viewDocuments ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.viewDocuments ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.viewDocuments ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Upload Documents</TableCell>
              <TableCell className="text-center">{adminPerms.uploadDocuments ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.uploadDocuments ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.uploadDocuments ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.uploadDocuments ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>

            {/* Chat */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={5} className="font-semibold">Chat</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Send Messages</TableCell>
              <TableCell className="text-center">{adminPerms.sendMessages ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.sendMessages ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.sendMessages ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.sendMessages ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>View Messages</TableCell>
              <TableCell className="text-center">{adminPerms.viewMessages ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.viewMessages ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.viewMessages ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.viewMessages ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>

            {/* Settings */}
            <TableRow className="bg-muted/50">
              <TableCell colSpan={5} className="font-semibold">Settings</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Manage Settings</TableCell>
              <TableCell className="text-center">{adminPerms.manageSettings ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.manageSettings ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.manageSettings ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.manageSettings ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Manage Users</TableCell>
              <TableCell className="text-center">{adminPerms.manageUsers ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{fmPerms.manageUsers ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{opsPerms.manageUsers ? <CheckIcon /> : <XIcon />}</TableCell>
              <TableCell className="text-center">{roPerms.manageUsers ? <CheckIcon /> : <XIcon />}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
