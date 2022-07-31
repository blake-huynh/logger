'use strict'
const port = 8080
const router = require('./router')
const Koa = require('koa')
const app = new Koa()

//KAFKA
const { Kafka, logLevel } = require('kafkajs')
const kafka = new Kafka({
  clientId: 'worker',
  logLevel: logLevel.ERROR,
  brokers: [`localhost:9092`],
  retry: {
    initialRetryTime: 1000,
    retries: 9
  }
})
const producer = kafka.producer()

//POSTGRES
const sequelize = require('sequelize')
const user = 'postgres'
const hostPostgres = 'localhost'
const database = 'postgres'
const password = 'postgres'
const portPostgres = '5432'

//REDIS
const { createClient } = require('redis');
const redis = createClient({
  socket: {
    host: 'localhost',
    port: 6379
  }
})

//ERR MIDDLEWARE
async function handleError(context, next) {
  try {
    await next();
    // catch any error that might have occurred
  } catch (error) {
    context.status = 500;
    context.body = error;
  }
}

const init = async () => {
    // PERSISTENCES INITIAlIZATION
    const db = await new sequelize(database, user, password, {
      hostPostgres,
      portPostgres,
      dialect: 'postgres',
    })
    await db.define('Key', {
      key : sequelize.STRING
    }, {
      indexes: [
        // Create a hash index on key
        {
          unique: true,
          fields: ['key']
        }
      ]
    })
    //db.sync({force: true})
    await redis.connect()
    await producer.connect()

    // API
    app.context.db = db
    app.context.producer = producer
    app.context.cache = redis
    app.use(router.routes())
    app.use(handleError);
}
setTimeout(init, 0)
app.listen(port, () => {
  console.log(`port ${port} listen`)
})  


