'use strict'

const path = require('path')
const googleCloudDatastore = require('@google-cloud/datastore')

const options = {
  keyFilename: path.join(__dirname, '../', process.env.DB_CREDENTIAL)
}

let DB = {}

DB.initDB = () => {
  return googleCloudDatastore(options)
}

module.exports = DB
