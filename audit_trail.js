'use strict'

const Moment = require('moment')
const RandomString = require('randomstring')

let Audit = {}

Audit.logAudit = (pageId, message, payload, isError) => {
  let COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_broadcast_log' : 'broadcast_log'

  let id = Moment().unix() + '_' + RandomString.generate()
  let key = global.DB.key([COLLECTION_NAME, id])

  let data = {
    id: id,
    page_id: pageId,
    message,
    payload,
    is_error: isError || false,
    created_at: new Date()
  }

  global.DB.save({ key, data }, err => {
    if (err) {
      throw err
    }
  })
}

module.exports = Audit
