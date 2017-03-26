'use strict'

require('dotenv').config()

const Promise = require('bluebird')
const CronJob = require('cron').CronJob
const ProcessClass = require('./broadcast')
const Init = require('./init')

Init()
  .then(Init => {
    const ProcessModel = new ProcessClass(Init.DB, Init.FB, Init.Raven)
    return new CronJob('*/10 * * * * *', ProcessModel.broadcast, null, true, 'Asia/Kuala_Lumpur')
  })
  .catch(err => {
    console.error('Error bootup the broadcast engine', err)
  })