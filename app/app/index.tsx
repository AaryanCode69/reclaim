import { StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reclaim</Text>
      <Text>Clean it. Claim it. Keep it.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: '700' },
});
