import { io, Socket } from 'socket.io-client';

export interface ServerToClientEvents {
  game_start: (data: { roomId: string; opponent: string; symbol: 'X' | 'O' }) => void;
  move_made: (data: { position: number; player: string }) => void;
  rematch_requested: (data: { player: string }) => void;
  rematch_accepted: () => void;
  return_to_lobby: () => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  make_move: (data: { roomId: string; position: number }) => void;
  request_rematch: (data: { roomId: string }) => void;
  game_over: (data: { roomId: string }) => void;
  request_to_play: (data: { username: string }) => void;
  check_username: (username: string, callback: (response: { exists: boolean }) => void) => void;
  register_user: (username: string, callback: (response: { success: boolean }) => void) => void;
  join_room: (data: { roomId: string }) => void; // Add join_room event type
}

// Create a single socket instance
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('https://tictactoe-online-multiplayer.onrender.com', {
  transports: ['websocket'],
  autoConnect: true
});

// Add connection event handlers
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('connect_error', () => {
  console.log('Connection failed');
});

export const checkServerConnection = () => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, 5000);

    socket.connect();
    socket.on('connect', () => {
      clearTimeout(timeout);
      resolve(true);
    });
  });
};