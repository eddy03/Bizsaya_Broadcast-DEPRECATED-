'use strict'

const Promise = require('bluebird')
const googleCloudDatastore = require('@google-cloud/datastore')
const FB = require('fb')
const Raven = require('raven')
const PusherJs = require('pusher-js/node')
const RedisClient = require('redis').createClient()
const PusherListen = require('./pusher_listen')

module.exports = () => {

  return new Promise(resolve => {

    if (process.env.DEV === 'false') {
      Raven.config(process.env.SENTRY).install()
    } else {
      console.log('Bizsaya broadcast currently running as development')
    }

    const DB = googleCloudDatastore({
      keyFilename: './google_keyfile.json'
    })

    FB.extend({
      appId: process.env.FB_APP_ID,
      appSecret: process.env.FB_APP_SECRET
    })

    const pusherClient = new PusherJs(process.env.PUSHER_KEY, {
      cluster: 'ap1',
      encrypted: true
    })

    RedisClient.on('ready', () => { console.log('Redis is ready to be use') })

    let redisClient = {
      get: key => {
        return new Promise((resolve, reject) => {
          RedisClient.get(key, (err, data) => {
            if (err) {
              reject(err)
            } else {
              resolve(JSON.parse(data))
            }
          })
        })
      },
      set: (key, data) => {
        return new Promise((resolve, reject) => {
          RedisClient.set(key, JSON.stringify(data), err => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })
      },
      del: key => {
        return new Promise((resolve, reject) => {
          RedisClient.del(key, err => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        })
      }
    }

    global.FB = FB
    global.DB = DB
    global.Pusher = pusherClient
    global.Redis = redisClient

    PusherListen.listen()

    resolve()

  })

}