'use strict'
const port = process.env.PORT || 8081
const ip = require('ip')
const Koa = require('koa')
const app = new Koa()
const host = process.env.HOST_IP || ip.address()
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
const consumer = kafka.consumer({ groupId: 'worker-group' })

//POSTGRES
const sequelize = require('sequelize')
const user = 'postgres'
const hostPostgres = 'localhost'
const database = 'postgres'
const password = 'postgres'
const portPostgres = '5432'


const init = async () => {
    const db = await new sequelize(database, user, password, {
        hostPostgres,
        portPostgres,
        dialect: 'postgres',
    })
    const Request = db.models.Request
    await consumer.connect()
    await consumer.subscribe({ topic: 'topic1', fromBeginning: true })
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log("printing123")
            console.log(message.value)
        },
    })
}
setTimeout(init, 0)
app.listen(port)


