/**
 * Boutons flèche haut / bas pour faire défiler une liste en cliquant.
 *
 * Sur la borne, l'écran de la tablette est vu par le Raspberry comme une
 * souris : glisser le doigt ne fait pas défiler. Ces deux boutons remplacent
 * le geste de défilement.
 *
 * Utilisation :
 *   const scroll = useScrollArrows();
 *   <ScrollView {...scroll.scrollProps}> ... </ScrollView>
 *   <ScrollArrows scroll={scroll} />
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { arcade } from '../constants/figmaTheme';

/** Part de la zone visible parcourue à chaque clic. */
const STEP_RATIO = 0.7;

/** Marge en pixels sous laquelle on considère être tout en haut ou tout en bas. */
const EDGE_TOLERANCE = 4;

export type ScrollArrowsController = ReturnType<typeof useScrollArrows>;

export function useScrollArrows() {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);
  const viewHeight = useRef(0);
  const contentHeight = useRef(0);

  // Seuls ces deux booléens déclenchent un nouveau rendu : on ne met pas à
  // jour l'état à chaque pixel de défilement, pour garder l'écran fluide.
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(false);

  const refresh = useCallback(() => {
    const max = Math.max(0, contentHeight.current - viewHeight.current);
    const up = offset.current > EDGE_TOLERANCE;
    const down = offset.current < max - EDGE_TOLERANCE;
    setCanUp((prev) => (prev === up ? prev : up));
    setCanDown((prev) => (prev === down ? prev : down));
  }, []);

  const scrollBy = useCallback((direction: 1 | -1) => {
    const max = Math.max(0, contentHeight.current - viewHeight.current);
    const step = viewHeight.current * STEP_RATIO * direction;
    const target = Math.min(max, Math.max(0, offset.current + step));
    ref.current?.scrollTo({ y: target, animated: true });
  }, []);

  const scrollProps = {
    ref,
    scrollEventThrottle: 16,
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = e.nativeEvent.contentOffset.y;
      refresh();
    },
    onLayout: (e: LayoutChangeEvent) => {
      viewHeight.current = e.nativeEvent.layout.height;
      refresh();
    },
    onContentSizeChange: (_width: number, height: number) => {
      contentHeight.current = height;
      refresh();
    },
  };

  return {
    scrollProps,
    canUp,
    canDown,
    scrollUp: () => scrollBy(-1),
    scrollDown: () => scrollBy(1),
  };
}

export function ScrollArrows({
  scroll,
}: {
  scroll: ScrollArrowsController;
}): React.ReactElement | null {
  if (!scroll.canUp && !scroll.canDown) return null;

  return (
    // box-none : la colonne laisse passer les clics, seuls les boutons les captent.
    <View style={styles.column} pointerEvents="box-none">
      {scroll.canUp ? (
        <Pressable
          onPress={scroll.scrollUp}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          accessibilityLabel="Monter"
        >
          <ChevronUp color={arcade.textInverse} size={30} strokeWidth={2.5} />
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
      {scroll.canDown ? (
        <Pressable
          onPress={scroll.scrollDown}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          accessibilityLabel="Descendre"
        >
          <ChevronDown color={arcade.textInverse} size={30} strokeWidth={2.5} />
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
}

const BUTTON_SIZE = 56;

const styles = StyleSheet.create({
  column: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: arcade.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  pressed: { backgroundColor: arcade.blueDark },
  // Garde la flèche restante à la même place quand l'autre disparaît.
  placeholder: { width: BUTTON_SIZE, height: BUTTON_SIZE },
});