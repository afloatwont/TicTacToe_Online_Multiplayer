import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import logger from './utils/logger.js';
import userService from './services/userService.js';
import gameService from './services/gameService.js';

const app = express();
app.get("/", (req, res) => {
  res.send("Server is running");
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://tictactoe-afloat-theta.vercel.app/"],
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  logger.info(`New client connected with ID: ${socket.id}`);

  socket.on("check_username", (username, callback) => {
    callback({ exists: userService.exists(username) });
  });

  socket.on("register_user", (username, callback) => {
    const success = userService.addUser(username, socket.id);
    callback({ success });
    socket.username = username;
  });

  // Update the request_to_play handler
  socket.on("request_to_play", ({ username }) => {
    // Check if user is already in a game
    if (gameService.activeUsers.has(username)) {
      socket.emit('error', { message: 'Already in a game' });
      return;
    }

    // Find an available opponent
    let opponent = Array.from(userService.users.entries())
      .find(([name, user]) => (
        user.online && 
        !user.playing && 
        name !== username &&
        !gameService.activeUsers.has(name)
      ));

    if (opponent) {
      const [opponentName, opponentData] = opponent;
      const roomId = gameService.createRoom(
        { username, socketId: socket.id },
        { username: opponentName, socketId: opponentData.socketId }
      );

      if (roomId) {
        // Update user statuses
        userService.updateUserStatus(username, { playing: true, roomId });
        userService.updateUserStatus(opponentName, { playing: true, roomId });

        // Notify both players
        io.to(socket.id).emit("game_start", { 
          roomId, 
          opponent: opponentName, 
          symbol: 'X' 
        });
        io.to(opponentData.socketId).emit("game_start", { 
          roomId, 
          opponent: username, 
          symbol: 'O' 
        });
      }
    }
  });

  socket.on("make_move", ({ roomId, position }) => {
    console.log('Move attempted:', position, socket.username); // Debug log
    
    if (gameService.handleMove(roomId, position, socket.username)) {
      // Join the room if not already joined
      socket.join(roomId);
      
      // Emit the move to all players in the room
      console.log('Move validated and emitting:', position, socket.username);
      io.to(roomId).emit("move_made", {
        position,
        player: socket.username
      });
    } else {
      console.log('Move rejected:', position, socket.username);
    }
  });

  socket.on("join_room", ({ roomId }) => {
    socket.join(roomId);
    console.log(`${socket.username} joined room ${roomId}`);
  });

  socket.on("request_rematch", ({ roomId }) => {
    if (gameService.requestRematch(roomId, socket.username)) {
      gameService.resetRoom(roomId);
      io.to(roomId).emit("rematch_accepted");
    } else {
      io.to(roomId).emit("rematch_requested", { player: socket.username });
    }
  });

  socket.on("game_over", ({ roomId }) => {
    setTimeout(() => {
      const room = gameService.rooms.get(roomId);
      if (room) {
        io.to(room.player1.socketId).emit("return_to_lobby");
        io.to(room.player2.socketId).emit("return_to_lobby");
        gameService.deleteRoom(roomId);
      }
    }, 5000);
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      userService.removeUser(socket.username);
    }
  });
});

httpServer.listen(3000, '0.0.0.0' ,() => {
  logger.info("Server is running on http://localhost:3000");
});

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
