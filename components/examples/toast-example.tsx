'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

/**
 * Toast Example Component
 *
 * Demonstrates how to use toast notifications in the Fleet Management system.
 * This component shows all toast variants and common use cases.
 *
 * @example
 * import { ToastExample } from '@/components/examples/toast-example'
 *
 * export default function ExamplePage() {
 *   return <ToastExample />
 * }
 */
export function ToastExample() {
  const { toast } = useToast()

  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Toast Notifications Examples</h1>
        <p className="text-muted-foreground">
          Interactive examples demonstrating toast notification usage throughout the Fleet Management system.
        </p>
      </div>

      {/* Basic Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Variants</CardTitle>
          <CardDescription>
            Standard toast variants for different types of feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: 'Notification',
                description: 'This is a default toast notification',
              })
            }
          >
            Default Toast
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'success',
                title: 'Success',
                description: 'Operation completed successfully',
              })
            }
          >
            Success Toast
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'warning',
                title: 'Warning',
                description: 'This requires your attention',
              })
            }
          >
            Warning Toast
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Something went wrong',
              })
            }
          >
            Error Toast
          </Button>
        </CardContent>
      </Card>

      {/* Pilot Management Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Pilot Management</CardTitle>
          <CardDescription>
            Toast notifications for pilot CRUD operations
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'success',
                title: 'Pilot Created',
                description: 'Captain John Doe has been added successfully',
              })
            }
          >
            Create Pilot
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'success',
                title: 'Pilot Updated',
                description: 'Changes saved successfully',
              })
            }
          >
            Update Pilot
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                title: 'Pilot Deleted',
                description: 'Captain John Doe has been removed',
                action: (
                  <ToastAction
                    altText="Undo deletion"
                    onClick={() =>
                      toast({
                        variant: 'success',
                        title: 'Restored',
                        description: 'Pilot has been restored',
                      })
                    }
                  >
                    Undo
                  </ToastAction>
                ),
              })
            }
          >
            Delete Pilot (with Undo)
          </Button>
        </CardContent>
      </Card>

      {/* Certification Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Certification Tracking</CardTitle>
          <CardDescription>
            Toast notifications for certification management
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'success',
                title: 'Certification Added',
                description: 'Line Check added for Captain Smith',
              })
            }
          >
            Add Certification
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'warning',
                title: 'Certification Expiring',
                description: 'Line Check expires in 15 days',
                action: (
                  <ToastAction altText="Schedule renewal">
                    Schedule
                  </ToastAction>
                ),
              })
            }
          >
            Expiring Soon
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'destructive',
                title: 'Certification Expired',
                description: 'Emergency Procedures Training expired 5 days ago',
                action: (
                  <ToastAction altText="Renew now">
                    Renew Now
                  </ToastAction>
                ),
              })
            }
          >
            Expired
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'warning',
                title: 'Multiple Expiring',
                description: '3 certifications expire within 30 days',
                action: (
                  <ToastAction altText="View details">
                    View Details
                  </ToastAction>
                ),
              })
            }
          >
            Batch Alert
          </Button>
        </CardContent>
      </Card>

      {/* Leave Request Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Management</CardTitle>
          <CardDescription>
            Toast notifications for leave request operations
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'success',
                title: 'Leave Request Submitted',
                description: 'Request for RP12/2025 submitted successfully',
              })
            }
          >
            Submit Request
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'success',
                title: 'Leave Approved',
                description: 'Your leave request has been approved',
              })
            }
          >
            Approve Leave
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'warning',
                title: 'Eligibility Alert',
                description: 'Multiple Captains requested the same dates',
                action: (
                  <ToastAction altText="Review conflicts">
                    Review
                  </ToastAction>
                ),
              })
            }
          >
            Eligibility Alert
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'destructive',
                title: 'Request Denied',
                description: 'Minimum crew requirements not met',
              })
            }
          >
            Deny Request
          </Button>
        </CardContent>
      </Card>

      {/* Data Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Data Operations</CardTitle>
          <CardDescription>
            Toast notifications for import/export and bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: 'Exporting Data',
                description: 'Preparing your data...',
              })
              setTimeout(() => {
                toast({
                  variant: 'success',
                  title: 'Export Complete',
                  description: 'Your data has been downloaded',
                })
              }, 2000)
            }}
          >
            Export Data
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'success',
                title: 'Import Complete',
                description: 'Imported 27 pilots successfully',
              })
            }
          >
            Import Success
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'destructive',
                title: 'Import Failed',
                description: 'Invalid file format. Please check your data.',
                action: (
                  <ToastAction altText="View errors">
                    View Errors
                  </ToastAction>
                ),
              })
            }
          >
            Import Error
          </Button>
        </CardContent>
      </Card>

      {/* Fleet Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Compliance</CardTitle>
          <CardDescription>
            Toast notifications for fleet-wide compliance alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'success',
                title: 'Fleet Compliant',
                description: 'Fleet compliance at 98% - Excellent!',
              })
            }
          >
            High Compliance
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'warning',
                title: 'Compliance Warning',
                description: 'Fleet compliance at 92%. Monitor closely.',
              })
            }
          >
            Medium Compliance
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast({
                variant: 'destructive',
                title: 'Critical: Fleet Compliance',
                description: 'Compliance at 85%. Immediate action required.',
                action: (
                  <ToastAction altText="View report">
                    View Report
                  </ToastAction>
                ),
              })
            }
          >
            Low Compliance
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
