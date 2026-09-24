/**
 * Panneau profil — même langage visuel que le MealScreen.
 *
 * Fond blanc pur, cartes à ombres douces, coins arrondis, accent bleu.
 * Uniquement les données récupérées en base.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { arcade, font, size, space } from '../constants/figmaTheme';
import {
  formatAllergies,
  getSexLabel,
  getActivityLabel,
  getInitial,
} from '../services/profileService';
import { computeRequirements } from '../services/nutritionEngine';
import type { UserProfile } from '../types/user';

type Props = {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
};

export function ProfilePanel({
  visible,
  profile,
  onClose,
}: Props): React.ReactElement {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(1)).current;
  const req = computeRequirements(profile);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slide, visible]);

  const translateX = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Dimensions.get('window').width],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.panel,
            { transform: [{ translateX }] },
          ]}
        >
          <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
            <Pressable
              style={styles.backButton}
              onPress={onClose}
              hitSlop={8}
            >
              <ArrowLeft color={arcade.text} size={22} strokeWidth={2} />
            </Pressable>
            <Text style={styles.headerTitle}>Profil</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + space.xl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroCard}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>{getInitial(profile)}</Text>
              </View>
              <Text style={styles.heroName}>
                {profile.firstName}{profile.lastName ? ` ${profile.lastName}` : ''}
              </Text>

            </View>

            <InfoCard title="Identité">
              <InfoRow label="Prénom" value={profile.firstName} />
              {profile.lastName ? (
                <InfoRow label="Nom" value={profile.lastName} />
              ) : null}
              <InfoRow label="Identifiant" value={profile.profileId} />
              <InfoRow label="Âge" value={`${profile.age} ans`} />
              <InfoRow label="Sexe" value={getSexLabel(profile)} last />
            </InfoCard>

            <InfoCard title="Données biométriques">
              <InfoRow label="Taille" value={`${profile.heightCm} cm`} />
              <InfoRow label="Poids" value={`${fr(profile.weightKg)} kg`} last />
            </InfoCard>

            <InfoCard title="Activité & allergies">
              <InfoRow
                label="Niveau d'activité"
                value={getActivityLabel(profile)}
              />
              <InfoRow
                label="Allergies"
                value={formatAllergies(profile)}
                last
              />
            </InfoCard>

            <InfoCard title="Besoins énergétiques">
              <InfoRow
                label="Minimum journalier"
                value={`${Math.round(req.calories.minimum)} kcal`}
              />
              <InfoRow
                label="Cible journalière"
                value={`${Math.round(req.calories.recommended)} kcal`}
                last
              />
            </InfoCard>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------
 * Briques
 * ---------------------------------------------------------------------- */

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}): React.ReactElement {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

/** Décimale française : 76.4 -> « 76,4 ». */
const fr = (value: number): string =>
  (Math.round(value * 10) / 10).toString().replace('.', ',');

/* -------------------------------------------------------------------------
 * Styles — calqués sur MealScreen
 * ---------------------------------------------------------------------- */

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },

  panel: {
    flex: 1,
    width: '100%',
    backgroundColor: arcade.bg,
  },

  // Header — identique au sliderHeader de MealScreen
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: arcade.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: font.display,
    fontSize: size.stat + 4,
    color: arcade.text,
    fontWeight: '700',
    marginLeft: space.md,
  },
  headerSpacer: { flex: 1 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: space.lg, gap: space.lg },

  // Hero — carte avec ombre, comme les cartes du menu
  heroCard: {
    alignItems: 'center',
    paddingVertical: space.xl,
    borderRadius: 16,
    backgroundColor: arcade.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: arcade.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  heroAvatarText: {
    fontFamily: font.display,
    fontSize: size.stat + 14,
    color: arcade.text,
    fontWeight: '700',
  },
  heroName: {
    fontFamily: font.display,
    fontSize: size.stat + 8,
    color: arcade.text,
    fontWeight: '700',
    marginBottom: space.md,
  },
  heroIdPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: arcade.cardAlt,
  },
  heroIdText: {
    fontFamily: font.body,
    fontSize: size.label + 1,
    color: arcade.textMuted,
    fontWeight: '500',
  },

  // Cartes info — ombre douce, comme gridItemCard
  card: {
    borderRadius: 16,
    backgroundColor: arcade.card,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: font.display,
    fontSize: size.label + 2,
    color: arcade.text,
    fontWeight: '700',
    marginBottom: space.md,
  },

  // Lignes — séparateur fin comme dans le modal d'ingrédients
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: arcade.borderLight,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: {
    fontFamily: font.body,
    fontSize: size.label + 1,
    color: arcade.textMuted,
    flexShrink: 1,
  },
  rowValue: {
    fontFamily: font.body,
    fontSize: size.label + 2,
    color: arcade.text,
    textAlign: 'right',
    flexShrink: 1,
    fontWeight: '600',
  },
});
