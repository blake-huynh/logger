'use strict'

const port = 8080
const ip = require('ip')
const host = process.env.HOST_IP || ip.address()
const router = require('./router')
const Koa = require('koa')
const app = new Koa()

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
const sequelize = require('sequelize')
const user = 'postgres'
const hostPostgres = 'localhost'
const database = 'postgres'
const password = 'postgres'
const portPostgres = '5432'

const redis = require('redis')
//app.use(middleware.parseQuery({ allowDots: true }))
const init = async () => {
    const db = await new sequelize(database, user, password, {
      hostPostgres,
      portPostgres,
      dialect: 'postgres',
    })
    //API KEY model
    const Key = await db.define('Key', {
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
    db.sync({force: true})
    const redisClient = redis.createClient({
      socket: {
          host: 'localhost',
          port: 6379
      }
    });
    const cache = await redisClient.connect()

    await producer.connect()
    app.context.db = db
    app.context.producer = producer
    app.context.cache = cache
    app.use(router.routes())
    app.use(async function handleError(context, next) {
      try {
        await next();
        // catch any error that might have occurred
      } catch (error) {
        context.status = 500;
        context.body = error;
      }
    });
}
//TODO set retries instead of guessing time for docker compose
setTimeout(init, 0)
app.listen(port, () => {
  console.log(`port ${port} listen`)
})  


