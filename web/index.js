'use strict'

const port = process.env.PORT || 8080
const Koa = require('koa')
const router = require('./router')
const kafka = require('kafka-node')
const app = new Koa()
const sequelize = require('sequelize')
//app.use(middleware.parseQuery({ allowDots: true }))
const dbsAreRunning = async () => {
    const db = await new sequelize(process.env.POSTGRES_URL)
    //API KEY model
    const Key = await db.define('Key', {
        key : sequelize.STRING
    })
    db.sync({force: true})
    const client = new kafka.KafkaClient({kafkaHost : process.env.KAFKA_BOOTSTRAP_SERVERS})
    const producer = new kafka.Producer(client)
    producer.on('ready', () => {
        app.context.db = db
        app.context.producer = producer
        //basic output log
        app.use(async (ctx, next) => {
            await next();
            const rt = ctx.response.get('X-Response-Time');
            console.log(`${ctx.method} ${ctx.url} - ${rt}`);
        });
        app.use(router.middleware())
        app.listen(port, () => {
            console.log(`port ${port} listen`)
        })  
    })
}

setTimeout(dbsAreRunning, 10000)



