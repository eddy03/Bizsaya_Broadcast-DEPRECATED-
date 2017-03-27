'use strict'

const PusherJs = require('pusher-js/node')

let Pusher = {}

Pusher.initPusher = () => {
  return new PusherJs(process.env.PUSHER_KEY, {
    cluster: 'ap1',
    encrypted: true
  })
}

module.exports = Pusher
