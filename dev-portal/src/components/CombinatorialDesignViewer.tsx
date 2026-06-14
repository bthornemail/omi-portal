import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { composeOmiCarrier, computeClockState, receiptCandidateImo } from '../omi/omiCarrier';
import type { DesignId, NarrativeProjectionState } from '../narrative/narrativeTypes';

type DesignDefinition = {
  id: DesignId;
  label: string;
  shortLabel: string;
  status: string;
};

const DESIGNS: DesignDefinition[] = [
  { id: 'fano', label: 'Fano Plane (PG(2,2))', shortLabel: 'Fano', status: 'Fano Plane: 7 points, 7 lines (bitwise incidence)' },
  { id: 'sbibd', label: 'Symmetric BIBD (7,3,1)', shortLabel: 'SBIBD', status: 'Symmetric BIBD (7,3,1): block intersection pattern' },
  { id: 'latin', label: 'Latin Square (4x4)', shortLabel: 'Latin', status: 'Latin Square 4x4: orthogonal array geometry' },
  { id: 'hadamard', label: 'Hadamard 4x4', shortLabel: 'Hadamard', status: 'Hadamard matrix H4: spectral nodes and edges' },
  { id: 'diffset', label: 'Difference Set (7,3,1)', shortLabel: 'Diffset', status: 'Difference Set (7,3,1): cyclic translations' },
  { id: 'tuscan', label: 'Tuscan Square (5)', shortLabel: 'Tuscan', status: 'Tuscan Square: Hamiltonian path decomposition' }
];

type SceneHandles = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  controls: OrbitControls;
  stars: THREE.Points;
  currentGroup?: THREE.Group;
  frameId?: number;
  resize: () => void;
};

type CombinatorialDesignViewerProps = {
  projectionState?: NarrativeProjectionState;
};

