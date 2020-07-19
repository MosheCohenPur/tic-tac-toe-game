const indexApp = angular.module('indexApp', []);
indexApp.controller('indexCtrl', ($scope) => {
  const url = window.location.origin;
  const socket = io.connect(url);

  // On connection handler
  socket.on('connect', () => {
    if (socket.connected) {
      $scope.message = 'Connected Successfully! Wait for rivel';
    } else {
      $scope.message = 'Connection Error!';
    }
    $scope.$apply();
  });

  // On disconnect handler
  socket.on('disconnect', () => {
    $scope.message = 'You disconnected from the server';
  });

  // On game start handler
  socket.on('gameStarted', (msg) => {
    // game parameters initialization
    $scope.symbol = msg.symbol;
    $scope.turn = msg.turn;
    $scope.board = msg.board;
    $scope.message = `You are in a game! you play ${$scope.symbol}`;
    $scope.roomID = msg.roomID;

    // turn text helper
    if ($scope.symbol === $scope.turn) {
      $scope.turnMessage = 'It\'s your turn!';
    } else {
      $scope.turnMessage = 'It\'s your rival\'s turn';
    }

    $scope.$apply();
  });

  // on next turn start handler
  socket.on('nextTurn', (msg) => {
    $scope.turn = msg.turn;
    $scope.board = msg.board;

    // turn text helper
    if ($scope.symbol === $scope.turn) {
      $scope.turnMessage = 'It\'s your turn!';
    } else {
      $scope.turnMessage = 'It\'s your rival\'s turn';
    }

    $scope.$apply();
  });

  // on game over handler
  socket.on('gameOver', (msg) => {
    $scope.board = msg.board;
    // gets the game status (calculated on the server!) and prints a relevant message
    if (msg.isGameOverResult === 'T') {
      $scope.message = 'It\'s a Tie!';
    } else if (msg.isGameOverResult === $scope.symbol) {
      $scope.message = 'You Won!';
    } else {
      $scope.message = 'You Lost!';
    }
    $scope.turnMessage = 'reload to start another game!';

    $scope.$apply();
    socket.close();
  });

  // send a turn message to the server socket
  $scope.makeTurn = (cell) => {
    if ($scope.turn === $scope.symbol && !$scope.board[cell[0]][cell[1]]) {
      socket.emit('turn', { cell, roomID: $scope.roomID });
      socket.emit('isGameOver', $scope.board);
    }
  };
});
