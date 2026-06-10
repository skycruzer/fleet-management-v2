/** Developer: Maurice Rondeau */

'use client'

import { format } from 'date-fns'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import type { CheckType } from '@/lib/services/admin-service'

interface CheckTypesTableProps {
  checkTypes: CheckType[]
}

export function CheckTypesTable({ checkTypes }: CheckTypesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checkTypes.map((checkType) => (
          <TableRow key={checkType.id}>
            <TableCell className="text-foreground font-medium whitespace-nowrap">
              {checkType.check_code}
            </TableCell>
            <TableCell className="text-foreground">{checkType.check_description}</TableCell>
            <TableCell className="text-muted-foreground whitespace-nowrap">
              {checkType.category || 'N/A'}
            </TableCell>
            <TableCell className="text-muted-foreground whitespace-nowrap">
              {format(new Date(checkType.updated_at), 'MMM dd, yyyy')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
