'use strict'

const googleCloudDatastore = require('@google-cloud/datastore')

let DB = {}

DB.initDB = () => {
  return googleCloudDatastore({
    keyFilename: './google_keyfile.json'
  })
}

module.exports = DB
