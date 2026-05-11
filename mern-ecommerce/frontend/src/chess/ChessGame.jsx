import React, { useState, useCallback, useRef, useEffect } from 'react';
import ChessEngine, { squareToRowCol, rowColToSquare } from './ChessEngine';
import ChessBoard3D from './ChessBoard3D';

/**
 * Utility: format a move in algebraic notation (simplified).
 * e.g., "e4", "Nf3", "Bxe5", "O-O", "e8=Q"
 */
function formatMove(moveInfo) {
  const { piece, captured, castle, promotion, from, to, check, checkmate } = moveInfo;

  if (castle) {
    const isKingside = to.charCodeAt(1) > from.charCodeAt(1);
    return isKingside ? 'O-O' + (checkmate ? '#' : check ? '+' : '') : 'O-O-O' + (checkmate ? '#' : check ? '+' : '');
  }

  let notation = '';

  if (piece !== 'P') {
    notation += piece; // K, Q, R, B, N
  }

  // Disambiguation / capture
  if (captured) {
    if (piece === 'P') notation += from[0]; // file of pawn
    notation += 'x';
  } else if (piece === 'P' && to === from[0] + '???') {
    notation += from[0];
  }

  notation += to;

  if (promotion) notation += '=' + promotion;
  if (checkmate) notation += '#';
  else if (check) notation += '+';

  return notation;
}

/**
 * Format move number + move pair for display
 */
