'use strict'

const Audit = require('./audit_trail')

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
  if (id) {
    global.FB.setAccessToken(process.env.ACCESSTOKEN)

    global.FB.api('me/messages', 'POST', payload, response => {
      if (!response || response.error) {
        console.log('Send MID informer error : ', response.error)
        let err = new Error(`Unable to send notification to user ${id} on broadcast module!`)
        err.error = response.error
        throw err
      } else {
        let message = payload.message.text ? payload.message.text : `Send ready to broadcast to admin mid ${id}`
        Audit.logAudit(pageId, message, null)
      }
    })
  }
}
