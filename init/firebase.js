'use strict'

const path = require('path')
const Promise = require('bluebird')
const FirebaseAdmin = require('firebase-admin')

const options = {
  credential: FirebaseAdmin.credential.cert(path.join(__dirname, '../', 'firebase_credentials.json')),
  databaseURL: process.env.FIREBASE_DATABASE_URL
}

let realtimeTable = FirebaseAdmin.initializeApp(options).database().ref(process.env.FIREBASE_REALTIME_KEY_NAME)

module.exports = new Promise((resolve, reject) => {

  let realtimeData = null

  realtimeTable.once('value', data => {
    if (data.val()) {

      realtimeData = data.val()

      resolve({
        updateTx: () => {
          realtimeData.todayTx += 1
          realtimeData.totalTx += 1
          realtimeData.todayBroadcast += 1
          realtimeData.totalBroadcast += 1

          realtimeTable.update(realtimeData)
        }
      })
    } else {
      throw new Error('No Firebase data available!')
    }
  })

})