function formatMoveHistory(moves) {
  const result = [];
  for (let i = 0; i < moves.length; i += 2) {
    const moveNum = Math.floor(i / 2) + 1;
    const white = formatMove(moves[i].moveInfo);
    const black = moves[i + 1] ? formatMove(moves[i + 1].moveInfo) : '';
    result.push(
      <div key={i} style={{ display: 'flex', gap: '8px', padding: '2px 0', fontSize: '0.85rem', fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
        <span style={{ color: '#6366f1', minWidth: '24px', fontWeight: 600 }}>{moveNum}.</span>
        <span style={{ color: '#fff', minWidth: '60px' }}>{white}</span>
        <span style={{ color: '#a1a1aa', minWidth: '60px' }}>{black}</span>
      </div>
    );
  }
  return result;
}

// ─── Promotion Dialog ─────────────────────────────────────
function PromotionDialog({ color, onSelect }) {
  const pieces = ['Q', 'R', 'B', 'N'];
  const labels = { Q: '♛', R: '♜', B: '♝', N: '♞' };
  const colors = { Q: '#6366f1', R: '#ec4899', B: '#22d3ee', N: '#fbbf24' };

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 100,
      background: 'rgba(10,10,12,0.95)',
      border: '1px solid var(--surface-border)',
      borderRadius: '16px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
        Promote Pawn
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {pieces.map(p => (
          <button
            key={p}
            onClick={() => onSelect(p)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              border: '2px solid var(--surface-border)',
              background: 'var(--surface)',
              color: colors[p],
              fontSize: '1.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'rgba(99,102,241,0.1)'; }}
            onMouseLeave={(e) => { e.target.style.borderColor = 'var(--surface-border)'; e.target.style.background = 'var(--surface)'; }}
          >
            {labels[p]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Chess Game Component ────────────────────────────
export default function ChessGame({ onBack }) {
  const engineRef = useRef(new ChessEngine());
  const [engine, setEngine] = useState(engineRef.current);
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [checkSquares, setCheckSquares] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState({ turn: 'w', gameOver: false, result: null, winner: null });
  const [showPromotion, setShowPromotion] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [message, setMessage] = useState('');

  // Refresh state from engine
  const refreshState = useCallback(() => {
    const e = engineRef.current;
    const lm = e.getLastMove();
    
    // Find check squares (king position when in check)
    const inCheck = e.isInCheck();
    let ckSq = [];
    if (inCheck) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = e.getBoard()[r][c];
          if (p && p.type === 'K' && p.color === e.turn) {
            ckSq.push(rowColToSquare(r, c));
          }
        }
      }
    }

    setLastMove(lm ? { from: lm.from, to: lm.to } : null);
    setCheckSquares(ckSq);
    setMoveHistory([...e.getMoveHistory()]);
    setGameStatus({
      turn: e.turn,
      gameOver: e.gameOver,
      result: e.gameResult,
      winner: e.winner,
    });
  }, []);

  // Handle square click
  const handleSquareClick = useCallback((sq) => {
    const e = engineRef.current;
    if (e.gameOver) return;

    const piece = e.getPiece(sq);

    // If we have a selected piece, try to move
    if (selected) {
      // Clicking on own piece swaps selection
      if (piece && piece.color === e.turn) {
        setSelected(sq);
        setLegalMoves(e.getLegalMoves(sq));
        return;
      }

      // Check if this is a legal move
      if (e.isLegalMove(selected, sq)) {
        // Check if pawn promotion needed
        const [tr] = squareToRowCol(sq);
        const [fr] = squareToRowCol(selected);
        const selectedPiece = e.getPiece(selected);
        if (selectedPiece && selectedPiece.type === 'P' && tr === (selectedPiece.color === 'w' ? 0 : 7)) {
          // Need promotion selection
          setPendingPromotion({ from: selected, to: sq });
          setShowPromotion(true);
          return;
        }

        const result = e.makeMove(selected, sq);
        if (result.success) {
          setSelected(null);
          setLegalMoves([]);
          refreshState();
          if (result.checkmate) {
            setMessage(`Checkmate! ${result.winner === 'w' ? 'White' : 'Black'} wins!`);
          } else if (result.stalemate) {
            setMessage('Stalemate! The game is a draw.');
          } else if (result.draw) {
            setMessage('Draw!');
          } else if (result.check) {
            setMessage('Check!');
          } else {
            setMessage('');
          }
          return;
        }
      }

      // Invalid move - deselect
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    // No piece selected yet
    if (piece && piece.color === e.turn) {
      setSelected(sq);
      setLegalMoves(e.getLegalMoves(sq));
    }
  }, [selected, refreshState]);

  // Handle promotion selection
  const handlePromotion = useCallback((promoType) => {
    if (!pendingPromotion) return;
    const e = engineRef.current;
    const result = e.makeMove(pendingPromotion.from, pendingPromotion.to, promoType);
    if (result.success) {
      setShowPromotion(false);
      setPendingPromotion(null);
      setSelected(null);
      setLegalMoves([]);
      refreshState();
      if (result.checkmate) {
        setMessage(`Checkmate! ${result.winner === 'w' ? 'White' : 'Black'} wins!`);
      } else if (result.stalemate) {
        setMessage('Stalemate! The game is a draw.');
      } else if (result.draw) {
        setMessage('Draw!');
      } else if (result.check) {
        setMessage('Check!');
      } else {
        setMessage('');
      }
    }
  }, [pendingPromotion, refreshState]);

  // Reset game
  const handleNewGame = useCallback(() => {
    engineRef.current = new ChessEngine();
    setEngine(engineRef.current);
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setCheckSquares([]);
    setMoveHistory([]);
    setGameStatus({ turn: 'w', gameOver: false, result: null, winner: null });
    setShowPromotion(false);
    setPendingPromotion(null);
    setMessage('');
  }, []);

  // Undo move
  const handleUndo = useCallback(() => {
    const e = engineRef.current;
    if (e.moveHistory.length === 0) return;
    e.undoLastMove();
    setSelected(null);
    setLegalMoves([]);
    setMessage('');
    refreshState();
  }, [refreshState]);

  // Flip board
  const handleFlip = useCallback(() => {
    setFlipped(f => !f);
  }, []);

  const isWhiteTurn = gameStatus.turn === 'w';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'var(--bg-color)',
      backgroundImage: 'var(--bg-gradient)',
      color: 'var(--text-primary)',
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Header */}
      <nav style={{
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--surface-border)',
        background: 'rgba(10,10,12,0.7)',
        backdropFilter: 'blur(16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--surface-border)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'var(--surface)'; }}
          >
            ← Back
          </button>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '1px', margin: 0 }}>
            ♚ Chess
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleUndo} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} disabled={moveHistory.length === 0}>
            ↩ Undo
          </button>
          <button onClick={handleFlip} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            🔄 Flip
          </button>
          <button onClick={handleNewGame} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            New Game
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        padding: '16px',
        gap: '16px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* 3D Board */}
        <div style={{
          flex: '1 1 65%',
          minHeight: '500px',
          height: 'calc(100vh - 120px)',
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <ChessBoard3D
            engine={engine}
            selected={selected}
            legalMoves={legalMoves}
            lastMove={lastMove}
            checkSquares={checkSquares}
            flipped={flipped}
            onSquareClick={handleSquareClick}
          />

          {/* Promotion Dialog */}
          {showPromotion && (
            <PromotionDialog
              color={gameStatus.turn}
              onSelect={handlePromotion}
            />
          )}
        </div>

        {/* Side Panel */}
        <div style={{
          flex: '1 1 35%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {/* Game status */}
          <div className="glass" style={{
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--surface-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: gameStatus.gameOver ? '#ef4444' : (isWhiteTurn ? '#f0f0f0' : '#222'),
                border: '2px solid var(--surface-border)',
              }} />
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {gameStatus.gameOver
                  ? gameStatus.result === 'checkmate'
                    ? `🏆 Checkmate! ${gameStatus.winner === 'w' ? 'White' : 'Black'} wins!`
                    : gameStatus.result === 'stalemate'
                      ? '🤝 Stalemate!'
                      : '🤝 Draw!'
                  : `${isWhiteTurn ? "White's" : "Black's"} Turn`
                }
              </span>
            </div>
            {message && (
              <div style={{
                color: message.includes('Checkmate') ? '#fbbf24' : message.includes('Check') ? '#ef4444' : '#6366f1',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}>
                {message}
              </div>
            )}
            <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginTop: '4px' }}>
              Move {Math.ceil(moveHistory.length / 2) || 1}
            </div>
          </div>

          {/* Captured pieces (simple indicator) */}
          <div className="glass" style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid var(--surface-border)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: '#a1a1aa',
          }}>
            <span>♚ ♛ ♜ ♝ ♞ ♟</span>
            <span style={{ fontWeight: 600, color: '#6366f1' }}>Click pieces to move</span>
          </div>

          {/* Move History */}
          <div className="glass" style={{
            flex: 1,
            borderRadius: '12px',
            border: '1px solid var(--surface-border)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '200px',
            overflow: 'hidden',
          }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
              Move History
            </h3>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {moveHistory.length === 0 ? (
                <div style={{ color: '#52525b', fontSize: '0.85rem', padding: '16px 0', textAlign: 'center' }}>
                  No moves yet. Make your first move!
                </div>
              ) : (
                formatMoveHistory(moveHistory)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
