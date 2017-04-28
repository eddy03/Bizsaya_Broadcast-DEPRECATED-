'use strict'

const Promise = require('bluebird')

const COLLECTION_NAME = process.env.DEV === 'true' ? 'dev_pages' : 'pages'

let PagesModel = {}

PagesModel.getPage = pageId => {
  return new Promise((resolve, reject) => {
    let key = global.DB.key([ COLLECTION_NAME, pageId ])
    global.DB.get(key, (err, pageObj) => {
      if (err) {
        reject(err)
      } else {
        resolve(pageObj)
      }
    })
  })
}

module.exports = PagesModel
