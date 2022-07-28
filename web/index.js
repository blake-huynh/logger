'use strict'

const port = process.env.PORT || 8080

const router = require('./router')

const Koa = require('koa')
const app = new Koa()

const kafka = require('kafka-node')
const client = new kafka.KafkaClient({kafkaHost : 'localhost:9092'})
const producer = new kafka.Producer(client)

const sequelize = require('sequelize')
const user = 'postgres'
const host = 'localhost'
const database = 'postgres'
const password = 'postgres'
const portPostgres = '5432'

const redis = require('redis')
//app.use(middleware.parseQuery({ allowDots: true }))
const init = async () => {
    const db = await new sequelize(database, user, password, {
      host,
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
    //db.sync({force: true})
    const redisClient = redis.createClient({
      socket: {
          host: 'localhost',
          port: 6379
      }
    });
    const cache = await redisClient.connect()
    producer.on('ready', () => {
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
        app.listen(port, () => {
            console.log(`port ${port} listen`)
        })  
    })
}
//TODO set retries instead of guessing time for docker compose
setTimeout(init, 0)



