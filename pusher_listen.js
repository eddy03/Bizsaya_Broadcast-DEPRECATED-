'use strict'

const Promise = require('bluebird')
const Async = require('async')
const MidInformer = require('./mid_informer')
const Audit = require('./audit_trail')

let pusherListen = {}

pusherListen.listen = () => {
  return new Promise(resolve => {
    // Just resolve this promise immediately
    resolve()

    global.Pusher.subscribe(process.env.LISTEN_CHANNEL).bind(process.env.LISTEN_ACTIVITY, data => {
      Async.auto({

        getPageDetail: cb => {
          let COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_pages' : 'pages'
          var key = global.DB.key([ COLLECTION_NAME, data.page_id ])
          global.DB.get(key, function (err, entity) {
            cb(err, entity)
          })
        },

        getListOfUsers: cb => {
          let COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_messenger_user' : 'messenger_user'
          let query = global.DB.createQuery(COLLECTION_NAME).filter('page_id', data.page_id)
          global.DB.runQuery(query, (err, users) => {
            cb(err, users)
          })
        },

        getMID: cb => {
          let COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_credentials' : 'credentials'
          var key = global.DB.key([ COLLECTION_NAME, data.fb_id ])
          global.DB.get(key, function (err, entity) {
            cb(err, entity)
          })
        }

      }, (err, results) => {
        if (err) {
          let error = new Error('Fail to initialize the broadcast detail for page ', data.page_id)
          error.error = err
          throw error
        }

        let dataToSave = {
          id: data.id,
          message: data.message,
          page_id: data.page_id,
          mid: results.getMID.mid,
          access_token: results.getPageDetail.access_token,
          toBeSend: [],
          start: 0
        }

        Async.each(results.getListOfUsers, (user, callback) => {
          dataToSave.toBeSend.push(user.sender_id)
          callback()
        }, () => {
          global.Redis.set(`broadcast_${data.page_id}`, dataToSave)
            .then(() => {
              return global.Redis.get('broadcast')
            })
            .then(broadcastList => {
              if (broadcastList) {
                broadcastList.push(`broadcast_${data.page_id}`)
                return global.Redis.set('broadcast', broadcastList)
              } else {
                return global.Redis.set('broadcast', [ `broadcast_${data.page_id}` ])
              }
            })
            .then(() => {
              MidInformer.sendToUser(data.page_id, dataToSave.mid, `Memulakan proses untuk broadcast mesej di FB page anda. Terdapat sebanyak ${dataToSave.toBeSend.length} fans dijangka menerima broadcast ini. Kami akan memaklumkan sekiranya terdapat mesej yang tidak boleh dihantar disini.`)
              MidInformer.readyToBroadcast(data.page_id, dataToSave.mid)
              Audit.logAudit(data.page_id, `Redis broadcast setup properly`, dataToSave)
              return null
            })
            .catch(err => {
              Audit.logAudit(data.page_id, `Fail to setup the redis broadcast for page ${data.page_id}`, dataToSave, true)
              let error = new Error('Fail to setup the redis broadcast for page ', data.page_id)
              error.error = err
              error.payload = dataToSave
              throw error
            })
        })
      })
    })
  })
}

module.exports = pusherListen
