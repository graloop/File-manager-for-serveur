require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('ssh2');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/public')));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  let sshClient = null;
  let currentSftp = null;

  socket.on('ssh-connect', (config) => {
    if (sshClient) {
      try { sshClient.end(); } catch(e) {}
    }

    sshClient = new Client();

    sshClient.on('ready', () => {
      socket.emit('ssh-status', { status: 'connected', message: 'Connected to server successfully.' });

      sshClient.sftp((err, sftp) => {
        if (err) {
          socket.emit('file-error', 'SFTP error: ' + err.message);
          return;
        }
        currentSftp = sftp;

        const listDir = (dirPath) => {
          sftp.realpath(dirPath, (err, absPath) => {
            const targetPath = err ? dirPath : absPath;
            sftp.readdir(targetPath, (err, list) => {
              if (err) {
                socket.emit('file-error', 'Readdir error: ' + err.message);
                return;
              }
              // Format file attributes properly
              const formattedList = list.map(item => ({
                filename: item.filename,
                longname: item.longname,
                size: item.attrs.size,
                mode: item.attrs.mode,
                uid: item.attrs.uid,
                gid: item.attrs.gid,
                mtime: item.attrs.mtime * 1000,
                atime: item.attrs.atime * 1000,
                isDirectory: item.attrs.isDirectory(),
                isSymbolicLink: item.attrs.isSymbolicLink()
              }));
              socket.emit('file-list', { path: targetPath, list: formattedList });
            });
          });
        };

        sftp.realpath('.', (err, absPath) => {
          const startPath = err ? '.' : absPath;
          listDir(startPath);
        });

        socket.on('list-dir', (dirPath) => {
          listDir(dirPath);
        });

        socket.on('create-folder', (folderPath) => {
          sftp.mkdir(folderPath, { mode: '0755' }, (err) => {
            if (err) {
              socket.emit('file-error', 'Create folder error: ' + err.message);
            } else {
              socket.emit('action-success', 'Folder created successfully');
              sftp.realpath(path.dirname(folderPath), (e, parent) => {
                listDir(parent || folderPath);
              });
            }
          });
        });

        socket.on('rename-path', ({ oldPath, newPath }) => {
          sftp.rename(oldPath, newPath, (err) => {
            if (err) {
              socket.emit('file-error', 'Rename error: ' + err.message);
            } else {
              socket.emit('action-success', 'Renamed successfully');
              sftp.realpath(path.dirname(newPath), (e, parent) => {
                listDir(parent || newPath);
              });
            }
          });
        });

        socket.on('delete-path', ({ filePath, isDir }) => {
          const removeAction = isDir ? 
            new Promise((res, rej) => sftp.rmdir(filePath, err => err ? rej(err) : res())) :
            new Promise((res, rej) => sftp.unlink(filePath, err => err ? rej(err) : res()));

          removeAction.then(() => {
            socket.emit('action-success', 'Deleted successfully');
            sftp.realpath(path.dirname(filePath), (err, parentPath) => {
              listDir(parentPath || '.');
            });
          }).catch(err => {
            socket.emit('file-error', 'Delete error: ' + err.message);
          });
        });
      });
    }).on('error', (err) => {
      console.error('SSH Error:', err.message);
      socket.emit('ssh-status', { status: 'error', message: err.message });
      socket.emit('file-error', 'Connection error: ' + err.message);
    }).connect({
      host: config.host,
      port: Number(config.port) || 22,
      username: config.username,
      password: config.password,
      readyTimeout: 15000
    });
  });

  socket.on('disconnect', () => {
    if (sshClient) {
      try { sshClient.end(); } catch(e) {}
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`SSH File Manager Backend listening at http://localhost:${port}`);
});
