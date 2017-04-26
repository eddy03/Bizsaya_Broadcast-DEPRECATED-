'use strict'

const Promise = require('bluebird')

const COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_messenger_user' : 'messenger_user'

let MessengerUserModel = {}

MessengerUserModel.getUsers = pageId => {

  return new Promise((resolve, reject) => {

    let query = global.DB.createQuery(COLLECTION_NAME)
      .filter('page_id', pageId)

    global.DB.runQuery(query, (err, users) => {
      if(err) {
        reject(err)
      } else {
        resolve(users)
      }
    })

  })

}

MessengerUserModel.deleteUser = (pageId, senderId) => {

  return new Promise((resolve, reject) => {

    let key = global.DB.key([ COLLECTION_NAME, `${pageId}__${senderId}` ])
    global.DB.get(key, err => {
      if(err) {
        reject(err)
      } else {
        resolve(true)
      }
    })

  })

}

module.exports = MessengerUserModel