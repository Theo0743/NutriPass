/**
 * Bouton profil de l'en-tête : pastille ronde cyan en haut à droite.
 *
 * Reprend les valeurs relevées sur l'interface publiée :
 * 36 px, fond rgba(0,212,255,0.1), bordure 0.8 px rgba(0,212,255,0.4),
 * pictogramme « utilisateur » cyan.
 *
 * L'icône est dessinée avec deux Views plutôt qu'importée : ça évite une
 * dépendance SVG pour une forme aussi simple, et ça reste net à toutes
 * les densités d'écran.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HAIRLINE, PROFILE_BUTTON_SIZE, c, radius } from '../constants/figmaTheme';

type Props = {
  onPress: () => void;
  /** Point vert indiquant un équipier en mission. */
  online?: boolean;
};

export function ProfileButton({
  onPress,
  online = true,
}: Props): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le profil"
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <View style={styles.head} />
        <View style={styles.shoulders} />
      </View>
      {online ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: PROFILE_BUTTON_SIZE,
    height: PROFILE_BUTTON_SIZE,
    borderRadius: radius.pill,
    backgroundColor: c.cyanFill,
    borderWidth: HAIRLINE,
    borderColor: c.cyanBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  icon: { alignItems: 'center', justifyContent: 'center' },
  head: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: c.cyan,
  },
  shoulders: {
    width: 13,
    height: 7,
    marginTop: 1.5,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: c.cyan,
  },
  dot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: c.green,
    borderWidth: 1.5,
    borderColor: c.panel,
  },
});
