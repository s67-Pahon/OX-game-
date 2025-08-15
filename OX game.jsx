// We start by importing the 'React' library and some special tools from it.
// These tools are called "Hooks" and they let us add features like memory and
// lifecycle events to our components.
import React, { useRef, useEffect, useState } from 'react';

// #A: REACT COMPONENTS
// In React, we build user interfaces by creating "components". Think of them
// as custom, reusable HTML tags. This 'App' function is a component.
// Its only job is to display our main 'GameBoard' component.
function App() {
  return (
    <div>
      <GameBoard />
    </div>
  );
}

// --- Helper Functions ---
// These are regular JavaScript functions that do specific jobs for our game.

// This function knows how to draw an 'X'.
function drawX(ctx, row, col, lineSpacing) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    const x = col * lineSpacing;
    const y = row * lineSpacing;
    const padding = 20;
    ctx.beginPath();
    ctx.moveTo(x + padding, y + padding);
    ctx.lineTo(x + lineSpacing - padding, y + lineSpacing - padding);
    ctx.moveTo(x + lineSpacing - padding, y + padding);
    ctx.lineTo(x + padding, y + lineSpacing - padding);
    ctx.stroke();
}

// This function knows how to draw an 'O'.
function drawO(ctx, row, col, lineSpacing) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    const centerX = col * lineSpacing + lineSpacing / 2;
    const centerY = row * lineSpacing + lineSpacing / 2;
    const radius = lineSpacing / 2 - 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

// #5: This function checks if a player has won.
// It no longer uses a hard-coded list of winning lines.
function calculateWinner(board) {
  const size = 3;
  // Check rows for a win
  for (let i = 0; i < size; i++) {
    const first = i * size;
    if (board[first] && board[first] === board[first + 1] && board[first] === board[first + 2]) {
      return board[first];
    }
  }
  // Check columns for a win
  for (let i = 0; i < size; i++) {
    if (board[i] && board[i] === board[i + size] && board[i] === board[i + 2 * size]) {
      return board[i];
    }
  }
  // Check diagonals for a win
  if (board[0] && board[0] === board[4] && board[0] === board[8]) {
    return board[0];
  }
  if (board[2] && board[2] === board[4] && board[2] === board[6]) {
    return board[2];
  }
  // If no winner is found after all checks, return nothing.
  return null;
}


// #1: This is the main component for our game. It holds all the logic and visuals.
function GameBoard() {
  // #B: REFS
  // A "ref" gives us a direct link to a specific HTML element that React renders.
  // Here, we're creating a ref to link to our <canvas> element.
  const canvasRef = useRef(null);
  
  // #2 & #C: STATE
  // "State" is the memory of our component. We use the `useState` Hook to create
  // variables that React will remember and can change over time. When a state
  // variable changes, React automatically re-renders the component to show the update.
  const [turn, setTurn] = useState(1); // Remembers the current turn.
  const [board, setBoard] = useState(Array(9).fill(null)); // Remembers the game board.
  const [winner, setWinner] = useState(null); // Remembers the winner.

function animateLine(ctx, x1, y1, x2, y2, duration) {
  return new Promise((resolve) => {
    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / duration, 1); // progress 0 → 1
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }

    requestAnimationFrame(frame);
  });
}

// Just draw two lines like a plus sign
async function drawCrossAnimated(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;

  const size = canvas.width;
  const mid = size / 3;

  // Vertical line
  await animateLine(ctx, mid, 0, mid, size, 500);
  // Horizontal line
  await animateLine(ctx, 0, mid, size, mid, 500);
}
  // #3 & #D: EFFECTS
  // The `useEffect` Hook lets us run code at specific moments in a component's life.
  // By passing an empty array `[]` at the end, we tell React to run this code
  // only ONCE, right after the component first appears on the screen.
  // This is perfect for setting up our initial empty grid.
  useEffect(() => {
  drawCrossAnimated(canvasRef.current);
}, []);


  // #4: This function runs every time the user clicks on the game board.
  const handleCanvasClick = (event) => {
    if (winner || turn > 9) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const lineSpacing = canvas.width / 3;
    const col = Math.floor(x / lineSpacing);
    const row = Math.floor(y / lineSpacing);
    const index = row * 3 + col;

    if (board[index]) return; 

    const currentPlayerSymbol = turn % 2 === 1 ? 'X' : 'O';
    const ctx = canvas.getContext('2d');
    if (currentPlayerSymbol === 'X') {
      drawX(ctx, row, col, lineSpacing);
    } else {
      drawO(ctx, row, col, lineSpacing);
    }

    // When we update state, we create a new copy of the array.
    // This is important for telling React that something has changed.
    const newBoard = [...board];
    newBoard[index] = currentPlayerSymbol;
    setBoard(newBoard); // Update the board state, causing a re-render.

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner); // Update the winner state.
    }

    setTurn(turn + 1); // Update the turn state.
  };
  
  // #6: This function runs when the user clicks the "Reset" button.
  const handleReset = () => {
    // We reset all the state variables back to their original values.
    setTurn(1);
    setBoard(Array(9).fill(null));
    setWinner(null);
    // We also manually redraw the grid to clear the old X's and O's.
    drawCrossAnimated(canvasRef.current);
  };

  // Figure out what message to show the user based on the current state.
  let status;
  if (winner) {
    status = `Winner: Player ${winner}`;
  } else if (turn > 9) {
    status = "It's a Draw!";
  } else {
    status = `Turn ${turn}: Player ${turn % 2 === 1 ? 'X' : 'O'}`;
  }

  // #7 & #E: JSX
  // This looks like HTML, but it's actually "JSX". It's a syntax that lets us
  // write HTML-like code in our JavaScript. React turns this into real HTML
  // that the browser can understand. We can embed JavaScript variables right
  // inside it using curly braces {}.
  return (
    <>
      <h1>Ox Game</h1>
      <h2>{status}</h2>
      <canvas
        ref={canvasRef}
        width="300"
        height="300"
        style={{ border: '1px solid black' }}
        onClick={handleCanvasClick}
      ></canvas>
      <button id="reset-btn" onClick={handleReset} style={{marginTop: '10px'}}>
        Reset
      </button>
    </>
  );
}

// We "export" our main App component so it can be used by other parts of the project.
export default App;
