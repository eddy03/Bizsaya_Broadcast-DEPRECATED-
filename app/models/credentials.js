'use strict'

const Promise = require('bluebird')

const COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_credentials' : 'credentials'

let CredentialModel = {}

CredentialModel.getCredential = fbId => {
  return new Promise((resolve, reject) => {
    let key = global.DB.key([ COLLECTION_NAME, fbId ])
    global.DB.get(key, (err, credentialObj) => {
      if (err) {
        reject(err)
      } else {
        resolve(credentialObj)
      }
    })
  })
}

module.exports = CredentialModel
