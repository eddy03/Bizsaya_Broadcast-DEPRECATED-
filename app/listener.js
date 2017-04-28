'use strict'

const Promise = require('bluebird')
const Async = require('async')
const _ = require('lodash')

const MidInformer = require('./notification')
const Audit = require('./models/audit')
const CredentialsModel = require('./models/credentials')
const PagesModel = require('./models/pages')
const MessengerUserModel = require('./models/messenger_user')
const FB = require('./fb')

let pusherListen = {}

pusherListen.listen = () => {
  return new Promise(resolve => {
    // Just resolve this promise immediately
    resolve()

    global.Pusher.subscribe(process.env.LISTEN_CHANNEL).bind(process.env.LISTEN_ACTIVITY, data => {
      Async.auto({
        getMID: cb => {
          CredentialsModel.getCredential(data.fb_id)
            .then(credential => { cb(null, credential); return null })
            .catch(err => { cb(err); return null })
        },
        getPageDetail: cb => {
          PagesModel.getPage(data.page_id)
            .then(page => { cb(null, page); return null })
            .catch(err => { cb(err); return null })
        },
        getListOfUsers: cb => {
          MessengerUserModel.getUsers(data.page_id)
            .then(users => { cb(null, users); return null })
            .catch(err => { cb(err); return null })
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
          message: _.cloneDeep(data),
          page_id: data.page_id,
          page_name: results.getPageDetail.name,
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
          FB.saveImageAsAttachment(data, data.page_id, dataToSave.access_token)
            .then(attachmentId => {
              dataToSave.message.attachment_id = attachmentId
              return global.Redis.set(`broadcast_${data.page_id}`, dataToSave)
            })
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
              global.adminPush(`Begin init broadcast`, `Page ${dataToSave.page_name} with total of ${dataToSave.toBeSend.length} prospect ready to be blast off!`)
              MidInformer.sendToUser(data.page_id, dataToSave.mid, `Memulakan proses untuk broadcast mesej di FB page anda. Terdapat sebanyak ${dataToSave.toBeSend.length} prospek dijangka menerima broadcast ini. Kami akan memaklumkan sekiranya terdapat mesej yang tidak boleh dihantar disini.`)
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
