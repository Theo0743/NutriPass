/**
 * Écran du flux repas — thème moderne, blanc pur, animations soignées.
 *
 * Flux par étapes : repas → portion → snack → boisson → récapitulatif → confirmation.
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
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  HelpCircle,
  ScanLine,
  User,
  X,
  Zap,
} from 'lucide-react-native';

import { arcade, font, size, space } from '../constants/figmaTheme';
import { claimAllMeals, fetchMeals } from '../services/mealsApi';
import { listenForBadges } from '../services/nfcReader';
import { computeRequirements } from '../services/nutritionEngine';
import type { ClaimPayload, MenuCategory, MenuItem } from '../types/meal';
import type { UserProfile } from '../types/user';
import { CodeScreen } from './CodeScreen';
import { ScrollArrows, useScrollArrows } from './ScrollArrows';

const KCAL_STEP_LABELS = ['Minimum', 'Recommandé'] as const;

const STEPS: { key: MenuCategory | 'recap'; label: string; title: string }[] = [
  { key: 'repas', label: 'Repas', title: 'Choisissez votre repas' },
  { key: 'snack', label: 'Snack', title: 'Choisissez votre snack' },
  { key: 'boisson', label: 'Boisson', title: 'Choisissez votre boisson' },
  { key: 'recap', label: 'Récapitulatif', title: 'Récapitulatif de la commande' },
];

function StepBar({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.stepBar}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          <View
            style={[
              styles.stepBarDot,
              i === currentStep - 1 && styles.stepBarDotActive,
              i < currentStep - 1 && styles.stepBarDotDone,
            ]}
          />
          {i < STEPS.length - 1 ? (
            <View
              style={[
                styles.stepBarLine,
                i < currentStep - 1 && styles.stepBarLineDone,
              ]}
            />
          ) : null}
        </React.Fragment>
      ))}
    </View>
  );
}

function buildKcalSteps(profile: UserProfile | null) {
  if (profile) {
    const { calories } = computeRequirements(profile);
    const tdee = calories.recommended;
    const min = calories.minimum;
    return [
      { level: 1, label: KCAL_STEP_LABELS[0], kcal: Math.round(min) },
      { level: 2, label: KCAL_STEP_LABELS[1], kcal: Math.round(tdee) },
    ];
  }
  return [
    { level: 1, label: KCAL_STEP_LABELS[0], kcal: 250 },
    { level: 2, label: KCAL_STEP_LABELS[1], kcal: 1000 },
  ];
}

function hasAllergenConflict(
  item: MenuItem,
  allergies: string[],
): boolean {
  if (allergies.length === 0) return false;
  const normalizedAllergies = allergies.map((a) => a.toLowerCase().trim());
  return item.ingredients.some((ing) => {
    const ingLower = ing.toLowerCase();
    return normalizedAllergies.some(
      (allergy) =>
        ingLower.includes(allergy) || allergy.includes(ingLower),
    );
  });
}

function sortMenu(items: MenuItem[], allergies: string[]): MenuItem[] {
  return [...items].sort((a, b) => {
    const aAllergen = hasAllergenConflict(a, allergies);
    const bAllergen = hasAllergenConflict(b, allergies);
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;
    if (!aAllergen && bAllergen) return -1;
    if (aAllergen && !bAllergen) return 1;
    return 0;
  });
}

type Screen = 'waiting' | 'code' | 'menu' | 'slider' | 'recap' | 'confirmed';

type Props = {
  onOpenProfile: () => void;
  profile: UserProfile | null;
  /** Code correct : l'application charge le profil de cet astronaute. */
  onAuthenticated: (astronauteId: string) => void;
  /** Commande terminée : la personne est déconnectée. */
  onLogout: () => void;
};