export function CombinatorialDesignViewer({ projectionState }: CombinatorialDesignViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const handlesRef = useRef<SceneHandles | null>(null);
  const [designOverride, setDesignOverride] = useState<DesignId | null>(null);
  const activeDesign = designOverride ?? projectionState?.activeDesign ?? 'fano';
  const tick = projectionState?.tick ?? 0;
  const phase = projectionState?.beat?.phase ?? 'projection';
  const motifs = projectionState?.beat?.motifs ?? [];
  const activeDefinition = useMemo(
    () => DESIGNS.find((design) => design.id === activeDesign) ?? DESIGNS[0],
    [activeDesign]
  );
  const clock = useMemo(() => computeClockState(tick), [tick]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070c);
    scene.fog = new THREE.FogExp2(0x05070c, 0.008);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(5, 4, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.domElement.className = 'design-canvas';
    mount.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = 'design-label-layer';
    mount.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.rotateSpeed = 1;
    controls.target.set(0, 0.2, 0);

    scene.add(new THREE.AmbientLight(0x202330));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(3, 5, 2);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.PointLight(0x4466cc, 0.4);
    fillLight.position.set(-2, 1, 3);
    scene.add(fillLight);

    const backLight = new THREE.PointLight(0xffaa66, 0.3);
    backLight.position.set(0, 1, -4);
    scene.add(backLight);

    const gridHelper = new THREE.GridHelper(12, 20, 0x2a3350, 0x1a1f2e);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    const stars = makeStars();
    scene.add(stars);

    const resize = () => {
      const width = Math.max(mount.clientWidth, 320);
      const height = Math.max(mount.clientHeight, 360);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      labelRenderer.setSize(width, height);
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const animate = () => {
      time += 0.003;
      stars.rotation.y = time * 0.05;
      stars.rotation.x = Math.sin(time * 0.1) * 0.1;
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
      const handles = handlesRef.current;
      if (handles) handles.frameId = window.requestAnimationFrame(animate);
    };

    handlesRef.current = { scene, camera, renderer, labelRenderer, controls, stars, resize };
    animate();

    return () => {
      const handles = handlesRef.current;
      if (!handles) return;
      if (handles.frameId) window.cancelAnimationFrame(handles.frameId);
      window.removeEventListener('resize', handles.resize);
      disposeObject(handles.currentGroup);
      disposeObject(handles.stars);
      handles.controls.dispose();
      handles.renderer.dispose();
      handles.renderer.domElement.remove();
      handles.labelRenderer.domElement.remove();
      handlesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles) return;
    if (handles.currentGroup) {
      handles.scene.remove(handles.currentGroup);
      disposeObject(handles.currentGroup);
    }
    const nextGroup = buildDesign(activeDesign);
    handles.currentGroup = nextGroup;
    handles.scene.add(nextGroup);
    handles.controls.target.set(0, 0.2, 0);
  }, [activeDesign]);

  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles?.currentGroup) return;
    const angleTick = Number(clock.t6 % 360n) * Math.PI / 180;
    const angleTock = Number(clock.t5 % 240n) * Math.PI / 120;
    handles.currentGroup.rotation.y = angleTick * 0.08;
    handles.currentGroup.rotation.x = angleTock * 0.035;
  }, [clock]);

  function resetCamera() {
    const handles = handlesRef.current;
    if (!handles) return;
    handles.camera.position.set(5, 4, 6);
    handles.controls.target.set(0, 0.2, 0);
    handles.controls.update();
  }

  return (
    <section
      className="panel design-viewer"
      data-omi={composeOmiCarrier(activeDesign, activeDesign.length, 'design')}
      data-imo={receiptCandidateImo()}
      data-design={activeDesign}
      data-phase={phase}
      data-beat={projectionState ? String(projectionState.beatIndex + 1) : 'local'}
      data-motif={motifs.join('|')}
    >
      <div className="design-header">
        <div>
          <p className="eyebrow">Projection Lab</p>
          <h2>Combinatorial Designs Geometry</h2>
          <p>DOM/WebGL exposes projection. Receipt accepts state.</p>
        </div>
        <span className="design-status">
          {projectionState?.ready ? `Narrative ${projectionState.beatIndex + 1}/${projectionState.beatCount} · ${activeDefinition.status}` : activeDefinition.status}
        </span>
      </div>

      <div className="design-stage" ref={mountRef} aria-label="3D combinatorial design viewer">
        <div className="scene-hint">Three.js projection | Drag to orbit | Scroll zoom | tick {clock.tick}</div>
        <button type="button" className="reset-scene-btn scene-reset" onClick={resetCamera}>reset camera / scene</button>
      </div>

      <div className="design-selector" aria-label="Combinatorial design selector">
        {DESIGNS.map((design) => (
          <button
            key={design.id}
            className={`design-btn${design.id === activeDesign ? ' active' : ''}`}
            data-omi={composeOmiCarrier(design.id, design.id.length, 'design')}
            data-imo={receiptCandidateImo()}
            data-design={design.id}
            data-phase={phase}
            onClick={() => setDesignOverride((current) => current === design.id ? null : design.id)}
          >
            <span>{design.shortLabel}</span>
            <small>{designOverride === design.id ? 'Visual override active' : design.label}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function buildDesign(design: DesignId): THREE.Group {
  const builders: Record<DesignId, () => THREE.Group> = {
    fano: buildFanoPlane,
    sbibd: buildSBIBD,
    latin: buildLatinSquare,
    hadamard: buildHadamard,
    diffset: buildDiffSet,
    tuscan: buildTuscanSquare
  };
  return builders[design]();
}

function makeLabel(text: string, color = '#bbccff', bgOpacity = 0.72) {
  const div = document.createElement('div');
  div.textContent = text;
  div.className = 'design-label';
  div.style.color = color;
  div.style.background = `rgba(10, 15, 25, ${bgOpacity})`;
  div.style.borderColor = color;
  return new CSS2DObject(div);
}

function makeStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 800;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    starPositions[i * 3] = (Math.random() - 0.5) * 200;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 80 - 40;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  return new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0xaab4df, size: 0.08, transparent: true, opacity: 0.6 })
  );
}

function buildFanoPlane() {
  const group = new THREE.Group();
  const radius = 2.2;
  const points = Array.from({ length: 7 }, (_, index) => {
    const angle = (index / 7) * Math.PI * 2;
    return new THREE.Vector3(
      Math.cos(angle) * radius,
      index % 2 === 0 ? 0.2 : -0.1,
      Math.sin(angle) * radius
    );
  });

  points.forEach((position, index) => {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x5b8dee, emissive: 0x1a2f4a, roughness: 0.3, metalness: 0.7 })
    );
    sphere.position.copy(position);
    group.add(sphere);
    const label = makeLabel(`P${index + 1}`, '#7aa2f7');
    label.position.copy(position.clone().add(new THREE.Vector3(0.25, 0.25, 0)));
    group.add(label);
  });

  const triples = [[0, 1, 3], [1, 2, 4], [2, 3, 5], [3, 4, 6], [4, 5, 0], [5, 6, 1], [6, 0, 2]];
  triples.forEach((triple) => {
    const [a, b, c] = triple.map((index) => points[index]);
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([a, b, c, a]),
      new THREE.LineBasicMaterial({ color: 0x44d9a2 })
    ));
    const center = new THREE.Vector3().add(a).add(b).add(c).multiplyScalar(1 / 3);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 5),
      new THREE.MeshStandardMaterial({ color: 0x44d9a2, emissive: 0x227755, transparent: true, opacity: 0.25 })
    );
    disc.position.copy(center);
    group.add(disc);
  });

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius + 0.15, 0.04, 64, 200),
    new THREE.MeshStandardMaterial({ color: 0x5b8dee, emissive: 0x1a3a6a })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.3;
  group.add(ring);
  return group;
}

