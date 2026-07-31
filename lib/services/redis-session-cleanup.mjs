/**
 * Runtime-neutral Redis session cleanup shared by the Next.js auth service and
 * standalone credential-remediation scripts.
 *
 * @param {{ smembers: (key: string) => Promise<string[]>, pipeline: () => {
 *   del: (key: string) => unknown,
 *   exec: () => Promise<unknown>
 * } }} redis
 * @param {string} userId
 * @returns {Promise<number>} number of session tokens removed
 */
export async function clearRedisUserSessions(redis, userId) {
  const setKey = `user:sessions:${userId}`
  const tokens = await redis.smembers(setKey)

  if (tokens.length === 0) {
    return 0
  }

  const pipeline = redis.pipeline()
  for (const token of tokens) {
    pipeline.del(`session:${token}`)
  }
  pipeline.del(setKey)
  await pipeline.exec()

  return tokens.length
}