export function MealScreen({
  onOpenProfile,
  profile,
  onAuthenticated,
  onLogout,
}: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('waiting');
  /** Identifiant lu sur la carte, jusqu'à la déconnexion. */
  const [badgeId, setBadgeId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedRepas, setSelectedRepas] = useState<MenuItem | null>(null);
  const [selectedSnack, setSelectedSnack] = useState<MenuItem | null>(null);
  const [selectedBoisson, setSelectedBoisson] = useState<MenuItem | null>(null);
  const [sliderValue, setSliderValue] = useState(1);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [ingredientsItem, setIngredientsItem] = useState<MenuItem | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const claimScaleAnim = useRef(new Animated.Value(1)).current;
  const screenFade = useRef(new Animated.Value(0)).current;
  const screenSlide = useRef(new Animated.Value(30)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const kcalPopAnim = useRef(new Animated.Value(1)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const profileScale = useRef(new Animated.Value(1)).current;
  const menuScroll = useScrollArrows();

  useEffect(() => {
    screenFade.setValue(0);
    screenSlide.setValue(30);
    Animated.parallel([
      Animated.timing(screenFade, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(screenSlide, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screen, screenFade, screenSlide]);

  useEffect(() => {
    if (screen !== 'waiting') return;

    const scanLoop = Animated.loop(
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
    scanLoop.start();

    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot2Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot3Anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot1Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(dot2Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(dot3Anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    dotLoop.start();

    return () => {
      scanLoop.stop();
      dotLoop.stop();
    };
  }, [screen, scanAnim, dot1Anim, dot2Anim, dot3Anim]);

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

  // Rechargement après une commande : le stock vient de baisser, les portions
  // affichées doivent suivre et un plat épuisé doit passer en rupture.
  const refreshMenu = useCallback(async () => {
    try {
      setMenu(await fetchMeals());
    } catch {
      // Le menu précédent reste affiché ; il sera rechargé à la commande suivante.
    }
  }, []);

  const allergies = profile?.allergies ?? [];
  const kcalSteps = buildKcalSteps(profile);
  const currentStep = kcalSteps[Math.round(sliderValue) - 1];

  useEffect(() => {
    kcalPopAnim.setValue(0.7);
    Animated.spring(kcalPopAnim, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [sliderValue, kcalPopAnim]);

  // Écran d'attente : on écoute le lecteur NFC. Une carte détectée ouvre
  // l'écran du code pour l'identifiant lu.
  useEffect(() => {
    if (screen !== 'waiting') return undefined;
    return listenForBadges((scan) => {
      setBadgeId(scan.id);
      setScreen('code');
    });
  }, [screen]);

  const resetSelections = useCallback(() => {
    setSelectedRepas(null);
    setSelectedSnack(null);
    setSelectedBoisson(null);
    setSliderValue(1);
    setStepIndex(0);
    setError(null);
  }, []);

  const handleSelectItem = (item: MenuItem) => {
    if (!item.available) {
      const manquants = item.missing.map((m) => m.name).join(', ');
      setError(
        manquants !== ''
          ? `Plat indisponible — stock insuffisant : ${manquants}`
          : 'Plat indisponible — stock insuffisant.',
      );
      return;
    }

    if (hasAllergenConflict(item, allergies)) {
      setError(
        'Ce plat contient un ingrédient auquel vous êtes allergique. Il a été désactivé.',
      );
      return;
    }

    setError(null);
    const category = STEPS[stepIndex].key;

    if (category === 'repas') {
      setSelectedRepas(item);
      setSliderValue(1);
      setScreen('slider');
    } else if (category === 'snack') {
      setSelectedSnack(item);
      setStepIndex(2);
      setScreen('menu');
    } else if (category === 'boisson') {
      setSelectedBoisson(item);
      setScreen('recap');
    }
  };

  const handleSliderNext = () => {
    setStepIndex(1);
    setScreen('menu');
  };

  const handleBack = () => {
    if (screen === 'slider') {
      setScreen('menu');
      setStepIndex(0);
    } else if (screen === 'menu' && stepIndex === 1) {
      setSelectedSnack(null);
      setScreen('slider');
      setStepIndex(0);
    } else if (screen === 'menu' && stepIndex === 2) {
      setSelectedBoisson(null);
      setStepIndex(1);
      setScreen('menu');
    } else if (screen === 'recap') {
      setStepIndex(2);
      setScreen('menu');
    }
  };

  const handleSkip = () => {
    setError(null);
    if (stepIndex === 1) {
      setSelectedSnack(null);
      setStepIndex(2);
      setScreen('menu');
    } else if (stepIndex === 2) {
      setSelectedBoisson(null);
      setScreen('recap');
    }
  };

  const handleClaim = useCallback(async () => {
    if (!selectedRepas || isClaiming) return;
    setIsClaiming(true);
    setError(null);
    try {
      const stepIdx = Math.round(sliderValue) - 1;
      const mealType = kcalSteps[stepIdx].label.toLowerCase();
      const portionSize = Math.round(sliderValue);
      // Le profil se charge juste après le code : si la commande part avant
      // qu'il soit arrivé, on utilise l'identifiant lu sur la carte.
      const astronauteId = profile?.profileId ?? badgeId ?? undefined;

      const claims: ClaimPayload[] = [];
      const repasKcal = kcalSteps[stepIdx].kcal;
      if (selectedRepas) {
        claims.push({
          repas_id: selectedRepas.id,
          meal_type: mealType,
          portion_size: portionSize,
          astronaute_id: astronauteId,
          kcal: repasKcal,
        });
      }
      if (selectedSnack) {
        claims.push({
          repas_id: selectedSnack.id,
          meal_type: mealType,
          portion_size: 1,
          astronaute_id: astronauteId,
          kcal: selectedSnack.calories,
        });
      }
      if (selectedBoisson) {
        claims.push({
          repas_id: selectedBoisson.id,
          meal_type: mealType,
          portion_size: 1,
          astronaute_id: astronauteId,
          kcal: selectedBoisson.calories,
        });
      }

      await claimAllMeals(claims);
      void refreshMenu();
      setScreen('confirmed');
      progressAnim.setValue(0);
      ringAnim.setValue(0);
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
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        resetSelections();
        // Déconnexion : la personne suivante doit scanner son propre pass.
        setBadgeId(null);
        onLogout();
        setScreen('waiting');
      }, 3000);
    } catch (e) {
      setError(
        `Impossible d'enregistrer votre commande. ${(e as Error).message || 'Vérifiez votre connexion.'}`,
      );
    } finally {
      setIsClaiming(false);
    }
  }, [
    selectedRepas,
    selectedSnack,
    selectedBoisson,
    sliderValue,
    isClaiming,
    profile,
    badgeId,
    onLogout,
    kcalSteps,
    fadeAnim,
    scaleAnim,
    progressAnim,
    ringAnim,
    resetSelections,
    refreshMenu,
  ]);

  const handleProfilePressIn = () =>
    Animated.timing(profileScale, {
      toValue: 0.88,
      duration: 100,
      useNativeDriver: true,
    }).start();

  const handleProfilePressOut = () =>
    Animated.spring(profileScale, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();

  const filteredMenu = menu.filter((m) => m.categorie === STEPS[stepIndex].key);
  const sortedMenu = sortMenu(filteredMenu, allergies);

  // --- ÉCRAN DU CODE ---
  if (screen === 'code' && badgeId) {
    return (
      <CodeScreen
        astronauteId={badgeId}
        onSuccess={() => {
          onAuthenticated(badgeId);
          resetSelections();
          setScreen('menu');
        }}
        onCancel={() => {
          setBadgeId(null);
          setScreen('waiting');
        }}
      />
    );
  }

  // --- ÉCRAN D'ATTENTE ---
  // Seul le passage d'une carte permet d'avancer (voir listenForBadges).
  if (screen === 'waiting') {
    const scanTranslateY = scanAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-12, 12],
    });

    return (
      <View style={styles.screen}>
        <View style={[styles.waitingCard, { paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.scanHaloWrap}>
            <Animated.View
              style={[
                styles.scanIconWrap,
                { transform: [{ translateY: scanTranslateY }] },
              ]}
            >
              <ScanLine color={arcade.blue} size={52} strokeWidth={2} />
            </Animated.View>
          </View>
          <Text style={styles.waitingTitle}>Scannez votre pass</Text>
          <Text style={styles.waitingSubtitle}>
            En attente de validation
            <Animated.Text style={{ opacity: dot1Anim }}>.</Animated.Text>
            <Animated.Text style={{ opacity: dot2Anim }}>.</Animated.Text>
            <Animated.Text style={{ opacity: dot3Anim }}>.</Animated.Text>
          </Text>
          <Text style={styles.waitingHint}>
            Approchez votre carte du lecteur
          </Text>
        </View>
      </View>
    );
  }

  // --- ÉCRAN DE CONFIRMATION ---
  if (screen === 'confirmed') {
    const ring1Scale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2] });
    const ring1Opacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
    const ring2Scale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] });
    const ring2Opacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });
    return (
      <View style={styles.screen}>
        <Animated.View
          style={[
            styles.confirmationCard,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.confirmationIconWrap}>
            <Animated.View
              style={[
                styles.confirmationRing,
                { transform: [{ scale: ring1Scale }], opacity: ring1Opacity },
              ]}
            />
            <Animated.View
              style={[
                styles.confirmationRing2,
                { transform: [{ scale: ring2Scale }], opacity: ring2Opacity },
              ]}
            />
            <Check color={arcade.blue} size={48} strokeWidth={2.5} />
          </View>
          <Text style={styles.confirmationTitle}>Commande envoyée</Text>
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

  // --- ÉCRAN SÉLECTEUR DE PORTION (repas only) ---
  if (screen === 'slider' && selectedRepas) {
    return (
      <View style={styles.screen}>
        <Animated.View
          style={[
            styles.sliderHeader,
            {
              paddingTop: insets.top + space.sm,
              opacity: screenFade,
              transform: [{ translateY: screenSlide }],
            },
          ]}
        >
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={8}
          >
            <ArrowLeft color={arcade.text} size={22} strokeWidth={2} />
          </Pressable>
          <Text style={styles.sliderHeaderTitle}>Choisir la portion</Text>
          <View style={styles.backButtonSpacer} />
        </Animated.View>

        <Animated.ScrollView
          style={[
            styles.sliderScroll,
            { opacity: screenFade, transform: [{ translateY: screenSlide }] },
          ]}
          contentContainerStyle={[
            styles.sliderScrollContent,
            { paddingBottom: space.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <StepBar currentStep={1} />
          <Text style={styles.stepIndicatorLabel}>
            Étape 1 sur 4 — Repas
          </Text>

          <View style={styles.mealHeroCard}>
            <Image
              source={{ uri: selectedRepas.image }}
              style={styles.mealHeroImage}
            />
            <Text style={styles.mealHeroName}>{selectedRepas.name}</Text>
          </View>

          <View style={styles.quantitySection}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>Quantité du repas</Text>
              <Animated.View
                style={[
                  styles.kcalPill,
                  { transform: [{ scale: kcalPopAnim }] },
                ]}
              >
                <Text style={styles.kcalPillText}>
                  {currentStep.kcal} kcal
                </Text>
              </Animated.View>
            </View>

            <View style={styles.sliderWrap}>
              <View style={styles.sliderTrackContainer}>
                <View style={styles.sliderTrack}>
                  <Animated.View
                    style={[
                      styles.sliderTrackFill,
                      {
                        width: sliderValue === 1 ? '0%' : '100%',
                      },
                    ]}
                  />
                </View>
                <View style={styles.sliderTicks}>
                  {kcalSteps.map((step) => (
                    <View
                      key={step.level}
                      style={[
                        styles.sliderTick,
                        currentStep.level === step.level && styles.sliderTickActive,
                      ]}
                    />
                  ))}
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={2}
                  step={1}
                  value={sliderValue}
                  onValueChange={(v) => {
                    setSliderValue(v);
                  }}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor="transparent"
                />
              </View>

              <View style={styles.sliderStepLabels}>
                {kcalSteps.map((step) => (
                  <View
                    key={step.level}
                    style={[
                      styles.sliderStepLabelWrap,
                      currentStep.level === step.level &&
                        styles.sliderStepLabelWrapActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sliderStepLabelText,
                        currentStep.level === step.level &&
                          styles.sliderStepLabelTextActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text
                      style={[
                        styles.sliderStepLabelKcal,
                        currentStep.level === step.level &&
                          styles.sliderStepLabelKcalActive,
                      ]}
                    >
                      {step.kcal} kcal
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.ingredientsCard}>
            <Text style={styles.ingredientsCardTitle}>Ingrédients</Text>
            <View style={styles.ingredientsList}>
              {selectedRepas.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientChip}>
                  <Text style={styles.ingredientChipText}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.ScrollView>

        {error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          <Pressable
            onPress={handleSliderNext}
            onPressIn={() =>
              Animated.timing(claimScaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
              }).start()
            }
            onPressOut={() =>
              Animated.spring(claimScaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 120,
                useNativeDriver: true,
              }).start()
            }
          >
            <Animated.View
              style={[
                styles.claimButton,
                { transform: [{ scale: claimScaleAnim }] },
              ]}
            >
              <Text style={styles.claimButtonText}>Suivant — Snack</Text>
              <ArrowRight color={arcade.buttonText} size={20} strokeWidth={2} />
            </Animated.View>
          </Pressable>
        </View>
      </View>
    );
  }

  // --- ÉCRAN RÉCAPITULATIF ---
  if (screen === 'recap') {
    const repasKcal = kcalSteps[Math.round(sliderValue) - 1].kcal;
    const snackKcal = selectedSnack?.calories ?? 0;
    const boissonKcal = selectedBoisson?.calories ?? 0;
    const totalKcal = repasKcal + snackKcal + boissonKcal;

    const recapItems: { label: string; item: MenuItem | null; kcal: number }[] = [
      { label: 'Repas', item: selectedRepas, kcal: repasKcal },
      { label: 'Snack', item: selectedSnack, kcal: snackKcal },
      { label: 'Boisson', item: selectedBoisson, kcal: boissonKcal },
    ];

    return (
      <View style={styles.screen}>
        <Animated.View
          style={[
            styles.sliderHeader,
            {
              paddingTop: insets.top + space.sm,
              opacity: screenFade,
              transform: [{ translateY: screenSlide }],
            },
          ]}
        >
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={8}
          >
            <ArrowLeft color={arcade.text} size={22} strokeWidth={2} />
          </Pressable>
          <Text style={styles.sliderHeaderTitle}>Récapitulatif</Text>
          <Pressable
            onPressIn={handleProfilePressIn}
            onPressOut={handleProfilePressOut}
            onPress={onOpenProfile}
            hitSlop={8}
          >
            <Animated.View
              style={[
                styles.profileButton,
                { transform: [{ scale: profileScale }] },
              ]}
            >
              <User color={arcade.text} size={20} strokeWidth={2} />
            </Animated.View>
          </Pressable>
        </Animated.View>

        <Animated.ScrollView
          style={[
            styles.sliderScroll,
            { opacity: screenFade, transform: [{ translateY: screenSlide }] },
          ]}
          contentContainerStyle={[
            styles.sliderScrollContent,
            { paddingBottom: space.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <StepBar currentStep={4} />
          <Text style={styles.stepIndicatorLabel}>
            Étape 4 sur 4 — Récapitulatif
          </Text>

          <View style={{ height: space.lg }} />

          {recapItems.map(({ label, item, kcal }) => (
            <View key={label} style={styles.recapRow}>
              <View style={styles.recapRowLeft}>
                <View style={styles.recapIconWrap}>
                  {item ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.recapImage}
                    />
                  ) : (
                    <Text style={styles.recapDash}>—</Text>
                  )}
                </View>
                <View style={styles.recapTextCol}>
                  <Text style={styles.recapLabel}>{label}</Text>
                  <Text style={styles.recapName}>
                    {item ? item.name : 'Aucun'}
                  </Text>
                  {item ? (
                    <Text style={styles.recapCal}>
                      {Math.round(kcal)} kcal
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))}

          <View style={styles.recapTotalCard}>
            <Text style={styles.recapTotalLabel}>Total estimé</Text>
            <Text style={styles.recapTotalValue}>
              {Math.round(totalKcal)} kcal
            </Text>
            <Text style={styles.recapPortion}>
              Portion : {KCAL_STEP_LABELS[Math.round(sliderValue) - 1]}
            </Text>
          </View>
        </Animated.ScrollView>

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
              Animated.spring(claimScaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 120,
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
              <Zap color={arcade.buttonText} size={20} strokeWidth={2} />
              <Text style={styles.claimButtonText}>
                {isClaiming ? 'Envoi...' : 'Envoyer la commande'}
              </Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>
    );
  }

  // --- ÉCRAN MENU (par étape) ---
  const currentStepInfo = STEPS[stepIndex];

  return (
    <View style={styles.screen}>
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + space.sm,
            opacity: screenFade,
            transform: [{ translateY: screenSlide }],
          },
        ]}
      >
        {stepIndex > 0 ? (
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={8}
          >
            <ArrowLeft color={arcade.text} size={22} strokeWidth={2} />
          </Pressable>
        ) : (
          <View style={styles.backButtonSpacer} />
        )}
        <Text style={styles.headerTitle}>{currentStepInfo.title}</Text>
        <Pressable
          onPressIn={handleProfilePressIn}
          onPressOut={handleProfilePressOut}
          onPress={onOpenProfile}
          hitSlop={8}
        >
          <Animated.View
            style={[
              styles.profileButton,
              { transform: [{ scale: profileScale }] },
            ]}
          >
            <User color={arcade.text} size={20} strokeWidth={2} />
          </Animated.View>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.stepIndicatorWrap,
          { opacity: screenFade, transform: [{ translateY: screenSlide }] },
        ]}
      >
        <StepBar currentStep={stepIndex + 1} />
        <Text style={styles.stepIndicatorLabel}>
          Étape {stepIndex + 1} sur 4 — {currentStepInfo.label}
        </Text>
      </Animated.View>

      {menuLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={arcade.blue} />
          <Text style={styles.loadingText}>Chargement des {currentStepInfo.label.toLowerCase()}s...</Text>
        </View>
      ) : menuError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{menuError}</Text>
        </View>
      ) : sortedMenu.length === 0 ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>
            Aucun {currentStepInfo.label.toLowerCase()} disponible.
          </Text>
        </View>
      ) : (
        <Animated.ScrollView
          {...menuScroll.scrollProps}
          style={[styles.menuGrid, { opacity: screenFade }]}
          contentContainerStyle={[
            styles.menuGridContent,
            { paddingBottom: insets.bottom + space.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridRow}>
            {sortedMenu.map((item, index) => {
              const allergen = hasAllergenConflict(item, allergies);
              return (
                <MealCard
                  key={item.id}
                  item={item}
                  index={index}
                  hasAllergen={allergen}
                  disabled={allergen}
                  onPress={() => handleSelectItem(item)}
                  onInfo={() => setIngredientsItem(item)}
                />
              );
            })}
          </View>
        </Animated.ScrollView>
      )}
      
      <ScrollArrows scroll={menuScroll} />

      {stepIndex > 0 ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          <Pressable
            onPress={handleSkip}
            onPressIn={() =>
              Animated.timing(claimScaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
              }).start()
            }
            onPressOut={() =>
              Animated.spring(claimScaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 120,
                useNativeDriver: true,
              }).start()
            }
          >
            <Animated.View
              style={[
                styles.skipButton,
                { transform: [{ scale: claimScaleAnim }] },
              ]}
            >
              <Text style={styles.skipButtonText}>
                Passer cette étape
              </Text>
            </Animated.View>
          </Pressable>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

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
                <X color={arcade.textMuted} size={22} strokeWidth={2} />
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

/* -------------------------------------------------------------------------
 * Carte plat — entrée échelonnée + animation de tap
 * ---------------------------------------------------------------------- */

function MealCard({
  item,
  index,
  hasAllergen,
  disabled,
  onPress,
  onInfo,
}: {
  item: MenuItem;
  index: number;
  hasAllergen: boolean;
  disabled: boolean;
  onPress: () => void;
  onInfo: () => void;
}): React.ReactElement {
  const scale = useRef(new Animated.Value(1)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 80;
    const timer = setTimeout(() => {
      Animated.spring(cardAnim, {
        toValue: 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [cardAnim, index]);

  const handlePressIn = () =>
    Animated.timing(scale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 120,
      useNativeDriver: true,
    }).start();

  const translateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });
  const opacity = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Pressable
      style={styles.gridItem}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.gridItemCard,
          !item.available && styles.gridItemCardOut,
          disabled && styles.gridItemCardAllergen,
          {
            transform: [{ scale }, { translateY }],
            opacity,
          },
        ]}
      >
        <View style={styles.gridItemImageWrap}>
          <Image
            source={{ uri: item.image }}
            style={styles.gridItemImage}
          />
          <Pressable
            style={styles.gridItemInfoBtn}
            onPress={onInfo}
            hitSlop={8}
          >
            <HelpCircle color={arcade.textInverse} size={18} strokeWidth={2} />
          </Pressable>
          {!item.available ? (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>RUPTURE</Text>
            </View>
          ) : null}
          {hasAllergen && item.available ? (
            <View style={styles.allergenBadge}>
              <AlertTriangle color={arcade.textInverse} size={12} strokeWidth={2} />
              <Text style={styles.allergenText}>ALLERGIE</Text>
            </View>
          ) : null}
          {disabled && item.available ? (
            <View style={styles.allergenOverlay}>
              <View style={styles.allergenOverlayInner}>
                <AlertTriangle color={arcade.red} size={22} strokeWidth={2} />
                <Text style={styles.allergenOverlayText}>
                  Non disponible{'\n'}pour vous
                </Text>
              </View>
            </View>
          ) : null}
        </View>
        <View style={styles.gridItemTextWrap}>
          <Text
            style={[
              styles.gridItemName,
              disabled && styles.gridItemNameDisabled,
            ]}
          >
            {item.name}
          </Text>
          {item.maxPortions !== null ? (
            <Text
              style={[
                styles.gridItemStock,
                item.maxPortions <= 3 && styles.gridItemStockLow,
                !item.available && styles.gridItemStockOut,
              ]}
            >
              {item.available
                ? `${item.maxPortions} portion${item.maxPortions > 1 ? 's' : ''} en stock`
                : 'Stock épuisé'}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: arcade.bg },

  // Menu header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  headerTitle: {
    flex: 1,
    fontFamily: font.display,
    fontSize: size.stat + 2,
    color: arcade.text,
    letterSpacing: 0.5,
    textTransform: 'none',
    fontWeight: '700',
    textAlign: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: arcade.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Step indicator
  stepIndicatorWrap: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: space.xs,
  },
  stepBarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: arcade.border,
  },
  stepBarDotActive: {
    backgroundColor: arcade.blue,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepBarDotDone: {
    backgroundColor: arcade.blue,
  },
  stepBarLine: {
    flex: 1,
    height: 2,
    backgroundColor: arcade.border,
    marginHorizontal: 4,
  },
  stepBarLineDone: {
    backgroundColor: arcade.blue,
  },
  stepIndicatorLabel: {
    fontFamily: font.mono,
    fontSize: size.meta + 1,
    color: arcade.textMuted,
    textAlign: 'center',
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
    color: arcade.textMuted,
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
    borderRadius: 16,
    backgroundColor: arcade.card,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gridItemImageWrap: { width: '100%', height: 140, position: 'relative' },
  gridItemImage: { width: '100%', height: '100%', resizeMode: 'contain', backgroundColor: '#eee' },
  gridItemInfoBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemTextWrap: {
    paddingVertical: space.md + 2,
    paddingHorizontal: space.md,
  },
  gridItemName: {
    fontFamily: font.body,
    fontSize: size.label + 2,
    color: arcade.text,
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  gridItemStock: {
    fontFamily: font.bodyRegular,
    fontSize: size.label,
    color: arcade.blue,
    marginTop: 4,
  },
  gridItemStockLow: { color: arcade.orange },
  gridItemStockOut: { color: arcade.red },
  gridItemCardOut: { opacity: 0.5 },
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: arcade.red,
  },
  outOfStockText: {
    fontFamily: font.body,
    fontSize: size.label - 1,
    letterSpacing: 0.5,
    fontWeight: '700',
    color: arcade.textInverse,
  },
  allergenBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: arcade.orange,
  },
  allergenText: {
    fontFamily: font.body,
    fontSize: size.label - 1,
    letterSpacing: 0.5,
    fontWeight: '700',
    color: arcade.textInverse,
  },
  gridItemCardAllergen: {
    opacity: 0.55,
  },
  allergenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergenOverlayInner: {
    alignItems: 'center',
    gap: 6,
  },
  allergenOverlayText: {
    fontFamily: font.body,
    fontSize: size.label - 1,
    color: arcade.red,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: size.label + 3,
  },
  gridItemNameDisabled: {
    color: arcade.textMuted,
  },

  // Slider screen
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  sliderHeaderTitle: {
    flex: 1,
    fontFamily: font.display,
    fontSize: size.stat + 2,
    color: arcade.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  backButtonSpacer: { width: 40 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: arcade.cardAlt,
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
    borderRadius: 16,
    resizeMode: 'contain',
    marginBottom: space.lg,
  },
  mealHeroName: {
    fontFamily: font.display,
    fontSize: size.stat + 10,
    color: arcade.text,
    textAlign: 'center',
    fontWeight: '700',
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
    fontSize: size.label + 1,
    color: arcade.textMuted,
  },
  kcalPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: arcade.cardAlt,
  },
  kcalPillText: {
    fontFamily: font.mono,
    fontSize: size.label,
    color: arcade.text,
    fontWeight: '600',
  },
  sliderWrap: {
    width: '100%',
    paddingTop: space.md,
    paddingBottom: space.sm,
    paddingHorizontal: 8,
  },
  sliderTrackContainer: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: arcade.border,
    overflow: 'hidden',
  },
  sliderTrackFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: arcade.blue,
  },
  sliderTicks: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  sliderTick: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: arcade.border,
  },
  sliderTickActive: {
    backgroundColor: arcade.blue,
    borderColor: arcade.blue,
    transform: [{ scale: 1.2 }],
    shadowColor: arcade.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  slider: { width: '100%', height: 44, zIndex: 3 },
  sliderStepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.md,
    marginBottom: space.xl,
    paddingHorizontal: 4,
  },
  sliderStepLabelWrap: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    borderRadius: 12,
  },
  sliderStepLabelWrapActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  sliderStepLabelText: {
    fontFamily: font.body,
    fontSize: size.label,
    color: arcade.textMuted,
    marginBottom: 2,
  },
  sliderStepLabelTextActive: { color: arcade.blue, fontWeight: '700' },
  sliderStepLabelKcal: {
    fontFamily: font.mono,
    fontSize: 11,
    color: arcade.textMuted,
  },
  sliderStepLabelKcalActive: { color: arcade.blue, fontWeight: '600' },

  // Ingredients card
  ingredientsCard: {
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderRadius: 16,
    backgroundColor: arcade.cardAlt,
  },
  ingredientsCardTitle: {
    fontFamily: font.display,
    fontSize: size.label + 4,
    color: arcade.text,
    marginBottom: space.md,
    fontWeight: '700',
  },
  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredientChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: arcade.card,
  },
  ingredientChipText: {
    fontFamily: font.mono,
    fontSize: size.meta + 1,
    color: arcade.text,
  },

  // Recap
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: 16,
    backgroundColor: arcade.cardAlt,
    marginBottom: space.sm,
  },
  recapRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    flex: 1,
  },
  recapTextCol: {
    flex: 1,
    flexShrink: 1,
  },
  recapIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: arcade.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  recapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  recapDash: {
    fontFamily: font.mono,
    fontSize: size.stat,
    color: arcade.textMuted,
  },
  recapLabel: {
    fontFamily: font.mono,
    fontSize: size.meta + 1,
    color: arcade.textMuted,
    marginBottom: 2,
  },
  recapName: {
    fontFamily: font.body,
    fontSize: size.label + 2,
    color: arcade.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  recapCal: {
    fontFamily: font.mono,
    fontSize: size.meta + 1,
    color: arcade.blue,
  },
  recapTotalCard: {
    alignItems: 'center',
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
    borderRadius: 16,
    backgroundColor: arcade.cardAlt,
    marginTop: space.sm,
  },
  recapTotalLabel: {
    fontFamily: font.mono,
    fontSize: size.label,
    color: arcade.textMuted,
    marginBottom: space.sm,
  },
  recapTotalValue: {
    fontFamily: font.display,
    fontSize: size.stat + 12,
    color: arcade.blue,
    fontWeight: '700',
    marginBottom: space.xs,
  },
  recapPortion: {
    fontFamily: font.mono,
    fontSize: size.meta + 1,
    color: arcade.textMuted,
  },

  // Error
  errorWrap: {
    margin: space.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
  },
  errorText: {
    fontFamily: font.mono,
    fontSize: size.meta + 1,
    color: arcade.red,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    backgroundColor: arcade.bg,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: arcade.blue,
  },
  claimButtonText: {
    fontFamily: font.display,
    fontSize: size.label + 4,
    color: arcade.buttonText,
    fontWeight: '600',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: arcade.cardAlt,
  },
  skipButtonText: {
    fontFamily: font.display,
    fontSize: size.label + 2,
    color: arcade.textMuted,
    fontWeight: '600',
  },

  // Confirmation
  confirmationCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  confirmationIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: arcade.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
  },
  confirmationRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: arcade.blue,
  },
  confirmationRing2: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: arcade.blue,
  },
  confirmationTitle: {
    fontFamily: font.display,
    fontSize: size.stat + 8,
    color: arcade.text,
    textAlign: 'center',
    marginBottom: space.md,
    fontWeight: '700',
  },
  confirmationDate: {
    fontFamily: font.mono,
    fontSize: size.label,
    color: arcade.textMuted,
    textTransform: 'capitalize',
    marginBottom: space.xl,
  },
  confirmationProgressTrack: {
    width: '70%',
    height: 4,
    borderRadius: 2,
    backgroundColor: arcade.cardAlt,
    overflow: 'hidden',
  },
  confirmationProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: arcade.blue,
  },

  // Waiting
  waitingCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanHaloWrap: {
    marginBottom: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanHalo: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: arcade.blue,
  },
  scanHalo2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: arcade.blue,
  },
  scanIconWrap: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: arcade.cardAlt,
  },
  waitingTitle: {
    fontFamily: font.display,
    fontSize: size.stat + 10,
    color: arcade.text,
    textAlign: 'center',
    marginBottom: space.md,
    fontWeight: '700',
  },
  waitingSubtitle: {
    fontFamily: font.mono,
    fontSize: size.label + 3,
    color: arcade.textMuted,
    marginBottom: space.xl,
  },
  waitingHint: {
    fontFamily: font.mono,
    fontSize: size.meta + 1,
    color: arcade.textMuted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: arcade.card,
    borderRadius: 20,
    padding: space.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
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
    color: arcade.text,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: arcade.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: arcade.border,
  },
  modalMealImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  modalMealText: { flex: 1, gap: 2 },
  modalMealName: {
    fontFamily: font.body,
    fontSize: size.label + 4,
    color: arcade.text,
    fontWeight: '600',
  },
  modalIngredientScroll: { maxHeight: 300 },
  modalIngredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: arcade.borderLight,
  },
  modalIngredientRowLast: { borderBottomWidth: 0 },
  modalIngredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: arcade.blue,
  },
  modalIngredientText: {
    flex: 1,
    fontFamily: font.bodyRegular,
    fontSize: size.label + 3,
    color: arcade.text,
  },
});
