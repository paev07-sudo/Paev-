"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  ballFragment,
  ballVertex,
  beamFragment,
  beamVertex,
  particlesFragment,
  particlesVertex,
  pitchFragment,
  pitchVertex,
  ridgeFragment,
  ridgeVertex,
  skyFragment,
  skyVertex,
} from "./shaders";

export interface SceneOptions {
  /** Reduced motion: render a still frame, no camera flight. */
  still: boolean;
  /** Lower-cost settings for phones and small screens. */
  lite: boolean;
  /** Whether the hero is on screen; rendering stops when it is not. */
  active: boolean;
  /** Called once the first frame is on screen. */
  onReady: () => void;
  /** Called when frames stay too slow: the hero then settles on a still frame. */
  onSlow?: () => void;
}

const HALF_LENGTH = 52.5;
const HALF_WIDTH = 34;
const BALL_R = 0.11;
/** The ball hovers at eye level, like a menu object, above its shadow. */
const BALL_HOVER = 0.28;
const LIGHTS: [number, number, number][] = [
  [-64, 20, -48],
  [64, 20, -48],
  [-64, 20, 48],
  [64, 20, 48],
];

/* Shared pointer and scroll state, written by DOM listeners, read in useFrame. */
const input = { x: 0, y: 0, scroll: 0 };

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ------------------------------------------------------------------ Pitch */

function Pitch() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: pitchVertex,
        fragmentShader: pitchFragment,
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uLights: { value: LIGHTS.map((l) => new THREE.Vector3(...l)) },
            uTime: { value: 0 },
          },
        ]),
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh rotation-x={-Math.PI / 2} material={material}>
      <planeGeometry args={[HALF_LENGTH * 2 + 40, HALF_WIDTH * 2 + 40, 1, 1]} />
    </mesh>
  );
}

function Surroundings() {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
      <circleGeometry args={[900, 48]} />
      <meshBasicMaterial color="#03060f" />
    </mesh>
  );
}

/* ------------------------------------------------------------------ Goals */

function Goal({ side }: { side: 1 | -1 }) {
  const net = useMemo(() => {
    const pts: number[] = [];
    const w = 7.32 / 2;
    const h = 2.44;
    const depth = 2;
    const step = 0.25;
    // Back panel
    for (let z = -w; z <= w + 1e-6; z += step) pts.push(depth, 0, z, depth * 0.85, h, z);
    for (let y = 0; y <= h + 1e-6; y += step) pts.push(depth * (1 - (0.15 * y) / h), y, -w, depth * (1 - (0.15 * y) / h), y, w);
    // Roof
    for (let z = -w; z <= w + 1e-6; z += step) pts.push(0, h, z, depth * 0.85, h, z);
    // Sides
    for (const s of [-w, w]) {
      for (let y = 0; y <= h + 1e-6; y += step) pts.push(0, y, s, depth * (1 - (0.15 * y) / h), y, s);
      for (let x = 0; x <= depth + 1e-6; x += step) pts.push(x, 0, s, Math.min(x, depth * 0.85), h, s);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useEffect(() => () => net.dispose(), [net]);
  const post = "#f4f4f0";
  return (
    <group position={[side * HALF_LENGTH, 0, 0]} scale={[side, 1, 1]}>
      <mesh position={[0, 1.22, -3.66]}>
        <cylinderGeometry args={[0.06, 0.06, 2.44, 12]} />
        <meshBasicMaterial color={post} />
      </mesh>
      <mesh position={[0, 1.22, 3.66]}>
        <cylinderGeometry args={[0.06, 0.06, 2.44, 12]} />
        <meshBasicMaterial color={post} />
      </mesh>
      <mesh position={[0, 2.44, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.06, 0.06, 7.44, 12]} />
        <meshBasicMaterial color={post} />
      </mesh>
      <lineSegments geometry={net}>
        <lineBasicMaterial color="#c9d2e6" transparent opacity={0.28} />
      </lineSegments>
    </group>
  );
}

/* ------------------------------------------------------------ Ad boards */

function useBoardTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 128;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 4;

    const draw = (family: string) => {
      const ctx = canvas.getContext("2d")!;
      const g = ctx.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, "#1d3fb3");
      g.addColorStop(1, "#122b85");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 128);
      ctx.fillStyle = "#ffd200";
      ctx.fillRect(0, 118, 2048, 10);
      ctx.font = `800 76px ${family}`;
      ctx.textBaseline = "middle";
      const items = ["VILLENEUVE-SPORTS", "DEPUIS 1921", "STADE DE LA TRONCHENAZ"];
      let x = 40;
      let i = 0;
      while (x < 2048) {
        const label = items[i % items.length];
        ctx.fillStyle = i % items.length === 1 ? "#ffd200" : "#ffffff";
        ctx.fillText(label, x, 62);
        x += ctx.measureText(label).width + 90;
        ctx.fillStyle = "#ffd200";
        ctx.fillRect(x - 55, 56, 14, 14);
        i++;
      }
      texture.needsUpdate = true;
    };

    const family =
      getComputedStyle(document.documentElement).getPropertyValue("--font-barlow-condensed").trim() || "Arial Narrow, sans-serif";
    draw(family);
    if (document.fonts?.load) {
      document.fonts.load(`800 76px ${family}`).then(() => draw(family)).catch(() => {});
    }
    return texture;
  }, []);
}

