const LIMIT_PER_15_MINUTES = 200
const FIFTEEN_MINUTES = 60*15
// Fixed window rate limiter
module.exports = async (ctx, next) => {
    const apiKey = ctx.headers['x-api-key']
    if (!apiKey) {
        ctx.throw(401);
    }
    try {
        //cache hit
        const counter = await ctx.cache.get(apiKey)
        if(!counter){
            //db hit
            const dbRecord = await ctx.db.models.Key.findAll({
                where: {
                    key: apiKey
                }
            });
            if (dbRecord.length == 0) {
                ctx.throw(401);
            }
            await ctx.cache.set(apiKey, 1, {
                //15 minutes window
                EX: FIFTEEN_MINUTES
            })
        } else {
            if(counter > LIMIT_PER_15_MINUTES){
                ctx.throw(429)
            }
            ctx.cache.incr(apiKey)
        }
    }
    catch (err) {
        err.status = err.statusCode || err.status || 500;
        ctx.body = err.message;
        throw err
    }
    next();
}