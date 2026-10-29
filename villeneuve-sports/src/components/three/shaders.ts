/**
 * GLSL for the hero scene. Units are metres; the pitch follows the Laws of
 * the Game (105 × 68 m, 12 cm lines). Colours are written in display space.
 */

export const pitchVertex = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vPos;
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vPos = world.xz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

export const pitchFragment = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uLights[4];
  uniform float uTime;
  varying vec2 vPos;
  varying vec3 vWorld;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  // Distance to the outline of an axis-aligned rectangle.
  float rectLine(vec2 p, vec2 c, vec2 h) {
    vec2 d = abs(p - c) - h;
    return abs(length(max(d, 0.0)) + min(max(d.x, d.y), 0.0));
  }

  float paint(float d, float w) {
    float aa = fwidth(d) * 1.2 + 0.002;
    return 1.0 - smoothstep(w - aa, w + aa, d);
  }

  void main() {
    vec2 p = vPos;
    const float HL = 52.5;  // half length
    const float HW = 34.0;  // half width
    const float W = 0.06;   // half line width (12 cm)

    // Mowing stripes: 18 bands along the length, plus a faint cross pattern.
    float band = mod(floor((p.x + HL) / (2.0 * HL / 18.0)), 2.0);
    float cross = mod(floor((p.y + HW) / 6.8), 2.0);
    float grain = noise(p * 3.1) * 0.55 + noise(p * 17.0) * 0.45;
    float patches = noise(p * 0.08);

    vec3 dark = vec3(0.075, 0.215, 0.105);
    vec3 light = vec3(0.115, 0.30, 0.15);
    vec3 grass = mix(dark, light, band * 0.85 + cross * 0.08);
    grass *= 0.86 + grain * 0.22 + patches * 0.12;

    // Outside the field of play the grass is rougher and darker.
    float inField = step(abs(p.x), HL + 2.5) * step(abs(p.y), HW + 2.5);
    grass = mix(grass * 0.62, grass, inField);

    // Markings.
    float d = 1e3;
    d = min(d, rectLine(p, vec2(0.0), vec2(HL, HW)));             // touch & goal lines
    d = min(d, abs(p.x));                                          // halfway line
    d = min(d, abs(length(p) - 9.15));                             // centre circle
    for (int s = -1; s <= 1; s += 2) {
      float sx = float(s);
      d = min(d, rectLine(p, vec2(sx * (HL - 8.25), 0.0), vec2(8.25, 20.16)));   // penalty area
      d = min(d, rectLine(p, vec2(sx * (HL - 2.75), 0.0), vec2(2.75, 9.16)));    // goal area
      vec2 spot = vec2(sx * (HL - 11.0), 0.0);
      float arc = abs(length(p - spot) - 9.15);
      arc = (abs(p.x) < HL - 16.5) ? arc : 1e3;                    // only outside the box
      d = min(d, arc);
      d = min(d, max(length(p - spot) - 0.05, 0.0));               // penalty spot (Ø 22 cm)
      for (int t = -1; t <= 1; t += 2) {
        vec2 corner = vec2(sx * HL, float(t) * HW);
        d = min(d, abs(length(p - corner) - 1.0));                 // corner arcs
      }
    }
    d = min(d, max(length(p) - 0.05, 0.0));                        // centre spot (Ø 22 cm)
    float inside = step(abs(p.x), HL + W) * step(abs(p.y), HW + W);
    float line = paint(d, W) * inside;

    // Floodlight pools.
    float lit = 0.0;
    for (int i = 0; i < 4; i++) {
      vec3 L = uLights[i];
      float dist = length(vWorld - L);
      lit += 520.0 / (dist * dist + 40.0);
    }
    lit = clamp(lit, 0.0, 1.6);

    vec3 col = grass * (0.22 + lit * 0.95);
    col = mix(col, vec3(0.93, 0.95, 0.92) * (0.35 + lit * 0.7), line * 0.92);

    // Subtle sheen in the bands toward the lights.
    col += vec3(0.02, 0.05, 0.03) * band * lit;

    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;

export const ballVertex = /* glsl */ `
  varying vec3 vObjNormal;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vObjNormal = normalize(position);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/**
 * Truncated icosahedron: 12 pentagons centred on the icosahedron vertices and
 * 20 hexagons centred on its faces. Seams are where the two closest centres
 * are almost equidistant (spherical Voronoi).
 */
export const ballFragment = /* glsl */ `
  uniform vec3 uCenters[32];
  uniform vec3 uKey;
  uniform vec3 uNavy;
  uniform vec3 uYellow;
  varying vec3 vObjNormal;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec3 n = normalize(vObjNormal);
    float best = -2.0, second = -2.0;
    int bestId = 0;
    for (int i = 0; i < 32; i++) {
      float d = dot(n, uCenters[i]);
      if (d > best) { second = best; best = d; bestId = i; }
      else if (d > second) { second = d; }
    }
    float edge = best - second;
    bool pentagon = bestId < 12;

    vec3 base = pentagon ? uNavy : vec3(0.97, 0.97, 0.95);
    // Thin yellow trim inside each pentagon.
    if (pentagon) base = mix(uYellow, base, smoothstep(0.018, 0.026, edge));

    float seam = 1.0 - smoothstep(0.0025, 0.0075, edge);
    float cushion = smoothstep(0.0, 0.08, edge);   // panels bulge, seams sink

    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    vec3 L = normalize(uKey);
    float diff = max(dot(N, L), 0.0);
    float fill = max(dot(N, normalize(vec3(0.6, 0.3, 0.8))), 0.0);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 64.0) * (pentagon ? 0.35 : 0.6);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    vec3 col = base * (0.16 + diff * 0.95 + fill * vec3(0.10, 0.14, 0.32));
    col *= 0.78 + cushion * 0.22;
    col = mix(col, vec3(0.05, 0.06, 0.09), seam * 0.85);
    col += vec3(1.0, 0.97, 0.9) * spec * cushion;
    col += uYellow * rim * 0.35 + vec3(0.25, 0.4, 1.0) * rim * 0.18;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const beamVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const beamFragment = /* glsl */ `
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float body = pow(facing, 2.2);
    float along = pow(vUv.y, 1.6);
    float shimmer = 0.9 + 0.1 * sin(uTime * 0.7 + vUv.x * 18.0);
    float a = body * along * uIntensity * shimmer;
    gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * a, a);
  }
`;

