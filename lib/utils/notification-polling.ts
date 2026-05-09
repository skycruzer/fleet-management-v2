export function shouldFetchNotifications(
  visibilityState: DocumentVisibilityState,
  options: { force?: boolean } = {}
) {
  return options.force === true || visibilityState === 'visible'
}
