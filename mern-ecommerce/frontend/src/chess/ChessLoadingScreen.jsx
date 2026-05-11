import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ChessEngine, { rowColToSquare } from './ChessEngine';
import ChessPiece3D from './ChessPiece3D';

/**
 * ChessLoadingScreen — 3D loading screen showing Scholar's Mate checkmate position.
 * The board auto-rotates slowly with a "Enter Store" button overlay.
 */

// ─── Scholar's Mate FEN ─────────────────────────────────────
// 1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#
const SCHOLARS_MATE_FEN = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';

// ─── Materials ──────────────────────────────────────────────
const LIGHT_SQ = new THREE.MeshStandardMaterial({ color: '#f0d9b5', roughness: 0.6 });
const DARK_SQ = new THREE.MeshStandardMaterial({ color: '#b58863', roughness: 0.6 });
const CHECK_MAT = new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.35 });

// ─── Board Square ───────────────────────────────────────────
function BoardSquare({ row, col, isLight, isCheck }) {
  const x = col - 3.5;
  const z = row - 3.5;

  return (
    <group>
      <mesh position={[x, -0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={isLight ? '#f0d9b5' : '#b58863'}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      {isCheck && (
        <mesh position={[x, 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <primitive object={CHECK_MAT} />
        </mesh>
      )}
    </group>
  );
}

// ─── Scene ──────────────────────────────────────────────────
function LoadingScene() {
  const engineRef = useRef(null);
  const [board, setBoard] = useState(null);
  const [checkSquares, setCheckSquares] = useState([]);

  useEffect(() => {
    const engine = new ChessEngine();
    engine.loadFen(SCHOLARS_MATE_FEN);
    engineRef.current = engine;

    // Find the black king (in checkmate)
    const b = engine.getBoard();
    const checks = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (p && p.type === 'K' && p.color === 'b') {
          checks.push(rowColToSquare(r, c));
        }
      }
    }
    setCheckSquares(checks);
    setBoard(b);
  }, []);

  if (!board) return null;

  const squares = [];
  const pieces = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = rowColToSquare(r, c);
      const isLight = (r + c) % 2 === 0;
      const isCheck = checkSquares.includes(sq);

      squares.push(
        <BoardSquare
          key={`sq-${r}-${c}`}
          row={r}
          col={c}
          isLight={isLight}
          isCheck={isCheck}
        />
      );

      const piece = board[r][c];
      if (piece) {
        pieces.push(
          <ChessPiece3D
            key={`pc-${r}-${c}`}
            type={piece.type}
            color={piece.color}
            position={[c - 3.5, r - 3.5]}
            highlighted={false}
          />
        );
      }
    }
  }

  return (
    <group>
      {/* Board base */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[8.2, 0.04, 8.2]} />
        <meshStandardMaterial color="#2a1f14" roughness={0.9} />
      </mesh>
      {squares}
      {pieces}
    </group>
  );
}

// ─── Lighting ───────────────────────────────────────────────
function LoadingLighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
      <pointLight position={[0, 8, 0]} intensity={0.3} />
    </>
  );
}

// ─── Main Loading Screen Component ──────────────────────────
export default function ChessLoadingScreen({ onComplete }) {
  const [showButton, setShowButton] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setFadeIn(true), 100);

    // Progress bar simulation (2.5s)
    const start = Date.now();
    const duration = 2500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setShowButton(true);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    if (onComplete) onComplete();
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'radial-gradient(circle at center, #1a1a2e, #0a0a0c)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: "'Outfit', sans-serif",
      opacity: fadeIn ? 1 : 0,
      transition: 'opacity 0.8s ease',
    }}>
      {/* 3D Chess Board */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.6,
      }}>
        <Canvas
          camera={{ position: [0, 6, 6], fov: 35, near: 0.1, far: 100 }}
          shadows
          onCreated={({ gl }) => {
            gl.setClearColor('#1a1a2e');
          }}
        >
          <LoadingLighting />
          <LoadingScene />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            enableRotate={true}
            autoRotate
            autoRotateSpeed={1.5}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 3}
            target={[0, 0, 0]}
          />
        </Canvas>
      </div>

      {/* Overlay gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(to bottom, rgba(10,10,12,0.3) 0%, rgba(10,10,12,0.7) 50%, rgba(10,10,12,0.95) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}>
        {/* Logo */}
        <div style={{
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          fontWeight: 800,
          letterSpacing: '6px',
          textShadow: '0 0 40px rgba(99,102,241,0.3)',
        }}>
          KIZUKI<span style={{
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>.</span>
        </div>

        {/* Subtitle */}
        <div style={{
          color: '#a1a1aa',
          fontSize: '0.85rem',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          Two Silhouettes. One Legacy.
        </div>

        {/* Chess indicator */}
        <div style={{
          color: '#6366f1',
          fontSize: '0.75rem',
          letterSpacing: '3px',
          fontWeight: 600,
          marginBottom: '32px',
          opacity: 0.7,
        }}>
          ♚ Scholar's Mate
        </div>

        {/* Progress bar */}
        <div style={{
          width: 'clamp(160px, 30vw, 280px)',
          height: '2px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '24px',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #ec4899)',
            borderRadius: '2px',
            transition: 'width 0.1s linear',
          }} />
        </div>

        {/* Enter Store Button */}
        <button
          onClick={handleEnter}
          style={{
            padding: '14px 40px',
            borderRadius: '12px',
            border: 'none',
            background: showButton
              ? 'linear-gradient(135deg, #6366f1, #ec4899)'
              : 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: showButton ? 'pointer' : 'default',
            opacity: showButton ? 1 : 0,
            transform: showButton ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: "'Outfit', sans-serif",
            boxShadow: showButton ? '0 4px 24px rgba(99,102,241,0.3)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (showButton) {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 8px 32px rgba(99,102,241,0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (showButton) {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 24px rgba(99,102,241,0.3)';
            }
          }}
        >
          Enter Store →
        </button>
      </div>
    </div>
  );
}
