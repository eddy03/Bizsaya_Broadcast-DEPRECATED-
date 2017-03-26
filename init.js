'use strict'

const Promise = require('bluebird')
const googleCloudDatastore = require('@google-cloud/datastore')
const FB = require('fb')
const Raven = require('raven')

module.exports = () => {

  return new Promise((resolve, reject) => {

    if(process.env.DEV === 'false') {
      Raven.config('https://653b847e50b64856a6baedd49d757e9c:a343504656e84c8ebe0cfbef2232b011@sentry.io/152007').install()
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

    resolve({ FB, DB, Raven })

  })

}