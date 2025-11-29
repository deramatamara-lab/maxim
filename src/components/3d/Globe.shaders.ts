/**
 * Globe shader constants extracted for maintainability and testability
 * 
 * NOTE ON TESTING: Due to WebGL/Three.js dependencies, approximately 33% of the Globe component
 * (shader rendering, useFrame animations, GPU resource management) cannot be meaningfully unit tested
 * in Jest/JSDOM environment. The remaining 67% coverage includes all business logic, input validation,
 * zoom functionality, and component interfaces. For complete testing of shader rendering paths,
 * consider visual regression testing or E2E testing in real browser/mobile environments.
 * 
 * All shaders use precision mediump for mobile performance optimization
 */

export const GLOBE_VERTEX_SHADER = /* glsl */`
  precision mediump float;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    float displacement = sin(position.y * 3.2 + time * 0.6) * 0.012;
    displacement += sin(position.x * 4.0 + time * 0.4) * 0.008;
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

export const GLOBE_FRAGMENT_SHADER = /* glsl */`
  precision mediump float;
  uniform float time;
  uniform vec3 baseColor;
  uniform vec3 highlightColor;
  uniform vec3 accentColor;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vec3 lightDir = normalize(vec3(0.2, 0.4, 1.0));
    float lighting = dot(normalize(vNormal), lightDir);
    lighting = clamp(lighting * 0.5 + 0.5, 0.0, 1.0);

    // Pulsing energy multiplier for breathing effect
    float pulseMultiplier = 1.0 + 0.4 * sin(time * 0.3) * cos(time * 0.7);
    float energyPulse = 1.0 + 0.3 * sin(time * 0.5);

    // Multi-layered energy bands with different frequencies
    float latBands1 = sin(vPosition.y * 3.0 + time * 0.8) * pulseMultiplier;
    float latBands2 = sin(vPosition.y * 7.0 - time * 1.2) * 0.6;
    float latBands3 = cos(vPosition.y * 11.0 + time * 0.4) * 0.4;
    
    // Flowing energy rivers with directional movement
    float lonFlow1 = sin(vPosition.x * 6.0 + time * 0.6) * cos(vPosition.z * 4.0 - time * 0.3);
    float lonFlow2 = cos(vPosition.x * 12.0 - time * 0.9) * sin(vPosition.z * 8.0 + time * 0.7) * 0.5;
    
    // Dynamic energy intensity with multiple layers
    float energy1 = latBands1 * 0.3 + lonFlow1 * 0.4;
    float energy2 = latBands2 * 0.2 + lonFlow2 * 0.3;
    float energy3 = latBands3 * 0.1;
    float totalEnergy = (energy1 + energy2 + energy3) * energyPulse;

    // Dynamic color gradients based on energy intensity
    vec3 energyColor1 = mix(baseColor, highlightColor, totalEnergy * 0.6 + 0.4);
    vec3 energyColor2 = mix(highlightColor, accentColor, abs(sin(totalEnergy * 2.0)) * 0.8);
    vec3 bandColor = mix(energyColor1, energyColor2, 0.3);

    // Enhanced glow with pulsing intensity
    float glowIntensity = 0.5 + 0.5 * sin(vPosition.y * 8.0 - time * 1.6) * energyPulse;
    vec3 glow = accentColor * glowIntensity;

    // Enhanced color mixing with energy-driven blending
    float energyBlend = clamp(totalEnergy * 0.7 + 0.3, 0.0, 1.0);
    vec3 color = mix(bandColor, glow, energyBlend * 0.4);
    color = mix(color, baseColor * 0.3, 1.0 - lighting);

    // Dramatic animated rim lighting
    float rim = pow(1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 2.0);
    float rimPulse = 1.0 + 0.6 * sin(time * 0.8) * energyPulse;
    color += highlightColor * rim * 0.35 * rimPulse;
    
    // Additional accent lighting for depth
    float accentRim = pow(1.0 - dot(normalize(vNormal), vec3(0.3, 0.7, 0.2)), 3.0);
    color += accentColor * accentRim * 0.15 * energyPulse;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const ATMOSPHERE_VERTEX_SHADER = /* glsl */`
  precision mediump float;
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ATMOSPHERE_FRAGMENT_SHADER = /* glsl */`
  precision mediump float;
  uniform vec3 glowColor;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
    gl_FragColor = vec4(glowColor, 1.0) * intensity;
  }
`;

export const AURORA_VERTEX_SHADER = /* glsl */`
  precision mediump float;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const AURORA_FRAGMENT_SHADER = /* glsl */`
  precision mediump float;
  uniform float time;
  uniform vec3 primaryColor;
  uniform vec3 secondaryColor;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float lat = abs(vPosition.y);
    
    // Dramatic multi-layered wave patterns
    float wave1 = sin(vPosition.x * 3.2 + time * 0.85) * cos(vPosition.z * 2.8 + time * 0.6);
    float wave2 = cos(vPosition.x * 5.6 - time * 1.1) * sin(vPosition.z * 4.4 + time * 0.9) * 0.7;
    float wave3 = sin(vPosition.x * 8.0 + time * 1.4) * cos(vPosition.z * 6.2 - time * 0.8) * 0.4;
    
    // Pulsing intensity for breathing effect
    float pulseIntensity = 1.0 + 0.5 * sin(time * 0.4) * cos(time * 0.7);
    
    // Combined wave patterns with energy flow
    float combinedWave = (wave1 + wave2 + wave3) * pulseIntensity;
    float auroraBase = smoothstep(0.48, 0.94, lat);
    float auroraFlow = auroraBase * (0.3 + 0.7 * combinedWave);
    
    // Dynamic color shifting based on wave intensity
    float colorShift1 = abs(sin(combinedWave * 2.0)) * 0.6;
    float colorShift2 = abs(cos(combinedWave * 1.5)) * 0.4;
    vec3 auroraColor1 = mix(primaryColor, secondaryColor, colorShift1);
    vec3 auroraColor2 = mix(secondaryColor, primaryColor, colorShift2);
    vec3 finalColor = mix(auroraColor1, auroraColor2, 0.5);
    
    // Enhanced intensity with dramatic falloff
    float intensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
    float auroraIntensity = intensity * auroraFlow * pulseIntensity;
    
    // Additional glow layers for depth
    float glowLayer1 = pow(0.9 - dot(vNormal, vec3(0.2, 0.3, 0.8)), 1.8);
    float glowLayer2 = pow(0.85 - dot(vNormal, vec3(-0.3, 0.4, 0.7)), 2.5);
    float totalGlow = auroraIntensity + glowLayer1 * 0.3 + glowLayer2 * 0.2;
    
    // Dramatic opacity variation
    float opacityVariation = 0.6 + 0.4 * sin(time * 0.6) * pulseIntensity;
    
    gl_FragColor = vec4(finalColor, 1.0) * totalGlow * opacityVariation * 0.65;
  }
`;
