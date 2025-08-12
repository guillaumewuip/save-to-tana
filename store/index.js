import { createClient } from 'redis';
import crypto from 'crypto';

import * as Log from 'log';

const REDIS_URL = process.env.REDIS_URL

const client = createClient({
  url: REDIS_URL,
  pingInterval: 1000 * 60 * 4,
});

client.on('error', error => Log.error('Redis Client Error', error.message));
client.on('reconnecting', () => Log.debug('Redis Client reconnecting...'));
client.on('ready', () => Log.info('Redis Client Ready!'));
client.on('connect', () => { });

const storeId = (id) => {
  // we hash the id to have something cleaner than raw url,
  // and to be sure to use valid caracters
  const hashedId = crypto.createHash('md5').update(id).digest("hex")

  // change the prefix to trash all existing ids
  // we can also connect to redis and flush the db
  //
  //   flyctl redis connect
  //   > FLUSHALL
  return `1-${hashedId}`
}

export const initialize = async () => {
  Log.info('Connecting to Redis', REDIS_URL)
  await client.connect();
}

export const isSavedAlready = async (itemId) => {
  const nbKeysFound = await client.exists(storeId(itemId))
  return nbKeysFound === 1
}

const saveItemSaved = async (itemId) => {
  await client.set(
    storeId(itemId),
    0,
    {
      EX: 345600, // 4 days in seconds
      NX: true,
    }
  )
}

export const saveItemsSaved = async (itemIds) => {
  return Promise.all(itemIds.map(saveItemSaved))
}
