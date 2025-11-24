/**
 * Quick Entry Form Component
 *
 * Admin form for manually entering pilot requests from email, phone, or Oracle.
 * Multi-step form with real-time validation, conflict detection, and roster period calculation.
 *
 * @author Maurice Rondeau
 * @spec Manual request entry workflow
 */

'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { CalendarIcon, AlertTriangle, CheckCircle2, FileText, User, Clock } from 'lucide-react'
import { format } from 'date-fns'

import {
  QuickEntrySchema,
  type QuickEntryFormInput,
  getDeadlineStatus,
} from '@/lib/validations/quick-entry-schema'
import { getRosterPeriodFromDate } from '@/lib/utils/roster-utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// ===================================
// TYPES
// ===================================

interface Pilot {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  employee_id: string
  role: 'Captain' | 'First Officer'
}

interface ConflictWarning {
  hasConflict: boolean
  conflicts: Array<{
    id: string
    type: string
    startDate: string
    endDate: string
    status: string
  }>
}

interface QuickEntryFormProps {
  pilots: Pilot[]
  onSuccess?: () => void
  onCancel?: () => void
}

// ===================================
// COMPONENT
// ===================================

export function QuickEntryForm({ pilots, onSuccess, onCancel }: QuickEntryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(1)
  const [conflictWarning, setConflictWarning] = React.useState<ConflictWarning | null>(null)
  const [rosterPeriod, setRosterPeriod] = React.useState<string | null>(null)
  const [deadlineStatus, setDeadlineStatus] = React.useState<ReturnType<
    typeof getDeadlineStatus
  > | null>(null)

  // Form initialization
  const form = useForm<QuickEntryFormInput>({
    resolver: zodResolver(QuickEntrySchema),
    defaultValues: {
      pilot_id: '',
      request_category: 'LEAVE',
      submission_channel: 'EMAIL',
      leave_type: undefined,
      flight_type: undefined,
      start_date: '',
      end_date: '',
      reason: '',
      source_reference: '',
      notes: '',
    },
  })

  const selectedCategory = form.watch('request_category')
  const selectedStartDate = form.watch('start_date')
  const selectedEndDate = form.watch('end_date')
  const selectedPilotId = form.watch('pilot_id')

  // ===================================
  // EFFECTS
  // ===================================

  // Calculate roster period when start date changes
  React.useEffect(() => {
    if (selectedStartDate) {
      try {
        const date = new Date(selectedStartDate)
        const period = getRosterPeriodFromDate(date)
        setRosterPeriod(period.code)

        // Calculate deadline status
        const status = getDeadlineStatus(selectedStartDate)
        setDeadlineStatus(status)
      } catch (error) {
        setRosterPeriod(null)
        setDeadlineStatus(null)
      }
    } else {
      setRosterPeriod(null)
      setDeadlineStatus(null)
    }
  }, [selectedStartDate])

  // Check for conflicts when dates or pilot changes
  React.useEffect(() => {
    if (selectedPilotId && selectedStartDate) {
      checkConflicts()
    }
  }, [selectedPilotId, selectedStartDate, selectedEndDate])

  // ===================================
  // HANDLERS
  // ===================================

  const checkConflicts = async () => {
    if (!selectedPilotId || !selectedStartDate) return

    try {
      const endDate = selectedEndDate || selectedStartDate
      const response = await fetch(
        `/api/requests/check-conflicts?pilot_id=${selectedPilotId}&start_date=${selectedStartDate}&end_date=${endDate}`
      )

      if (response.ok) {
        const data = await response.json()
        setConflictWarning(data)
      }
    } catch (error) {
      console.error('Failed to check conflicts:', error)
    }
  }

  const handleSubmit = async (data: QuickEntryFormInput) => {
    console.log('🚀 handleSubmit called with data:', data)
    setIsSubmitting(true)

    try {
      // Get selected pilot details
      const selectedPilot = pilots.find((p) => p.id === data.pilot_id)
      console.log('👤 Selected pilot:', selectedPilot)

      if (!selectedPilot) {
        throw new Error('Selected pilot not found')
      }

      // Prepare unified request payload
      const payload = {
        pilot_id: data.pilot_id,
        employee_number: selectedPilot.employee_id,
        rank: selectedPilot.role,
        name: `${selectedPilot.first_name} ${selectedPilot.last_name}`,
        request_category: data.request_category,
        request_type:
          data.request_category === 'LEAVE' ? data.leave_type : data.flight_type,
        submission_channel: data.submission_channel,
        start_date: data.start_date,
        end_date: data.end_date || data.start_date,
        reason: data.reason,
        notes: data.notes,
        source_reference: data.source_reference,
      }

      console.log('📦 Request payload:', payload)
      console.log('🌐 Sending POST to /api/requests...')

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      const result = await response.json()
      console.log('📄 Response body:', result)

      if (!response.ok) {
        console.error('❌ Request failed:', result)
        // Show conflict information if available
        if (result.conflicts && result.conflicts.length > 0) {
          const conflictMessages = result.conflicts.map((c: any) => c.message).join('; ')
          throw new Error(`${result.error}\n\nConflicts: ${conflictMessages}`)
        }
        throw new Error(result.error || 'Failed to submit request')
      }

      console.log('✅ Request succeeded!')

      // Show success with any warnings
      let description = `${data.request_category} request successfully created for roster period ${rosterPeriod}`
      if (result.warnings && result.warnings.length > 0) {
        description += `\n\nWarnings: ${result.warnings.join('; ')}`
      }

      toast({
        title: 'Request Submitted',
        description,
      })

      // Reset form and close
      form.reset()
      setCurrentStep(1)
      setConflictWarning(null)
      setRosterPeriod(null)
      setDeadlineStatus(null)

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('💥 Submission error:', error)
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      console.log('🏁 Submission complete, setting isSubmitting to false')
      setIsSubmitting(false)
    }
  }

  const nextStep = async () => {
    // Get current form values for debugging
    const formValues = form.getValues()
    console.log('🔍 Form values when clicking Next:', formValues)
    console.log('🔍 Current step:', currentStep)

    // Validate specific fields based on step
    let isValid = false

    if (currentStep === 1) {
      // Step 1: Check required fields manually first
      const { pilot_id, request_category, submission_channel, leave_type, flight_type } = formValues

      console.log('🔍 Step 1 values:', {
        pilot_id,
        request_category,
        submission_channel,
        leave_type,
        flight_type,
      })

      // Check pilot_id
      if (!pilot_id || pilot_id.trim() === '') {
        console.error('❌ Pilot ID is missing')
        toast({
          title: 'Validation Error',
          description: 'Please select a pilot.',
          variant: 'destructive',
        })
        return
      }

      // Check request_category
      if (!request_category) {
        console.error('❌ Request category is missing')
        toast({
          title: 'Validation Error',
          description: 'Please select a request category.',
          variant: 'destructive',
        })
        return
      }

      // Check conditional type fields
      if (request_category === 'LEAVE' && !leave_type) {
        console.error('❌ Leave type is missing')
        toast({
          title: 'Validation Error',
          description: 'Please select a leave type.',
          variant: 'destructive',
        })
        return
      }

      if (request_category === 'FLIGHT' && !flight_type) {
        console.error('❌ Flight type is missing')
        toast({
          title: 'Validation Error',
          description: 'Please select a flight request type.',
          variant: 'destructive',
        })
        return
      }

      // Check submission_channel
      if (!submission_channel) {
        console.error('❌ Submission channel is missing')
        toast({
          title: 'Validation Error',
          description: 'Please select a submission channel.',
          variant: 'destructive',
        })
        return
      }

      isValid = true
    } else if (currentStep === 2) {
      // Step 2: Validate dates
      const { start_date, end_date, request_category } = formValues

      if (!start_date || start_date.trim() === '') {
        toast({
          title: 'Validation Error',
          description: 'Please select a start date.',
          variant: 'destructive',
        })
        return
      }

      // End date is required for LEAVE, LEAVE_BID, and FLIGHT (RDO/SDO)
      if (
        (request_category === 'LEAVE' || request_category === 'LEAVE_BID' || request_category === 'FLIGHT') &&
        (!end_date || end_date.trim() === '')
      ) {
        toast({
          title: 'Validation Error',
          description: 'Please select an end date for this request.',
          variant: 'destructive',
        })
        return
      }

      isValid = true
    } else {
      // Steps 3 and 4 don't have validation
      isValid = true
    }

    if (isValid) {
      console.log('✅ Validation passed, moving to next step')
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const getSelectedPilot = () => {
    return pilots.find((p) => p.id === selectedPilotId)
  }

  // ===================================
  // RENDER
  // ===================================

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-colors',
                  currentStep >= step
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-muted'
                )}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 transition-colors',
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Step 1: Basic Information
              </CardTitle>
              <CardDescription>
                Select the pilot and specify the type of request being submitted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pilot Selection */}
              <FormField
                control={form.control}
                name="pilot_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pilot *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a pilot..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {pilots.map((pilot) => (
                          <SelectItem key={pilot.id} value={pilot.id}>
                            {pilot.employee_id} - {pilot.first_name}{' '}
                            {pilot.middle_name ? `${pilot.middle_name} ` : ''}
                            {pilot.last_name} ({pilot.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Request Category */}
              <FormField
                control={form.control}
                name="request_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LEAVE">Leave Request</SelectItem>
                        <SelectItem value="FLIGHT">RDO/SDO Request</SelectItem>
                        <SelectItem value="LEAVE_BID">Leave Bid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the category of request to submit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Leave Type (conditional) */}
              {selectedCategory === 'LEAVE' && (
                <FormField
                  control={form.control}
                  name="leave_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select leave type..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="RDO">RDO (Rostered Day Off)</SelectItem>
                          <SelectItem value="SDO">SDO (Scheduled Day Off)</SelectItem>
                          <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                          <SelectItem value="SICK">Sick Leave</SelectItem>
                          <SelectItem value="LSL">Long Service Leave</SelectItem>
                          <SelectItem value="LWOP">Leave Without Pay</SelectItem>
                          <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                          <SelectItem value="COMPASSIONATE">
                            Compassionate Leave
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Flight Type (conditional) */}
              {selectedCategory === 'FLIGHT' && (
                <FormField
                  control={form.control}
                  name="flight_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RDO/SDO Request Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select flight request type..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="RDO">RDO (Rostered Day Off)</SelectItem>
                          <SelectItem value="SDO">SDO (Scheduled Day Off)</SelectItem>
                          <SelectItem value="OFFICE_DAY">Office Day</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Submission Channel */}
              <FormField
                control={form.control}
                name="submission_channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission Channel *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="PHONE">Phone Call</SelectItem>
                        <SelectItem value="ORACLE">Oracle System</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How was this request originally submitted?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Date Selection */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Step 2: Date Selection
              </CardTitle>
              <CardDescription>
                Specify the start and end dates for this request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              {(selectedCategory === 'LEAVE' || selectedCategory === 'LEAVE_BID' || selectedCategory === 'FLIGHT') && (
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                            }}
                            disabled={(date) => {
                              const minDate = selectedStartDate
                                ? new Date(selectedStartDate)
                                : new Date(new Date().setHours(0, 0, 0, 0))
                              return date < minDate
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Select date range for multi-day requests
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Roster Period Display */}
              {rosterPeriod && (
                <Alert>
                  <CalendarIcon className="h-4 w-4" />
                  <AlertTitle>Roster Period</AlertTitle>
                  <AlertDescription>
                    This request falls within <strong>{rosterPeriod}</strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* Deadline Status */}
              {deadlineStatus && (
                <Alert
                  variant={
                    deadlineStatus.status === 'past-deadline'
                      ? 'destructive'
                      : deadlineStatus.status === 'late'
                        ? 'default'
                        : 'default'
                  }
                >
                  <Clock className="h-4 w-4" />
                  <AlertTitle>
                    {deadlineStatus.status === 'past-deadline'
                      ? 'Past Deadline'
                      : deadlineStatus.status === 'late'
                        ? 'Late Request'
                        : 'On-Time Request'}
                  </AlertTitle>
                  <AlertDescription>{deadlineStatus.label}</AlertDescription>
                </Alert>
              )}

              {/* Conflict Warning */}
              {conflictWarning?.hasConflict && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Conflicting Requests Detected</AlertTitle>
                  <AlertDescription>
                    This pilot has {conflictWarning.conflicts.length} existing request(s)
                    for overlapping dates. Review before submitting.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Additional Details */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Step 3: Additional Details
              </CardTitle>
              <CardDescription>
                Provide additional context and source information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason / Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the reason for this request..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional explanation provided by the pilot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Source Reference */}
              <FormField
                control={form.control}
                name="source_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Reference</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Email ID, Phone Log #, Oracle Ticket #"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Reference number from the original submission
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Admin Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Internal notes (not visible to pilot)..."
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Internal notes for admin reference only
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Step 4: Review & Submit
              </CardTitle>
              <CardDescription>
                Review the request details before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pilot Info */}
              <div>
                <h4 className="font-semibold mb-2">Pilot Information</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{' '}
                    {getSelectedPilot()?.first_name}{' '}
                    {getSelectedPilot()?.middle_name
                      ? `${getSelectedPilot()?.middle_name} `
                      : ''}
                    {getSelectedPilot()?.last_name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Employee ID:</span>{' '}
                    {getSelectedPilot()?.employee_id}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Role:</span>{' '}
                    {getSelectedPilot()?.role}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Request Details */}
              <div>
                <h4 className="font-semibold mb-2">Request Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge>{selectedCategory}</Badge>
                  </div>
                  <p>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    {selectedCategory === 'LEAVE'
                      ? form.getValues('leave_type')
                      : form.getValues('flight_type')}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Start Date:</span>{' '}
                    {selectedStartDate
                      ? format(new Date(selectedStartDate), 'PPP')
                      : 'N/A'}
                  </p>
                  {selectedEndDate && (
                    <p>
                      <span className="text-muted-foreground">End Date:</span>{' '}
                      {format(new Date(selectedEndDate), 'PPP')}
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Roster Period:</span>{' '}
                    {rosterPeriod || 'N/A'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Submitted Via:</span>{' '}
                    {form.getValues('submission_channel')}
                  </p>
                  {deadlineStatus && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={
                          deadlineStatus.status === 'on-time'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {deadlineStatus.status === 'on-time' ? 'On-Time' : 'Late'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {form.getValues('reason') && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Reason</h4>
                    <p className="text-sm text-muted-foreground">
                      {form.getValues('reason')}
                    </p>
                  </div>
                </>
              )}

              {form.getValues('source_reference') && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Source Reference</h4>
                    <p className="text-sm text-muted-foreground">
                      {form.getValues('source_reference')}
                    </p>
                  </div>
                </>
              )}

              {conflictWarning?.hasConflict && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Warning: Conflicting Requests</AlertTitle>
                  <AlertDescription>
                    This pilot has {conflictWarning.conflicts.length} existing request(s)
                    for overlapping dates. Proceeding will require manual review.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Previous
              </Button>
            )}
            {onCancel && currentStep === 1 && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < 4 && (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            )}
            {currentStep === 4 && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  )
}
