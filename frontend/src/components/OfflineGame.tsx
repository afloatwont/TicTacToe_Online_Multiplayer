import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Game.css';

type Player = 'X' | 'O';
type Board = (Player | null)[];

const OfflineGame: React.FC = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'Draw' | null>(null);

  const checkWinner = (squares: Board): Player | 'Draw' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    if (squares.every(square => square !== null)) {
      return 'Draw';
    }

    return null;
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <h2>Offline Mode</h2>
        <p className="turn-indicator">
          {winner 
            ? winner === 'Draw' 
              ? "It's a Draw!" 
              : `Winner: ${winner}`
            : `Current turn: ${currentPlayer}`}
        </p>
      </div>

      <div className="game-board">
        {board.map((value, index) => (
          <button
            key={index}
            className={`cell ${value ? 'filled' : ''} 
              ${value === 'X' ? 'x-mark' : value === 'O' ? 'o-mark' : ''}`}
            onClick={() => handleClick(index)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="game-over-actions">
        <button className="rematch-button" onClick={handleReset}>
          {winner ? 'Play Again' : 'Reset Game'}
        </button>
        <button 
          className="offline-button" 
          onClick={() => navigate('/')}
          style={{ marginTop: '1rem' }}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default OfflineGame;