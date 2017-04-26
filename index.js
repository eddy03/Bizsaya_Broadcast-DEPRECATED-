'use strict'

require('dotenv').config()

const CronJob = require('cron').CronJob

const Init = require('./init')
const Process = require('./app/broadcast')

Init.initialize()
  .then(() => {
    console.log('Bizsaya Broadcast is ready')
    return new CronJob('*/20 * * * * *', Process.broadcastProcess, null, true, 'Asia/Kuala_Lumpur')
  })
  .catch(err => {
    console.error('Error bootup the broadcast engine', err)
    global.Raven.captureException(err)
  })
