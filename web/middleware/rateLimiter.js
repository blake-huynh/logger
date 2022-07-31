const LIMIT_PER_15_MINUTES = 3//200
const FIFTEEN_MINUTES_IN_SECONDS = 3//60*15
// Token bucket rate limiter
module.exports = async (ctx, next) => {
    const apiKey = ctx.headers['x-api-key']
    console.log("header123", apiKey)
    const redisKey = `${apiKey}_counter`
    const redisKeyLastResetTime = `${apiKey}_last_reset_time`
    if (!apiKey) {
        ctx.throw(401);
    }
    try {
        //cache hit
        const counter = await ctx.cache.get(redisKey)
        const unixNowInSeconds = Math.floor(Date.now()/1000)
        if(!counter){
            //db hit
            const dbRecord = await ctx.db.models.Key.findAll({
                where: {
                    key: apiKey
                }
            });
            // not authorized if db miss
            if (dbRecord.length == 0) {
                ctx.throw(401);
            }
            // put key in cache
            await ctx.cache.set(`${apiKey}_counter`, LIMIT_PER_15_MINUTES)
            await ctx.cache.set(`${apiKey}_last_reset_time`, `${unixNowInSeconds}`)
        } else {
            const lastResetTime = await ctx.cache.get(redisKeyLastResetTime)
            const lastResetTimeTimeInUnix = new Date(parseInt(lastResetTime))
            //Refill bucket with maximum tokens if enough time have passed
            if(unixNowInSeconds - lastResetTimeTimeInUnix >= FIFTEEN_MINUTES_IN_SECONDS){
                await ctx.cache.set(`${apiKey}_counter`, LIMIT_PER_15_MINUTES)
            } else {
                const requestsLeft = counter
                //Error if not enough tokens in bucket
                if(requestsLeft <= 0){
                    ctx.throw(429)
                }
            }
            //Request allowed through
            await ctx.cache.set(`${apiKey}_last_reset_time`, `${unixNowInSeconds}`)
            await ctx.cache.decr(`${apiKey}_counter`)
        }
    }
    catch (err) {
        err.status = err.statusCode || err.status || 500;
        ctx.body = err.message;
        throw err
    }
    next();
}