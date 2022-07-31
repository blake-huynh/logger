const redis = require('redis')


module.exports = async () => {
    const redisClient = redis.createClient();
    console.log('init redis')
    redisClient.connect()
    redisClient.on('connect', async function(){
        console.log('connected')
        return new Promise((resolve,reject)=>{
            resolve(redisClient)
        })
    });
}