'use strict'

const Promise = require('bluebird')
const Voca = require('voca')

const Audit = require('./models/audit')

let FB = {}

FB.saveImageAsAttachment = (form, pageId, accessToken) => {
  return new Promise((resolve, reject) => {
    if (form.image_url) {
      let payload = {
        message: {
          attachment: {
            type: 'image',
            payload: {
              url: form.image_url,
              is_reusable: true
            }
          }
        }
      }

      global.Firebase.updateTx()
      global.FB.setAccessToken(accessToken)
      global.FB.api('/me/message_attachments', 'POST', payload, response => {
        if (response && response.error) {
          response.error.payload = payload
          Audit.logAudit(pageId, 'Cannot set image as reuseable', response.error, true)
          resolve(null)
        } else {
          resolve(response.attachment_id)
        }
      })
    } else {
      resolve(null)
    }
  })
}

FB.broadcastImage = (id, form, accessToken) => {
  return new Promise((resolve, reject) => {
    if (form.image_url && form.attachment_id) {
      let payload = {
        recipient: { id },
        message: {
          attachment: {
            type: 'image',
            payload: {
              attachment_id: form.attachment_id
            }
          }
        }
      }

      global.Firebase.updateTx()
      global.FB.setAccessToken(accessToken)
      global.FB.api('/me/messages', 'POST', payload, response => {
        if (response && response.error) {
          console.error('Image error ', response.error)
          let err = new Error('Cannot send image')
          err.error = response.error
          reject(err)
        } else {
          resolve()
        }
      })
    } else {
      resolve()
    }
  })
}

FB.broadcastMessage = (id, senderName, form, accessToken) => {
  return new Promise((resolve, reject) => {
    let buttons = []
    let payload = {
      recipient: { id },
      message: {}
    }

    let text = form.message
    text = Voca.replaceAll(text, '{{sender_name}}', senderName)
    text = Voca.truncate(text, 640)

    if (form.show_phone === true && form.contact_number_label.replace(/\s/g, '').length !== 0 && form.contact_number.replace(/\s/g, '').length !== 0) {
      buttons.push({
        type: 'phone_number',
        title: form.contact_number_label,
        payload: `+6${form.contact_number}`
      })
    }
    if (form.show_link === true && form.link_label.replace(/\s/g, '').length !== 0 && form.link.replace(/\s/g, '').length !== 0) {
      buttons.push({
        type: 'web_url',
        title: form.link_label,
        url: form.link,
        messenger_extensions: false
      })
    }

    if (buttons.length === 0) {
      payload.message = { text }
    } else {
      payload.message = {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text,
            buttons
          }
        }
      }
    }

    global.Firebase.updateTx()
    global.FB.setAccessToken(accessToken)
    global.FB.api('/me/messages', 'POST', payload, response => {
      if (response && response.error) {
        let err = new Error('Cannot send messages')
        err.error = response.error
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

module.exports = FB
