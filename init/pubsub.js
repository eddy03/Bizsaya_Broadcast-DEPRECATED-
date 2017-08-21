'use strict'

const googlePubSub = require('@google-cloud/pubsub')
const listener = require('../app/listener')

const _TOPIC = process.env.DEV === 'true' ? `dev_${process.env.PUBSUB_TOPIC}` : process.env.PUBSUB_TOPIC
const _MYNAME = process.env.DEV === 'true' ? `dev_${process.env.PUBSUB_MYNAME}` : process.env.PUBSUB_MYNAME
const _REALTIME = process.env.DEV === 'true' ? `dev_${process.env.REALTIME_PUBSUB_TOPIC}` : process.env.REALTIME_PUBSUB_TOPIC

module.exports = () => {
  let pubsub = googlePubSub({ keyFilename: './google_pubsub.json' })

  pubsub.subscribe(_TOPIC, _MYNAME, { autoAck: true }, (err, subscriptions) => {
    if (err) {
      console.error('Error initialize subscription to google Pubsub', err)
    } else {
      console.log('Connection to google PubSub is established')
      subscriptions.on('message', message => listener(message.data))
    }
  })

  return {
    tx: pageId => {
      let realtimeTopic = pubsub.topic(_REALTIME)
      realtimeTopic.publish({ task: 'BROADCAST_TX', data: { pageId } })
    }
  }
}
