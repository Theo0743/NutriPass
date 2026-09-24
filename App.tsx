/**
 * NutriPass — écran unique.
 *
 * L'écran principal est le flux repas (scannage → menu → curseur →
 * confirmation). L'icône utilisateur en haut à droite ouvre le panneau
 * latéral, qui affiche uniquement les données récupérées en base.
 */

import { Exo2_400Regular, Exo2_500Medium } from '@expo-google-fonts/exo-2';
import { Orbitron_700Bold } from '@expo-google-fonts/orbitron';
import { ShareTechMono_400Regular } from '@expo-google-fonts/share-tech-mono';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { MealScreen } from './src/components/MealScreen';
import { ProfilePanel } from './src/components/ProfilePanel';
import { arcade } from './src/constants/figmaTheme';
import { loadCrewMember } from './src/services/crewApi';
import type { UserProfile } from './src/types/user';

export default function App(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Root />
    </SafeAreaProvider>
  );
}

function Root(): React.ReactElement {
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
        <ActivityIndicator color={arcade.blue} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <MealScreen onOpenProfile={openPanel} profile={profile} />

      <ProfilePanel
        visible={panelOpen}
        profile={profile}
        onClose={closePanel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: arcade.bg,

    // Configuration spécifique au navigateur.
    ...(Platform.OS === 'web'
      ? {
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          touchAction: 'manipulation',
        }
      : {}),
  },

  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
