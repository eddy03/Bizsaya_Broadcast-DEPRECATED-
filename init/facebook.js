'use strict'

const facebook = require('fb')
const options = {
  appId: process.env.FB_APP_ID,
  appSecret: process.env.FB_APP_SECRET
}

let FB = {}

FB.initFB = () => {
  return facebook.extend(options)
}

module.exports = FB
