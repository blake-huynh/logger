'use strict'
const { v4: uuidv4 } = require('uuid');
const { parsePhoneNumber } = require('awesome-phonenumber')
const rateLimiter = require('../middleware/rateLimiter')


const Router = require('koa-router')
const router = new Router()

// middleware configurations
router.use(["/parse"], rateLimiter);
// endpoints
router.get('/key', async (ctx, next) => {
    const uuid = uuidv4()
    const record = await ctx.db.models.Key.create({
        key: uuid
    })
    ctx.body = record.dataValues.key;
    console.log("record created", ctx.body)
})
.get('/parse', async (ctx, next) => {
    const { phone } = ctx.request.query
    const parsed = parsePhoneNumber(`+${phone}`)
    const apiKey = ctx.headers['x-api-key']
    ctx.producer.send({
        topic: 'topic1',
        messages: [
            {value: `${apiKey}:${Math.floor(Date.now()/1000)}`},
        ],
    })
    if(parsed.isValid()){
        ctx.body = parsed.toJSON()
    } else {
        ctx.body = "Invalid Phone Number"
    }
})
.get('/', (ctx, next) => {
    ctx.response.status = 200;
    ctx.body = "Hello";
});


module.exports = router