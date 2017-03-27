'use strict'

const Raven = require('raven')

let sentry = {}

sentry.initSentry = () => {
  if (process.env.DEV === 'false') {
    Raven.config(process.env.SENTRY).install()
  } else {
    console.log('Bizsaya broadcast currently running as development')
  }
}

module.exports = sentry
