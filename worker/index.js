'use strict'

const port = process.env.PORT || 8080
const Koa = require('koa')
//const middleware = require('./middleware')
const router = require('./router')
const app = new Koa()
const sequelize = require('sequelize')
const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');

//app.use(middleware.parseQuery({ allowDots: true }))
const dbsAreRunning = async () => {
    const db = await new sequelize(process.env.POSTGRES_URL)
    const Key = db.define('key', {
        key : sequelize.STRING
    })
    db.sync({force: true})
    const client = new kafka.KafkaClient({kafkaHost : process.env.KAFKA_BOOTSTRAP_SERVERS})
    const producer = new kafka.Producer(client)
    producer.on('ready', () => {
        app.use(async (ctx, next) => {
            await next();
            const rt = ctx.response.get('X-Response-Time');
            console.log(`${ctx.method} ${ctx.url} - ${rt}`);
        });
        app.use(router.middleware())
        router.get('/key', async (ctx, next) => {
            producer.send([{topic: process.env.KAFKA_TOPIC || 'topic1', messages: '7148374099'}], async (err, data) => {
                if(err) {
                    console.log(err)
                }
                else {
                    const uuid = uuidv4()
                    await Key.create({
                        key: uuid
                    })
                    ctx.body = uuid;
                    next()
                }
            })
        })
        app.listen(port, () => {
            console.log(`port ${port} listen`)
        })  
    })
}

setTimeout(dbsAreRunning, 10000)



