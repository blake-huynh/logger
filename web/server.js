'use strict'

const Koa = require('koa')
//const middleware = require('./middleware')
const router = require('./router')

const app = new Koa()

// logger

app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});
  
  // x-response-time
  
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});
//app.use(middleware.parseQuery({ allowDots: true }))
app.use(router.middleware())

module.exports = app