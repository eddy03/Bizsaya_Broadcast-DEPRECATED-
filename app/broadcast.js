'use strict'

const Promise = require('bluebird')
const Async = require('async')
const _ = require('lodash')

const MidInformer = require('./notification')
const FB = require('./fb')
const Helper = require('./helpers')
const Audit = require('./models/audit')
const MessengerUserModel = require('./models/messenger_user')
const BroadcastMessageModel = require('./models/broadcast_message')

const _BROADCAST_KEY = process.env.REDIS_BROADCAST_KEY
const _TOTAL_MESSAGE_CAN_BE_SEND = 20

let Process = {}

Process.broadcastProcess = () => {
  Helper.debugLog('%s - searching for task', new Date())
  global.Redis.get(_BROADCAST_KEY)
    .then(broadCastDataIDs => getBroadcastData(broadCastDataIDs))
    .catch(err => global.Raven.captureException(err))
}

module.exports = Process

function getBroadcastData (broadCastDataIDs) {
  return new Promise((resolve, reject) => {
    Async.each(broadCastDataIDs, (dataId, callback) => {
      global.Redis.get(dataId)
        .then(data => {
          if (data) {
            return processSpecificData(data)
          } else {
            let index = _.findIndex(broadCastDataIDs, o => { return o === dataId })
            if (index !== -1) {
              broadCastDataIDs.splice(index, 1)
            }
            return global.Redis.set(_BROADCAST_KEY, broadCastDataIDs)
          }
        })
        .then(() => callback())
        .catch(err => callback(err))
    }, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function processSpecificData (data) {
  return new Promise(resolve => {
    resolve()
    Helper.debugLog('%s - Begin broadcasting', new Date())

    let _SINGLE_BROADCAST_KEY = `${_BROADCAST_KEY}_${data.page_id}`

    global.adminPush(`Up up and away`, `Page ${data.page_name} from index ${data.start} from ${data.toBeSend.length}`)
    Audit.logAudit(data.page_id, `Begin broadcast from index ${data.start}`, null)

    let i = 0
    for (i = 0; i < _TOTAL_MESSAGE_CAN_BE_SEND; i++) {
      if (data.toBeSend[(i + data.start)]) {
        sendTheMessage(data.page_id, data.access_token, data.mid, data.message, data.toBeSend[(i + data.start)])
          .then(() => { /* Broadcast success */ })
          .catch(err => { global.Raven.captureException(err) })
      } else {
        Audit.logAudit(data.page_id, `Broadcast successfully ended. Total broadcast ${data.start + i}`, null)
        MidInformer.sendToUser(data.page_id, data.mid, `Broadcast tamat. Sebanyak ${data.start + i} prospek telah dibroadcast dengan mesej yang anda berikan`)
        global.adminPush(`Broadcast ended`, `Broadcast for page ${data.page_id} ended. ${data.start + i} prospect are send with those message`)
        data.delete_this = true
        global.Redis.del(_SINGLE_BROADCAST_KEY)
          .then(() => BroadcastMessageModel.completeBroadcast(data))
          .catch(err => {
            Audit.logAudit(data.page_id, `Fail to update broadcast message detail`, null, true)
            global.Raven.captureException(err)
          })
        break
      }
    }

    // Update the current starting index
    if (!_.has(data, 'delete_this')) {
      data.start = data.start + i
      global.Redis.set(_SINGLE_BROADCAST_KEY, data)
        .then(() => { })
        .catch(err => { global.Raven.captureException(err) })
    }
  })
}

function sendTheMessage (pageId, accessToken, mid, messageData, recipientDetail) {
  return new Promise((resolve, reject) => {
    if (process.env.DONTSEND === 'true') { return }

    let senderId = recipientDetail.sender_id
    let senderName = recipientDetail.sender_name

    global.pubsub.tx(pageId)
    FB.broadcastMessage(senderId, senderName, messageData, accessToken)
      .then(() => FB.broadcastImage(senderId, messageData, accessToken))
      .then(() => resolve())
      .catch(response => {
        Helper.debugErr('Error send broadcast message ', response.error)
        if (response.error.code === 613) {
          global.Redis.del(`${_BROADCAST_KEY}_${pageId}`).then(() => { }).catch(err => { console.error('Error ', err) })
          MidInformer.sendToUser(pageId, mid, 'Penggunakan data FB page anda telah sampai ke had yang ditetapkan oleh FB. Bizsaya tidak mampu untuk menghantar sebarang mesej keluar.')
          resolve()
        } else if ((response.error.code === 200 && response.error.error_subcode === 1545041) || (response.error.code === 10 && response.error.error_subcode === 2018108)) {
          MessengerUserModel.deleteUser(pageId, senderId)
            .then(() => null)
            .catch(err => Audit.logAudit(pageId, `Fail to delete the prospek ${senderName}`, err, true))
          resolve()
        } else {
          Audit.logAudit(pageId, `Error during sending broadcast to ${senderId}`, response.error, true)
          let err = new Error(`Error send broadcast mesej in page ${pageId} for recipient ${senderId}`)
          err.error = response.error
          reject(err)
        }
      })
  })
}
