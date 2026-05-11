# 3D Chess Game — Implementation Plan

## Overview
Create a fully playable 3D chess game integrated into the KIZUKI store webapp using Three.js (@react-three/fiber) and compatible with Expo/React Native Web. The chess game will be accessible via a `#chess` hash route and a "♚ Chess" button in the navigation bar.

---

## Architecture

```
mern-ecommerce/frontend/src/chess/
├── ChessEngine.js        # Pure game logic (no rendering)
├── ChessPiece3D.jsx      # 3D piece models (Three.js primitives)
├── ChessBoard3D.jsx      # 3D board + interaction (raycasting, clicks)
└── ChessGame.jsx         # Full game UI wrapper (nav, move history, status)
```

---

## Phase 1: Chess Engine (`ChessEngine.js`)

### Data Model
- **Board**: 8×8 array, each cell = `{ type, color }` or `null`
- **Types**: `'pawn'`, `'knight'`, `'bishop'`, `'rook'`, `'queen'`, `'king'`
- **Colors**: `'white'`, `'black'`

### Move Generation
- `getLegalMoves(board, from)` — returns array of `{ row, col }` for a piece
- Per-piece movement rules:
  - **Pawn**: forward 1 (2 from start), diagonal capture, en passant, promotion
  - **Knight**: L-shape (8 positions)
  - **Bishop**: diagonals (blocked by pieces)
  - **Rook**: straight lines (blocked by pieces)
  - **Queen**: bishop + rook combined
  - **King**: 1 square any direction + castling

### Game State
- `currentTurn`: `'white'` | `'black'`
- `moveHistory`: array of `{ from, to, captured, piece, castling, enPassant }`
- `selectedSquare`: `{ row, col }` or `null`
- `legalMoves`: array for selected piece
- `gameStatus`: `'playing'` | `'check'` | `'checkmate'` | `'stalemate'` | `'draw'`
- `capturedPieces`: `{ white: [], black: [] }`

### Special Rules
- **Castling**: kingside (O-O) and queenside (O-O-O), blocked if king in check
- **En Passant**: track last double pawn push
- **Pawn Promotion**: auto-promote to queen (or prompt user)
- **Check Detection**: is king under attack?
- **Checkmate**: in check + no legal moves
- **Stalemate**: not in check + no legal moves
- **Draw**: insufficient material, 50-move rule, threefold repetition

### Functions
- `initBoard()` → starting position
- `makeMove(board, from, to)` → new board state
- `isInCheck(board, color)` → boolean
- `isCheckmate(board, color)` → boolean
- `isStalemate(board, color)` → boolean
- `getAllLegalMoves(board, color)` → all legal moves for a color
- `undoLastMove()` → revert state
- `exportFEN()` / `importFEN(fen)` → FEN string serialization

---

## Phase 2: 3D Chess Pieces (`ChessPiece3D.jsx`)

### Piece Models (Three.js primitives)
Each piece is a group of meshes:

| Piece | Geometry |
|-------|----------|
| **Pawn** | Small cylinder base + sphere top |
| **Rook** | Cylinder base + box top (crenellations) |
| **Knight** | Cylinder base + cone (tilted) + box (head) |
| **Bishop** | Cylinder base + cone (tall, angled cut) + sphere |
| **Queen** | Cylinder base + cone + sphere crown |
| **King** | Cylinder base + cone + cross on top |

### Materials
- White pieces: `#f5f5f0` (ivory)
- Black pieces: `#1a1a1a` (dark)
- Selected piece: emissive glow ring underneath
- Hover effect: slight scale up

### Props
- `type`, `color`, `position` (row, col → x, z)
- `isSelected`, `isLegalTarget`, `isLastMove`

---

## Phase 3: 3D Chess Board (`ChessBoard3D.jsx`)

### Board Visuals
- 8×8 grid of squares
- Colors: `#f0d9b5` (light) and `#b58863` (dark)
- Board frame/border (wooden look)
- Coordinate labels (a-h, 1-8) — optional

