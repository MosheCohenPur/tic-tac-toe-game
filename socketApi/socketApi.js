const socketIo = require('socket.io');

const io = socketIo();
const socketAPI = {};
socketAPI.io = io;
module.exports = socketAPI;
