'use strict'

require('dotenv').config()

const CronJob = require('cron').CronJob

const Process = require('./broadcast')
const Init = require('./init')

Init.initialize()
  .then(() => {
    return new CronJob('*/10 * * * * *', Process.broadcastProcess, null, true, 'Asia/Kuala_Lumpur')
  })
  .catch(err => {
    console.error('Error bootup the broadcast engine', err)
    global.Raven.captureException(err)
  })
