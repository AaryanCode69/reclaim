import { Camera, Map } from '@maplibre/maplibre-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { mapStyleUrl } from '@/lib/config';
import { configureMapRequests } from '@/lib/mapRequests';

// Must run before the first tile request.
configureMapRequests();

// Vellore, Tamil Nadu: pilot area (CLAUDE.md §1).
const VELLORE: [number, number] = [79.1325, 12.9165];

export default function MapScreen() {
  const style = mapStyleUrl();

  if (!style.ok) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{style.error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Map style={styles.container} mapStyle={style.url}>
        <Camera initialViewState={{ center: VELLORE, zoom: 13 }} />
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
});
