import { ds } from '../../constants/theme';

// Generated Mapbox style tailored to Aura's design system.
export const auraDarkStyleJSON = JSON.stringify({
  version: 8,
  name: 'AuraDark',
  metadata: {
    'mapbox:type': 'template',
    'aurora:version': '1.0.0',
  },
  center: [0, 0],
  zoom: 2,
  pitch: 0,
  bearing: 0,
  sources: {
    mapbox: {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  light: {
    anchor: 'viewport',
    color: ds.colors.glowCyan,
    intensity: 0.2,
  },
  terrain: {
    source: 'mapbox',
    exaggeration: 0,
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': ds.colors.background,
      },
    },
    {
      id: 'earth',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'land',
      paint: {
        'fill-color': ds.colors.surface,
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox',
      'source-layer': 'water',
      paint: {
        'fill-color': ds.colors.glowCyan,
        'fill-opacity': 0.12,
      },
    },
    {
      id: 'building',
      type: 'fill-extrusion',
      source: 'mapbox',
      'source-layer': 'building',
      paint: {
        'fill-extrusion-color': ds.colors.surfaceElevated,
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.78,
      },
    },
    {
      id: 'road-shields',
      type: 'symbol',
      source: 'mapbox',
      'source-layer': 'road',
      minzoom: 12,
      layout: {
        'text-field': ['get', 'name_en'],
        'text-size': 12,
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      },
      paint: {
        'text-color': ds.colors.textSecondary,
        'text-halo-color': ds.colors.background,
        'text-halo-width': 1,
      },
    },
    {
      id: 'road-major',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['==', ['get', 'class'], 'primary'],
      paint: {
        'line-color': ds.colors.primary,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5,
          0.2,
          14,
          3.2,
        ],
        'line-opacity': 0.8,
      },
    },
    {
      id: 'road-minor',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'road',
      filter: ['!=', ['get', 'class'], 'primary'],
      paint: {
        'line-color': ds.colors.outlineSubtle,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5,
          0.1,
          14,
          1.4,
        ],
        'line-opacity': 0.5,
      },
    },
    {
      id: 'poi-labels',
      type: 'symbol',
      source: 'mapbox',
      'source-layer': 'poi_label',
      minzoom: 13,
      layout: {
        'text-field': ['get', 'name_en'],
        'text-size': 11,
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      },
      paint: {
        'text-color': ds.colors.textSecondary,
        'text-halo-color': ds.colors.background,
        'text-halo-width': 0.6,
        'text-opacity': 0.78,
      },
    },
    {
      id: 'boundaries',
      type: 'line',
      source: 'mapbox',
      'source-layer': 'admin',
      filter: ['==', ['get', 'admin_level'], 2],
      paint: {
        'line-color': ds.colors.glowMagenta,
        'line-width': 0.8,
        'line-opacity': 0.24,
        'line-dasharray': [2, 2.5],
      },
    },
  ],
});
