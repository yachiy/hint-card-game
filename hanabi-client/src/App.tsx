import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Board from './components/Board';

function App() {
  return (
    <div className="App">
      <h1>Hanabi</h1>
      <Board />
    </div>
  );
}

export default App;
