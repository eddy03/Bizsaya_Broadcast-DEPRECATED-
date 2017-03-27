'use strict'

const Promise = require('bluebird')
const Async = require('async')
const _ = require('lodash')
const MidInformer = require('./mid_informer')
const Audit = require('./audit_trail')

let Process = {}

Process.broadcastProcess = () => {
  global.Redis.get('broadcast')
    .then(broadCastDataIDs => {
      return getBroadcastData(broadCastDataIDs)
    })
    .catch(err => {
      throw err
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

    Audit.logAudit(data.page_id, `Begin broadcast from index ${data.start}`, null)

    let i = 0
    for (i = 0; i < 20; i++) {
      if (data.toBeSend[(i + data.start)]) {
        sendTheMessage(data.page_id, data.access_token, data.mid, data.message, data.toBeSend[(i + data.start)])
      } else {
        Audit.logAudit(data.page_id, `Broadcast successfully ended. Total broadcast ${data.start + (i + 1)}`, null)
        if (data.mid) {
          MidInformer.sendToUser(data.mid, `Broadcast tamat. Sebanyak ${data.start + (i + 1)} telah dihantar dengan mesej yang anda berikan.`)
        }
        data.delete_this = true
        global.Redis.del(`broadcast_${data.page_id}`)
          .then(() => {
            let COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_broadcast_message' : 'broadcast_message'
            var key = global.DB.key([ COLLECTION_NAME, data.id ])
            global.DB.get(key, function (err, entity) {
              if (err) {
                throw err
              }
              if (entity) {
                entity.can_send = false
                entity.on_send = false
                entity.already_send = true
                global.DB.save({ key, data: entity }, err => {
                  if (err) {
                    console.error('Fail to update broadcast message')
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
        .then(() => {
          resolve()
        })
        .catch(err => {
          reject(err)
        })
    } else {
      // do nothing
    }
  })
}

function sendTheMessage (pageId, accessToken, mid, message, recipientId) {
  return new Promise((resolve, reject) => {
    global.FB.setAccessToken(accessToken)

    let params = {
      recipient: { id: recipientId },
      message: { text: message }
    }

    global.FB.api('me/messages', 'POST', params, response => {
      if (!response || response.error) {
        console.error('Error send broadcast message ', response.error.message)
        Audit.logAudit(pageId, `Error during sending broadcast to ${recipientId}`, response.error)
        if (response.error.code === 613) {
          global.Redis.del(`broadcast_${pageId}`).then(() => { }).catch(err => { console.error('Error ', err) })
          if (mid) {
            MidInformer.sendToUser(mid, 'Penggunakan data FB page anda telah sampai ke had yang ditetapkan oleh FB. Bizsaya tidak mampu untuk menghantar sebarang mesej keluar.')
          }
        } else {
          if (mid) {
            MidInformer.sendToUser(mid, `Terdapat ralat yang diberikan oleh FB sewaktu Bizsaya menghantar mesej keluar ke fan : ${recipientId}. Mesej ralat dari FB : ${response.error.message}`)
          }
          let err = new Error(`Error send broadcast mesej in page ${pageId} for recipient ${recipientId}`)
          err.error = response.error
          throw err
        }
      } else {
        // Audit trail anyone?
      }
    })

    resolve()
  })
}
