import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { socket, checkServerConnection } from '../utils/socket';
import '../styles/Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkServerConnection();
      setIsConnecting(false);
      
      if (!isConnected) {
        Swal.fire({
          icon: 'warning',
          title: 'Server Unreachable',
          text: 'Playing offline mode only. Online features will not be available.',
          confirmButtonText: 'Okay'
        });
      }
    };

    checkConnection();
  }, []);

  const handleLogin = async () => {
    if (!username.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Username',
        text: 'Please enter a username'
      });
      return;
    }

    if (!socket.connected) {
      localStorage.setItem('username', username);
      navigate('/offline');
      return;
    }

    await Swal.fire({
      title: 'Connecting to server...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    socket.emit('check_username', username, (response) => {
      Swal.close();
      if (response.exists) {
        Swal.fire({
          icon: 'error',
          title: 'Username taken',
          text: 'Please choose another username'
        });
        return;
      }

      socket.emit('register_user', username, (response) => {
        if (response.success) {
          localStorage.setItem('username', username);
          navigate('/lobby');
        }
      });
    });
  };

  const handleOfflinePlay = () => {
    navigate('/offline');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="main-div">
      <h1 className="title">Tic Tac Toe</h1>
      <div className="input-container">
        <input 
          className="username-input"
          type="text" 
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          maxLength={15}
        />
      </div>
      <button 
        className="enter-button" 
        onClick={handleLogin}
        disabled={isConnecting}
      >
        Play Online
      </button>
      <button 
        className="offline-button" 
        onClick={handleOfflinePlay}
      >
        Play Offline
      </button>
      {isConnecting && <p className="connecting-text">Connecting to server...</p>}
    </div>
  );
};

export default Home;