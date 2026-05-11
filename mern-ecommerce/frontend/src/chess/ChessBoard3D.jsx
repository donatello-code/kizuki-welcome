import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ChessEngine, { squareToRowCol, rowColToSquare } from './ChessEngine';
import ChessPiece3D from './ChessPiece3D';

/**
 * 3D chess board rendered with Three.js and @react-three/fiber.
 *
 * Props:
 *   engine       — ChessEngine instance
 *   selected     — selected square (e.g., 'e2') or null
 *   legalMoves   — array of legal move destination squares
 *   lastMove     — { from, to } of the last move or null
 *   onSquareClick — (square: string) => void
 *   flipped      — boolean: true = black's perspective
 */

// ─── Material helpers ──────────────────────────────────────
const LIGHT_SQ = new THREE.MeshStandardMaterial({ color: '#f0d9b5', roughness: 0.6 });
const DARK_SQ = new THREE.MeshStandardMaterial({ color: '#b58863', roughness: 0.6 });
const HIGHLIGHT_MAT = new THREE.MeshBasicMaterial({ color: '#6366f1', transparent: true, opacity: 0.3 });
const LEGAL_MOVE_MAT = new THREE.MeshBasicMaterial({ color: '#6366f1', transparent: true, opacity: 0.25 });
const LAST_MOVE_MAT = new THREE.MeshBasicMaterial({ color: '#ffff00', transparent: true, opacity: 0.15 });
const CHECK_MAT = new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.35 });

// ─── Square Component ──────────────────────────────────────
function BoardSquare({ row, col, isLight, isSelected, isLegal, isLastMove, isCheck, onClick }) {
  const x = col - 3.5;
  const z = row - 3.5;
  const baseMat = isLight ? LIGHT_SQ : DARK_SQ;

  return (
    <group>
      {/* Square tile */}
      <mesh
        position={[x, -0.05, z]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={onClick}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={isLight ? '#f0d9b5' : '#b58863'}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Overlay for selected */}
      {isSelected && (
        <mesh position={[x, 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <primitive object={HIGHLIGHT_MAT} />
        </mesh>
      )}

      {/* Overlay for legal moves */}
      {isLegal && (
        <mesh position={[x, 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <primitive object={LEGAL_MOVE_MAT} />
        </mesh>
      )}

      {/* Overlay for last move */}
      {isLastMove && (
        <mesh position={[x, 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <primitive object={LAST_MOVE_MAT} />
        </mesh>
      )}

      {/* Overlay for check */}
      {isCheck && (
        <mesh position={[x, 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <primitive object={CHECK_MAT} />
        </mesh>
      )}

      {/* Legal move dot indicator (empty squares) */}
      {isLegal && !isCheck && false && (
        <mesh position={[x, 0.01, z]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <primitive object={LEGAL_MOVE_MAT} />
        </mesh>
      )}

      {/* Rank/file labels */}
      {col === 0 && (
        <mesh position={[x - 0.7, 0.01, z]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial
            color={isLight ? '#b58863' : '#f0d9b5'}
            opacity={0.6}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {row === 7 && (
        <mesh position={[x, 0.01, z + 0.7]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial
            color={isLight ? '#b58863' : '#f0d9b5'}
            opacity={0.6}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Board Scene ───────────────────────────────────────────
function BoardScene({ engine, selected, legalMoves, lastMove, checkSquares, flipped, onSquareClick }) {
  const board = engine.getBoard();
  const turn = engine.turn;

  const squares = [];
  const pieces = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const displayR = flipped ? 7 - r : r;
      const displayC = flipped ? 7 - c : c;

      const sq = rowColToSquare(r, c);
      const isLight = (r + c) % 2 === 0;
      const isSelected = selected === sq;
      const isLegal = legalMoves.includes(sq);
      const isLastMove = lastMove && (sq === lastMove.from || sq === lastMove.to);
      const isCheck = checkSquares.includes(sq);

      squares.push(
        <BoardSquare
          key={`sq-${r}-${c}`}
          row={displayR}
          col={displayC}
          isLight={isLight}
          isSelected={isSelected}
          isLegal={isLegal}
          isLastMove={isLastMove}
          isCheck={isCheck}
          onClick={(e) => { e.stopPropagation(); onSquareClick(sq); }}
        />
      );

      // Pieces
      const piece = board[r][c];
      if (piece) {
        pieces.push(
          <ChessPiece3D
            key={`pc-${r}-${c}`}
            type={piece.type}
            color={piece.color}
            position={[displayC - 3.5, displayR - 3.5]}
            highlighted={isSelected}
            onClick={(e) => { e.stopPropagation(); onSquareClick(sq); }}
          />
        );
      }
    }
  }

  // Board border
  const borderMat = new THREE.MeshStandardMaterial({ color: '#3d2b1f', roughness: 0.8 });

  return (
    <group>
      {/* Board base */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 9]} />
        <primitive object={borderMat} />
      </mesh>
      {/* Border frame */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[8.2, 0.04, 8.2]} />
        <meshStandardMaterial color="#2a1f14" roughness={0.9} />
      </mesh>

      {squares}
      {pieces}
    </group>
  );
}

// ─── Lighting ──────────────────────────────────────────────
function ChessLighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
      <pointLight position={[0, 8, 0]} intensity={0.3} />
    </>
  );
}

// ─── Main Board Component ──────────────────────────────────
export default function ChessBoard3D({
  engine,
  selected,
  legalMoves,
  lastMove,
  checkSquares,
  flipped = false,
  onSquareClick,
}) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: flipped ? [0, 8, 8] : [0, 8, -8], fov: 40, near: 0.1, far: 100 }}
        shadows
        onCreated={({ gl }) => {
          gl.setClearColor('#1a1a2e');
        }}
      >
        <ChessLighting />
        <BoardScene
          engine={engine}
          selected={selected}
          legalMoves={legalMoves}
          lastMove={lastMove}
          checkSquares={checkSquares}
          flipped={flipped}
          onSquareClick={onSquareClick}
        />
        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.5}
          minDistance={6}
          maxDistance={16}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
