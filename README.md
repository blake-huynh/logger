# Fractional Take Home
## Basic

B) Please write a function that sorts 11 small numbers (<100) as fast as possible. Once written, provide an estimate for how long it would take to execute that function 10 Billion (10^10) times on a normal machine.
```
function CountingSort(input, k)
    
    count ← array of k + 1 zeros
    output ← array of same length as input
    
    for i = 0 to length(input) - 1 do
        j = key(input[i])
        count[j] += 1

    for i = 1 to k do
        count[i] += count[i - 1]

    for i = length(input) - 1 downto 0 do
        j = key(input[i])
        count[j] -= 1
        output[count[j]] = input[i]

    return output
```
- around 2n complexity, n = 11 => 22 ops per sort, with operation around 100ns or 10^-9s (Main memory ref), referenced from http://brenocon.com/dean_perf.html
- 22 * 10^10 * 10^-9 = 220s = ~ 4 minutes

C) Please make improvements to the code below, using Javascript.

```
connectToDatabase()
.then((database)  => {
    return getUser(database, 'email@email.com')
    .then(user => {
        return getUserSettings(database, user.id)
        .then(settings => {
            return setRole(database, user.id, "ADMIN")
            .then(success => {
                return notifyUser(user.id, "USER_ROLE_UPDATED")
                .then(success => {
                    return notifyAdmins("USER_ROLE_UPDATED")
                })
            })
        })
    })
})
```
- Await Async is my preferred method. We can break each asynchronous op into a function whic return a promise. Example
```
function initConnectToDatabase(){
    return connectToDatabase()
    .then((database)  => {
        return new Promise((res, rej)=>{
            res(database)
        })
    }).catch((err) => {
        return new Promise((res, rej)=>{
            rej(err)
        })
    })
}
```
Then clean up the code as
```
const [db, err] = await initConnectToDatabase()
const [user, err] = await initGetUser(database, 'email@email.com')
const [settings, err] = await initGetUserSettings(database, user.id)
```

## Practical
To run locally, open 3 terminal windows. Make sure you have docker/docker-compose installed

On first window, run

```
\export HOST_IP=$(ifconfig | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | awk '{ print $2 }' | cut -f2 -d: | head -n1)
docker-compose up
```

On 2nd and 3rd windows, make sure you are at /web and /worker directory respectively. Run
```
npm i
```

and then 

```
node index.js
```
on each window

Then you can cURL to check if it's working

```console
curl localhost:8080  
Hello  
```

Get an API key
```console
curl localhost:8080/key
c138a11d-a9ee-4267-a0e5-1b231fcf60d9
```
Parse a phone number
```console
curl -X GET "http://localhost:8080/parse?phone=17148374099" -H "x-api-key: c138a11d-a9ee-4267-a0e5-1b231fcf60d9"
```
```
{"number":{"input":"+17148374099","international":"+1 714-837-4099","national":"(714) 837-4099","e164":"+17148374099","rfc3966":"tel:+1-714-837-4099","significant":"7148374099"},"regionCode":"US","valid":true,"possible":true,"canBeInternationallyDialled":true,"type":"fixed-line-or-mobile","possibility":"is-possible"}
```

System Architecture Diagram:
![](/./system.png "System Diagram")

## Analysis:
We break the basis system down into 2 main services, web and worker. We notice that this system have a very high throughput requirement for writes. We will keep this in mind as we design the SQL schemas
## Web service:
- Parse incoming request, and rate limit it using a token bucket algorithm and redis.
- Token bucket was chosen since its both memory and performance efficient, especially coupled with redis. It also disallow bursts of data, a problem that an algorithm like fixed window might encounter
- The api key is checked against redis first, then check SQL if it's a cache miss, then write to cache of the key is valid
- Further optimization of api key checking can be done to prevent DB trips by introducing a data structure such as Bloom Filter to filter out invalid requests.
``` js
db.define('Key', 
    {
        key : sequelize.STRING
    }, 
    {
        indexes: [
            {
            unique: true,
            fields: ['key']
            }
        ]
    }
)
```
- Our API KEY table is simply key with a hash index for the api key for fast lookup of api key
- Every request that passes our authentication is then parsed and asynchronously sent to the worker service through KAFKA for processing
- This ensures that the web service is quickly parsing phone number and not spending time on IO intensive tasks (DB calls)
- KAFKA is used to decouple the two services and provide reliability and scalability. We can scale our web/worker service instances up as needed to meet throughput demands
## Worker service:
- responsible for processing messages sent through KAFKA queue
- Each message is then inserted to SQL. Request through API and Record inserted is 1 to 1
```js
db.define('Request', {
    timestamp : sequelize.INTEGER,
    key: sequelize.STRING
})
```
- Note the above schema has timestamp for when the request was made, and a key for api string
- We do not normalize the data or create indexes because it will affect our insert throughput
- Appending every request instead of updating a counter also allow parallel request (with same API key) to proceed quickly instead of doing a lock/transaction pattern for updating a counter for API key
- We do `autocommit: true` as a setting for KAFKA to ensure requests have AT LEAST ONCE processing. This does run the risk of processing a request twice in event of worker service failure but has little impact on the main objectives of our service. We will allow a miniscule error in our count of API requests
- We notice that the amount of record grows very quickly with this pattern, which affect querying of Request log for analytics 
- A possible proposal, improvement we can make (not implemented here) is to switch our write to a new table every day/ few days
- A cron job (not implemented) is then run to compress data of previous days into time buckets (15/30minutes or even hours/days) using the request timestamp into a new table where we have a counter summing the amount of requests per api key during that time batch interval
- This pattern has two main benefits, if we use the analytics as incident response, we can do so with the freshest batch of data. Old batches of data can be used for deeper analytics and be more efficiently queried since it is compressed into time batches. We can design a specialized ETL/data pipeline with SPARK/MapReduce to analyze these data
