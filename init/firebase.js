'use strict'

const path = require('path')
const Promise = require('bluebird')
const FirebaseAdmin = require('firebase-admin')

const options = {
  credential: FirebaseAdmin.credential.cert(path.join(__dirname, '../', process.env.FIREBASE_CREDENTIAL)),
  databaseURL: process.env.FIREBASE_DATABASE_URL
}

const realTimeDatabase = FirebaseAdmin.initializeApp(options).database().ref(process.env.FIREBASE_REALTIME_KEY_NAME)

module.exports = new Promise((resolve, reject) => {
  let realTimeStats = null

  realTimeDatabase.once('value', data => {
    if (data.val()) {
      realTimeStats = data.val()

      let responseObj = {
        updateTx: () => {
          realTimeStats.todayTx += 1
          realTimeStats.totalTx += 1
          realTimeStats.todayBroadcast += 1
          realTimeStats.totalBroadcast += 1

          if (process.env.DEV !== 'true') {
            realTimeDatabase.update(realTimeStats)
          }
        }
      }

      resolve(responseObj)
    } else {
      throw new Error('No Firebase data available!')
    }
  })
})