function Boards() {
  const texture = useBoardTexture();
  const boards = useMemo(() => {
    const list: { pos: [number, number, number]; rot: number; len: number }[] = [];
    const off = 5;
    list.push({ pos: [0, 0.5, -(HALF_WIDTH + off)], rot: 0, len: 96 });
    list.push({ pos: [0, 0.5, HALF_WIDTH + off], rot: Math.PI, len: 96 });
    list.push({ pos: [HALF_LENGTH + off + 2, 0.5, -20], rot: -Math.PI / 2, len: 22 });
    list.push({ pos: [HALF_LENGTH + off + 2, 0.5, 20], rot: -Math.PI / 2, len: 22 });
    list.push({ pos: [-(HALF_LENGTH + off + 2), 0.5, -20], rot: Math.PI / 2, len: 22 });
    list.push({ pos: [-(HALF_LENGTH + off + 2), 0.5, 20], rot: Math.PI / 2, len: 22 });
    return list;
  }, []);
  const materials = useMemo(
    () =>
      boards.map((b) => {
        if (!texture) return new THREE.MeshBasicMaterial({ color: "#1d3fb3" });
        const t = texture.clone();
        t.needsUpdate = true;
        t.repeat.set(b.len / 30, 1);
        return new THREE.MeshBasicMaterial({ map: t, color: "#c9cbd6", toneMapped: false });
      }),
    [boards, texture],
  );
  useEffect(() => () => materials.forEach((m) => { m.map?.dispose(); m.dispose(); }), [materials]);
  return (
    <group>
      {boards.map((b, i) => (
        <mesh key={i} position={b.pos} rotation-y={b.rot} material={materials[i]}>
          <planeGeometry args={[b.len, 1]} />
        </mesh>
      ))}
    </group>
  );
}

/* --------------------------------------------------------- Floodlights */

function useGlowTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.18, "rgba(235,242,255,0.75)");
    g.addColorStop(0.5, "rgba(140,170,255,0.18)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

function Floodlight({ head, still }: { head: [number, number, number]; still: boolean }) {
  const glow = useGlowTexture();
  const beam = useRef<THREE.Mesh>(null);
  const { beamPos, beamQuat, beamLen } = useMemo(() => {
    const h = new THREE.Vector3(...head);
    const target = new THREE.Vector3(head[0] * 0.25, 0, head[2] * 0.2);
    const dir = new THREE.Vector3().subVectors(h, target);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const mid = new THREE.Vector3().addVectors(h, target).multiplyScalar(0.5);
    return { beamPos: mid, beamQuat: quat, beamLen: len };
  }, [head]);

  const beamMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uIntensity: { value: 0.16 }, uTime: { value: 0 } },
      }),
    [],
  );
  useEffect(() => () => beamMaterial.dispose(), [beamMaterial]);

  useFrame((state) => {
    const m = beam.current?.material as THREE.ShaderMaterial | undefined;
    if (m && !still) m.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const facing = Math.atan2(-head[0], -head[2]);
  return (
    <group>
      {/* Mast */}
      <mesh position={[head[0] * 1.02, (head[1] - 1.8) / 2, head[2] * 1.02]}>
        <cylinderGeometry args={[0.25, 0.45, head[1] - 1.8, 8]} />
        <meshBasicMaterial color="#0a1128" />
      </mesh>
      {/* Lamp array */}
      <group position={head} rotation-y={facing}>
        <mesh>
          <planeGeometry args={[6.4, 3.6]} />
          <meshBasicMaterial color="#0d1630" side={THREE.DoubleSide} />
        </mesh>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[-2.25 + (i % 4) * 1.5, i < 4 ? 0.8 : -0.8, 0.05]}>
            <planeGeometry args={[1.1, 1]} />
            <meshBasicMaterial color="#f6f9ff" toneMapped={false} />
          </mesh>
        ))}
      </group>
      {glow && (
        <sprite position={head} scale={[34, 34, 1]}>
          <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.85} toneMapped={false} />
        </sprite>
      )}
      <mesh ref={beam} position={beamPos} quaternion={beamQuat} material={beamMaterial}>
        <cylinderGeometry args={[1.2, 22, beamLen, 40, 1, true]} />
      </mesh>
    </group>
  );
}

/* --------------------------------------------------------- Atmosphere */

function Sky() {
  const material = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: skyVertex, fragmentShader: skyFragment, side: THREE.BackSide, depthWrite: false }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[1600, 32, 16]} />
    </mesh>
  );
}

function Stars({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const y = 0.12 + rand() * 0.88;
      const r = Math.sqrt(1 - y * y);
      pos.set([Math.cos(theta) * r * 1400, y * 1400, Math.sin(theta) * r * 1400], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry}>
      <pointsMaterial color="#c8d4ff" size={1.6} sizeAttenuation={false} transparent opacity={0.7} depthWrite={false} />
    </points>
  );
}

