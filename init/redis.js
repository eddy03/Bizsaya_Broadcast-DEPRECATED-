'use strict'

const Promise = require('bluebird')
const redisClient = require('redis').createClient()

let redis = {}

redis.initRedis = () => {
  redisClient.on('ready', () => { console.log('Connection to redis is successfully connected') })

  return {
    get: key => {
      return new Promise((resolve, reject) => {
        redisClient.get(key, (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(JSON.parse(data))
          }
        })
      })
    },
    set: (key, data) => {
      return new Promise((resolve, reject) => {
        redisClient.set(key, JSON.stringify(data), err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    },
    del: key => {
      return new Promise((resolve, reject) => {
        redisClient.del(key, err => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }
  }
}

module.exports = redis
