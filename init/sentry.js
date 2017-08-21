'use strict'

const Raven = require('raven')

let sentry = {}

sentry.initSentry = () => {
  if (process.env.DEV === 'false') {
    Raven.config(process.env.SENTRY).install()
    return Raven
  } else {
    console.log('Bizsaya broadcast currently running as development')
    return { captureException: err => console.error('Error ', err) }
  }
}

module.exports = sentry
