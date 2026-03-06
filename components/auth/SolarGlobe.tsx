"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function GlobePoints() {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      // Sphere surface distribution using fibonacci sphere
      const phi = Math.acos(1 - 2 * (i + 0.5) / 2000);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 2.2;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15;
      ref.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#ff6a00"
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

function ConnectionLines() {
  const ref = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    const result: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    for (let i = 0; i < 20; i++) {
      const phi1 = Math.random() * Math.PI;
      const theta1 = Math.random() * Math.PI * 2;
      const phi2 = phi1 + (Math.random() - 0.5) * 0.8;
      const theta2 = theta1 + (Math.random() - 0.5) * 0.8;
      const r = 2.22;

      result.push({
        start: new THREE.Vector3(
          r * Math.sin(phi1) * Math.cos(theta1),
          r * Math.sin(phi1) * Math.sin(theta1),
          r * Math.cos(phi1)
        ),
        end: new THREE.Vector3(
          r * Math.sin(phi2) * Math.cos(theta2),
          r * Math.sin(phi2) * Math.sin(theta2),
          r * Math.cos(phi2)
        ),
      });
    }
    return result;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15;
      ref.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.1;
    }
  });

  return (
    <group ref={ref}>
      {lines.map((line, i) => {
        const curve = new THREE.QuadraticBezierCurve3(
          line.start,
          line.start.clone().add(line.end).multiplyScalar(0.6),
          line.end
        );
        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <line key={i}>
            <bufferGeometry attach="geometry" {...geometry} />
            <lineBasicMaterial
              attach="material"
              color="#ff6a00"
              transparent
              opacity={0.15}
            />
          </line>
        );
      })}
    </group>
  );
}

export default function SolarGlobe() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <GlobePoints />
        <ConnectionLines />
      </Canvas>
    </div>
  );
}
