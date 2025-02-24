import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { socket } from '../utils/socket';
import '../styles/Game.css';

type CellValue = 'X' | 'O' | null;
type Symbol = 'X' | 'O';

interface LocationState {
  opponent: string;
  symbol: Symbol;
}

interface GameState {
  board: CellValue[];
  currentTurn: string;
  winner: string | null;
  isDraw: boolean;
}

const Game: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams<{ roomId: string }>();
  const state = location.state as LocationState;
  const username = localStorage.getItem('username') || '';

  // Early return if no roomId
  if (!roomId) {
    navigate('/lobby');
    return null;
  }

  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentTurn: state?.symbol === 'X' ? username : state?.opponent,
    winner: null,
    isDraw: false
  });
  const [rematchRequested, setRematchRequested] = useState(false);

  const checkWinner = (board: CellValue[]): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] === 'X' ? state?.symbol === 'X' ? 
          username : state?.opponent : 
          state?.symbol === 'O' ? username : state?.opponent;
      }
    }
    return null;
  };

  const handleCellClick = (index: number) => {
    if (
      gameState.board[index] || 
      gameState.winner || 
      gameState.isDraw || 
      gameState.currentTurn !== username
    ) {
      return;
    }

    // Update local state immediately for better UX
    const newBoard = [...gameState.board];
    newBoard[index] = state.symbol;
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentTurn: state.opponent
    }));

    // Emit the move to server
    socket.emit('make_move', {
      roomId,
      position: index
    });
  };

  const handleRematchRequest = () => {
    socket.emit('request_rematch', { roomId });
    setRematchRequested(true);
  };

  useEffect(() => {
    // Check for required state
    if (!state?.opponent || !state?.symbol || !roomId) {
      navigate('/lobby');
      return;
    }

    // Join the room
    socket.emit('join_room', { roomId });

    socket.on('move_made', ({ position, player }) => {
      console.log('Move received:', position, player); // Debug log
      setGameState(prev => {
        const newBoard = [...prev.board];
        // Set X or O based on which player made the move
        newBoard[position] = player === state.opponent ? 
          (state.symbol === 'X' ? 'O' : 'X') : 
          state.symbol;

        const winner = checkWinner(newBoard);
        const isDraw = !winner && newBoard.every(cell => cell !== null);

        if (winner || isDraw) {
          socket.emit('game_over', { roomId });
        }

        return {
          board: newBoard,
          currentTurn: player === username ? state.opponent : username,
          winner,
          isDraw
        };
      });
    });

    socket.on('rematch_requested', ({ player }) => {
      if (player !== username) {
        setRematchRequested(true);
      }
    });

    socket.on('rematch_accepted', () => {
      setGameState({
        board: Array(9).fill(null),
        currentTurn: state?.symbol === 'X' ? 
          username : state?.opponent,
        winner: null,
        isDraw: false
      });
      setRematchRequested(false);
    });

    socket.on('return_to_lobby', () => {
      navigate('/lobby');
    });

    return () => {
      socket.off('move_made');
      socket.off('rematch_requested');
      socket.off('rematch_accepted');
      socket.off('return_to_lobby');
    };
  }, [navigate, state, roomId, username]);

  // Early return if no state
  if (!state) {
    navigate('/lobby');
    return null;
  }

  return (
    <div className="game-container">
      <div className="game-info">
        <h2>Playing against: {state?.opponent}</h2>
        <p>You are: {state?.symbol}</p>
        <p className="turn-indicator">
          {gameState.winner ? 
            `Winner: ${gameState.winner}` : 
            gameState.isDraw ? 
              'Game Draw!' : 
              `Current turn: ${gameState.currentTurn}`}
        </p>
      </div>

      <div className="game-board">
        {gameState.board.map((value, index) => (
          <button
            key={index}
            className={`cell ${value ? 'filled' : ''} 
              ${value === 'X' ? 'x-mark' : value === 'O' ? 'o-mark' : ''} 
              ${gameState.winner && gameState.board[index] === 
              (state?.symbol === 'X' ? 'X' : 'O') ? 'winner' : ''}`}
            onClick={() => handleCellClick(index)}
          >
            {value}
          </button>
        ))}
      </div>

      {(gameState.winner || gameState.isDraw) && (
        <div className="game-over-actions">
          {!rematchRequested ? (
            <button className="rematch-button" onClick={handleRematchRequest}>
              Request Rematch
            </button>
          ) : (
            <p>Waiting for opponent...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;