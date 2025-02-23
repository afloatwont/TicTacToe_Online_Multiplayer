import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { socket } from '../utils/socket';
import '../styles/Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  const handleLogin = async () => {
    if (!username.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Empty Username',
        text: 'Please enter a username'
      });
      return;
    }

    socket.emit('check_username', username, (response) => {
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
      <button className="enter-button" onClick={handleLogin}>
        Enter Game
      </button>
    </div>
  );
};

export default Home;