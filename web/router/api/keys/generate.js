'use strict'

// const joi = require('joi')
// const redis = require('../../../../models/redis')
const { 
  v1: uuidv1,
  v4: uuidv4,
} = require('uuid');

// const querySchema = joi.object({
//   limit: joi.number()
//     .default(10),
//   offset: joi.number()
//     .default(0)
// })
//   .unknown()
//   .required()

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function generateKey (ctx, next) {
    // const { error, value: query } = joi.validate(this.query, querySchema)
    // if (error) {
    //   ctx.response.status = 400;
    // }
    //db write
    await sleep(1000)
    ctx.body = uuidv4();
    next()
}

module.exports = generateKey