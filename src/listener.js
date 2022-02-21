const MySQLEvents = require('@rodrigogs/mysql-events');
const config = require('./config');
const redis = require('./helpers/redis');
const mysql = require('./helpers/mysql');
const constants = require('./helpers/constants');

async function main() {
  const redisClient = await redis.connect(config.redisUri);
  const mysqlClient = await mysql.connect(config.mysqlUri);

  const instance = new MySQLEvents(mysqlClient, {
    startAtEnd: true,
    excludedSchemas: {
      mysql: true,
    },
  });

  await instance.start();

  instance.addTrigger({
    name: 'mysql2mongo',
    expression: `${config.mysqlDb}.${config.table}`,
    statement: MySQLEvents.STATEMENTS.DELETE,
    onEvent: (event) => {
      const item = {
        type: event.type,
        affectedRows: event.affectedRows,
      };
      redisClient.publish(constants.REDIS_CHANNEL, JSON.stringify(item));
    },
  });

  instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
  instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);

  process.on('SIGINT', async () => {
    console.log();
    await redis.disconnect(redisClient);
    mysql.destroy(mysqlClient);
    await instance.stop();
  });
}

main().catch((err) => {
  console.error('listener.main', err);
});
