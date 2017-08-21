'use strict'

const Request = require('superagent')

let PN = {}

PN.adminPush = (subject, message) => {
  let sendData = {
    app_id: process.env.ONESIGNAL_ADMIN_APP_ID,
    headings: {en: subject},
    contents: {en: message},
    included_segments: ['All']
  }

  Request
    .post('https://onesignal.com/api/v1/notifications')
    .set('Authorization', 'Basic ' + process.env.ONESIGNAL_ADMIN_SECRET)
    .set('Content-Type', 'application/json; charset=utf-8')
    .send(sendData)
    .end(err => {
      if(err) {
        console.error('Error push notification ', err)
      }
    })
}

module.exports = PN
