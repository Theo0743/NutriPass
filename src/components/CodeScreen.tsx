/**
 * Saisie du code après le scan du pass.
 *
 * Pavé numérique à grosses touches plutôt que le clavier du système, plus
 * lisible et plus fiable sur une borne. Le code est vérifié dès que le
 * dernier chiffre est tapé.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Delete, Lock } from 'lucide-react-native';

import { arcade, font, size, space } from '../constants/figmaTheme';
import { verifyCode } from '../services/authApi';

/** Nombre de chiffres du code. */
const CODE_LENGTH = 4;

/** Sans action pendant ce délai, on revient à l'écran « Scannez votre pass ». */
const IDLE_CANCEL_MS = 60 * 1000;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'cancel', '0', 'delete'];

type Props = {
  /** Identifiant lu sur la carte. */
  astronauteId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function CodeScreen({
  astronauteId,
  onSuccess,
  onCancel,
}: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Retour automatique si la personne scanne puis s'en va sans taper son code.
  const restartIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(onCancel, IDLE_CANCEL_MS);
  }, [onCancel]);

  useEffect(() => {
    restartIdleTimer();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [restartIdleTimer]);

  const submit = useCallback(
    async (fullCode: string) => {
      setChecking(true);
      const result = await verifyCode(astronauteId, fullCode);
      setChecking(false);

      if (result.ok) {
        onSuccess();
        return;
      }
      setError(result.message);
      setCode('');
    },
    [astronauteId, onSuccess],
  );

  const handleKey = (key: string) => {
    if (checking) return;
    restartIdleTimer();

    if (key === 'cancel') {
      onCancel();
      return;
    }
    if (key === 'delete') {
      setCode((c) => c.slice(0, -1));
      return;
    }
    if (code.length >= CODE_LENGTH) return;

    const next = code + key;
    setError(null);
    setCode(next);
    if (next.length === CODE_LENGTH) {
      void submit(next);
    }
  };

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + space.xl }]}>
      <View style={styles.header}>
        <View style={styles.lockIcon}>
          <Lock color={arcade.blue} size={30} strokeWidth={2} />
        </View>
        <Text style={styles.title}>Entrez votre code</Text>
        <Text style={styles.subtitle}>Pass n° {astronauteId}</Text>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <View
            key={i}
            style={[styles.dot, i < code.length && styles.dotFilled]}
          />
        ))}
      </View>

      <View style={styles.feedback}>
        {checking ? (
          <ActivityIndicator color={arcade.blue} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}
      </View>

      <View style={styles.pad}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => handleKey(key)}
            disabled={checking}
            style={({ pressed }) => [
              styles.key,
              key === 'cancel' || key === 'delete' ? styles.keyAction : null,
              pressed && styles.keyPressed,
            ]}
          >
            {key === 'delete' ? (
              <Delete color={arcade.text} size={26} strokeWidth={2} />
            ) : key === 'cancel' ? (
              <Text style={styles.keyActionText}>Annuler</Text>
            ) : (
              <Text style={styles.keyText}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const KEY_SIZE = 76;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: arcade.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  header: { alignItems: 'center', marginBottom: space.xl },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: arcade.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  title: {
    fontFamily: font.display,
    fontSize: size.stat + 8,
    fontWeight: '700',
    color: arcade.text,
  },
  subtitle: {
    fontFamily: font.bodyRegular,
    fontSize: size.label + 2,
    color: arcade.textMuted,
    marginTop: space.xs,
  },
  dots: { flexDirection: 'row', gap: space.lg },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: arcade.border,
  },
  dotFilled: { backgroundColor: arcade.blue, borderColor: arcade.blue },
  feedback: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontFamily: font.body,
    fontSize: size.label + 2,
    color: arcade.red,
  },
  pad: {
    width: KEY_SIZE * 3 + space.lg * 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.lg,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    backgroundColor: arcade.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyAction: { backgroundColor: 'transparent' },
  keyPressed: { backgroundColor: arcade.border },
  keyText: {
    fontFamily: font.display,
    fontSize: size.stat + 12,
    fontWeight: '600',
    color: arcade.text,
  },
  keyActionText: {
    fontFamily: font.body,
    fontSize: size.label + 1,
    color: arcade.textMuted,
  },
});
