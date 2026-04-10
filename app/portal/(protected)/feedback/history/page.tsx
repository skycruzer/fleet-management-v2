/**
 * Feedback History Redirect
 *
 * Redirects to the main feedback page which now shows all feedback history.
 */

import { redirect } from 'next/navigation'

export default function FeedbackHistoryRedirect() {
  redirect('/portal/feedback')
}
