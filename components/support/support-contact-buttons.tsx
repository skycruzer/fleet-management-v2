/**
 * Support Contact Buttons Component
 * Interactive buttons for contacting support via different channels
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, MessageSquare, Clock } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SupportChannel {
  icon: typeof Mail
  title: string
  description: string
  contact: string
  response: string
  color: 'blue' | 'green' | 'purple'
  action: () => void
}

export function SupportContactButtons() {
  const [liveChatOpen, setLiveChatOpen] = useState(false)

  const handleEmailSupport = () => {
    window.location.href = 'mailto:support@fleetmanagement.com?subject=Fleet Management Support Request'
  }

  const handlePhoneSupport = () => {
    window.location.href = 'tel:+15551234567'
  }

  const handleLiveChat = () => {
    setLiveChatOpen(true)
  }

  const supportChannels: SupportChannel[] = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email within 24 hours',
      contact: 'support@fleetmanagement.com',
      response: '24 hours',
      color: 'blue',
      action: handleEmailSupport,
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      contact: '+1 (555) 123-4567',
      response: 'Immediate',
      color: 'green',
      action: handlePhoneSupport,
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      contact: 'Available Monday-Friday, 9am-5pm',
      response: '5 minutes',
      color: 'purple',
      action: handleLiveChat,
    },
  ]

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {supportChannels.map((channel) => {
          const Icon = channel.icon
          const bgColor =
            channel.color === 'blue'
              ? 'bg-blue-100'
              : channel.color === 'green'
                ? 'bg-green-100'
                : 'bg-primary/10'
          const textColor =
            channel.color === 'blue'
              ? 'text-blue-600'
              : channel.color === 'green'
                ? 'text-green-600'
                : 'text-primary'

          return (
            <Card key={channel.title} className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-lg ${bgColor} p-3`}>
                  <Icon className={`h-6 w-6 ${textColor}`} />
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {channel.response}
                </Badge>
              </div>
              <h3 className="text-foreground mb-2 text-lg font-semibold">{channel.title}</h3>
              <p className="text-muted-foreground mb-4 text-sm">{channel.description}</p>
              <p className="text-foreground mb-4 font-medium">{channel.contact}</p>
              <Button className="w-full gap-2" onClick={channel.action}>
                Contact Now
                <Icon className="h-4 w-4" />
              </Button>
            </Card>
          )
        })}
      </div>

      {/* Live Chat Dialog */}
      <Dialog open={liveChatOpen} onOpenChange={setLiveChatOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Live Chat Support</DialogTitle>
            <DialogDescription>
              Connect with our support team in real-time
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-dashed p-8 text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Live Chat Coming Soon</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Our live chat feature is currently under development. In the meantime, please use
                email or phone support.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleEmailSupport}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support Instead
                </Button>
                <Button variant="outline" className="w-full" onClick={handlePhoneSupport}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call Support Instead
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
