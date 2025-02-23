import logger from '../utils/logger.js';

class GameService {
  constructor() {
    this.rooms = new Map();
    this.activeUsers = new Set(); // Track users in games
  }

  createRoom(player1, player2) {
    // Check if either player is already in a game
    if (this.activeUsers.has(player1.username) || this.activeUsers.has(player2.username)) {
      return null;
    }

    const roomId = `${player1.username}_${player2.username}`;
    this.rooms.set(roomId, {
      player1,
      player2,
      gameState: Array(9).fill(null),
      currentTurn: player1.username,
      rematchRequests: new Set()
    });

    // Add users to active set
    this.activeUsers.add(player1.username);
    this.activeUsers.add(player2.username);

    return roomId;
  }

  handleMove(roomId, position, username) {
    console.log('Handling move:', { roomId, position, username });
    
    const room = this.rooms.get(roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      return false;
    }
    
    if (room.gameState[position] !== null) {
      console.log('Position already taken:', position);
      return false;
    }
    
    if (room.currentTurn !== username) {
      console.log('Not player\'s turn:', username, 'current turn:', room.currentTurn);
      return false;
    }
    
    // Update game state
    room.gameState[position] = username === room.player1.username ? 'X' : 'O';
    room.currentTurn = username === room.player1.username ? 
      room.player2.username : room.player1.username;

    console.log('Move successful:', { position, symbol: room.gameState[position] });
    return true;
  }

  requestRematch(roomId, username) {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    room.rematchRequests.add(username);
    return room.rematchRequests.size === 2;
  }

  resetRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.gameState = Array(9).fill(null);
      room.currentTurn = room.player1.username;
      room.rematchRequests.clear();
    }
  }

  deleteRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      // Remove users from active set
      this.activeUsers.delete(room.player1.username);
      this.activeUsers.delete(room.player2.username);
      this.rooms.delete(roomId);
    }
  }
}

export default new GameService();