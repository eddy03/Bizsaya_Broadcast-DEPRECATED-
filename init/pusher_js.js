'use strict'

const PusherJs = require('pusher-js/node')

const options = {
  cluster: 'ap1',
  encrypted: true
}

let Pusher = {}

Pusher.initPusher = () => {
  return new PusherJs(process.env.PUSHER_KEY, options)
}

module.exports = Pusher
