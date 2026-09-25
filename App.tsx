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
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

/** Sans toucher l'écran pendant ce délai, la personne connectée est déconnectée. */
const INACTIVITY_LOGOUT_MS = 2 * 60 * 1000;

function Root(): React.ReactElement {
  // null : personne n'est connecté, la borne attend un pass.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  // Changer cette clé remonte MealScreen, qui repart sur « Scannez votre pass ».
  const [sessionKey, setSessionKey] = useState(0);
  // Incrémenté à chaque déconnexion : un profil qui arrive après coup est ignoré.
  const sessionRef = useRef(0);
  const lastActivity = useRef(Date.now());

  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    ShareTechMono_400Regular,
    Exo2_400Regular,
    Exo2_500Medium,
  });

  // Code correct : on charge le profil de la personne qui a scanné son pass.
  const handleAuthenticated = useCallback((astronauteId: string) => {
    const session = sessionRef.current;
    lastActivity.current = Date.now();
    void (async () => {
      const result = await loadCrewMember(astronauteId);
      if (sessionRef.current === session) {
        setProfile(result.profile);
      }
    })();
  }, []);

  const handleLogout = useCallback(() => {
    sessionRef.current += 1;
    setProfile(null);
    setPanelOpen(false);
  }, []);

  // Déconnexion automatique si la personne part sans commander.
  useEffect(() => {
    if (!profile) return undefined;
    lastActivity.current = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current > INACTIVITY_LOGOUT_MS) {
        handleLogout();
        setSessionKey((k) => k + 1);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [profile, handleLogout]);

  // Chaque contact avec l'écran (doigt ou souris) repousse la déconnexion.
  // Renvoyer false laisse le contact au composant touché.
  const markActivity = useCallback(() => {
    lastActivity.current = Date.now();
    return false;
  }, []);

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  if (!fontsLoaded) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={arcade.blue} />
      </View>
    );
  }

  return (
    <View
      style={styles.screen}
      onStartShouldSetResponderCapture={markActivity}
    >
      <MealScreen
        key={sessionKey}
        onOpenProfile={openPanel}
        profile={profile}
        onAuthenticated={handleAuthenticated}
        onLogout={handleLogout}
      />

      {profile ? (
        <ProfilePanel
          visible={panelOpen}
          profile={profile}
          onClose={closePanel}
        />
      ) : null}
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
