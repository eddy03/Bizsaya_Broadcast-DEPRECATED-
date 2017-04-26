'use strict'

const Promise = require('bluebird')
const Async = require('async')
const MidInformer = require('./notification')
const Audit = require('./audit')

const PAGES_TABLE = process.env.DEV === 'true' ? 'dev_pages' : 'pages'
const MESSENGER_USER_TABLE = process.env.DEV === 'true' ? 'dev_messenger_user' : 'messenger_user'
const CREDENTIALS_TABLE = process.env.DEV === 'true' ? 'dev_credentials' : 'credentials'

let pusherListen = {}

pusherListen.listen = () => {
  return new Promise(resolve => {
    // Just resolve this promise immediately
    resolve()

    global.Pusher.subscribe(process.env.LISTEN_CHANNEL).bind(process.env.LISTEN_ACTIVITY, data => {
      const DB = global.DB

      Async.auto({
        getMID: cb => {
          DB.get(DB.key([ CREDENTIALS_TABLE, data.fb_id ]), (err, entity) => { cb(err, entity) })
        },
        getPageDetail: cb => {
          DB.get(DB.key([ PAGES_TABLE, data.page_id ]), (err, entity) => { cb(err, entity) })
        },
        getListOfUsers: cb => {
          let query = DB.createQuery(MESSENGER_USER_TABLE).filter('page_id', data.page_id)
          DB.runQuery(query, (err, users) => { cb(err, users) })
        }
      }, (err, results) => {
        if (err) {
          let error = new Error(`Fail to initialize the broadcast detail for page ${data.page_id}`)
          error.error = err
          global.Raven.captureException(error)
          return
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
          dataToSave.toBeSend.push({
            sender_id: user.sender_id,
            sender_name: `${user.first_name} ${user.last_name}`
          })
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
              dataToSave.totalToBeMessage = dataToSave.toBeSend.length
              delete dataToSave.toBeSend
              Audit.logAudit(data.page_id, `Redis broadcast setup properly`, dataToSave)
              return null
            })
            .catch(err => {
              Audit.logAudit(data.page_id, `Fail to setup the redis broadcast for page ${data.page_id}`, dataToSave, true)
              let error = new Error('Fail to setup the redis broadcast for page ', data.page_id)
              error.error = err
              dataToSave.totalToBeMessage = dataToSave.toBeSend.length
              delete dataToSave.toBeSend
              error.payload = dataToSave
              global.Raven.captureException(error)
            })
        })
      })
    })
  })
}

module.exports = pusherListen
