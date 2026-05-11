import React from 'react';
import * as THREE from 'three';

/**
 * 3D chess pieces built with Three.js primitives.
 * Each piece is a group of meshes.
 */

// ─── Color helpers ─────────────────────────────────────────
const WHITE_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#f0f0f0',
  metalness: 0.3,
  roughness: 0.4,
});
const BLACK_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#222222',
  metalness: 0.5,
  roughness: 0.3,
});

function getMat(color) {
  return color === 'w' ? WHITE_MATERIAL : BLACK_MATERIAL;
}

// ─── Pawn ──────────────────────────────────────────────────
function Pawn({ color }) {
  const mat = getMat(color);
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} material={mat}>
        <cylinderGeometry args={[0.25, 0.3, 0.3, 16]} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.45, 0]} material={mat}>
        <cylinderGeometry args={[0.18, 0.22, 0.3, 16]} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 0.6, 0]} material={mat}>
        <cylinderGeometry args={[0.14, 0.16, 0.08, 16]} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.78, 0]} material={mat}>
        <sphereGeometry args={[0.14, 16, 16]} />
      </mesh>
    </group>
  );
}

// ─── Knight ────────────────────────────────────────────────
function Knight({ color }) {
  const mat = getMat(color);
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} material={mat}>
        <cylinderGeometry args={[0.28, 0.32, 0.3, 16]} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.45, 0]} material={mat}>
        <cylinderGeometry args={[0.2, 0.24, 0.3, 16]} />
      </mesh>
      {/* Horse head - using a rotated cone + box */}
      <mesh position={[0.05, 0.7, 0.05]} material={mat} rotation={[0.3, 0, 0.2]}>
        <coneGeometry args={[0.15, 0.3, 8]} />
      </mesh>
      {/* Ears */}
      <mesh position={[0.07, 0.9, 0.0]} material={mat} rotation={[0, 0, 0.3]}>
        <coneGeometry args={[0.04, 0.12, 6]} />
      </mesh>
    </group>
  );
}

// ─── Bishop ────────────────────────────────────────────────
function Bishop({ color }) {
  const mat = getMat(color);
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} material={mat}>
        <cylinderGeometry args={[0.26, 0.3, 0.3, 16]} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.45, 0]} material={mat}>
        <cylinderGeometry args={[0.18, 0.22, 0.3, 16]} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.65, 0]} material={mat}>
        <cylinderGeometry args={[0.1, 0.14, 0.15, 12]} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 0.75, 0]} material={mat}>
        <torusGeometry args={[0.16, 0.03, 8, 16]} />
      </mesh>
      {/* Mitre (hat) */}
      <mesh position={[0, 0.88, 0]} material={mat}>
        <coneGeometry args={[0.12, 0.18, 12]} />
      </mesh>
      {/* Cross on top */}
      <mesh position={[0, 0.98, 0]} material={mat} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.04]} />
      </mesh>
    </group>
  );
}

// ─── Rook ──────────────────────────────────────────────────
function Rook({ color }) {
  const mat = getMat(color);
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.15, 0]} material={mat}>
        <cylinderGeometry args={[0.28, 0.32, 0.3, 16]} />
      </mesh>
      {/* Body (column) */}
      <mesh position={[0, 0.5, 0]} material={mat}>
        <cylinderGeometry args={[0.2, 0.22, 0.4, 16]} />
      </mesh>
      {/* Top platform */}
      <mesh position={[0, 0.72, 0]} material={mat}>
        <cylinderGeometry args={[0.24, 0.26, 0.08, 16]} />
      </mesh>
      {/* Battlements */}
      <mesh position={[-0.12, 0.82, 0]} material={mat}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
      </mesh>
      <mesh position={[0.12, 0.82, 0]} material={mat}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
      </mesh>
      <mesh position={[0, 0.82, -0.12]} material={mat}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
      </mesh>
      <mesh position={[0, 0.82, 0.12]} material={mat}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
      </mesh>
    </group>
  );
}

// ─── Queen ─────────────────────────────────────────────────
function Queen({ color }) {
  const mat = getMat(color);
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.18, 0]} material={mat}>
        <cylinderGeometry args={[0.3, 0.34, 0.3, 16]} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.5, 0]} material={mat}>
        <cylinderGeometry args={[0.2, 0.26, 0.4, 16]} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.72, 0]} material={mat}>
        <cylinderGeometry args={[0.12, 0.16, 0.1, 12]} />
      </mesh>
      {/* Crown base */}
      <mesh position={[0, 0.82, 0]} material={mat}>
        <cylinderGeometry args={[0.18, 0.2, 0.08, 16]} />
      </mesh>
      {/* Crown points */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.18, 0.9, Math.sin(angle) * 0.18]}
            material={mat}
          >
            <sphereGeometry args={[0.04, 6, 6]} />
          </mesh>
        );
      })}
      {/* Crown top */}
      <mesh position={[0, 0.95, 0]} material={mat}>
        <sphereGeometry args={[0.08, 12, 12]} />
      </mesh>
    </group>
  );
}

// ─── King ──────────────────────────────────────────────────
function King({ color }) {
  const mat = getMat(color);
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.18, 0]} material={mat}>
        <cylinderGeometry args={[0.32, 0.36, 0.3, 16]} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.52, 0]} material={mat}>
        <cylinderGeometry args={[0.22, 0.28, 0.44, 16]} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.76, 0]} material={mat}>
        <cylinderGeometry args={[0.14, 0.18, 0.1, 12]} />
      </mesh>
      {/* Crown base */}
      <mesh position={[0, 0.85, 0]} material={mat}>
        <cylinderGeometry args={[0.2, 0.22, 0.08, 16]} />
      </mesh>
      {/* Crown points */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.2, 0.94, Math.sin(angle) * 0.2]}
            material={mat}
          >
            <coneGeometry args={[0.04, 0.1, 6]} />
          </mesh>
        );
      })}
      {/* Cross on top */}
      <mesh position={[0, 0.98, 0]} material={mat} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.04, 0.12, 0.04]} />
      </mesh>
      <mesh position={[0, 1.04, 0]} material={mat} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.04]} />
      </mesh>
    </group>
  );
}

// ─── Piece Selector ────────────────────────────────────────
const PIECE_COMPONENTS = {
  P: Pawn,
  N: Knight,
  B: Bishop,
  R: Rook,
  Q: Queen,
  K: King,
};

export default function ChessPiece3D({ type, color, position, onClick, highlighted }) {
  const PieceComponent = PIECE_COMPONENTS[type];
  if (!PieceComponent) return null;

  return (
    <group
      position={[position[0], 0, position[1]]}
      onClick={onClick}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {/* Highlight ring when selected */}
      {highlighted && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.35, 24]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
      <PieceComponent color={color} />
    </group>
  );
}
