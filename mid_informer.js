'use strict'

let mid = {}

mid.sendToUser = (id, text) => {

  global.FB.setAccessToken(process.env.ACCESSTOKEN)

  let params = {
    recipient: { id },
    message: { text }
  }

  global.FB.api('me/messages', 'POST', params, response => {
    if (!response || response.error) {
      let err = new Error(`Unable to send notification to user ${id} on broadcast module!`)
      err.error = response.error
      throw err
    } else {
      // Audit trail anyone?
    }
  })

}

mid.readyToBroadcast = id => {

  global.FB.setAccessToken(process.env.ACCESSTOKEN)

  let params = {
    recipient: { id },
    message: {
      attachment: {
        type: 'image',
        payload: {
          url: process.env.GIF
        }
      }
    }
  }

  global.FB.api('me/messages', 'POST', params, response => {
    if (!response || response.error) {
      let err = new Error(`Unable to send notification to user ${id} on broadcast module!`)
      err.error = response.error
      throw err
      console.log('Error ', response.error)
    } else {
      // Audit trail anyone?
    }
  })
}

module.exports = mid