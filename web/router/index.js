'use strict'

const Router = require('koa-router')
const api = require('./api')

const router = new Router()

// endpoints
router.get('/api-key', api.keys.generate)
router.get('/', (ctx, next) => {
    ctx.response.status = 200;
    console.log(api.keys.generate)
    ctx.body = JSON.parse('{"result":true, "count":42}');
	next();
});
module.exports = router