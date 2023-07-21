// starting 1 minute before deployment time to handle potential downtime
const processStartTimeMs = Date.now() - 1 * 60 * 1000;

/**
 * We can pass an optional START_TIME env var to control the RSS parsing start
 * date. Default is process start time minus one minute.
 *
 * Iso date, eg. 2023-06-27T18:00:00.000Z
 */
const startTime = new Date(process.env.START_TIME || processStartTimeMs);

console.log(`Using ${startTime.toISOString()} as start time`)

function run(callback) {
  let lastRunDate = startTime;

  return function () {
    const now = new Date()
    callback(lastRunDate)
    lastRunDate = now
  }
}

module.exports = { run }