function buildSBIBD() {
  const group = new THREE.Group();
  const radius = 2;
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    const position = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.4, Math.sin(angle) * radius);
    points.push(position);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xe05c6c, emissive: 0x441122 })
    );
    sphere.position.copy(position);
    group.add(sphere);
    const label = makeLabel(`pt${i}`, '#e05c6c');
    label.position.copy(position.clone().add(new THREE.Vector3(0.2, 0.2, 0)));
    group.add(label);
  }
  for (let i = 0; i < 7; i += 1) {
    for (let j = i + 1; j < 7; j += 1) {
      if ((j - i) % 3 === 1 || (j - i) % 3 === 2) {
        group.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([points[i], points[j]]),
          new THREE.LineBasicMaterial({ color: 0x88aaff })
        ));
      }
    }
  }
  return group;
}

function buildLatinSquare() {
  const group = new THREE.Group();
  const colors = [0x5b8dee, 0xe05c6c, 0x44d9a2, 0xf5a97f];
  const latin = [[0, 1, 2, 3], [1, 2, 3, 0], [2, 3, 0, 1], [3, 0, 1, 2]];
  const spacing = 0.9;
  const offset = 1.35;
  latin.forEach((row, i) => row.forEach((value, j) => {
    const x = j * spacing - offset;
    const z = i * spacing - offset;
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshStandardMaterial({ color: colors[value], emissive: 0x222222, roughness: 0.2 })
    );
    cube.position.set(x, 0, z);
    group.add(cube);
    const label = makeLabel(`${value + 1}`, '#ffffff', 0.5);
    label.position.set(x, 0.45, z);
    group.add(label);
  }));
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    new THREE.MeshStandardMaterial({ color: 0x1a1f2e, roughness: 0.6, metalness: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.45;
  group.add(floor);
  return group;
}

function buildHadamard() {
  const group = new THREE.Group();
  const vertices = [
    new THREE.Vector3(1, 1, 1),
    new THREE.Vector3(1, -1, -1),
    new THREE.Vector3(-1, 1, -1),
    new THREE.Vector3(-1, -1, 1)
  ].map((vertex) => vertex.multiplyScalar(1.2));
  vertices.forEach((position, index) => {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x5b8dee, emissive: 0x224466 })
    );
    sphere.position.copy(position);
    group.add(sphere);
    const label = makeLabel(`H${index + 1}`, '#9ece6a');
    label.position.copy(position.clone().add(new THREE.Vector3(0.2, 0.2, 0)));
    group.add(label);
  });
  [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]].forEach(([a, b]) => {
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([vertices[a], vertices[b]]),
      new THREE.LineBasicMaterial({ color: 0x44d9a2 })
    ));
  });
  return group;
}

function buildDiffSet() {
  const group = new THREE.Group();
  const points: THREE.Vector3[] = [];
  const radius = 2.2;
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    const position = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle * 3) * 0.3, Math.sin(angle) * radius);
    points.push(position);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x44d9a2, emissive: 0x227755 })
    );
    sphere.position.copy(position);
    group.add(sphere);
    const label = makeLabel(`${i}`, '#bbffcc');
    label.position.copy(position.clone().add(new THREE.Vector3(0.2, 0.2, 0)));
    group.add(label);
  }
  [1, 2, 4].forEach((delta) => points.forEach((point, i) => {
    group.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([point, points[(i + delta) % 7]]),
      new THREE.LineBasicMaterial({ color: 0x5b8dee })
    ));
  }));
  return group;
}

function buildTuscanSquare() {
  const group = new THREE.Group();
  const colors = [0x5b8dee, 0xe05c6c, 0x44d9a2, 0xffaa66, 0xbb77ff];
  const rows = [[0, 1, 2, 3, 4], [1, 2, 3, 4, 0], [2, 3, 4, 0, 1], [3, 4, 0, 1, 2], [4, 0, 1, 2, 3]];
  rows.forEach((row, i) => row.forEach((value, j) => {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.65, 0.65),
      new THREE.MeshStandardMaterial({ color: colors[value], roughness: 0.25 })
    );
    cube.position.set(-2.2 + j * 1.1, Math.sin(i * 1.2 + j) * 0.2, -2.2 + i * 1.1);
    group.add(cube);
    if (value === 0) {
      const glow = new THREE.PointLight(0x5b8dee, 0.4, 1.5);
      glow.position.copy(cube.position);
      group.add(glow);
    }
  }));
  return group;
}

function disposeObject(object?: THREE.Object3D) {
  if (!object) return;
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) material.forEach((item) => item.dispose());
    else if (material) material.dispose();
  });
}
