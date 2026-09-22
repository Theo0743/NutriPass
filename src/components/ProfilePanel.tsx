/**
 * Panneau profil — strictement les données de la base.
 *
 * Chaque ligne affichée est soit un champ de UserProfile, soit une valeur
 * calculée à partir de ces champs par le moteur nutritionnel. Rien d'autre.
 *
 *   PROFIL    les 13 champs stockés + IMC et masse maigre dérivés
 *   BESOINS   sortie du moteur : macros, hydratation, micronutriments
 *   MÉTHODE   hypothèses et avertissement produits par le moteur
 *
 * Le design (couleurs, polices, structure en cartes) reprend l'interface
 * publiée ; seules les données changent.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
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

import { HAIRLINE, c, font, radius, size, space } from '../constants/figmaTheme';
import { estimateNutrition } from '../services/nutritionEngine';
import {
  formatAllergies,
  formatIntolerances,
  formatUpdatedAt,
  getActivityLabel,
  getBmi,
  getBmiLabel,
  getDietLabel,
  getInitial,
  getLeanMassKg,
  getSexLabel,
} from '../services/profileService';
import type { MicronutrientKey } from '../types/nutrition';
import type { UserProfile } from '../types/user';

type PanelTab = 'profil' | 'besoins' | 'methode';

const TABS: Array<{ key: PanelTab; label: string }> = [
  { key: 'profil', label: 'PROFIL' },
  { key: 'besoins', label: 'BESOINS' },
  { key: 'methode', label: 'MÉTHODE' },
];

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
  const [tab, setTab] = useState<PanelTab>('profil');
  const slide = useRef(new Animated.Value(1)).current;

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

  // Recalculé à chaque changement de profil : aucun besoin n'est stocké.
  const assessment = useMemo(() => estimateNutrition(profile), [profile]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        <Animated.View
          style={[
            styles.panel,
            { paddingTop: insets.top, transform: [{ translateX }] },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitial(profile)}</Text>
            </View>

            <View style={styles.headerMain}>
              <Text style={styles.name}>{profile.firstName}</Text>
              <Text style={styles.headerMeta}>{profile.profileId}</Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Fermer le profil"
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.tabBar}>
            {TABS.map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => setTab(key)}
                style={[styles.tab, tab === key && styles.tabActive]}
              >
                <Text
                  style={[styles.tabText, tab === key && styles.tabTextActive]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + space.xl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {tab === 'profil' ? <ProfilTab profile={profile} /> : null}
            {tab === 'besoins' ? (
              <BesoinsTab assessment={assessment} />
            ) : null}
            {tab === 'methode' ? (
              <MethodeTab assessment={assessment} />
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------
 * PROFIL — les champs stockés
 * ---------------------------------------------------------------------- */

function ProfilTab({ profile }: { profile: UserProfile }): React.ReactElement {
  const bmi = getBmi(profile);
  const leanMass = getLeanMassKg(profile);

  return (
    <>
      <Section title="IDENTITÉ">
        <Row label="Prénom" value={profile.firstName} />
        <Row label="Identifiant" value={profile.profileId} tone="cyan" />
        <Row label="Âge" value={`${profile.age} ans`} />
        <Row label="Sexe" value={getSexLabel(profile)} last />
      </Section>

      <Section title="DONNÉES BIOMÉTRIQUES">
        <Row label="Taille" value={`${profile.heightCm} cm`} />
        <Row label="Poids" value={`${fr(profile.weightKg)} kg`} tone="cyan" />
        <Row
          label="IMC"
          value={`${fr(bmi)} — ${getBmiLabel(bmi)}`}
          tone={bmi >= 18.5 && bmi < 25 ? 'green' : 'default'}
        />
        {profile.bodyFatPercent !== undefined ? (
          <Row label="Masse grasse" value={`${fr(profile.bodyFatPercent)} %`} />
        ) : null}
        {leanMass !== undefined ? (
          <Row label="Masse maigre" value={`${fr(leanMass)} kg`} last />
        ) : null}
      </Section>

      <Section title="ACTIVITÉ & RÉGIME">
        <Row label="Niveau d'activité" value={getActivityLabel(profile)} />
        <Row label="Régime" value={getDietLabel(profile)} />
        <Row label="Allergies" value={formatAllergies(profile)} />
        <Row label="Intolérances" value={formatIntolerances(profile)} last />
      </Section>

      <Text style={styles.footnote}>
        Enregistré sur l'appareil · mis à jour le{' '}
        {formatUpdatedAt(profile.updatedAt)}
      </Text>
    </>
  );
}

