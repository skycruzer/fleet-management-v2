import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentPilotUser, getFeedbackPosts } from '@/lib/services/pilot-portal-service'
import { format } from 'date-fns'
import { FeedbackPagination } from '@/components/portal/feedback-pagination'

interface FeedbackPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const pilotUser = await getCurrentPilotUser()

  if (!pilotUser || !pilotUser.registration_approved) {
    redirect('/auth/login')
  }

  // Get page from URL query params (default to 1)
  const params = await searchParams
  const currentPage = Number(params.page) || 1

  // Fetch paginated feedback posts (20 per page)
  const feedbackData = await getFeedbackPosts(currentPage, 20)
  const { posts: feedbackPosts, pagination } = feedbackData

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pilot Feedback</h1>
              <p className="mt-1 text-sm text-gray-600">
                {pilotUser.rank} {pilotUser.first_name} {pilotUser.last_name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/portal/feedback/new">
                <button
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Create new feedback post"
                >
                  + New Feedback
                </button>
              </Link>
              <Link href="/portal/dashboard">
                <button
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                  aria-label="Return to dashboard"
                >
                  ← Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Posts</p>
            <p className="text-3xl font-bold text-gray-900">{pagination.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Current Page</p>
            <p className="text-3xl font-bold text-gray-900">
              {pagination.page} of {pagination.totalPages}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Posts per Page</p>
            <p className="text-3xl font-bold text-gray-900">{pagination.limit}</p>
          </div>
        </div>

        {/* Feedback Posts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Feedback Posts</h2>
          </div>

          {feedbackPosts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedback Posts Yet</h3>
              <p className="text-gray-600 mb-6">
                Be the first to share your feedback and help improve our operations.
              </p>
              <Link href="/portal/feedback/new">
                <button
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Submit your first feedback post"
                >
                  Submit Your First Feedback
                </button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {feedbackPosts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {post.category && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {post.category.icon} {post.category.name}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.is_anonymous
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {post.is_anonymous ? '🕶️ Anonymous' : '👤 Public'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          By <strong>{post.author_display_name}</strong>
                          {post.author_rank && ` (${post.author_rank})`}
                        </span>
                        {post.created_at && (
                          <span>• {format(new Date(post.created_at), 'MMM dd, yyyy')}</span>
                        )}
                        {post.comment_count && post.comment_count > 0 && (
                          <span>• 💬 {post.comment_count} comments</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-8">
            <FeedbackPagination pagination={pagination} />
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">About Pilot Feedback</h3>
              <p className="text-blue-800 text-sm mb-3">
                The Pilot Feedback system allows you to share suggestions, concerns, and ideas with fleet management
                and fellow pilots. Your voice matters!
              </p>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>✅ Submit feedback anonymously or publicly</li>
                <li>✅ Engage in discussions with comments</li>
                <li>✅ Help improve operations and working conditions</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
