'use strict'

const Promise = require('bluebird')

const database = require('./database')
const facebook = require('./facebook')
const pusherjs = require('./pusher_js')
const redisClient = require('./redis')
const sentry = require('./sentry')
const firebase = require('./firebase')
const PusherListen = require('../app/pusher_listen')

let init = {}

init.initialize = () => {
  return new Promise((resolve, reject) => {
    global.DB = database.initDB()
    global.FB = facebook.initFB()
    global.Pusher = pusherjs.initPusher()
    global.Redis = redisClient.initRedis()
    global.Raven = sentry.initSentry()

    PusherListen.listen()

    firebase
      .then(data => {
        global.Firebase = data
        resolve()
      })
      .catch(err => {
        reject(err)
      })
  })
}

module.exports = init
