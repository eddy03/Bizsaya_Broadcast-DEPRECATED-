'use strict'

const facebook = require('fb')

let FB = {}

FB.initFB = () => {
  return facebook.extend({
    appId: process.env.FB_APP_ID,
    appSecret: process.env.FB_APP_SECRET
  })
}

module.exports = FB
