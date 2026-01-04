'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import { format } from 'date-fns'

interface AdminUser {
  id: string
  email: string
  role: string
  created_at: string
}

interface CheckType {
  id: string
  name: string
  category: string
  frequency_months: number
}

interface ContractType {
  id: string
  type: string
  description: string | null
}

interface AdminDashboardClientProps {
  users: AdminUser[]
  checkTypes: CheckType[]
  contracts: ContractType[]
}

export function AdminDashboardClient({ users, checkTypes, contracts }: AdminDashboardClientProps) {
  const [userSearch, setUserSearch] = useState('')
  const [checkTypeSearch, setCheckTypeSearch] = useState('')
  const [contractSearch, setContractSearch] = useState('')

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.role.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredCheckTypes = checkTypes.filter(
    (ct) =>
      ct.name.toLowerCase().includes(checkTypeSearch.toLowerCase()) ||
      ct.category.toLowerCase().includes(checkTypeSearch.toLowerCase())
  )

  const filteredContracts = contracts.filter((c) =>
    c.type.toLowerCase().includes(contractSearch.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Users Section */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search users by email or role..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">Email</th>
                  <th className="py-3 text-left font-medium">Role</th>
                  <th className="py-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3">{user.email}</td>
                    <td className="py-3">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground py-3 text-sm">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Check Types Section */}
      <Card>
        <CardHeader>
          <CardTitle>Check Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search check types by name or category..."
              value={checkTypeSearch}
              onChange={(e) => setCheckTypeSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">Name</th>
                  <th className="py-3 text-left font-medium">Category</th>
                  <th className="py-3 text-left font-medium">Frequency</th>
                </tr>
              </thead>
              <tbody>
                {filteredCheckTypes.map((ct) => (
                  <tr key={ct.id} className="border-b last:border-0">
                    <td className="py-3">{ct.name}</td>
                    <td className="py-3">
                      <Badge variant="outline">{ct.category}</Badge>
                    </td>
                    <td className="text-muted-foreground py-3 text-sm">
                      {ct.frequency_months} months
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search contracts..."
              value={contractSearch}
              onChange={(e) => setContractSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium">Type</th>
                  <th className="py-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{contract.type}</td>
                    <td className="text-muted-foreground py-3 text-sm">
                      {contract.description || 'No description'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
