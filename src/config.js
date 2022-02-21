const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV,
  mysqlUri: process.env.MYSQL_URI,
  mongoUri: process.env.MONGO_URI,
  redisUri: process.env.REDIS_URI,
  mysqlDb: process.env.MYSQL_DB,
  table: process.env.MYSQL_TABLE,
  tableId: process.env.MYSQL_TABLE_ID,
  collection: process.env.MONGO_COLLECTION,
};
