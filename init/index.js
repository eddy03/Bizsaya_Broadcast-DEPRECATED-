'use strict'

const Promise = require('bluebird')
const database = require('./database')
const facebook = require('./facebook')
const pusherjs = require('./pusher_js')
const redisClient = require('./redis')
const sentry = require('./sentry')
const PusherListen = require('../pusher_listen')

let init = {}

init.initialize = () => {
  return new Promise((resolve, reject) => {
    global.DB = database.initDB()

    global.FB = facebook.initFB()

    global.Pusher = pusherjs.initPusher()

    global.Redis = redisClient.initRedis()

    sentry.initSentry()

    PusherListen.listen()
  })
}

module.exports = init