/* -------------------------------------------------------------------------
 * BESOINS — sortie du moteur
 * ---------------------------------------------------------------------- */

type Assessment = ReturnType<typeof estimateNutrition>;

const MICRO_LABELS: Record<MicronutrientKey, string> = {
  calcium: 'Calcium',
  iron: 'Fer',
  vitaminD: 'Vitamine D',
  vitaminC: 'Vitamine C',
  potassium: 'Potassium',
  sodium: 'Sodium',
};

function BesoinsTab({
  assessment,
}: {
  assessment: Assessment;
}): React.ReactElement {
  const { requirements: r, derivation: d, micronutrients } = assessment;

  return (
    <>
      <Section title="DÉPENSE ÉNERGÉTIQUE">
        <Row label="Métabolisme de base" value={`${fmt(d.bmrKcal)} kcal/j`} />
        <Row label="Facteur d'activité" value={`× ${d.activityFactor}`} />
        <Row
          label="Dépense totale"
          value={`${fmt(d.tdeeKcal)} kcal/j`}
          tone="cyan"
          last
        />
      </Section>

      <Section title="APPORTS — MINIMUM / RECOMMANDÉ">
        <RangeRow
          label="Calories"
          minimum={`${fmt(r.calories.minimum)}`}
          recommended={`${fmt(r.calories.recommended)}`}
          unit="kcal"
        />
        <RangeRow
          label="Protéines"
          minimum={`${fmt(r.protein.minimum)}`}
          recommended={`${fmt(r.protein.recommended)}`}
          unit="g"
        />
        <RangeRow
          label="Glucides"
          minimum={`${fmt(r.carbohydrates.minimum)}`}
          recommended={`${fmt(r.carbohydrates.recommended)}`}
          unit="g"
        />
        <RangeRow
          label="Lipides"
          minimum={`${fmt(r.fat.minimum)}`}
          recommended={`${fmt(r.fat.recommended)}`}
          unit="g"
        />
        <RangeRow
          label="Fibres"
          minimum={`${fmt(r.fiber.minimum)}`}
          recommended={`${fmt(r.fiber.recommended)}`}
          unit="g"
        />
        <RangeRow
          label="Hydratation"
          minimum={fr(r.water.minimum / 1000)}
          recommended={fr(r.water.recommended / 1000)}
          unit="L"
          last
        />
      </Section>

      <Section title="MICRONUTRIMENTS">
        {(Object.keys(micronutrients) as MicronutrientKey[]).map(
          (key, index, all) => {
            const micro = micronutrients[key];
            const unit = micro.unit === 'ug' ? 'µg' : micro.unit;
            return (
              <Row
                key={key}
                label={MICRO_LABELS[key]}
                value={`${fmt(micro.minimum)} / ${fmt(micro.recommended)} ${unit}`}
                last={index === all.length - 1}
              />
            );
          },
        )}
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------
 * MÉTHODE — hypothèses du moteur
 * ---------------------------------------------------------------------- */

function MethodeTab({
  assessment,
}: {
  assessment: Assessment;
}): React.ReactElement {
  return (
    <>
      <Section title="ÉQUATION UTILISÉE">
        <Row
          label="Méthode"
          value={
            assessment.derivation.bmrMethod === 'katch-mcardle'
              ? 'Katch-McArdle'
              : 'Mifflin-St Jeor'
          }
          tone="cyan"
          last
        />
      </Section>

      <Section title="HYPOTHÈSES">
        {assessment.assumptions.map((assumption, index, all) => (
          <View
            key={assumption}
            style={[
              styles.bulletRow,
              index === all.length - 1 && styles.rowLast,
            ]}
          >
            <Text style={styles.bullet}>›</Text>
            <Text style={styles.bulletText}>{assumption}</Text>
          </View>
        ))}
      </Section>

      <Text style={styles.footnote}>{assessment.disclaimer}</Text>
    </>
  );
}

/* -------------------------------------------------------------------------
 * Briques
 * ---------------------------------------------------------------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  tone = 'default',
  last = false,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'cyan' | 'green';
  last?: boolean;
}): React.ReactElement {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          tone === 'cyan' && styles.rowValueCyan,
          tone === 'green' && styles.rowValueGreen,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/** Le couple minimum / recommandé, qui est la forme native du moteur. */
function RangeRow({
  label,
  minimum,
  recommended,
  unit,
  last = false,
}: {
  label: string;
  minimum: string;
  recommended: string;
  unit: string;
  last?: boolean;
}): React.ReactElement {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rangeValues}>
        <Text style={styles.rangeMin}>{minimum}</Text>
        <Text style={styles.rangeSep}>/</Text>
        <Text style={styles.rangeRec}>{recommended}</Text>
        <Text style={styles.rangeUnit}>{unit}</Text>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------
 * Formatage
 * ---------------------------------------------------------------------- */

/** Décimale française : 76.4 -> « 76,4 ». */
const fr = (value: number): string =>
  (Math.round(value * 10) / 10).toString().replace('.', ',');

/** Milliers séparés par une espace fine : 2633 -> « 2 633 ». */
const fmt = (value: number): string =>
  Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* -------------------------------------------------------------------------
 * Styles
 * ---------------------------------------------------------------------- */

const styles = StyleSheet.create({
  backdrop: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)' },
  backdropTouch: { flex: 1 },

  panel: {
    width: '100%',
    maxWidth: 420,
    flex: 1,
    backgroundColor: c.panel,
    borderLeftWidth: HAIRLINE,
    borderLeftColor: c.border,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: c.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: c.cyanFill,
    borderWidth: HAIRLINE,
    borderColor: c.cyanBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.display, fontSize: size.name, color: c.cyan },
  headerMain: { flex: 1, gap: 2 },
  name: { fontFamily: font.display, fontSize: size.name, color: c.cyan },
  headerMeta: { fontFamily: font.mono, fontSize: size.meta, color: c.label },
  close: { fontSize: 18, color: c.muted, paddingHorizontal: space.xs },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: HAIRLINE,
    borderBottomColor: c.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: c.cyan },
  tabText: {
    fontFamily: font.display,
    fontSize: size.tab,
    letterSpacing: 1,
    color: c.muted,
  },
  tabTextActive: { color: c.cyan },

  scroll: { flex: 1 },
  scrollContent: { padding: space.lg, gap: space.md },

  section: {
    backgroundColor: c.card,
    borderRadius: radius.card,
    borderWidth: HAIRLINE,
    borderColor: c.border,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xs,
  },
  sectionTitle: {
    fontFamily: font.display,
    fontSize: size.sectionTitle,
    letterSpacing: 1,
    color: c.cyan,
    marginBottom: space.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.sm,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: 'rgba(28, 46, 80, 0.5)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: {
    fontFamily: font.mono,
    fontSize: size.label,
    color: c.label,
    flexShrink: 1,
  },
  rowValue: {
    fontFamily: font.body,
    fontSize: size.value,
    color: c.value,
    textAlign: 'right',
    flexShrink: 1,
  },
  rowValueCyan: { color: c.cyan },
  rowValueGreen: { color: c.green },

  rangeValues: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  rangeMin: { fontFamily: font.mono, fontSize: size.value, color: c.label },
  rangeSep: { fontFamily: font.mono, fontSize: size.value, color: c.muted },
  rangeRec: { fontFamily: font.mono, fontSize: size.value, color: c.cyan },
  rangeUnit: { fontFamily: font.mono, fontSize: size.meta, color: c.label },

  bulletRow: {
    flexDirection: 'row',
    gap: space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: HAIRLINE,
    borderBottomColor: 'rgba(28, 46, 80, 0.5)',
  },
  bullet: { fontFamily: font.mono, fontSize: size.label, color: c.cyan },
  bulletText: {
    flex: 1,
    fontFamily: font.bodyRegular,
    fontSize: size.label,
    color: c.label,
    lineHeight: 17,
  },

  footnote: {
    fontFamily: font.mono,
    fontSize: size.meta,
    color: c.label,
    paddingHorizontal: space.xs,
    lineHeight: 15,
  },
});
