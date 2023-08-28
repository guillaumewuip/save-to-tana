const { createClient } = require('redis');

const REDIS_URL = `redis://${process.env.REDIS_HOST}`

const client = createClient({
  url: REDIS_URL,
});

client.on('error', error => console.error('Redis Client Error', error));

// change the prefix to trash all existing ids
const toStoreId = (id) => `1-${id}`

const initialize = async () => {
  console.log('Connecting to Redis', REDIS_URL)
  await client.connect();
  console.log('Connected!')
}

const savedAlready = async (itemId) => {
  const nbKeysFound = await client.exists(toStoreId(itemId))
  return nbKeysFound === 1
}

const saveItemSaved = async (itemId) => {
  await client.set(
    toStoreId(itemId),
    0,
    {
      EX: 345600, // 4 days in seconds
      NX: true,
    }
  )
}

const saveItemsSaved = async (itemIds) => {
  return Promise.all(itemIds.map(saveItemSaved))
}

module.exports = {
  initialize,
  savedAlready,
  saveItemsSaved,
}
