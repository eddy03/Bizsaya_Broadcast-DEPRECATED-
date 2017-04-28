'use strict'

const Moment = require('moment')
const RandomString = require('randomstring')

const COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_broadcast_log' : 'broadcast_log'

let BroadcastLogModel = {}

BroadcastLogModel.getPageDetail = data => {
  data.id = Moment().unix() + '_' + RandomString.generate()
  let key = global.DB.key([COLLECTION_NAME, data.id])

  data.created_at = new Date()
  data.to_be_delete_at = Moment().add(1, 'M').format('YYYY/MM/DD')

  global.DB.save({ key, data }, err => {
    if (err) {
      global.Raven.captureException(err)
    }
  })
}

module.exports = BroadcastLogModel
