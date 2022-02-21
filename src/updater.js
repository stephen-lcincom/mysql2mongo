const config = require('./config');
const redis = require('./helpers/redis');
const mysql = require('./helpers/mysql');
const mongo = require('./helpers/mongo');
const constants = require('./helpers/constants');

async function migrate(collection, mysqlClient) {
  const rows = await new Promise((resolve, reject) => {
    mysqlClient.query(
      `SELECT ${config.tableId} FROM ${config.table} WHERE is_mongo=0`,
      (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results);
      }
    );
  });

  const length = rows.length;
  if (length === 0) {
    return console.log('There is no records need to migrate.');
  }

  console.log(`Migrating ${length} records...`);

  let count = 0;
  let countDone = 0;
  await new Promise((resolve) => {
    rows.forEach((row, i) => {
      setTimeout(async () => {
        try {
          count += 1;
          console.log(`Migrating record ${count}/${length}...`);
          const record = await new Promise((resolve, reject) => {
            mysqlClient.query(
              `SELECT * FROM ${config.table} WHERE ${config.tableId}='${
                row[config.tableId]
              }'`,
              (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
              }
            );
          });
          if (record) {
            const recordId = getRecordId(record);
            await collection.replaceOne(
              { [config.tableId]: recordId },
              record,
              {
                upsert: true,
              }
            );
            await new Promise((resolve, reject) => {
              mysqlClient.query(
                `UPDATE ${config.table} SET is_mongo=1 WHERE ${config.tableId}=${recordId}`,
                (err) => {
                  if (err) return reject(err);
                  resolve();
                }
              );
            });
          }
        } catch (err) {
          console.error('Update failed', err);
        } finally {
          countDone += 1;
          if (countDone === length) return resolve();
        }
      }, (i / 100) * 1000);
    });
  });
}

function getRecordId(record) {
  return record[config.tableId];
}

async function main() {
  const redisClient = await redis.connect(config.redisUri);
  const mysqlClient = await mysql.connect(config.mysqlUri);
  const mongoClient = await mongo.connect(config.mongoUri);

  redisClient.subscribe(constants.REDIS_CHANNEL, (message) => {
    try {
      const data = JSON.parse(message);
      const ids = data.affectedRows.map((aftectedRow) => {
        return aftectedRow.before[config.tableId];
      });
      collection.deleteMany({ [config.tableId]: { $in: ids } });
    } catch (err) {
      console.log('redis.message', err);
    }
  });

  process.on('SIGINT', () => {
    console.log();
    redis.disconnect(redisClient);
    mysql.destroy(mysqlClient);
    mongo.close(mongoClient);
    process.exit();
  });

  const collection = mongoClient.db().collection(config.collection);
  await migrate(collection, mysqlClient);

  setInterval(async () => {
    await migrate(collection, mysqlClient);
  }, 10000);
}

main().catch((err) => {
  console.error('updater.main', err);
});
