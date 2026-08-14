const { Client } = require('ssh2');

class SSHManager {
  constructor() {
    this.conn = new Client();
  }

  // Placeholder for connection logic
  connect(config) {
    return new Promise((resolve, reject) => {
      this.conn
        .on('ready', () => resolve())
        .on('error', (err) => reject(err))
        .connect(config);
    });
  }

  // Placeholder for SFTP logic
  listDir(path) {
    return new Promise((resolve, reject) => {
      this.conn.sftp((err, sftp) => {
        if (err) return reject(err);
        sftp.readdir(path, (err, list) => {
          if (err) return reject(err);
          resolve(list);
        });
      });
    });
  }
}

module.exports = new SSHManager();
