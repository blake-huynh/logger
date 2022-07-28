'use strict'
const { 
    v4: uuidv4,
  } = require('uuid');
const Router = require('koa-router')
const router = new Router()

// endpoints
router.get('/key', async (ctx, next) => {
    const uuid = uuidv4()
    const record = await ctx.db.models.Key.create({
        key: uuid
    })
    ctx.producer.send([{topic: process.env.KAFKA_TOPIC || 'topic1', messages: '7148374099'}], async (err, data) => {
        if(err) {
            console.log(err)
        }
        else {
            console.log("topic1 message sent")
        }
    })
    ctx.body = uuid;
    console.log("record created", record)
    next()
})
router.get('/', (ctx, next) => {
    ctx.response.status = 200;
    ctx.body = JSON.parse('{"result":true, "count":42}');
    console.log('here123')
    next()
});
module.exports = router