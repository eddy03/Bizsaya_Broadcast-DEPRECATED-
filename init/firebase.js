'use strict'

const path = require('path')
const Promise = require('bluebird')
const googlePubSub = require('@google-cloud/pubsub')

const pubsub = googlePubSub({ keyFilename: './google_pubsub.json' })
const topic = pubsub.topic('update_realtime')

module.exports = new Promise(resolve => {

  let responseObj = {
    updateTx: () => {
      if (process.env.DEV !== 'true') {
        topic.publish({ task: 'BROADCAST_TX' })
      }
    }
  }

  resolve(responseObj)

})