const { createClient } = require('redis');

async function connect(uri) {
  const client = createClient(uri);
  await client.connect();
  console.log('Redis connected.')
  return client;
}

async function disconnect(client) {
  try {
    if (client) {
      await client.disconnect();
      console.log('Redis disconnected.');
    }
  } catch (err) {
    console.error('redis.disconnect', err);
  }
}

module.exports = {
  connect,
  disconnect,
};
