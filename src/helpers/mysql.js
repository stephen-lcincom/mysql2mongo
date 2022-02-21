const mysql = require('mysql');

async function connect(uri) {
  const connection = mysql.createConnection(uri);
  await new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  });
  console.log('MySQL connected.')
  return connection;
}

function destroy(connection) {
  if (connection) {
    connection.destroy((err) => {
      if (err) {
        console.error('mysq.destroy', err);
      } else {
        console.log('MySQL disconnected.');
      }
    });
  }
}

module.exports = {
  connect,
  destroy,
};
