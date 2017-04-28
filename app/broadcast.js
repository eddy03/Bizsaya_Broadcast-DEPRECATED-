'use strict'

const Promise = require('bluebird')
const Async = require('async')
const _ = require('lodash')

const MidInformer = require('./notification')
const FB = require('./fb')
const Audit = require('./models/audit')

const MessengerUserModel = require('./models/messenger_user')

let Process = {}

Process.broadcastProcess = () => {
  if (process.env.DEV === 'true') {
    console.log('%s - searching for task', new Date())
  }

  global.Redis.get('broadcast')
    .then(broadCastDataIDs => {
      return getBroadcastData(broadCastDataIDs)
    })
    .catch(err => {
      global.Raven.captureException(err)
    })
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
            return global.Redis.set('broadcast', broadCastDataIDs)
          }
        })
        .then(() => {
          callback()
        })
        .catch(err => {
          callback(err)
        })
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
  return new Promise((resolve, reject) => {
    resolve()

    if (process.env.DEV === 'true') {
      console.log('%s - Begin broadcasting', new Date())
    }

    global.adminPush(`Up up and away`, `Page ${data.page_name} from index ${data.start} from ${data.toBeSend.length}`)
    Audit.logAudit(data.page_id, `Begin broadcast from index ${data.start}`, null)

    let i = 0
    for (i = 0; i < 20; i++) {
      if (data.toBeSend[(i + data.start)]) {
        sendTheMessage(data.page_id, data.access_token, data.mid, data.message, data.toBeSend[(i + data.start)])
          .then(() => { /* Broadcast success */ })
          .catch(err => { global.Raven.captureException(err) })
      } else {
        Audit.logAudit(data.page_id, `Broadcast successfully ended. Total broadcast ${data.start + i}`, null)
        MidInformer.sendToUser(data.page_id, data.mid, `Broadcast tamat. Sebanyak ${data.start + i} prospek telah dibroadcast dengan mesej yang anda berikan`)
        global.adminPush(`Broadcast ended`, `Broadcast for page ${data.page_id} ended. ${data.start + i} prospect are send with those message`)
        data.delete_this = true
        global.Redis.del(`broadcast_${data.page_id}`)
          .then(() => {
            let COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_broadcast_message' : 'broadcast_message'
            var key = global.DB.key([ COLLECTION_NAME, data.id ])
            global.DB.get(key, function (err, entity) {
              if (err) {
                global.Raven.captureException(err)
              }
              if (entity) {
                entity.can_send = false
                entity.on_send = false
                entity.already_send = true

                if (process.env.DEV === 'true') {
                  entity.can_send = true
                  entity.on_send = false
                  entity.already_send = false
                }

                global.DB.save({ key, data: entity }, err => {
                  if (err) {
                    global.Raven.captureException(err)
                    Audit.logAudit(data.page_id, `Fail to update broadcast message detail`, null, true)
                  }
                })
              }
            })
          })
          .catch(err => {
            console.error('Error ', err)
          })
        break
      }
    }

    if (!_.has(data, 'delete_this')) {
      data.start = data.start + i
      global.Redis.set(`broadcast_${data.page_id}`, data)
        .then(() => { })
        .catch(err => { global.Raven.captureException(err) })
    } else {
      // do nothing
    }
  })
}

function sendTheMessage (pageId, accessToken, mid, messageData, recipientDetail) {
  return new Promise((resolve, reject) => {
    if (process.env.DONTSEND === 'true') {
      return
    }

    let senderId = recipientDetail.sender_id
    let senderName = recipientDetail.sender_name

    FB.broadcastMessage(senderId, senderName, messageData, accessToken)
      .then(() => {
        return FB.broadcastImage(senderId, messageData, accessToken)
      })
      .then(() => {
        resolve()
      })
      .catch(response => {
        if (process.env.DEV === 'true') {
          console.error('Error send broadcast message ', response.error.message)
        }

        if (response.error.code === 613) {
          global.Redis.del(`broadcast_${pageId}`).then(() => { }).catch(err => { console.error('Error ', err) })
          MidInformer.sendToUser(pageId, mid, 'Penggunakan data FB page anda telah sampai ke had yang ditetapkan oleh FB. Bizsaya tidak mampu untuk menghantar sebarang mesej keluar.')
          resolve()
        } else if (response.error.code === 200 && response.error.error_subcode === 1545041) {
          MessengerUserModel.deleteUser(pageId, senderId)
            .then(() => {
              MidInformer.sendToUser(pageId, mid, `Mesej ke prospek ${senderName} tidak dapat dihantar kerana prospek telah memadam mesej dengan FB page anda sebelum ini atau akaun FB prospek tersebut telah dipadam oleh FB.`)
              return null
            })
            .catch(err => {
              Audit.logAudit(pageId, `Fail to delete the prospek ${senderName}`, err, true)
            })
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
