'use strict'

const Promise = require('bluebird')
const googleCloudDatastore = require('@google-cloud/datastore')
const facebook = require('fb')

const redisClient = require('./redis')
const googlePubSub = require('./pubsub')

const sentry = require('./sentry')
const pushnotification = require('./push_notification')

let init = {}

init.initialize = () => {
  return new Promise(resolve => {
    global.DB = googleCloudDatastore({ keyFilename: './google_keyfile.json' })

    global.FB = facebook.extend({
      appId: process.env.FB_APP_ID,
      appSecret: process.env.FB_APP_SECRET
    })

    global.Redis = redisClient.initRedis()
    global.Raven = sentry.initSentry()
    global.adminPush = pushnotification.adminPush

    global.pubsub = googlePubSub()

    resolve()
  })
}

module.exports = init
