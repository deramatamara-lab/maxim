import React, {
  ForwardedRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import MapboxGL, { Camera, MapView, PointAnnotation } from '@rnmapbox/maps';
// Import types from main package, runtime from dist build to avoid import.meta
import type { Map as MapboxMap } from 'mapbox-gl';

import { ds } from '../../constants/theme';
import { config } from '../../constants/config';
import { auraDarkStyleJSON } from './auraDarkStyle';

MapboxGL.setAccessToken(config.mapboxToken);
if (typeof MapboxGL.setTelemetryEnabled === 'function') {
  MapboxGL.setTelemetryEnabled(false);
}

export interface MapContainerHandle {
  focusTo: (input: {
    coordinate: [number, number];
    zoomLevel?: number;
    pitch?: number;
    heading?: number;
    durationMs?: number;
  }) => void;
  setTrafficEnabled: (enabled: boolean) => void;
  isTrafficEnabled: () => boolean;
}

interface MapContainerProps {
  coordinate: [number, number];
  zoomLevel?: number;
  pitch?: number;
  heading?: number;
  style?: StyleProp<ViewStyle>;
  onMapReady?: () => void;
  /** Enable traffic layer - requires Mapbox Traffic API */
  showTraffic?: boolean;
  /** Callback when traffic layer state changes */
  onTrafficToggle?: (enabled: boolean) => void;
  /** Optional live driver location marker (lon, lat) */
  driverLocation?: [number, number];
  /** Optional live rider location marker (lon, lat) */
  riderLocation?: [number, number];
}

const DEFAULT_ZOOM = 13.2;
const DEFAULT_PITCH = 62;
const DEFAULT_HEADING = 18;

// Traffic layer source ID (Mapbox Traffic v1)
const TRAFFIC_SOURCE_ID = 'mapbox-traffic';
const TRAFFIC_LAYER_ID = 'traffic-layer';

const MapContainerComponent = (
  {
    coordinate,
    zoomLevel = DEFAULT_ZOOM,
    pitch = DEFAULT_PITCH,
    heading = DEFAULT_HEADING,
    style,
    onMapReady,
    showTraffic = false,
    onTrafficToggle,
    driverLocation,
    riderLocation,
  }: MapContainerProps,
  ref: ForwardedRef<MapContainerHandle>
) => {
  const cameraRef = useRef<Camera>(null);
  const mapRef = useRef<MapView>(null);
  const webContainerRef = useRef<View | null>(null);
  const webMapRef = useRef<MapboxMap | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  const [isReady, setIsReady] = useState(false);
  const [trafficEnabled, setTrafficEnabled] = useState(showTraffic);
  const styleJSON = useMemo(() => auraDarkStyleJSON, []);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  // Sync traffic state with prop
  useEffect(() => {
    setTrafficEnabled(showTraffic);
  }, [showTraffic]);

  // Add/remove traffic layer on web
  useEffect(() => {
    if (Platform.OS !== 'web' || !isReady) return;
    
    const mapInstance = webMapRef.current;
    if (!mapInstance) return;

    const hasSource = mapInstance.getSource(TRAFFIC_SOURCE_ID);
    const hasLayer = mapInstance.getLayer(TRAFFIC_LAYER_ID);

    if (trafficEnabled && !hasSource) {
      // Add Mapbox Traffic source
      // NOTE: Requires Mapbox Traffic API subscription
      // API endpoint can be configured via admin panel
      mapInstance.addSource(TRAFFIC_SOURCE_ID, {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-traffic-v1',
      });

      mapInstance.addLayer({
        id: TRAFFIC_LAYER_ID,
        type: 'line',
        source: TRAFFIC_SOURCE_ID,
        'source-layer': 'traffic',
        paint: {
          'line-width': 2,
          'line-color': [
            'match',
            ['get', 'congestion'],
            'low', '#4ADE80',      // Green - free flow
            'moderate', '#FACC15', // Yellow - moderate
            'heavy', '#F97316',    // Orange - heavy
            'severe', '#EF4444',   // Red - severe
            '#6B7280'              // Gray - unknown
          ],
          'line-opacity': 0.8,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });
    } else if (!trafficEnabled && hasLayer) {
      mapInstance.removeLayer(TRAFFIC_LAYER_ID);
      if (hasSource) {
        mapInstance.removeSource(TRAFFIC_SOURCE_ID);
      }
    }
  }, [trafficEnabled, isReady]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return undefined;
    }

    // Web map initialization is disabled for now to avoid import.meta issues.
    // The web container will render as an empty placeholder.
    return undefined;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const mapInstance = webMapRef.current;
    if (!mapInstance) {
      return;
    }

    mapInstance.easeTo({
      center: coordinate,
      zoom: zoomLevel,
      pitch,
      bearing: heading,
      duration: 1200,
      essential: true,
    });
  }, [coordinate, heading, pitch, zoomLevel]);

  useEffect(() => {
    if (!isReady || Platform.OS === 'web') {
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: coordinate,
      zoomLevel,
      pitch,
      heading,
      animationDuration: 1200,
      animationMode: 'easeTo',
    });
  }, [coordinate, heading, isReady, pitch, zoomLevel]);

  // Follow live driver location on native when provided
  useEffect(() => {
    if (!isReady || Platform.OS === 'web') {
      return;
    }

    if (!driverLocation) {
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: driverLocation,
      zoomLevel,
      pitch,
      heading,
      animationDuration: 800,
      animationMode: 'easeTo',
    });
  }, [driverLocation, heading, isReady, pitch, zoomLevel]);

  useImperativeHandle(
    ref,
    () => ({
      focusTo: ({
        coordinate: nextCoordinate,
        zoomLevel: nextZoom = zoomLevel,
        pitch: nextPitch = pitch,
        heading: nextHeading = heading,
        durationMs = 1400,
      }) => {
        if (Platform.OS === 'web') {
          webMapRef.current?.flyTo({
            center: nextCoordinate,
            zoom: nextZoom,
            pitch: nextPitch,
            bearing: nextHeading,
            duration: durationMs,
            essential: true,
          });
          return;
        }

        cameraRef.current?.setCamera({
          centerCoordinate: nextCoordinate,
          zoomLevel: nextZoom,
          pitch: nextPitch,
          heading: nextHeading,
          animationDuration: durationMs,
          animationMode: 'easeTo',
        });
      },
      setTrafficEnabled: (enabled: boolean) => {
        setTrafficEnabled(enabled);
        onTrafficToggle?.(enabled);
      },
      isTrafficEnabled: () => trafficEnabled,
    }),
    [heading, pitch, zoomLevel, trafficEnabled, onTrafficToggle]
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <View ref={webContainerRef} style={styles.webCanvas} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleJSON={styleJSON}
        zoomEnabled
        pitchEnabled
        rotateEnabled
        attributionEnabled={false}
        logoEnabled={false}
        compassEnabled={false}
        scrollEnabled
        scaleBarEnabled={false}
        onDidFinishLoadingMap={() => {
          if (!isReady) {
            setIsReady(true);
            onMapReady?.();
          }
        }}
        onMapIdle={() => {
          if (!isReady) {
            setIsReady(true);
            onMapReady?.();
          }
        }}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: coordinate,
            zoomLevel,
            pitch,
            heading,
          }}
        />

        {/* Rider marker */}
        {riderLocation && (
          <PointAnnotation
            id="rider-location"
            coordinate={riderLocation}
          >
            <View style={styles.riderMarker} />
          </PointAnnotation>
        )}

        {/* Driver marker */}
        {driverLocation && (
          <PointAnnotation
            id="driver-location"
            coordinate={driverLocation}
          >
            <View style={styles.driverMarker} />
          </PointAnnotation>
        )}
      </MapboxGL.MapView>
    </View>
  );
};

export const MapContainer = forwardRef<MapContainerHandle, MapContainerProps>(MapContainerComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  riderMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ds.colors.secondary,
    borderWidth: 2,
    borderColor: ds.colors.backgroundDeep,
  },
  driverMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ds.colors.primary,
    borderWidth: 2,
    borderColor: ds.colors.backgroundDeep,
  },
});
