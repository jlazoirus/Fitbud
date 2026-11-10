import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          source={require('../assets/evolv.png')}
          style={styles.mark}
          accessibilityLabel="Evolv"
        />
        <View style={styles.message}>
          <Text accessibilityRole="header" style={styles.title}>
            Tu mejor versión,{'\n'}un día a la vez.
          </Text>
          <Text style={styles.description}>Nutrición y entrenamiento para tu día a día.</Text>
          <Text style={styles.notice}>Estamos preparando tu experiencia en el teléfono.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#101010' },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 32,
    gap: 40,
    maxWidth: 560,
    alignSelf: 'center',
    width: '100%',
  },
  mark: { width: 104, height: 104 },
  message: { gap: 20 },
  title: { color: '#f2f2ee', fontSize: 34, fontWeight: '700', lineHeight: 42 },
  description: { color: '#f2f2ee', fontSize: 18, lineHeight: 28 },
  notice: { color: '#a8a8a0', fontSize: 16, lineHeight: 24 },
});
