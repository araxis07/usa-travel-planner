import { useEffect, useRef, useState } from 'react';
import type { Language, StateGuide } from '../data/travel';
import TravelImage from './TravelImage';
import { w } from '../data/workspace-copy';
import { readLocal } from '../lib/storage';
import { local } from '../data/travel';
import { x } from '../data/experience-copy';

// A small, locally rendered 3D illustration. No model downloads or render loop while hidden.
type SceneKind = 'CA' | 'NY' | 'AZ';
const TITLES: Record<SceneKind, readonly [string, string, string, string, string]> = {
  CA: ['Golden Gate Bridge', 'สะพานโกลเดนเกต', '金门大桥', 'ゴールデンゲートブリッジ', '금문교'],
  NY: [
    'Liberty in New York Harbor',
    'เสรีภาพแห่งอ่าวนิวยอร์ก',
    '纽约港的自由女神',
    'ニューヨーク港の自由の女神',
    '뉴욕항의 자유의 여신',
  ],
  AZ: ['Monument Valley', 'โมนูเมนต์แวลลีย์', '纪念碑谷', 'モニュメントバレー', '모뉴먼트밸리'],
};
export default function LandmarkScene({
  lang,
  motion,
  state,
}: {
  lang: Language;
  motion: boolean;
  state: StateGuide;
}) {
  const [photoMode, setPhotoMode] = useState(() =>
    readLocal('roam.scene-photo.v1', false, (v) => v === true),
  );
  const supported = state.code in TITLES;
  return (
    <div className="atlas-scene-container">
      <div className="scene-mode-controls">
        {supported && (
          <button
            className="text-link"
            aria-pressed={photoMode}
            onClick={() => {
              const next = !photoMode;
              setPhotoMode(next);
              try {
                localStorage.setItem('roam.scene-photo.v1', JSON.stringify(next));
              } catch {
                /* Optional visual preference. */
              }
            }}
          >
            {w(lang, photoMode ? 'sceneMode' : 'lightMode')}
          </button>
        )}
      </div>
      <LandmarkCanvas
        key={`${state.code}-${photoMode}`}
        lang={lang}
        motion={motion}
        state={state}
        kind={supported && !photoMode ? (state.code as SceneKind) : null}
      />
    </div>
  );
}
function LandmarkCanvas({
  lang,
  motion,
  state,
  kind,
}: {
  lang: Language;
  motion: boolean;
  state: StateGuide;
  kind: SceneKind | null;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [angle, setAngle] = useState(-0.65);
  const [available, setAvailable] = useState(!!kind);
  const cover = state.photos[state.cover];
  const title = kind ? local(TITLES[kind], lang) : local(state.names, lang);
  useEffect(() => {
    if (!kind) return;
    const element = canvas.current;
    const gl = element?.getContext('webgl', { alpha: true, antialias: true });
    if (!element || !gl) {
      setAvailable(false);
      return;
    }
    const shader = (type: number, source: string) => {
      const value = gl.createShader(type)!;
      gl.shaderSource(value, source);
      gl.compileShader(value);
      if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {
        gl.deleteShader(value);
        throw Error('Shader unavailable');
      }
      return value;
    };
    let program: WebGLProgram | null = null;
    let vertex: WebGLShader | null = null;
    let fragment: WebGLShader | null = null;
    let buffer: WebGLBuffer | null = null;
    let frame = 0;
    let visible = false;
    let lost = false;
    try {
      vertex = shader(
        gl.VERTEX_SHADER,
        `attribute vec3 position;attribute vec3 color;varying vec3 tint;uniform float angle;uniform float aspect;void main(){float c=cos(angle),s=sin(angle);vec3 p=vec3(position.x*c+position.z*s,position.y,-position.x*s+position.z*c);float tilt=.42;p=vec3(p.x,p.y*cos(tilt)-p.z*sin(tilt),p.y*sin(tilt)+p.z*cos(tilt));float depth=8.0-p.z;gl_Position=vec4(p.x*2.6/aspect,p.y*2.6,depth-2.0,depth);tint=color;}`,
      );
      fragment = shader(
        gl.FRAGMENT_SHADER,
        `precision mediump float;varying vec3 tint;void main(){gl_FragColor=vec4(tint,1.0);}`,
      );
      program = gl.createProgram()!;
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Scene unavailable');
      gl.useProgram(program);
      const points: number[] = [];
      const cube = (
        cx: number,
        cy: number,
        cz: number,
        w: number,
        h: number,
        d: number,
        color: number[],
      ) => {
        const corners = [
          [-1, -1, -1],
          [1, -1, -1],
          [1, 1, -1],
          [-1, 1, -1],
          [-1, -1, 1],
          [1, -1, 1],
          [1, 1, 1],
          [-1, 1, 1],
        ];
        const faces = [
          [0, 1, 2, 0, 2, 3],
          [4, 7, 6, 4, 6, 5],
          [0, 4, 5, 0, 5, 1],
          [3, 2, 6, 3, 6, 7],
          [1, 5, 6, 1, 6, 2],
          [0, 3, 7, 0, 7, 4],
        ];
        faces.forEach((face, i) =>
          face.forEach((n) => {
            const v = corners[n],
              shade = [0.65, 0.9, 0.55, 1, 0.78, 0.68][i];
            points.push(
              cx + (v[0] * w) / 2,
              cy + (v[1] * h) / 2,
              cz + (v[2] * d) / 2,
              ...color.map((c) => c * shade),
            );
          }),
        );
      };
      if (kind === 'CA') {
        const red = [0.78, 0.25, 0.19],
          water = [0.39, 0.65, 0.68];
        cube(0, -1.2, 0, 6.4, 0.16, 3.2, water);
        cube(0, -0.12, 0, 6, 0.12, 0.72, [0.23, 0.3, 0.34]);
        cube(0, -0.02, 0, 6, 0.035, 0.035, [0.96, 0.83, 0.57]);
        for (const px of [-1.6, 1.6]) {
          for (const pz of [-0.42, 0.42]) {
            cube(px, 0.42, pz, 0.18, 2.8, 0.18, red);
            cube(px, -1.02, pz, 0.45, 0.25, 0.5, [0.62, 0.63, 0.55]);
          }
          for (const py of [0.5, 1.3, 1.65]) cube(px, py, 0, 0.18, 0.12, 1, red);
        }
        for (const z of [-0.43, 0.43])
          for (let i = 0; i < 55; i++) {
            const px = -3 + (i * 6) / 54;
            const py =
              Math.abs(px) <= 1.6
                ? 0.4 + 1.22 * (px / 1.6) ** 2
                : 1.62 - (Math.abs(px) - 1.6) * 1.05;
            cube(px, py, z, 0.15, 0.055, 0.055, red);
            if (i % 3 === 0)
              cube(px, (py - 0.02) / 2, z, 0.035, Math.max(0.02, py + 0.02), 0.035, red);
          }
        cube(-3, -0.75, 0, 0.6, 0.75, 1.1, [0.64, 0.62, 0.43]);
        cube(3, -0.75, 0, 0.6, 0.75, 1.1, [0.64, 0.62, 0.43]);
      } else if (kind === 'NY') {
        const copper = [0.3, 0.6, 0.53],
          stone = [0.65, 0.6, 0.47];
        cube(0, -1.25, 0, 5.8, 0.16, 3, [0.32, 0.57, 0.64]);
        cube(0, -1.05, 0, 2.1, 0.3, 1.6, [0.46, 0.6, 0.39]);
        cube(0, -0.75, 0, 1.05, 0.45, 0.95, stone);
        cube(0, -0.38, 0, 0.78, 0.35, 0.72, stone);
        cube(0, 0.14, 0, 0.58, 0.72, 0.44, copper);
        cube(0, 0.59, 0, 0.42, 0.35, 0.35, copper);
        cube(0, 0.92, 0, 0.3, 0.32, 0.3, copper);
        cube(0, 1.13, 0, 0.52, 0.06, 0.37, copper);
        for (let i = -2; i <= 2; i++)
          cube(i * 0.1, 1.24, 0, 0.035, 0.2 + 0.04 * (2 - Math.abs(i)), 0.04, copper);
        cube(-0.41, 0.92, 0, 0.14, 0.7, 0.14, copper);
        cube(-0.3, 0.61, 0, 0.4, 0.14, 0.16, copper);
        cube(-0.41, 1.34, 0, 0.12, 0.2, 0.12, [0.85, 0.68, 0.26]);
        cube(-0.41, 1.5, 0, 0.1, 0.16, 0.1, [1, 0.79, 0.23]);
        cube(0.3, 0.45, 0.17, 0.18, 0.5, 0.16, copper);
        cube(0.28, 0.38, 0.3, 0.3, 0.42, 0.09, [0.22, 0.48, 0.43]);
        for (const [px, h, pz] of [
          [-2, 0.6, -0.9],
          [-1.6, 1, -0.8],
          [1.5, 0.7, -1],
          [2, 1.3, -1],
          [2.4, 0.5, -0.8],
        ])
          cube(px, -1.15 + h / 2, pz, 0.3, h, 0.4, [0.5, 0.6, 0.63]);
      } else {
        cube(0, -1.2, 0, 6, 0.18, 3.2, [0.72, 0.42, 0.28]);
        for (const [px, pz, height, width] of [
          [-1.65, 0, 2, 0.85],
          [0.2, 0.55, 1.6, 0.95],
          [1.85, -0.3, 2.5, 1.05],
        ]) {
          cube(px, -0.9, pz, width * 1.45, 0.5, width * 1.2, [0.66, 0.31, 0.2]);
          cube(px, -0.5 + height * 0.25, pz, width, height * 0.7, width * 0.72, [0.78, 0.39, 0.23]);
          cube(
            px,
            -0.5 + height * 0.66,
            pz,
            width * 0.7,
            height * 0.2,
            width * 0.55,
            [0.65, 0.29, 0.18],
          );
          cube(
            px + width * 0.3,
            -0.5 + height * 0.74,
            pz,
            width * 0.19,
            height * 0.38,
            width * 0.25,
            [0.72, 0.34, 0.2],
          );
        }
        for (let i = 0; i < 7; i++)
          cube(-2.5 + i * 0.8, -1.02, 1, 0.16, 0.18, 0.16, [0.41, 0.45, 0.26]);
      }
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
      for (const [name, offset] of [
        ['position', 0],
        ['color', 12],
      ] as const) {
        const location = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 24, offset);
      }
      const angleUniform = gl.getUniformLocation(program, 'angle'),
        aspect = gl.getUniformLocation(program, 'aspect');
      const render = (time = 0) => {
        if (lost) return;
        const rect = element.getBoundingClientRect(),
          dpr = Math.min(devicePixelRatio, 1.5);
        const width = Math.max(1, Math.round(rect.width * dpr)),
          height = Math.max(1, Math.round(rect.height * dpr));
        if (element.width !== width || element.height !== height) {
          element.width = width;
          element.height = height;
        }
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.uniform1f(angleUniform, angle + (motion ? Math.sin(time / 5000) * 0.08 : 0));
        gl.uniform1f(aspect, width / height);
        gl.drawArrays(gl.TRIANGLES, 0, points.length / 6);
        if (motion && visible && !document.hidden) frame = requestAnimationFrame(render);
      };
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(frame);
        if (visible) render();
      });
      observer.observe(element);
      const resize = new ResizeObserver(() => {
        if (!motion || !visible) render();
      });
      resize.observe(element);
      const visibility = () => {
        cancelAnimationFrame(frame);
        if (visible && !document.hidden) render();
      };
      document.addEventListener('visibilitychange', visibility);
      const contextLost = (event: Event) => {
        event.preventDefault();
        lost = true;
        cancelAnimationFrame(frame);
        setAvailable(false);
      };
      element.addEventListener('webglcontextlost', contextLost);
      render();
      return () => {
        observer.disconnect();
        resize.disconnect();
        document.removeEventListener('visibilitychange', visibility);
        element.removeEventListener('webglcontextlost', contextLost);
        cancelAnimationFrame(frame);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
      };
    } catch {
      setAvailable(false);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    }
  }, [angle, motion, kind]);
  return (
    <figure className="landmark-scene">
      <div className="landmark-scene-top">
        <span>
          {state.code} / {available ? '3D' : 'USA'}
        </span>
        <span aria-hidden="true">✦</span>
      </div>
      {available ? (
        <canvas ref={canvas} role="img" aria-label={`${w(lang, 'sceneMode')}: ${title}`} />
      ) : (
        <TravelImage
          src={cover.src}
          alt={local(state.names, lang)}
          loading="lazy"
          sizes="(max-width:760px) 90vw, 340px"
        />
      )}
      <figcaption>
        <strong>{available ? title : local(cover.displayCaption ?? state.names, lang)}</strong>
        {available && (
          <button
            className="text-link"
            onClick={() => setAngle((a) => (a > 0.4 ? -0.65 : a + 0.35))}
          >
            {x(lang, 'rotate')}
          </button>
        )}
      </figcaption>
      {available ? (
        <p className="scene-note">{w(lang, 'sceneHint')}</p>
      ) : (
        <a className="scene-note" href={cover.source} target="_blank" rel="noreferrer">
          {cover.author} · {cover.license}
        </a>
      )}
    </figure>
  );
}
