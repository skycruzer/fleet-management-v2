/**
 * Support Contact Buttons Component
 * Displays contact channels for support
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 */

'use client'

import { Mail, Phone, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

const contactChannels = [
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us an email for detailed inquiries',
    action: 'mailto:mrondeau@airniugini.com.pg',
    actionLabel: 'Send Email',
    color: 'text-[var(--color-info)]',
    bgColor: 'bg-[var(--color-info-bg)]',
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Call us during business hours',
    action: 'tel:+1-800-FLEET',
    actionLabel: 'Call Now',
    color: 'text-[var(--color-success-400)]',
    bgColor: 'bg-[var(--color-success-muted)]',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Chat with our support team in real-time',
    action: '#',
    actionLabel: 'Start Chat',
    color: 'text-[var(--color-badge-purple)]',
    bgColor: 'bg-[var(--color-badge-purple-bg)]',
  },
]

export function SupportContactButtons() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {contactChannels.map((channel) => {
        const Icon = channel.icon
        return (
          <Card key={channel.title} className="p-6">
            <div className={`mb-4 w-fit rounded-lg p-3 ${channel.bgColor}`}>
              <Icon className={`h-6 w-6 ${channel.color}`} aria-hidden="true" />
            </div>
            <h3 className="text-foreground mb-2 text-lg font-semibold">{channel.title}</h3>
            <p className="text-muted-foreground mb-4 text-sm">{channel.description}</p>
            <a href={channel.action} className="text-primary text-sm font-medium hover:underline">
              {channel.actionLabel} &rarr;
            </a>
          </Card>
        )
      })}
    </div>
  )
}
