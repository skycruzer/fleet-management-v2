'use client'

/**
 * Audit Log Filters Component
 *
 * Filter controls for audit logs (user, date range, table, action, search).
 *
 * @spec 001-missing-core-features (US4, T075)
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface AuditLogFiltersProps {
  currentFilters: {
    userEmail?: string
    tableName?: string
    action?: string
    recordId?: string
    startDate?: string
    endDate?: string
    searchQuery?: string
  }
}

export default function AuditLogFilters({ currentFilters }: AuditLogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [userEmail, setUserEmail] = useState(currentFilters.userEmail || '')
  const [tableName, setTableName] = useState(currentFilters.tableName || '')
  const [action, setAction] = useState(currentFilters.action || '')
  const [recordId, setRecordId] = useState(currentFilters.recordId || '')
  const [startDate, setStartDate] = useState(currentFilters.startDate || '')
  const [endDate, setEndDate] = useState(currentFilters.endDate || '')
  const [searchQuery, setSearchQuery] = useState(currentFilters.searchQuery || '')
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if any filters are active
  const hasActiveFilters =
    userEmail || tableName || action || recordId || startDate || endDate || searchQuery

  useEffect(() => {
    // Auto-expand if filters are active
    if (hasActiveFilters) {
      setIsExpanded(true)
    }
  }, [hasActiveFilters])

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams?.toString())

    // Clear old filter params
    params.delete('userEmail')
    params.delete('tableName')
    params.delete('action')
    params.delete('recordId')
    params.delete('startDate')
    params.delete('endDate')
    params.delete('searchQuery')
    params.delete('page') // Reset to page 1

    // Add new filter params
    if (userEmail) params.set('userEmail', userEmail)
    if (tableName) params.set('tableName', tableName)
    if (action) params.set('action', action)
    if (recordId) params.set('recordId', recordId)
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (searchQuery) params.set('searchQuery', searchQuery)

    router.push(`/dashboard/audit?${params.toString()}`)
  }

  const clearFilters = () => {
    setUserEmail('')
    setTableName('')
    setAction('')
    setRecordId('')
    setStartDate('')
    setEndDate('')
    setSearchQuery('')

    const params = new URLSearchParams(searchParams?.toString())
    params.delete('userEmail')
    params.delete('tableName')
    params.delete('action')
    params.delete('recordId')
    params.delete('startDate')
    params.delete('endDate')
    params.delete('searchQuery')
    params.delete('page')

    router.push(`/dashboard/audit?${params.toString()}`)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Filter Header */}
      <div
        className="flex cursor-pointer items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          {hasActiveFilters && (
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              Active
            </span>
          )}
        </div>
        <svg
          className={`h-5 w-5 text-gray-600 transition-transform dark:text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Filter Fields */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* User Email */}
            <div>
              <label
                htmlFor="userEmail"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                User Email
              </label>
              <input
                type="text"
                id="userEmail"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Filter by user email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Table Name */}
            <div>
              <label
                htmlFor="tableName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Table Name
              </label>
              <input
                type="text"
                id="tableName"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Filter by table"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Action */}
            <div>
              <label
                htmlFor="action"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Action
              </label>
              <select
                id="action"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Actions</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="LOGIN">LOGIN</option>
                <option value="LOGOUT">LOGOUT</option>
                <option value="EXPORT">EXPORT</option>
                <option value="APPROVE">APPROVE</option>
                <option value="DENY">DENY</option>
                <option value="CANCEL">CANCEL</option>
              </select>
            </div>

            {/* Record ID */}
            <div>
              <label
                htmlFor="recordId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Record ID
              </label>
              <input
                type="text"
                id="recordId"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                placeholder="Filter by record ID"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Start Date */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Search Query (spans full width) */}
            <div className="md:col-span-2 lg:col-span-3">
              <label
                htmlFor="searchQuery"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Search Description
              </label>
              <input
                type="text"
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in descriptions..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={applyFilters}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
