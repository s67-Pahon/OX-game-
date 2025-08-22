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

// This function knows how to draw an 'X' (animated with two strokes).
function drawX(ctx, row, col, lineSpacing) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    const x = col * lineSpacing;
    const y = row * lineSpacing;
    const padding = 20;

    const x1 = x + padding;
    const y1 = y + padding;
    const x2 = x + lineSpacing - padding;
    const y2 = y + lineSpacing - padding;
    const x3 = x + lineSpacing - padding;
    const y3 = y + padding;
    const x4 = x + padding;
    const y4 = y + lineSpacing - padding;

    function animateLine(ax, ay, bx, by, duration) {
      return new Promise((resolve) => {
        const start = performance.now();
        function frame(now) {
          const t = Math.min((now - start) / duration, 1);
          const cx = ax + (bx - ax) * t;
          const cy = ay + (by - ay) * t;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(cx, cy);
          ctx.stroke();
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
    }

    // draw the two strokes of X sequentially
    animateLine(x1, y1, x2, y2, 180).then(() => {
      return animateLine(x3, y3, x4, y4, 180);
    });
}

// This function knows how to draw an 'O' (animated via dash-offset method).
function drawO(ctx, row, col, lineSpacing) {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;

    const centerX = col * lineSpacing + lineSpacing / 2;
    const centerY = row * lineSpacing + lineSpacing / 2;
    const radius = lineSpacing / 2 - 20;
    const duration = 360; // ms

    // Use a single dash equal to circumference and reveal by reducing offset
    const C = 2 * Math.PI * radius;

    return new Promise((resolve) => {
      const start = performance.now();
      ctx.setLineDash([C]);
      ctx.lineDashOffset = C;

      function frame(now) {
        const t = Math.min((now - start) / duration, 1); // 0→1
        ctx.lineDashOffset = C * (1 - t);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();

        if (t < 1) requestAnimationFrame(frame);
        else {
          ctx.setLineDash([]);      // cleanup so future strokes are normal
          ctx.lineDashOffset = 0;
          resolve();
        }
      }

      requestAnimationFrame(frame);
    });
}

// #5: This function checks if a player has won.
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
  const canvasRef = useRef(null);
  
  // #2 & #C: STATE
  const [turn, setTurn] = useState(1);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [winner, setWinner] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);   // lock during X/O animation
  const [isGridDrawing, setIsGridDrawing] = useState(false); // lock while grid draws + extra delay

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

// Draw the board grid as four lines (two vertical, two horizontal), animated.
async function drawCrossAnimated(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;

  const size = canvas.width;
  const mid = size / 3;

  // Vertical lines
  await animateLine(ctx, mid, 0, mid, size, 300);
  await animateLine(ctx, mid * 2, 0, mid * 2, size, 300);
  // Horizontal lines
  await animateLine(ctx, 0, mid, size, mid, 300);
  await animateLine(ctx, 0, mid * 2, size, mid * 2, 300);
}

  // #3 & #D: EFFECTS
  useEffect(() => {
    setIsGridDrawing(true); // lock during initial grid draw
    drawCrossAnimated(canvasRef.current).then(() => {
      setTimeout(() => setIsGridDrawing(false),500); // extra 0.5s lock after grid draws
    });
  }, []);


  // #4: Handle clicks to draw X/O
const handleCanvasClick = (event) => {
  if (winner || turn > 9 || isAnimating || isGridDrawing) return;

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

  setIsAnimating(true); //  lock clicks while animating

  let drawPromise;
  if (currentPlayerSymbol === 'X') {
    // wrap X drawing into a Promise for consistency
    drawPromise = new Promise((resolve) => {
      drawX(ctx, row, col, lineSpacing);
      setTimeout(resolve, 400); // X finishes after ~400ms
    });
  } else {
    drawPromise = drawO(ctx, row, col, lineSpacing);
  }

  drawPromise.then(() => {
    const newBoard = [...board];
    newBoard[index] = currentPlayerSymbol;
    setBoard(newBoard);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
    }

    setTurn(turn + 1);
    setIsAnimating(false); //  unlock clicks after animation
  });
};

  
  // #6: Reset
  const handleReset = () => {
    setTurn(1);
    setBoard(Array(9).fill(null));
    setWinner(null);

    setIsGridDrawing(true); // lock during reset grid draw
    drawCrossAnimated(canvasRef.current).then(() => {
      setTimeout(() => setIsGridDrawing(false), 500); // extra 0.5s lock after redraw
    });
  };

  // Status text
  let status;
  if (winner) {
    status = `Winner: Player ${winner}`;
  } else if (turn > 9) {
    status = "It's a Draw!";
  } else if (isGridDrawing) {
    status = "Preparing board...";
  } else {
    status = `Turn ${turn}: Player ${turn % 2 === 1 ? 'X' : 'O'}`;
  }

  // #7 & #E: JSX
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

  );
}

// We "export" our main App component so it can be used by other parts of the project.
export default App;
