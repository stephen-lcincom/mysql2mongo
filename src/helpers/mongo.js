const { MongoClient } = require('mongodb');

async function connect(uri) {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Mongo connected.');
    return client;
  } catch (err) {
    console.error('mongo.connect', err);
  }
}

async function close(client) {
  try {
    if (client) {
      await client.close();
      console.log('Mongo disconnected.');
    }
  } catch (err) {
    console.error('mongo.close', err);
  }
}

module.exports = {
  connect,
  close,
};
