/**
 * NutriPass — écran unique.
 *
 * L'écran principal est le flux repas (scannage → menu → curseur →
 * confirmation). La pastille profil en haut à droite ouvre le panneau
 * latéral, qui reste inchangé.
 */

import { Exo2_400Regular, Exo2_500Medium } from '@expo-google-fonts/exo-2';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { ShareTechMono_400Regular } from '@expo-google-fonts/share-tech-mono';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { MealScreen } from './src/components/MealScreen';
import { ProfileButton } from './src/components/ProfileButton';
import { ProfilePanel } from './src/components/ProfilePanel';
import { HAIRLINE, c, font, space } from './src/constants/figmaTheme';
import { loadCrewMember } from './src/services/crewApi';
import type { UserProfile } from './src/types/user';

export default function App(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Root />
    </SafeAreaProvider>
  );
}

function Root(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    ShareTechMono_400Regular,
    Exo2_400Regular,
    Exo2_500Medium,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await loadCrewMember();
      if (!cancelled) {
        setProfile(result.profile);
        console.log(`Profil chargé depuis : ${result.source}`);
        if (result.warning) console.log(`Serveur : ${result.warning}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  if (!fontsLoaded || !profile) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={c.cyan} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.brand}>
          <Text style={styles.brandKicker}>SYSTÈME DE NUTRITION</Text>
          <Text style={styles.brandName}>
            NUTRI<Text style={styles.brandNameAccent}>PASS</Text>
          </Text>
        </View>

        <ProfileButton onPress={openPanel} />
      </View>

      <MealScreen onOpenProfile={openPanel} />

      <ProfilePanel
        visible={panelOpen}
        profile={profile}
        onClose={closePanel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.panel },
  centered: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: c.border,
  },
  brand: { gap: 2 },
  brandKicker: {
    fontFamily: font.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: c.label,
  },
  brandName: {
    fontFamily: font.display,
    fontSize: 16,
    letterSpacing: 1,
    color: c.white,
  },
  brandNameAccent: { color: c.cyan },
});
