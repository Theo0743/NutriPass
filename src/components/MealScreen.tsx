/**
 * Écran du flux repas — scannage, menu, curseur de quantité, confirmation.
 *
 * Reprend le design sombre de NutriPass (tokens figmaTheme) au lieu du
 * thème orange clair de l'interface d'origine. Les quatre écrans et la
 * fenêtre d'ingrédients sont conservés à l'identique côté comportement.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { ArrowLeft, Check, HelpCircle, ScanLine, X, Zap } from 'lucide-react-native';

import { HAIRLINE, c, font, radius, size, space } from '../constants/figmaTheme';
import { claimMeal, fetchMeals } from '../services/mealsApi';
import type { MenuItem } from '../types/meal';

const KCAL_STEPS = [
  { level: 1, label: 'Minimum', kcal: 250 },
  { level: 2, label: 'Modéré', kcal: 500 },
  { level: 3, label: 'Complet', kcal: 750 },
  { level: 4, label: 'Recommandé', kcal: 1000 },
] as const;

type Screen = 'menu' | 'slider' | 'confirmed' | 'waiting';

type Props = {
  onOpenProfile: () => void;
};

export function MealScreen({ onOpenProfile }: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('waiting');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [sliderValue, setSliderValue] = useState(1);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [ingredientsItem, setIngredientsItem] = useState<MenuItem | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const claimScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMeals();
        if (!cancelled) {
          setMenu(data);
          setMenuError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setMenuError(
            `Impossible de charger le menu. ${(e as Error).message || 'Vérifiez votre connexion.'}`,
          );
        }
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (screen !== 'waiting') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [screen, scanAnim]);

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
    setSliderValue(1);
    setError(null);
    setScreen('slider');
  };

  const handleClaim = useCallback(async () => {
    if (!selectedItem || isClaiming) return;
    setIsClaiming(true);
    setError(null);
    try {
      const stepIndex = Math.round(sliderValue) - 1;
      await claimMeal({
        repas_id: selectedItem.id,
        meal_type: KCAL_STEPS[stepIndex].label.toLowerCase(),
        portion_size: Math.round(sliderValue),
      });
      setScreen('confirmed');
      progressAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]).start();
      setTimeout(() => setScreen('waiting'), 3000);
    } catch (e) {
      setError(
        `Impossible d'enregistrer votre plat. ${(e as Error).message || 'Vérifiez votre connexion.'}`,
      );
    } finally {
      setIsClaiming(false);
    }
  }, [selectedItem, sliderValue, isClaiming, fadeAnim, scaleAnim, progressAnim]);

  const currentStepIndex = Math.round(sliderValue) - 1;
  const currentStep = KCAL_STEPS[currentStepIndex];

  if (screen === 'waiting') {
    const scanTranslateY = scanAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-12, 12],
    });
    return (
      <Pressable
        style={styles.screen}
        onPress={() => {
          setSelectedItem(null);
          setScreen('menu');
        }}
      >
        <View
          style={[styles.waitingCard, { paddingBottom: insets.bottom + 40 }]}
        >
          <Animated.View
            style={[
              styles.scanIconWrap,
              { transform: [{ translateY: scanTranslateY }] },
            ]}
          >
            <ScanLine color={c.cyan} size={56} strokeWidth={2} />
          </Animated.View>
          <Text style={styles.waitingTitle}>Scannez votre Pass</Text>
          <Text style={styles.waitingSubtitle}>
            En attente de validation...
          </Text>
          <Text style={styles.waitingHint}>
            Touchez l'écran pour revenir au menu
          </Text>
        </View>
      </Pressable>
    );
  }

  if (screen === 'confirmed' && selectedItem) {
    return (
      <View style={styles.screen}>
        <Animated.View
          style={[
            styles.confirmationCard,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.confirmationIconWrap}>
            <Check color={c.cyan} size={48} strokeWidth={3} />
          </View>
          <Text style={styles.confirmationTitle}>Plat journalier réclamé</Text>
          <View style={styles.confirmationHoloLine} />
          <Text style={styles.confirmationMealName}>{selectedItem.name}</Text>
          <View style={styles.confirmationBadge}>
            <Text style={styles.confirmationBadgeText}>
              {currentStep.label} · {currentStep.kcal} kcal
            </Text>
          </View>
          <Text style={styles.confirmationDate}>
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
          <View style={styles.confirmationProgressTrack}>
            <Animated.View
              style={[
                styles.confirmationProgressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    );
  }

  if (screen === 'slider' && selectedItem) {
    return (
      <View style={styles.screen}>
        <View style={[styles.sliderHeader, { paddingTop: insets.top + space.sm }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => setScreen('menu')}
            hitSlop={8}
          >
            <ArrowLeft color={c.cyan} size={22} strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.sliderScroll}
          contentContainerStyle={[
            styles.sliderScrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mealHeroCard}>
            <Image
              source={{ uri: selectedItem.image }}
              style={styles.mealHeroImage}
            />
            <Text style={styles.mealHeroName}>{selectedItem.name}</Text>
          </View>

          <View style={styles.quantitySection}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Quantité du repas</Text>
              <View style={styles.kcalPill}>
                <Text style={styles.kcalPillText}>
                  {currentStep.kcal} kcal
                </Text>
              </View>
            </View>

            <Text style={styles.sliderStepLabel}>{currentStep.label}</Text>

            <View style={styles.sliderWrap}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={4}
                step={1}
                value={sliderValue}
                onValueChange={setSliderValue}
                minimumTrackTintColor={c.cyan}
                maximumTrackTintColor={c.border}
                thumbTintColor={c.cyan}
              />
            </View>

            <View style={styles.sliderStepLabels}>
              {KCAL_STEPS.map((step) => (
                <View key={step.level} style={styles.sliderStepLabelWrap}>
                  <Text
                    style={[
                      styles.sliderStepLabelText,
                      currentStep.level === step.level && styles.sliderStepLabelTextActive,
                    ]}
                  >
                    {step.label}
                  </Text>
                  <Text
                    style={[
                      styles.sliderStepLabelKcal,
                      currentStep.level === step.level && styles.sliderStepLabelKcalActive,
                    ]}
                  >
                    {step.kcal} kcal
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.ingredientsCard}>
            <Text style={styles.ingredientsCardTitle}>Ingrédients</Text>
            <View style={styles.ingredientsList}>
              {selectedItem.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientChip}>
                  <Text style={styles.ingredientChipText}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          <Pressable
            onPress={handleClaim}
            onPressIn={() =>
              Animated.timing(claimScaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
              }).start()
            }
            onPressOut={() =>
              Animated.timing(claimScaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }).start()
            }
            disabled={isClaiming}
          >
            <Animated.View
              style={[
                styles.claimButton,
                { transform: [{ scale: claimScaleAnim }] },
              ]}
            >
              <Zap color={c.panel} size={20} strokeWidth={2.5} />
              <Text style={styles.claimButtonText}>
                {isClaiming ? 'Enregistrement...' : 'Valider la réclamation'}
              </Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>
    );
  }

  // MENU
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.headerTitle}>Liste des repas</Text>
        <Pressable
          style={styles.profileButton}
          onPress={onOpenProfile}
          hitSlop={8}
        >
          <Text style={styles.profileButtonText}>PROFIL</Text>
        </Pressable>
      </View>

      {menuLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={c.cyan} />
          <Text style={styles.loadingText}>Chargement des repas...</Text>
        </View>
      ) : menuError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{menuError}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.menuGrid}
          contentContainerStyle={[
            styles.menuGridContent,
            { paddingBottom: insets.bottom + space.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridRow}>
            {menu.map((item) => (
              <Pressable
                key={item.id}
                style={styles.gridItem}
                onPress={() => handleSelectItem(item)}
              >
                <View style={styles.gridItemCard}>
                  <View style={styles.gridItemImageWrap}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.gridItemImage}
                    />
                    <Pressable
                      style={styles.gridItemInfoBtn}
                      onPress={() => setIngredientsItem(item)}
                      hitSlop={8}
                    >
                      <HelpCircle color={c.white} size={18} strokeWidth={2.5} />
                    </Pressable>
                  </View>
                  <View style={styles.gridItemTextWrap}>
                    <Text style={styles.gridItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.gridItemCal}>{item.calories} kcal</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={ingredientsItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setIngredientsItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ingrédients</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setIngredientsItem(null)}
                hitSlop={12}
              >
                <X color={c.muted} size={22} strokeWidth={2.5} />
              </Pressable>
            </View>
            {ingredientsItem ? (
              <>
                <View style={styles.modalMealInfo}>
                  <Image
                    source={{ uri: ingredientsItem.image }}
                    style={styles.modalMealImage}
                  />
                  <View style={styles.modalMealText}>
                    <Text style={styles.modalMealName}>
                      {ingredientsItem.name}
                    </Text>
                    <Text style={styles.modalMealCal}>
                      {ingredientsItem.calories} kcal
                    </Text>
                  </View>
                </View>
                <ScrollView
                  style={styles.modalIngredientScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {ingredientsItem.ingredients.map((ing, i) => (
                    <View
                      key={i}
                      style={[
                        styles.modalIngredientRow,
                        i === ingredientsItem.ingredients.length - 1 &&
                          styles.modalIngredientRowLast,
                      ]}
                    >
                      <View style={styles.modalIngredientDot} />
                      <Text style={styles.modalIngredientText}>{ing}</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.panel },

  // Menu header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: c.border,
  },
  headerTitle: {
    fontFamily: font.display,
    fontSize: size.stat,
    letterSpacing: 1,
    color: c.white,
  },
  profileButton: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.tile,
    backgroundColor: c.cyanFill,
    borderWidth: HAIRLINE,
    borderColor: c.cyanBorder,
  },
  profileButtonText: {
    fontFamily: font.display,
    fontSize: size.meta,
    letterSpacing: 1,
    color: c.cyan,
  },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  loadingText: {
    fontFamily: font.mono,
    fontSize: size.label,
    color: c.label,
  },

  // Menu grid
  menuGrid: { flex: 1 },
  menuGridContent: { padding: space.lg },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: { width: '48%', marginBottom: space.lg },
  gridItemCard: {
    borderRadius: radius.card,
    backgroundColor: c.card,
    borderWidth: HAIRLINE,
    borderColor: c.border,
    overflow: 'hidden',
  },
  gridItemImageWrap: { width: '100%', height: 140, position: 'relative' },
  gridItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  gridItemInfoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemTextWrap: {
    paddingVertical: space.md,
    paddingHorizontal: space.md,
  },
  gridItemName: {
    fontFamily: font.body,
    fontSize: size.label,
    color: c.value,
  },
  gridItemCal: {
    fontFamily: font.mono,
    fontSize: size.meta,
    color: c.label,
    marginTop: 2,
  },

  // Slider screen
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.cyanFill,
    borderWidth: HAIRLINE,
    borderColor: c.cyanBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderScroll: { flex: 1 },
  sliderScrollContent: { paddingHorizontal: space.lg, paddingBottom: space.xl },

  // Meal hero
  mealHeroCard: { alignItems: 'center', marginBottom: space.xl },
  mealHeroImage: {
    width: '100%',
    height: 220,
    borderRadius: radius.card,
    resizeMode: 'cover',
    marginBottom: space.lg,
  },
  mealHeroName: {
    fontFamily: font.display,
    fontSize: size.stat + 8,
    color: c.white,
    textAlign: 'center',
  },

  // Quantity section
  quantitySection: { marginBottom: space.xl },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  sliderLabel: {
    fontFamily: font.mono,
    fontSize: size.label,
    color: c.label,
  },
  kcalPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: c.cyanFill,
    borderWidth: HAIRLINE,
    borderColor: c.cyanBorder,
  },
  kcalPillText: {
    fontFamily: font.mono,
    fontSize: size.label,
    color: c.cyan,
  },
  sliderStepLabel: {
    fontFamily: font.display,
    fontSize: size.stat + 12,
    color: c.white,
    textAlign: 'center',
    marginBottom: space.xl,
  },
  sliderWrap: {
    width: '100%',
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  slider: { width: '100%', height: 50 },
  sliderStepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: space.xl,
    paddingHorizontal: 4,
  },
  sliderStepLabelWrap: { flex: 1, alignItems: 'center' },
  sliderStepLabelText: {
    fontFamily: font.mono,
    fontSize: size.meta,
    color: c.muted,
    marginBottom: 2,
  },
  sliderStepLabelTextActive: { color: c.cyan },
  sliderStepLabelKcal: {
    fontFamily: font.mono,
    fontSize: 11,
    color: c.muted,
  },
  sliderStepLabelKcalActive: { color: c.cyan },

  // Ingredients card
  ingredientsCard: {
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderRadius: radius.card,
    backgroundColor: c.card,
    borderWidth: HAIRLINE,
    borderColor: c.border,
  },
  ingredientsCardTitle: {
    fontFamily: font.display,
    fontSize: size.label + 4,
    color: c.cyan,
    marginBottom: space.md,
  },
  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredientChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: c.cyanFill,
    borderWidth: HAIRLINE,
    borderColor: c.cyanBorder,
  },
  ingredientChipText: {
    fontFamily: font.mono,
    fontSize: size.meta,
    color: c.cyan,
  },

  // Error
  errorWrap: {
    margin: space.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.card,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: HAIRLINE,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    fontFamily: font.mono,
    fontSize: size.meta,
    color: '#EF4444',
    textAlign: 'center',
  },

  // Footer
  footer: { paddingHorizontal: space.lg, paddingTop: space.md },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: radius.card,
    backgroundColor: c.cyan,
  },
  claimButtonText: {
    fontFamily: font.display,
    fontSize: size.label + 4,
    color: c.panel,
    letterSpacing: 0.3,
  },

  // Confirmation
  confirmationCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  confirmationIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: c.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
  },
  confirmationTitle: {
    fontFamily: font.display,
    fontSize: size.stat + 8,
    color: c.white,
    textAlign: 'center',
    marginBottom: space.md,
  },
  confirmationHoloLine: {
    width: 120,
    height: 2,
    backgroundColor: c.cyan,
    marginBottom: space.lg,
  },
  confirmationMealName: {
    fontFamily: font.body,
    fontSize: size.stat + 2,
    color: c.value,
    marginBottom: space.lg,
  },
  confirmationBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: c.cyanFill,
    borderWidth: HAIRLINE,
    borderColor: c.cyanBorder,
    marginBottom: space.md,
  },
  confirmationBadgeText: {
    fontFamily: font.mono,
    fontSize: size.label + 3,
    color: c.cyan,
  },
  confirmationDate: {
    fontFamily: font.mono,
    fontSize: size.label,
    color: c.label,
    textTransform: 'capitalize',
    marginBottom: space.xl,
  },
  confirmationProgressTrack: {
    width: '70%',
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    overflow: 'hidden',
  },
  confirmationProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: c.cyan,
  },

  // Waiting
  waitingCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIconWrap: {
    marginBottom: space.xl,
    padding: 24,
    borderRadius: 50,
    backgroundColor: c.cyanFill,
    borderWidth: 2,
    borderColor: c.cyanBorder,
  },
  waitingTitle: {
    fontFamily: font.display,
    fontSize: size.stat + 10,
    color: c.white,
    textAlign: 'center',
    marginBottom: space.md,
  },
  waitingSubtitle: {
    fontFamily: font.mono,
    fontSize: size.label + 3,
    color: c.label,
    marginBottom: space.xl,
  },
  waitingHint: {
    fontFamily: font.mono,
    fontSize: size.meta,
    color: c.muted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: c.card,
    borderRadius: radius.card + 4,
    borderWidth: HAIRLINE,
    borderColor: c.border,
    padding: space.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  modalTitle: {
    fontFamily: font.display,
    fontSize: size.stat + 4,
    color: c.cyan,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: c.border,
  },
  modalMealImage: {
    width: 56,
    height: 56,
    borderRadius: radius.tile,
    resizeMode: 'cover',
  },
  modalMealText: { flex: 1, gap: 2 },
  modalMealName: {
    fontFamily: font.body,
    fontSize: size.label + 4,
    color: c.white,
  },
  modalMealCal: {
    fontFamily: font.mono,
    fontSize: size.meta,
    color: c.label,
  },
  modalIngredientScroll: { maxHeight: 300 },
  modalIngredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 10,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: 'rgba(28, 46, 80, 0.5)',
  },
  modalIngredientRowLast: { borderBottomWidth: 0 },
  modalIngredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.cyan,
  },
  modalIngredientText: {
    flex: 1,
    fontFamily: font.bodyRegular,
    fontSize: size.label + 3,
    color: c.value,
  },
});
