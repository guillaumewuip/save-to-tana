function info(...message) {
  console.info(...message)
}

function debug(...message) {
  if (process.env.DEBUG === 'true') {
    console.debug(...message)
  }
}

function error(...error) {
  console.error(...error)
}

module.exports = {
  info,
  debug,
  error,
}
