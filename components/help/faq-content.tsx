/**
 * FAQ Content Component
 * Searchable FAQ accordion organized by category
 *
 * @author Maurice Rondeau
 * @version 1.0.0
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FileQuestion, Search } from 'lucide-react'
import Link from 'next/link'

const faqCategories = [
  {
    category: 'Pilot Management',
    questions: [
      {
        id: 'how-to-add-a-new-pilot',
        question: 'How to add a new pilot?',
        answer: `To add a new pilot to the system:
1. Navigate to Dashboard → Pilots
2. Click the "Add New Pilot" button in the top right
3. Fill in the required information:
 - First and Last Name
 - Rank (Captain or First Officer)
 - Commencement Date
 - Date of Birth
4. Click "Create Pilot"

The system will automatically calculate seniority numbers based on the commencement date.`,
      },
      {
        id: 'how-to-update-certification-dates',
        question: 'How to update certification dates?',
        answer: `To update certification dates:
1. Go to Dashboard → Pilots
2. Click on the pilot's name to view their profile
3. Scroll to the "Certifications" section
4. Click the edit icon next to the certification you want to update
5. Update the expiry date
6. Click "Save Changes"

The system will automatically recalculate the status (Green/Yellow/Red) based on the new date.`,
      },
    ],
  },
  {
    category: 'Leave Management',
    questions: [
      {
        id: 'how-to-submit-a-leave-request',
        question: 'How to submit a leave request?',
        answer: `To submit a leave request:
1. Navigate to Dashboard → Leave Requests
2. Click "Submit Leave Request"
3. Select the start and end roster periods (must align to RP boundaries)
4. Add a reason (optional)
5. Click "Submit"

The system will check eligibility based on:
- Minimum crew requirements (10 Captains + 10 First Officers)
- Your seniority number
- Existing approved requests

You'll receive immediate feedback on approval status.`,
      },
      {
        id: 'leave-eligibility-rules',
        question: 'What are the leave eligibility rules?',
        answer: `Leave eligibility is determined by:

**Minimum Crew Requirements:**
- Must maintain 10 Captains available
- Must maintain 10 First Officers available
- Each rank is evaluated independently

**Approval Priority (same rank):**
1. Lower seniority number = higher priority (e.g., #1 beats #5)
2. Earlier submission date

**Special Alerts:**
- Eligibility Alert: Shows when 2+ pilots of same rank request overlapping dates
- Final Review Alert: Appears 22 days before next roster period (if pending requests exist)`,
      },
    ],
  },
  {
    category: 'Certification & Compliance',
    questions: [
      {
        id: 'certification-color-coding',
        question: 'What do the certification colors mean?',
        answer: `Certification status colors:

🔴 **Red (Expired)**: Certification has expired (days_until_expiry < 0)
- Immediate action required
- Pilot may not be flight-ready

🟡 **Yellow (Expiring Soon)**: Expiring within 30 days
- Schedule renewal immediately
- Plan ahead to avoid expiry

🟢 **Green (Current)**: More than 30 days until expiry
- Certification is current
- No immediate action needed

The system automatically calculates these based on FAA standards.`,
      },
      {
        id: 'how-to-generate-renewal-plans',
        question: 'How to generate renewal plans?',
        answer: `To generate certification renewal plans:
1. Navigate to Dashboard → Renewal Planning
2. Select the year for planning (current or next)
3. Review the distribution settings:
 - Target checks per roster period
 - Check type priorities
4. Click "Generate Plan"
5. Review the proposed plan in the calendar view
6. Export to PDF for distribution

The system intelligently distributes renewals across 13 roster periods to balance workload.`,
      },
    ],
  },
  {
    category: 'Reports & Export',
    questions: [
      {
        id: 'how-to-export-data-to-pdf',
        question: 'How to export data to PDF?',
        answer: `Export data to PDF:

**Pilot Reports:**
1. Go to Dashboard → Pilots
2. Click on a pilot's name
3. Click "Export to PDF" in the top right
4. PDF includes certifications, qualifications, and compliance status

**Renewal Plans:**
1. Go to Dashboard → Renewal Planning
2. Generate or view an existing plan
3. Click "Export Plan" → "PDF"
4. Includes calendar view and detailed check schedule

**Leave Requests:**
1. Go to Dashboard → Leave Requests
2. Click "Export" → "PDF"
3. Includes all requests with status and eligibility info`,
      },
    ],
  },
  {
    category: 'System & Permissions',
    questions: [
      {
        id: 'how-to-manage-user-permissions',
        question: 'How to manage user permissions?',
        answer: `To manage user permissions (Admin only):
1. Navigate to Dashboard → Admin → Users
2. Find the user you want to modify
3. Click the edit icon
4. Update their role:
 - **Admin**: Full system access
 - **Manager**: Read/write access to most features
 - **Pilot**: Read-only access to personal data
5. Click "Save Changes"

Role changes take effect immediately.`,
      },
      {
        id: 'system-requirements',
        question: 'What are the system requirements?',
        answer: `System Requirements:

**Browser Support:**
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Devices:**
- iOS 13+ (Safari)
- Android 8+ (Chrome)
- Progressive Web App (PWA) support for offline access

**Internet Connection:**
- Required for real-time updates
- Offline mode available for viewing cached data

**Screen Resolution:**
- Minimum: 1280x720
- Recommended: 1920x1080+
- Fully responsive design for tablets and mobile`,
      },
    ],
  },
]

export function FaqContent() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0)

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Search className="text-muted-foreground h-5 w-5" />
          <Input
            type="search"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      {/* FAQ Categories */}
      {filteredCategories.length > 0 ? (
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <Card key={category.category} className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <FileQuestion className="text-primary h-6 w-6" />
                <h2 className="text-foreground text-xl font-semibold">{category.category}</h2>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="text-foreground font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-muted-foreground pt-2 text-sm leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileQuestion className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="text-foreground mb-2 text-lg font-semibold">No Results Found</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            No FAQs match your search query. Try different keywords or browse all questions.
          </p>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </Card>
      )}

      {/* Still Need Help */}
      <Card className="border-[var(--color-info)]/20 bg-[var(--color-info-bg)] p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <h3 className="text-foreground mb-2 text-lg font-semibold">Still Need Help?</h3>
            <p className="text-muted-foreground text-sm">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
          </div>
          <Link href="/dashboard/feedback">
            <Button size="lg" className="gap-2">
              <FileQuestion className="h-4 w-4" />
              Contact Support
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
