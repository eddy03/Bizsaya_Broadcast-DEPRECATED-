'use strict'

const Promise = require('bluebird')
const _ = require('lodash')

const Audit = require('./models/audit')

let mid = {}

mid.sendToUser = (pageId, id, text) => {
  let payload = {
    recipient: { id },
    message: { text }
  }

  sendTo(pageId, id, payload)
}

mid.readyToBroadcast = (pageId, id) => {
  let payload = {
    recipient: { id },
    message: {
      attachment: {
        type: 'image',
        payload: {
          url: process.env.GIF
        }
      }
    }
  }

  sendTo(pageId, id, payload)
}

module.exports = mid

function sendTo (pageId, id, payload) {
  return new Promise((resolve, reject) => {
    if (id && !_.isEmpty(id)) {
      global.pubsub.tx(pageId)
      global.FB.setAccessToken(process.env.ACCESSTOKEN)

      global.FB.api('me/messages', 'POST', payload, response => {
        if (!response || response.error) {
          if (process.env.DEV === 'true') {
            console.log('Send MID informer error : ', response.error)
          }
          let err = new Error(`Unable to send notification to user ${id} on broadcast module!`)
          err.error = response.error
          Audit.logAudit(pageId, `Unable to send notification to admin MID ${id}`, response.error, true)
          global.Raven.captureException(err)
          reject(err)
        } else {
          let message = payload.message.text ? payload.message.text : `Send ready to broadcast to admin mid ${id}`
          Audit.logAudit(pageId, 'To Admin Message : ' + message, null)
          resolve()
        }
      })
    } else {
      resolve()
    }
  })
}