### Interaction (Raycasting)
- Click on square → select piece or move
- OrbitControls for camera rotation
- Highlighting:
  - Selected square: blue/indigo overlay
  - Legal moves: green dots/circles
  - Last move: yellow highlight
  - King in check: red highlight

### Camera
- Initial position: top-down isometric (x:5, y:10, z:5)
- OrbitControls: rotate, zoom, pan
- Auto-flip on turn change (optional)

### Lighting
- Ambient light (soft)
- Directional light (shadows)
- Point light (warm accent)

---

## Phase 4: Game UI (`ChessGame.jsx`)

### Layout
```
┌─────────────────────────────────────────────┐
│  ← Back  │  Undo  │  Flip  │  New Game      │
├──────────────────────┬──────────────────────┤
│                      │  Turn: ● White       │
│                      │  Status: Playing     │
│    3D Chess Board    │                      │
│    (65% width)       │  Move History:       │
│                      │  1. e4  e5           │
│                      │  2. Nf3 Nc6          │
│                      │  3. Bb5 a6           │
│                      │                      │
│                      │  Captured:           │
│                      │  White: ♝♞           │
│                      │  Black: ♟♟           │
└──────────────────────┴──────────────────────┘
```

### Features
- **Header bar**: Back, Undo, Flip Board, New Game buttons
- **Side panel**: turn indicator, status, move history (algebraic notation), captured pieces
- **Promotion dialog**: modal to choose piece when pawn reaches 8th rank
- **Game over overlay**: "Checkmate! White wins" with New Game button

### State Management
- All game state in `ChessGame.jsx` (useState/useReducer)
- Pass state down to ChessBoard3D and ChessPiece3D
- No external store needed (self-contained)

---

## Phase 5: Loading Screen with Checkmate Scene (`V2App.jsx`)

### Loading Screen Redesign
Replace the simple progress bar loading screen with an interactive 3D chess board showing a **preset checkmate scenario** (Fool's Mate or Scholar's Mate). The board auto-rotates slowly and the user can click "Enter Store" when ready.

### Preset Checkmate: Scholar's Mate
```
FEN: r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4
```
- White has delivered checkmate with Qxf7#
- The board shows the final position with the check square highlighted in red
- Slow auto-rotation of the camera for visual appeal
- "Enter Store" button overlays the scene

### LoadingScreen Component
- Uses the same `ChessBoard3D` component but in **display-only mode** (no interaction)
- Loads a `ChessEngine` instance with the preset FEN
- Auto-rotates using OrbitControls autoRotate
- Shows "KIZUKI." branding + "♚ Chess" subtitle
- "Enter Store" button fades in after a brief delay

### Route
- Hash route: `#chess`
- Button in nav bar: `♚ Chess`
- Full-page view (no store nav/footer when playing)

### Navigation
```jsx
// In V2App.jsx
if (currentView === 'chess') {
  return <ChessGame onBack={() => navigateTo('store')} />;
}
```

---

## Phase 6: Dependencies

```bash
npm install three @react-three/fiber @react-three/drei
```

- `three` — Three.js core
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — Utility components (OrbitControls, etc.)

---

## File Checklist

- [ ] `mern-ecommerce/frontend/src/chess/ChessEngine.js`
- [ ] `mern-ecommerce/frontend/src/chess/ChessPiece3D.jsx`
- [ ] `mern-ecommerce/frontend/src/chess/ChessBoard3D.jsx`
- [ ] `mern-ecommerce/frontend/src/chess/ChessGame.jsx`
- [ ] Update `mern-ecommerce/frontend/src/V2App.jsx` (add chess route)
- [ ] Install Three.js dependencies
- [ ] Test build

---

## Edge Cases & Polish

- **Resize**: Canvas auto-resizes with window
- **Mobile**: Touch events for piece selection/movement
- **Performance**: Limit render updates, use memo
- **Accessibility**: Keyboard navigation (arrows + enter)
- **Animations**: Smooth piece movement (spring animations)
- **Sound**: Optional move/capture sounds
