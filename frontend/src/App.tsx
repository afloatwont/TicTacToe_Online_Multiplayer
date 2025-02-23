import React, { useState, useEffect } from "react";
import "./App.css";
import { io, Socket } from "socket.io-client";
import Swal from "sweetalert2";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';

type PlayerType = "circle" | "cross";
type GameStateType = (number | PlayerType)[][];
type FinishedStateType = PlayerType | "draw" | "opponentLeftMatch" | boolean;

interface OpponentFoundData {
  playingAs: PlayerType;
  opponentName: string;
}

interface PlayerMoveData {
  state: {
    id: number;
    sign: PlayerType;
  }
}

const renderFrom: GameStateType = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameStateType>(renderFrom);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerType>("circle");
  const [finishedState, setFinishetState] = useState<FinishedStateType>(false);
  const [finishedArrayState, setFinishedArrayState] = useState<number[]>([]);
  const [playOnline, setPlayOnline] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [playingAs, setPlayingAs] = useState<PlayerType | null>(null);

  const checkWinner = (): PlayerType | "draw" | null => {
    // row dynamic
    for (let row = 0; row < gameState.length; row++) {
      if (
        gameState[row][0] === gameState[row][1] &&
        gameState[row][1] === gameState[row][2]
      ) {
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
        return gameState[row][0] as PlayerType;
      }
    }

    // column dynamic
    for (let col = 0; col < gameState.length; col++) {
      if (
        gameState[0][col] === gameState[1][col] &&
        gameState[1][col] === gameState[2][col]
      ) {
        setFinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
        return gameState[0][col] as PlayerType;
      }
    }

    if (
      gameState[0][0] === gameState[1][1] &&
      gameState[1][1] === gameState[2][2]
    ) {
      return gameState[0][0] as PlayerType;
    }

    if (
      gameState[0][2] === gameState[1][1] &&
      gameState[1][1] === gameState[2][0]
    ) {
      return gameState[0][2] as PlayerType;
    }

    const isDrawMatch = gameState.flat().every((e) => 
      e === "circle" || e === "cross"
    );

    if (isDrawMatch) return "draw";

    return null;
  };

  useEffect(() => {
    const winner = checkWinner();
    if (winner) {
      setFinishetState(winner);
    }
  }, [gameState]);

  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter your name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });

    return result;
  };

  socket?.on("opponentLeftMatch", () => {
    setFinishetState("opponentLeftMatch");
  });

  socket?.on("playerMoveFromServer", (data: PlayerMoveData) => {
    const id = data.state.id;
    setGameState((prevState) => {
      const newState = [...prevState];
      const rowIndex = Math.floor(id / 3);
      const colIndex = id % 3;
      newState[rowIndex][colIndex] = data.state.sign;
      return newState;
    });
    setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
  });

  socket?.on("connect", () => {
    setPlayOnline(true);
  });

  socket?.on("OpponentNotFound", () => {
    setOpponentName(null);
  });

  socket?.on("OpponentFound", (data: OpponentFoundData) => {
    setPlayingAs(data.playingAs);
    setOpponentName(data.opponentName);
  });


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game/:roomId" element={<Game />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
