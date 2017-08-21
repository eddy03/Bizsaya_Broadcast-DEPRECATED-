'use strict'

let helper = {}

helper.debugLog = (message, ...args) => {
  if (process.env.DEV === 'true') {
    console.log(message, ...args)
  }
}

helper.debugErr = (msg, ...args) => {
  if (process.env.DEV === 'true') {
    console.error(msg, ...args)
  }
}

module.exports = helper
