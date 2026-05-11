/**
 * ChessEngine.js — Full chess game logic
 *
 * Board layout: board[row][col]
 *   row 0 = rank 8 (black's back rank)
 *   row 7 = rank 1 (white's back rank)
 *   col 0 = file 'a', col 7 = file 'h'
 *
 * Piece: { type, color } or null
 *   type: 'K','Q','R','B','N','P'
 *   color: 'w' | 'b'
 *
 * Moves use algebraic notation: "e2e4"
 */

const FILES = 'abcdefgh';

export function squareToRowCol(sq) {
  const file = sq.charCodeAt(0) - 97; // 'a' -> 0
  const rank = parseInt(sq[1], 10);    // '1' -> 1
  return [8 - rank, file];
}

export function rowColToSquare(row, col) {
  return FILES[col] + (8 - row);
}

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function cloneBoard(board) {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

export default class ChessEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = this._initBoard();
    this.turn = 'w';
    this.castling = { K: true, Q: true, k: true, q: true }; // white K-side, white Q-side, black k-side, black q-side
    this.enPassant = null; // square where en passant capture can happen, e.g., 'e3'
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.moveHistory = [];
    this.positionHistory = [];
    this.gameOver = false;
    this.winner = null; // 'w', 'b', or null
    this.gameResult = null; // 'checkmate', 'stalemate', 'draw'
    this._savePosition();
  }

  _initBoard() {
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));

    const backRank = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    for (let c = 0; c < 8; c++) {
      board[0][c] = { type: backRank[c], color: 'b' };
      board[1][c] = { type: 'P', color: 'b' };
      board[6][c] = { type: 'P', color: 'w' };
      board[7][c] = { type: backRank[c], color: 'w' };
    }
    return board;
  }

  getPiece(sq) {
    const [r, c] = squareToRowCol(sq);
    return this.board[r][c];
  }

  getBoard() {
    return this.board;
  }

  getFen() {
    let fen = '';
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (!p) {
          empty++;
        } else {
          if (empty > 0) { fen += empty; empty = 0; }
          fen += p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
        }
      }
      if (empty > 0) fen += empty;
      if (r < 7) fen += '/';
    }
    // Turn
    fen += ' ' + this.turn;
    // Castling
    let castling = '';
    if (this.castling.K) castling += 'K';
    if (this.castling.Q) castling += 'Q';
    if (this.castling.k) castling += 'k';
    if (this.castling.q) castling += 'q';
    fen += ' ' + (castling || '-');
    // En passant
    fen += ' ' + (this.enPassant || '-');
    // Halfmove clock
    fen += ' ' + this.halfMoveClock;
    // Fullmove number
    fen += ' ' + this.fullMoveNumber;
    return fen;
  }

  loadFen(fen) {
    const parts = fen.split(' ');
    const rows = parts[0].split('/');
    this.board = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const ch of rows[r]) {
        if (ch >= '1' && ch <= '8') {
          c += parseInt(ch, 10);
        } else {
          this.board[r][c] = {
            type: ch.toUpperCase(),
            color: ch === ch.toUpperCase() ? 'w' : 'b',
          };
          c++;
        }
      }
    }
    this.turn = parts[1];
    this.castling = { K: false, Q: false, k: false, q: false };
    if (parts[2] !== '-') {
      for (const ch of parts[2]) {
        if (ch === 'K') this.castling.K = true;
        if (ch === 'Q') this.castling.Q = true;
        if (ch === 'k') this.castling.k = true;
        if (ch === 'q') this.castling.q = true;
      }
    }
    this.enPassant = parts[3] === '-' ? null : parts[3];
    this.halfMoveClock = parseInt(parts[4], 10);
    this.fullMoveNumber = parseInt(parts[5], 10);
    this.gameOver = false;
    this.winner = null;
    this.gameResult = null;
    this.moveHistory = [];
    this.positionHistory = [];
    this._savePosition();
  }

  _savePosition() {
    this.positionHistory.push(this.getFen().split(' ').slice(0, 4).join(' '));
  }

  // ─── Legal Move Generation ──────────────────────────────

  /**
   * Get all legal moves for the current player.
   * Returns [{ from, to, promotion? }]
   */
  getAllLegalMoves() {
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === this.turn) {
          const from = rowColToSquare(r, c);
          const targets = this._getPseudoLegalMoves(r, c);
          for (const to of targets) {
            if (!this._wouldBeCheck(from, to)) {
              // Check for pawn promotion
              const targetRow = squareToRowCol(to)[0];
              if (p.type === 'P' && targetRow === (p.color === 'w' ? 0 : 7)) {
                moves.push({ from, to, promotion: 'Q' });
                moves.push({ from, to, promotion: 'R' });
                moves.push({ from, to, promotion: 'B' });
                moves.push({ from, to, promotion: 'N' });
              } else {
                moves.push({ from, to });
              }
            }
          }
        }
      }
    }
    return moves;
  }

  /**
   * Get all legal moves for a specific square.
   */
  getLegalMoves(sq) {
    const [r, c] = squareToRowCol(sq);
    const p = this.board[r][c];
    if (!p || p.color !== this.turn) return [];
    const targets = this._getPseudoLegalMoves(r, c);
    return targets.filter(to => !this._wouldBeCheck(sq, to));
  }

  isLegalMove(from, to) {
    const moves = this.getLegalMoves(from);
    return moves.some(m => m === to);
  }

  /**
   * Make a move. Returns { success, captured, check, checkmate, stalemate, promotion, gameOver, winner, moveInfo }
   */
  makeMove(from, to, promotionType = null) {
    if (this.gameOver) return { success: false, error: 'Game is over' };

    const [fr, fc] = squareToRowCol(from);
    const piece = this.board[fr][fc];
    if (!piece) return { success: false, error: 'No piece at from square' };
    if (piece.color !== this.turn) return { success: false, error: 'Wrong turn' };
    if (!this.isLegalMove(from, to)) return { success: false, error: 'Illegal move' };

    const [tr, tc] = squareToRowCol(to);
    const captured = this.board[tr][tc];
    const isCastle = piece.type === 'K' && Math.abs(tc - fc) === 2;
    const isEnPassant = piece.type === 'P' && to === this.enPassant;
    const isPromotion = piece.type === 'P' && tr === (piece.color === 'w' ? 0 : 7);

    // Save state for undo
    const prevState = {
      board: cloneBoard(this.board),
      turn: this.turn,
      castling: { ...this.castling },
      enPassant: this.enPassant,
      halfMoveClock: this.halfMoveClock,
    };

    // Execute move
    this.board[tr][tc] = piece;
    this.board[fr][fc] = null;

    // En passant capture
    let epCaptured = null;
    if (isEnPassant) {
      epCaptured = this.board[fr][tc];
      this.board[fr][tc] = null;
    }

    // Pawn promotion
    let promotedPiece = null;
    if (isPromotion) {
      const promo = promotionType || 'Q';
      this.board[tr][tc] = { type: promo, color: piece.color };
      promotedPiece = promo;
    }

    // Castling — move the rook
    if (isCastle) {
      if (tc > fc) {
        // Kingside
        this.board[tr][7] = null;
        this.board[tr][5] = { type: 'R', color: piece.color };
      } else {
        // Queenside
        this.board[tr][0] = null;
        this.board[tr][3] = { type: 'R', color: piece.color };
      }
    }

    // Update castling rights
    if (piece.type === 'K') {
      if (piece.color === 'w') { this.castling.K = false; this.castling.Q = false; }
      else { this.castling.k = false; this.castling.q = false; }
    }
    if (piece.type === 'R') {
      if (fr === 7 && fc === 0) this.castling.Q = false;
      if (fr === 7 && fc === 7) this.castling.K = false;
      if (fr === 0 && fc === 0) this.castling.q = false;
      if (fr === 0 && fc === 7) this.castling.k = false;
    }
    // If a rook is captured
    if (tr === 7 && tc === 0) this.castling.Q = false;
    if (tr === 7 && tc === 7) this.castling.K = false;
    if (tr === 0 && tc === 0) this.castling.q = false;
    if (tr === 0 && tc === 7) this.castling.k = false;

    // Update en passant
    if (piece.type === 'P' && Math.abs(tr - fr) === 2) {
      this.enPassant = rowColToSquare((fr + tr) / 2, fc);
    } else {
      this.enPassant = null;
    }

    // Update clocks
    if (piece.type === 'P' || captured || epCaptured) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }
    if (this.turn === 'b') this.fullMoveNumber++;
    this.turn = this.turn === 'w' ? 'b' : 'w';

    this._savePosition();

    // Check game state
    const inCheck = this._isInCheck(this.turn);
    const legalMoves = this.getAllLegalMoves();
    const checkmate = inCheck && legalMoves.length === 0;
    const stalemate = !inCheck && legalMoves.length === 0;

    // Check for draw by insufficient material
    const draw = !checkmate && !stalemate && this._isDraw();

    const moveInfo = {
      from,
      to,
      piece: piece.type,
      color: piece.color,
      captured: captured ? captured.type : (epCaptured ? 'P' : null),
      castle: isCastle,
      enPassant: isEnPassant,
      promotion: promotedPiece,
      check: inCheck,
      checkmate,
      stalemate,
    };

    if (checkmate || stalemate || draw) {
      this.gameOver = true;
      if (checkmate) {
        this.winner = this.turn === 'w' ? 'b' : 'w'; // opponent won
        this.gameResult = 'checkmate';
      } else if (stalemate) {
        this.winner = null;
        this.gameResult = 'stalemate';
      } else {
        this.winner = null;
        this.gameResult = 'draw';
      }
    }

    this.moveHistory.push({ ...moveInfo, prevState });

    return {
      success: true,
      captured: captured || epCaptured,
      check: inCheck,
      checkmate,
      stalemate,
      draw,
      promotion: promotedPiece,
      gameOver: this.gameOver,
      winner: this.winner,
      gameResult: this.gameResult,
      moveInfo,
    };
  }

  undoLastMove() {
    if (this.moveHistory.length === 0) return false;
    const last = this.moveHistory.pop();
    this.board = last.prevState.board;
    this.turn = last.prevState.turn;
    this.castling = last.prevState.castling;
    this.enPassant = last.prevState.enPassant;
    this.halfMoveClock = last.prevState.halfMoveClock;
    this.positionHistory.pop();
    this.gameOver = false;
    this.winner = null;
    this.gameResult = null;
    return true;
  }

  isInCheck() {
    return this._isInCheck(this.turn);
  }

  isCheckmate() {
    return this.gameOver && this.gameResult === 'checkmate';
  }

  isStalemate() {
    return this.gameOver && this.gameResult === 'stalemate';
  }

  // ─── Internal helpers ───────────────────────────────────

  _isInCheck(color) {
    // Find king
    let kr = -1, kc = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.type === 'K' && p.color === color) {
          kr = r; kc = c; break;
        }
      }
      if (kr >= 0) break;
    }
    if (kr < 0) return true; // king missing = technically in check

    const enemy = color === 'w' ? 'b' : 'w';
    return this._isSquareAttacked(kr, kc, enemy);
  }

  _isSquareAttacked(row, col, byColor) {
    // Check knight attacks
    const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of knightMoves) {
      const r = row + dr, c = col + dc;
      if (inBounds(r, c) && this.board[r][c] && this.board[r][c].type === 'N' && this.board[r][c].color === byColor)
        return true;
    }

    // Check king attacks (adjacent squares)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr, c = col + dc;
        if (inBounds(r, c) && this.board[r][c] && this.board[r][c].type === 'K' && this.board[r][c].color === byColor)
          return true;
      }
    }

    // Check pawn attacks
    const pawnDir = byColor === 'w' ? -1 : 1;
    for (const dc of [-1, 1]) {
      const r = row + pawnDir, c = col + dc;
      if (inBounds(r, c) && this.board[r][c] && this.board[r][c].type === 'P' && this.board[r][c].color === byColor)
        return true;
    }

    // Check sliding pieces (rook, bishop, queen)
    const slideDirs = {
      rook: [[0,1],[1,0],[0,-1],[-1,0]],
      bishop: [[1,1],[1,-1],[-1,1],[-1,-1]],
    };
    const allDirs = [...slideDirs.rook, ...slideDirs.bishop];
    for (const [dr, dc] of allDirs) {
      let r = row + dr, c = col + dc;
      while (inBounds(r, c)) {
        const p = this.board[r][c];
        if (p) {
          if (p.color === byColor) {
            const isRookLike = p.type === 'R' || p.type === 'Q';
            const isBishopLike = p.type === 'B' || p.type === 'Q';
            const drAbs = Math.abs(dr), dcAbs = Math.abs(dc);
            // Check if direction matches piece type
            if (drAbs === 0 || dcAbs === 0) {
              // Horizontal/vertical
              if (isRookLike) return true;
            } else {
              // Diagonal
              if (isBishopLike) return true;
            }
          }
          break;
        }
        r += dr; c += dc;
      }
    }

    return false;
  }

  _getPseudoLegalMoves(row, col) {
    const piece = this.board[row][col];
    if (!piece) return [];
    const moves = [];
    const { type, color } = piece;
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;

    switch (type) {
      case 'P': {
        // Forward one
        if (inBounds(row + dir, col) && !this.board[row + dir][col])
          moves.push(rowColToSquare(row + dir, col));
        // Forward two from start
        if (row === startRow && !this.board[row + dir][col] && !this.board[row + 2 * dir][col])
          moves.push(rowColToSquare(row + 2 * dir, col));
        // Captures
        for (const dc of [-1, 1]) {
          const r = row + dir, c = col + dc;
          if (inBounds(r, c)) {
            if (this.board[r][c] && this.board[r][c].color !== color)
              moves.push(rowColToSquare(r, c));
            // En passant
            const epSq = rowColToSquare(r, c);
            if (epSq === this.enPassant)
              moves.push(epSq);
          }
        }
        break;
      }

      case 'N': {
        const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for (const [dr, dc] of knightMoves) {
          const r = row + dr, c = col + dc;
          if (inBounds(r, c) && (!this.board[r][c] || this.board[r][c].color !== color))
            moves.push(rowColToSquare(r, c));
        }
        break;
      }

      case 'B': {
        const bDirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr, dc] of bDirs) {
          let r = row + dr, c = col + dc;
          while (inBounds(r, c)) {
            if (!this.board[r][c]) {
              moves.push(rowColToSquare(r, c));
            } else {
              if (this.board[r][c].color !== color)
                moves.push(rowColToSquare(r, c));
              break;
            }
            r += dr; c += dc;
          }
        }
        break;
      }

      case 'R': {
        const rDirs = [[0,1],[1,0],[0,-1],[-1,0]];
        for (const [dr, dc] of rDirs) {
          let r = row + dr, c = col + dc;
          while (inBounds(r, c)) {
            if (!this.board[r][c]) {
              moves.push(rowColToSquare(r, c));
            } else {
              if (this.board[r][c].color !== color)
                moves.push(rowColToSquare(r, c));
              break;
            }
            r += dr; c += dc;
          }
        }
        break;
      }

      case 'Q': {
        const qDirs = [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];
        for (const [dr, dc] of qDirs) {
          let r = row + dr, c = col + dc;
          while (inBounds(r, c)) {
            if (!this.board[r][c]) {
              moves.push(rowColToSquare(r, c));
            } else {
              if (this.board[r][c].color !== color)
                moves.push(rowColToSquare(r, c));
              break;
            }
            r += dr; c += dc;
          }
        }
        break;
      }

      case 'K': {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = row + dr, c = col + dc;
            if (inBounds(r, c) && (!this.board[r][c] || this.board[r][c].color !== color))
              moves.push(rowColToSquare(r, c));
          }
        }
        // Castling
        const backRank = color === 'w' ? 7 : 0;
        if (row === backRank && col === 4) {
          // Kingside
          if (this.castling[color === 'w' ? 'K' : 'k']) {
            if (!this.board[row][5] && !this.board[row][6] && this.board[row][7]?.type === 'R' && this.board[row][7]?.color === color) {
              if (!this._isSquareAttacked(row, 4, color === 'w' ? 'b' : 'w') &&
                  !this._isSquareAttacked(row, 5, color === 'w' ? 'b' : 'w') &&
                  !this._isSquareAttacked(row, 6, color === 'w' ? 'b' : 'w')) {
                moves.push(rowColToSquare(row, 6));
              }
            }
          }
          // Queenside
          if (this.castling[color === 'w' ? 'Q' : 'q']) {
            if (!this.board[row][3] && !this.board[row][2] && !this.board[row][1] && this.board[row][0]?.type === 'R' && this.board[row][0]?.color === color) {
              if (!this._isSquareAttacked(row, 4, color === 'w' ? 'b' : 'w') &&
                  !this._isSquareAttacked(row, 3, color === 'w' ? 'b' : 'w') &&
                  !this._isSquareAttacked(row, 2, color === 'w' ? 'b' : 'w')) {
                moves.push(rowColToSquare(row, 2));
              }
            }
          }
        }
        break;
      }
    }

    return moves;
  }

  _wouldBeCheck(from, to) {
    const [fr, fc] = squareToRowCol(from);
    const [tr, tc] = squareToRowCol(to);
    const piece = this.board[fr][fc];
    const captured = this.board[tr][tc];
    const color = piece.color;

    // Make move on a copy
    this.board[tr][tc] = piece;
    this.board[fr][fc] = null;

    // En passant capture
    let epCaptured = null;
    if (piece.type === 'P' && to === this.enPassant) {
      epCaptured = this.board[fr][tc];
      this.board[fr][tc] = null;
    }

    const inCheck = this._isInCheck(color);

    // Undo
    this.board[fr][fc] = piece;
    this.board[tr][tc] = captured;
    if (epCaptured) this.board[fr][tc] = epCaptured;

    return inCheck;
  }

  _isDraw() {
    // Insufficient material
    const pieces = { w: [], b: [] };
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p) pieces[p.color].push({ ...p, row: r, col: c });
      }
    }

    const all = [...pieces.w, ...pieces.b];

    // K vs K
    if (all.length === 2) return true;
    // K+B vs K or K+N vs K
    if (all.length === 3) {
      const hasMinor = all.some(p => p.type === 'B' || p.type === 'N');
      if (hasMinor) return true;
    }
    // K+B+B vs K (same color bishops)
    if (all.length === 4) {
      const bishops = all.filter(p => p.type === 'B');
      if (bishops.length === 2) {
        const wBishops = bishops.filter(b => b.color === 'w');
        const bBishops = bishops.filter(b => b.color === 'b');
        if (wBishops.length === 2 || bBishops.length === 2) {
          // Check same color squares
          const color1 = (wBishops[0] || bBishops[0]);
          const color2 = (wBishops[1] || bBishops[1]);
          if (color1 && color2 && (color1.row + color1.col) % 2 === (color2.row + color2.col) % 2) {
            return true;
          }
        }
      }
    }

    // 50-move rule
    if (this.halfMoveClock >= 100) return true;

    // Threefold repetition
    const currentPos = this.getFen().split(' ').slice(0, 4).join(' ');
    let count = 0;
    for (const pos of this.positionHistory) {
      if (pos === currentPos) count++;
    }
    if (count >= 3) return true;

    return false;
  }

  getMoveHistory() {
    return this.moveHistory;
  }

  getLastMove() {
    return this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null;
  }

  isKingInCheck(color) {
    return this._isInCheck(color);
  }
}
