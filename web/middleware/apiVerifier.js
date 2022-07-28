module.exports = async (ctx, next) => {
    const apiKey = ctx.headers['x-api-key']
    console.log("apiKey", apiKey)
    if (!apiKey) {
        ctx.throw(401);
    }
    try {
        const record = await ctx.db.models.Key.findAll({
            where: {
              key: apiKey
            }
        });
        console.log('rec', record, typeof apiKey)
        if (record.length == 0) {
          ctx.throw(401);
        }
    }
    catch (err) {
        ctx.throw(401);
    }
    next();
}