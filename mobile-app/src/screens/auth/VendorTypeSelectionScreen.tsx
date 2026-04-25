import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VENDOR_TYPES } from '../../utils/constants';
import { Button } from '../../components/common/Button';
import { Colors } from '../../theme/colors';

interface Props {
  navigation: any;
  route: any;
}

export function VendorTypeSelectionScreen({ navigation, route }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const { registrationData } = route.params || {};

  const handleNext = () => {
    if (!selected) return;
    navigation.navigate('VendorDetails', {
      ...registrationData,
      vendorType: selected,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>What type of vendor are you?</Text>
        <Text style={styles.subtitle}>Select your primary service to get started</Text>

        <View style={styles.grid}>
          {VENDOR_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              onPress={() => setSelected(type.id)}
              activeOpacity={0.8}
              style={[styles.card, selected === type.id && styles.selectedCard]}
            >
              <Text style={styles.icon}>{type.icon}</Text>
              <Text style={[styles.cardTitle, selected === type.id && styles.selectedText]}>
                {type.title}
              </Text>
              <Text style={[styles.cardDesc, selected === type.id && styles.selectedDesc]}>
                {type.description}
              </Text>
              {selected === type.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title={selected ? `Continue as ${VENDOR_TYPES.find((t) => t.id === selected)?.title}` : 'Select a type to continue'}
          onPress={handleNext}
          disabled={!selected}
          style={styles.continueBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.gray[500], marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  card: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
  },
  selectedCard: { borderColor: Colors.primary, backgroundColor: '#f0fdf4' },
  icon: { fontSize: 36, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.gray[800], marginBottom: 4 },
  selectedText: { color: Colors.primary },
  cardDesc: { fontSize: 12, color: Colors.gray[500] },
  selectedDesc: { color: Colors.primaryLight },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    backgroundColor: Colors.primary,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  continueBtn: { marginBottom: 24 },
});