/** Mountain silhouettes: Villeneuve sits at the foot of the Alps, at the eastern end of Lake Geneva. */
function Ridge({ radius, base, amp, color, rim, seed }: { radius: number; base: number; amp: number; color: string; rim: string; seed: number }) {
  const { geometry, material } = useMemo(() => {
    const segments = 220;
    const positions: number[] = [];
    const tops: number[] = [];
    const index: number[] = [];
    const n = (x: number) => {
      // Sum of sines: a deterministic, natural-looking ridge line.
      return (
        Math.sin(x * 3.1 + seed) * 0.5 +
        Math.sin(x * 7.3 + seed * 2.1) * 0.25 +
        Math.sin(x * 17.9 + seed * 0.7) * 0.12 +
        Math.sin(x * 41.0 + seed * 1.3) * 0.05
      );
    };
    for (let i = 0; i <= segments; i++) {
      const a = (-0.62 + (i / segments) * 1.24) * Math.PI; // arc in front of the camera
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const h = base + amp * (0.55 + 0.45 * n(i / segments));
      positions.push(x, -20, z, x, h, z);
      tops.push(0, 1);
      if (i < segments) {
        const k = i * 2;
        index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("aTop", new THREE.Float32BufferAttribute(tops, 1));
    g.setIndex(index);
    const m = new THREE.ShaderMaterial({
      vertexShader: ridgeVertex,
      fragmentShader: ridgeFragment,
      fog: true,
      side: THREE.DoubleSide,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        { uColor: { value: new THREE.Color(color) }, uRim: { value: new THREE.Color(rim) } },
      ]),
    });
    return { geometry: g, material: m };
  }, [radius, base, amp, color, rim, seed]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return <mesh geometry={geometry} material={material} />;
}

function Particles({ count, still }: { count: number; still: boolean }) {
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    let s = 11;
    const rand = () => ((s = (s * 48271) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      const light = LIGHTS[i % 4];
      const t = rand();
      // Spread along each beam, between the lamp and the pitch.
      pos.set(
        [light[0] * (1 - t * 0.7) + (rand() - 0.5) * 18, rand() * 22, light[2] * (1 - t * 0.75) + (rand() - 0.5) * 18],
        i * 3,
      );
      seeds[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: particlesVertex,
      fragmentShader: particlesFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
    });
    return { geometry: g, material: m };
  }, [count]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  const points = useRef<THREE.Points>(null);
  useFrame((state) => {
    const m = points.current?.material as THREE.ShaderMaterial | undefined;
    if (!m) return;
    m.uniforms.uPixelRatio.value = state.viewport.dpr * 60;
    if (!still) m.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ Ball */

function ballCenters() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const verts = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ].map(([a, b, c]) => new THREE.Vector3().add(verts[a]).add(verts[b]).add(verts[c]).normalize());
  return [...verts, ...faces];
}

function Ball({ still }: { still: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const spin = useRef(new THREE.Euler(0.4, 0.6, 0));
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ballVertex,
        fragmentShader: ballFragment,
        uniforms: {
          uCenters: { value: ballCenters() },
          uKey: { value: new THREE.Vector3(-0.4, 0.85, -0.35) },
          uNavy: { value: new THREE.Color("#0f1d55") },
          uYellow: { value: new THREE.Color("#ffd200") },
        },
      }),
    [],
  );
  const shadowTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(0,0,0,0.75)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const ball = ref.current;
    if (!ball) return;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    if (still) {
      ball.rotation.copy(spin.current);
      return;
    }
    // Idle spin, steered by the pointer, rolled by the scroll.
    spin.current.y += dt * (0.25 + input.x * 0.6);
    spin.current.x += dt * (0.08 + input.y * 0.35);
    const targetZ = -input.scroll * Math.PI * 1.5;
    spin.current.z += (targetZ - spin.current.z) * Math.min(1, dt * 4);
    ball.rotation.copy(spin.current);
    const bob = Math.sin(t * 1.4) * 0.025;
    ball.position.y = BALL_R + BALL_HOVER + bob;
    if (shadow.current) {
      const s = 0.5 - bob * 2;
      shadow.current.scale.set(s, s, 1);
      (shadow.current.material as THREE.MeshBasicMaterial).opacity = 0.5 - bob * 3;
    }
  });

  return (
    <group>
      <mesh ref={ref} material={material} position={[0, BALL_R + BALL_HOVER, 0]}>
        <sphereGeometry args={[BALL_R, 96, 64]} />
      </mesh>
      {shadowTexture && (
        <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, 0.004, 0]} scale={[0.5, 0.5, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------------------------------------ Camera rig */

function CameraRig({ still, onReady }: { still: boolean; onReady: () => void }) {
  const size = useThree((s) => s.size);
  const get = useThree((s) => s.get);
  const ready = useRef(false);
  const start = useRef<number | null>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-70, 62, 58),
        new THREE.Vector3(-34, 22, 26),
        new THREE.Vector3(-9, 4.2, 6),
        new THREE.Vector3(-2.4, 1.0, 1.7),
        new THREE.Vector3(-1.12, 0.5, 0.66),
      ]),
    [],
  );
  const lookAt = useRef(new THREE.Vector3());
  const tmp = useRef(new THREE.Vector3());
  const aerial = useRef(new THREE.Vector3(0, 0, 0));

  // Frame composition: the ball sits right of the headline on wide screens,
  // above it on tall (phone) screens.
  const target = useMemo(() => {
    const wide = size.width / size.height > 1.05;
    return wide ? new THREE.Vector3(3.87, 0.34, -4.25) : new THREE.Vector3(4.91, -2.37, -2.89);
  }, [size.width, size.height]);

  useEffect(() => {
    const { camera, invalidate } = get();
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = size.width / size.height > 1.05 ? 44 : 52;
    cam.updateProjectionMatrix();
    if (still) {
      cam.position.copy(curve.getPoint(1));
      cam.lookAt(target);
      invalidate();
    }
  }, [get, size.width, size.height, still, curve, target]);

  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(() => onReady());
    }
    if (still) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = Math.min(1, (state.clock.elapsedTime - start.current - 0.15) / 3.6);
    const e = easeInOutCubic(Math.max(0, t));
    const p = curve.getPoint(e, tmp.current);

    // After the flight: scroll lifts the camera, the pointer adds parallax.
    const s = input.scroll;
    p.x += -s * 2.2 + input.x * 0.06 * e;
    p.y += s * 1.6 + input.y * 0.04 * e;
    p.z += s * 0.8;
    cam.position.copy(p);

    lookAt.current.lerpVectors(aerial.current, target, e);
    cam.lookAt(lookAt.current);
  });
  return null;
}

