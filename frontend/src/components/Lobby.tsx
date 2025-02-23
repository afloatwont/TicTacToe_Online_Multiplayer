import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import Swal from 'sweetalert2';
import '../styles/Lobby.css';

const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    const handleGameStart = (data: { roomId: string; opponent: string; symbol: 'X' | 'O' }) => {
      navigate(`/game/${data.roomId}`, { state: { opponent: data.opponent, symbol: data.symbol } });
    };

    socket.on('game_start', handleGameStart);

    return () => {
      socket.off('game_start', handleGameStart);
    };
  }, [navigate, username]);

  useEffect(() => {
    if (!username) {
      navigate('/');
      return;
    }

    socket.on('error', ({ message }) => {
      setIsSearching(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
      });
    });

    return () => {
      socket.off('error');
    };
  }, [navigate, username]);

  const handlePlayClick = () => {
    if (username) {
      setIsSearching(true);
      socket.emit('request_to_play', { username });
    }
  };

  return (
    <div className="lobby-container">
      <h2 className="welcome-text">Welcome, {username}!</h2>
      <div className="lobby-content">
        {!isSearching ? (
          <button className="play-button" onClick={handlePlayClick}>
            Play Game
          </button>
        ) : (
          <div className="searching-container">
            <div className="loading-spinner"></div>
            <p>Searching for opponent...</p>
            <button 
              className="cancel-button"
              onClick={() => setIsSearching(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;