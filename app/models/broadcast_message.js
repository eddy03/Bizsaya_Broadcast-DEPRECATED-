'use strict'

const Promise = require('bluebird')

const COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_broadcast_message' : 'broadcast_message'

let MessengerUserModel = {}

MessengerUserModel.getBroadcastMessage = data => {
  return new Promise((resolve, reject) => {
    const key = global.DB.key([ COLLECTION_NAME, data.id ])
    global.DB.get(key, function (err, broadcaseMessage) {
      if (err) {
        reject(err)
      } else {
        resolve(broadcaseMessage)
      }
    })
  })
}

MessengerUserModel.saveBroadcastMessage = data => {
  return new Promise((resolve, reject) => {
    const key = global.DB.key([ COLLECTION_NAME, data.id ])

    data.created_at = new Date(data.created_at)
    data.updated_at = new Date()

    global.DB.save({ key, data }, err => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

MessengerUserModel.completeBroadcast = data => {
  return MessengerUserModel.getBroadcastMessage(data)
    .then(broadcastMessage => {
      if (broadcastMessage) {
        broadcastMessage.can_send = false
        broadcastMessage.on_send = false
        broadcastMessage.already_send = true
        return MessengerUserModel.updateBroadcastMessage(broadcastMessage)
      } else {
        return new Promise(resolve => { resolve() })
      }
    })
}

module.exports = MessengerUserModel
