'use strict'

const Moment = require('moment')
const RandomString = require('randomstring')

const COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_broadcast_log' : 'broadcast_log'

let Audit = {}

Audit.logAudit = (pageId, message, payload, isError) => {
  let id = Moment().unix() + '_' + RandomString.generate()
  let key = global.DB.key([COLLECTION_NAME, id])

  let data = [{
    name: 'id',
    value: id
  }, {
    name: 'page_id',
    value: pageId
  }, {
    name: 'message',
    value: message,
    excludeFromIndexes: true
  }, {
    name: 'payload',
    value: payload,
    excludeFromIndexes: true
  }, {
    name: 'is_error',
    value: isError || false
  }, {
    name: 'created_at',
    value: new Date()
  }, {
    name: 'delete_at',
    value: Moment().add(3, 'd').format('YYYY/MM/DD')
  }]

  global.DB.save({ key, data }, err => {
    if (err) {
      global.Raven.captureException(err)
    }
  })
}

module.exports = Audit
