'use strict'

class Process {

  constructor (DB, FB, Raven) {
    this.DB = DB
    this.FB = FB
    this.Raven = Raven
  }

  broadcast () {
    console.log('%s currently running ', new Date())
  }

}

module.exports = Process