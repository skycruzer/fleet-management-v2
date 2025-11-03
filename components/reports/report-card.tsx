/**
 * Report Card Component
 * Author: Maurice Rondeau
 * Date: November 3, 2025
 *
 * Card component for displaying individual report options
 */

'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Download,
  Mail,
  ChevronDown,
  Calendar,
  Users,
  Award,
  Plane,
  Settings,
  BarChart3,
  TrendingUp,
  GitBranch,
  Database,
  AlertTriangle,
  Shield,
  CalendarClock,
  ClipboardList,
  PieChart,
  Target,
  CheckSquare,
  AlertCircle,
  Activity,
  MessageSquare,
} from 'lucide-react'
import type { Report, ReportFormat } from '@/types/reports'

const ICON_MAP = {
  FileText,
  Calendar,
  Users,
  Award,
  Plane,
  Settings,
  BarChart3,
  TrendingUp,
  GitBranch,
  Database,
  AlertTriangle,
  Shield,
  CalendarClock,
  ClipboardList,
  PieChart,
  Target,
  CheckSquare,
  AlertCircle,
  Activity,
  MessageSquare,
}

interface ReportCardProps {
  report: Report
  onGenerate: (reportId: string, format: ReportFormat) => Promise<void>
  onEmail: (reportId: string, format: ReportFormat) => Promise<void>
}

export function ReportCard({ report, onGenerate, onEmail }: ReportCardProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const Icon = report.icon && report.icon in ICON_MAP ? ICON_MAP[report.icon as keyof typeof ICON_MAP] : FileText

  const handleGenerate = async (format: ReportFormat) => {
    setIsGenerating(true)
    try {
      await onGenerate(report.id, format)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEmail = async (format: ReportFormat) => {
    setIsSending(true)
    try {
      await onEmail(report.id, format)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow" data-report={report.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{report.name}</CardTitle>
              <CardDescription className="mt-1">{report.description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          {report.formats.map((format) => (
            <Badge key={format} variant="secondary" className="uppercase">
              {format}
            </Badge>
          ))}
        </div>

        {report.parameters && report.parameters.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Configurable options:</p>
            <ul className="list-disc list-inside space-y-1">
              {report.parameters.map((param) => (
                <li key={param.name}>{param.label}</li>
              ))}
            </ul>
          </div>
        )}

        {report.metadata?.lastGenerated && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            Last generated: {new Date(report.metadata.lastGenerated.date).toLocaleDateString()} by{' '}
            {report.metadata.lastGenerated.user}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isGenerating} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {report.formats.map((format) => (
              <DropdownMenuItem key={format} onClick={() => handleGenerate(format)}>
                <FileText className="h-4 w-4 mr-2" />
                Generate {format.toUpperCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {report.emailDelivery && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isSending}>
                <Mail className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Email'}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {report.formats.map((format) => (
                <DropdownMenuItem key={format} onClick={() => handleEmail(format)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email {format.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
    </Card>
  )
}