/* ----------------------------------------------------------- Frame budget */

/** Caps the frame rate (frameloop "demand") on lower-cost devices. */
function FrameCap({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let id = 0;
    let last = 0;
    const loop = (t: number) => {
      id = requestAnimationFrame(loop);
      if (t - last >= 1000 / fps - 2) {
        last = t;
        invalidate();
      }
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [fps, invalidate]);
  return null;
}

/**
 * After the intro, measures frame time for ~2 s. If the median frame is
 * slower than 50 ms (under 20 fps), asks the hero to switch to a still frame.
 */
function PerformanceGuard({ onSlow }: { onSlow: () => void }) {
  const samples = useRef<number[]>([]);
  const done = useRef(false);
  useFrame((state, delta) => {
    if (done.current || state.clock.elapsedTime < 4.5) return;
    samples.current.push(delta);
    if (samples.current.length >= 40) {
      done.current = true;
      const sorted = [...samples.current].sort((a, b) => a - b);
      if (sorted[Math.floor(sorted.length / 2)] > 0.05) onSlow();
    }
  });
  return null;
}

/* ---------------------------------------------------------------- Scene */

function Scene({ still, lite, onReady, onSlow }: Omit<SceneOptions, "active">) {
  return (
    <>
      <color attach="background" args={["#050b1f"]} />
      <fog attach="fog" args={["#07112b", 140, 2600]} />
      <Sky />
      <Stars count={lite ? 260 : 600} />
      <Ridge radius={1150} base={45} amp={115} color="#0b1638" rim="#4a64aa" seed={1.7} />
      <Ridge radius={780} base={18} amp={58} color="#060d24" rim="#1d2c5c" seed={4.2} />
      <Surroundings />
      <Pitch />
      <Boards />
      <Goal side={1} />
      <Goal side={-1} />
      {LIGHTS.map((l, i) => (
        <Floodlight key={i} head={l} still={still} />
      ))}
      <Particles count={lite ? 700 : 1800} still={still} />
      <Ball still={still} />
      <CameraRig still={still} onReady={onReady} />
      {!still && onSlow && <PerformanceGuard onSlow={onSlow} />}
    </>
  );
}

export default function StadiumScene({ still, lite, active, onReady, onSlow }: SceneOptions) {
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (still) return;
    const onPointer = (e: PointerEvent) => {
      input.x = (e.clientX / window.innerWidth) * 2 - 1;
      input.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onScroll = () => {
      const h = wrapper.current?.offsetHeight || window.innerHeight;
      input.scroll = Math.min(1, Math.max(0, window.scrollY / h));
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [still]);

  return (
    <div ref={wrapper} className="absolute inset-0">
      <Canvas
        dpr={lite ? [1, 1.25] : [1, 1.75]}
        frameloop={still || lite ? "demand" : active ? "always" : "never"}
        gl={{ antialias: !lite, powerPreference: "high-performance", alpha: false, stencil: false }}
        camera={{ fov: 44, near: 0.05, far: 3000, position: [-70, 62, 58] }}
        aria-hidden="true"
        tabIndex={-1}
      >
        <Scene still={still} lite={lite} onReady={onReady} onSlow={onSlow} />
        {lite && !still && active && <FrameCap fps={30} />}
      </Canvas>
    </div>
  );
}