export const particlesVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * (0.15 + aSeed * 0.2);
    p.x += sin(t + aSeed * 40.0) * 2.0;
    p.y += mod(t * 1.5 + aSeed * 30.0, 30.0) - 4.0;
    p.z += cos(t * 0.8 + aSeed * 23.0) * 2.0;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (6.0 + aSeed * 10.0) * uPixelRatio / -mv.z;
    float h = clamp((p.y + 4.0) / 30.0, 0.0, 1.0);
    vAlpha = (0.2 + 0.45 * aSeed) * smoothstep(0.0, 0.15, h) * (1.0 - smoothstep(0.75, 1.0, h));
  }
`;

export const particlesFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d) * vAlpha;
    gl_FragColor = vec4(vec3(1.0, 0.96, 0.85) * a, a);
  }
`;

export const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const skyFragment = /* glsl */ `
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, -0.2, 1.0);
    vec3 horizon = vec3(0.11, 0.18, 0.38);
    vec3 zenith = vec3(0.008, 0.016, 0.05);
    vec3 col = mix(horizon, zenith, pow(max(h, 0.0), 0.45));
    // Glow of the floodlights above the far stand.
    float glow = exp(-pow((vDir.y - 0.05) * 7.0, 2.0)) * smoothstep(-0.2, 0.9, vDir.x);
    col += vec3(0.08, 0.1, 0.18) * glow;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const ridgeVertex = /* glsl */ `
  #include <fog_pars_vertex>
  varying float vH;
  varying float vTop;
  attribute float aTop;
  void main() {
    vH = position.y;
    vTop = aTop;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

export const ridgeFragment = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uColor;
  uniform vec3 uRim;
  varying float vH;
  varying float vTop;
  void main() {
    vec3 col = mix(uColor * 0.55, uColor, smoothstep(0.0, 1.0, vTop));
    col += uRim * smoothstep(0.93, 1.0, vTop);
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;
