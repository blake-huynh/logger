'use strict'

//const http = require('http')
//const promisify = require('es6-promisify')
// //const config = require('../config')
const app = require('./server')
app.listen(3000, () => {
  console.log("port 3000 listen")
})  


