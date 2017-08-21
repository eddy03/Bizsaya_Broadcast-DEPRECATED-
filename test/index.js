'use strict'

const { spawn } = require('child_process')
const _ = require('lodash')
const googleCloudDatastore = require('@google-cloud/datastore')

const DB = googleCloudDatastore({ keyFilename: './google_keyfile.json' })

describe('test broadcast', function () {

  describe('initialization testing functionality', function () {

    it('can be boot up', function (done) {

      this.timeout(5200)

      let broadcastInstance = spawn('node', ['index.js'])

      let timeout = setTimeout(() => {
        done(new Error('Fail to bootup'))
        broadcastInstance.kill()
      }, 5000)

      broadcastInstance.stdout.on('data', data => {
        if(_.trim(data.toString(), '\n') === 'Bizsaya Broadcast is ready') {
          done()
          broadcastInstance.kill()
          clearTimeout(timeout)
        }
      })

      broadcastInstance.stderr.on('data', () => {
        let err = new Error('Error during bootup broadcast instance')
        done(err)
        broadcastInstance.kill()
        clearTimeout(timeout)
      })

    })

    it('Can make connection to google Pubsub', function (done) {

      this.timeout(5200)

      let broadcastInstance = spawn('node', ['index.js'])

      let timeout = setTimeout(() => {
        done(new Error('Fail to make connection to google pubsub'))
        broadcastInstance.kill()
      }, 5000)

      broadcastInstance.stdout.on('data', data => {
        if(_.trim(data.toString(), '\n') === 'Connection to google PubSub is established') {
          done()
          broadcastInstance.kill()
          clearTimeout(timeout)
        }
      })

      broadcastInstance.stderr.on('data', () => {
        let err = new Error('Error during bootup broadcast instance')
        done(err)
        broadcastInstance.kill()
        clearTimeout(timeout)
      })

    })

  })

  describe('functions testing', function () {

    let broadcastInstance = null
    let data = {}
    let topicPubSub = null

    before(function (done) {

      this.timeout(6000)

      broadcastInstance = spawn('node', ['index.js'])

      let timeout = setTimeout(() => {
        done(new Error('Fail to bootup broadcast instance'))
      }, 5000)

      broadcastInstance.stdout.on('data', data => {
        let msg = _.trim(data.toString(), '\n')
        console.log(msg)
        if(msg === 'Connection to google PubSub is established') {
          done()
          clearTimeout(timeout)
        }
      })

    })

    before(function (done) {

      this.timeout(2000)

      let query = DB.createQuery('dev_broadcast_message').limit(1)

      DB.runQuery(query, (err, broadcastMessage) => {
        if (err) {
          done(err)
        } else {
          data = broadcastMessage[0]
          done()
        }
      })

    })

    before(function (done) {

      this.timeout(4000)

      require('dotenv').config()
      topicPubSub = require('@google-cloud/pubsub')({ keyFilename: './google_pubsub.json' }).topic(`dev_${process.env.PUBSUB_TOPIC}`)
      done()

    })

    it.skip('Can listen to correct pubsub command', function (done) {

      this.timeout(10000)

      let timeout = setTimeout(() => done(new Error('Unable to process pubsub command in time')), 9000)

      topicPubSub.publish(data)
      let weGetIt = false
      broadcastInstance.stdout.on('data', data => {
        let msg = _.trim(data.toString(), '\n')
        if(msg.match(/Incomming broadcast detail for broadcast_/) && weGetIt === false) {
          weGetIt = true
          done()
          clearTimeout(timeout)
        }
      })

    })

    it('Can process the given broadcast', function (done) {

      this.timeout(62000)

      let timeout = setTimeout(() => done(new Error('Unable to process pubsub command in time')), 61000)

      topicPubSub.publish(data)
      broadcastInstance.stdout.on('data', data => {
        let msg = _.trim(data.toString(), '\n')
        if(msg.match(/Begin broadcasting/)) {
          clearTimeout(timeout)
          setTimeout(() => done(), 2000)
        }
      })

    })

    after(function (done) {

      if(broadcastInstance) {
        broadcastInstance.kill()
      }
      done()

    })

  })


})