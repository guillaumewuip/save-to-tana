export function info(...message) {
  console.info(...message)
}

export function debug(...message) {
  if (process.env.DEBUG === 'true') {
    console.debug(...message)
  }
}

export function error(...error) {
  console.error(...error)
}