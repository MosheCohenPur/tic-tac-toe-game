const express = require('express');
const path = require('path');

const router = express.Router();
const socketAPI = require('../socketApi/socketApi');

const { io } = socketAPI;

// serves the homepage
router.get('/', (req, res) => res.sendFile(path.join(__dirname, '../views/index.html')));

// all users connected to the server socket
const users = {};

// all active games
const rooms = {};

// player who is waiting for a rival
let unmatched;

// winning combination
const winCordenation = ['XXX', 'OOO'];

const isGameOver = (board) => {
  // possible winning combination
  const boardOptions = [
    board[0].join[''],
    board[1].join[''],
    board[2].join[''],
    `${board[0][0]}${board[1][0]}${board[2][0]}`,
    `${board[0][1]}${board[1][1]}${board[2][1]}`,
    `${board[0][2]}${board[1][2]}${board[2][2]}`,
    `${board[0][0]}${board[1][1]}${board[2][2]}`,
    `${board[0][2]}${board[1][1]}${board[2][0]}`,
  ];

  // checks if someone won
  for (let i = 0; i < boardOptions.length; i += 1) {
    if (boardOptions[i] === winCordenation[0]) {
      return 'X';
    }
    if (boardOptions[i] === winCordenation[1]) {
      return 'O';
    }
  }

  // checks if there's a possible move
  if (board.flat().find((cell) => !cell) === undefined) {
    return 'T';
  }

  return false;
};

const playerJoin = (socket) => {
  // if there is a player waiting, connect him with the new one,
  // if not, put the new user on the unmatched seat
  if (unmatched) {
    const room = {
      player1: unmatched,
      player2: socket.id,
      board: [[null, null, null], [null, null, null], [null, null, null]],
      turn: 'X',
    };
    const roomID = `${unmatched}${socket.id}`;
    rooms[roomID] = room;
    unmatched = null;
    return roomID;
  }
  unmatched = socket.id;
  return false;
};

const onConnect = (socket) => {
  const { id } = socket;
  console.log(`New player connected. ID: ${id}`);
  users[id] = socket;

  // if a player disconnect, also remove him from the users list,
  // also destroy the rooms if he's in one
  socket.on('disconnect', () => {
    if (unmatched === id) {
      unmatched = null;
    }
    const roomID = Object.keys(rooms)
      .find((roomIDn) => rooms[roomIDn].player1 === id || rooms[roomIDn].player2 === id);
    delete rooms[roomID];
    console.log(`Client disconnected. ID: ${id}`);
    delete users[id];
  });

  const roomID = playerJoin(socket);

  if (roomID) {
    socket.emit('gameStarted', {
      symbol: 'O',
      roomID,
      turn: rooms[roomID].turn,
      board: rooms[roomID].board,
    });
    users[rooms[roomID].player1].emit('gameStarted', {
      symbol: 'X',
      turn: rooms[roomID].turn,
      board: rooms[roomID].board,
      roomID,
    });
  }

  // on turn handler
  socket.on('turn', (msg) => {
    const room = rooms[msg.roomID];
    if (!room) {
      console.log('Error');
    }
    const { board } = room;
    let { turn } = room;
    board[msg.cell[0]][msg.cell[1]] = turn;
    turn = turn === 'X' ? 'O' : 'X';
    room.turn = turn;

    // checks if the game is over
    const isGameOverResult = isGameOver(board);
    if (isGameOverResult) {
      users[room.player1].emit('gameOver', {
        isGameOverResult,
        board,
      });
      users[room.player2].emit('gameOver', {
        isGameOverResult,
        board,
      });
    } else {
      users[room.player1].emit('nextTurn', {
        turn, board,
      });
      users[room.player2].emit('nextTurn', {
        turn, board,
      });
    }
  });
};

io.on('connection', onConnect);

module.exports = router;
