import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, AppState, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import Ring from './src/components/Ring';
import NumberField from './src/components/NumberField';
import TrendChart, { chartSummary } from './src/components/TrendChart';
import { DEFAULT_STATE, loadState, normalize, saveState } from './src/storage';
import { METRICS, MOODS, RING_KEYS, useTheme } from './src/theme';
import { fmt, num, parse, shiftDay, streak } from './src/utils';

export default function App() {
  return (
    <SafeAreaProvider>
      <Tracker />
    </SafeAreaProvider>
  );
}

function Tracker() {
  const t = useTheme();
  const s = useMemo(() => makeStyles(t), [t]);

  const [todayKey, setTodayKey] = useState(fmt(new Date()));
  const [cur, setCur] = useState(todayKey);
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [metric, setMetric] = useState('water');
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load once.
  useEffect(() => {
    loadState().then((st) => {
      setState(st);
      setLoaded(true);
    });
  }, []);

  // Save shortly after each change, and immediately when the app goes to the background.
  useEffect(() => {
    if (!loaded) return undefined;
    const id = setTimeout(() => saveState(state), 300);
    return () => clearTimeout(id);
  }, [state, loaded]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        saveState(stateRef.current);
      } else {
        const now = fmt(new Date());
        setTodayKey((prev) => {
          if (prev !== now) setCur(now);
          return now;
        });
      }
    });
    return () => sub.remove();
  }, []);

  const day = state.days[cur] || {};

  const setVal = (k, v) =>
    setState((prev) => {
      const d = { ...(prev.days[cur] || {}) };
      if (v === null || v === undefined || v === '') delete d[k];
      else d[k] = v;
      const days = { ...prev.days };
      if (Object.keys(d).length) days[cur] = d;
      else delete days[cur];
      return { ...prev, days };
    });

  const bump = (k, dir) => {
    const next = Math.max(0, Math.round(((day[k] || 0) + dir * METRICS[k].step) * 100) / 100);
    setVal(k, next);
  };

  const setGoal = (k, v) => {
    if (v && v > 0) setState((prev) => ({ ...prev, goals: { ...prev.goals, [k]: v } }));
  };

  const doExport = async () => {
    try {
      await Share.share({ title: 'Vitals export', message: JSON.stringify(state, null, 2) });
    } catch (e) {
      Alert.alert('Export failed', 'Could not open the share sheet. Try again.');
    }
  };

  const doImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!parsed || typeof parsed.days !== 'object') throw new Error('bad');
      setState(normalize(parsed));
      setImportOpen(false);
      setImportText('');
      Alert.alert('Imported', `Loaded ${Object.keys(parsed.days).length} days.`);
    } catch (e) {
      Alert.alert('Import failed', 'That text is not a Vitals export. Paste the full JSON from Export.');
    }
  };

  const doReset = () =>
    Alert.alert('Delete all data?', 'This removes every entry and resets goals. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setState(normalize(null)) },
    ]);

  const d = parse(cur);
  const n = streak(state.days, todayKey);
  const summary = chartSummary(state.days, cur, metric);
  const unitFor = (k) => (k === 'weight' ? state.unit : METRICS[k].unit);

  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {/* Header */}
        <View style={s.rowBetween}>
          <Text style={s.brand}>Vitals</Text>
          <Text style={s.muted}>{n ? `${n} ${n === 1 ? 'day' : 'days'} logged in a row` : 'No streak yet'}</Text>
        </View>

        <View style={s.dateBar}>
          <IconButton s={s} label="Previous day" onPress={() => setCur(shiftDay(cur, -1))}>‹</IconButton>
          <View style={{ flex: 1 }}>
            <Text style={s.dateTitle}>{d.toLocaleDateString(undefined, { weekday: 'long' })}</Text>
            <Text style={s.muted}>{d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
          </View>
          <IconButton s={s} label="Next day" onPress={() => setCur(shiftDay(cur, 1))}>›</IconButton>
        </View>
        {cur !== todayKey && (
          <Pressable style={s.pill} onPress={() => setCur(todayKey)} accessibilityRole="button">
            <Text style={s.pillText}>Jump to today</Text>
          </Pressable>
        )}

        {/* Progress */}
        <Section s={s} title="Progress toward goals">
          <View style={s.rings}>
            {RING_KEYS.map((k) => (
              <View key={k} style={s.ringCell}>
                <Ring value={day[k] || 0} goal={state.goals[k]} color={t[k]} label={METRICS[k].label} unit={METRICS[k].unit} t={t} />
                <Text style={s.ringLabel}>{METRICS[k].label}</Text>
                <Text style={s.mutedSmall}>{num(day[k] || 0)} / {num(state.goals[k])}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Log */}
        <Section s={s} title="Log this day">
          {RING_KEYS.map((k) => (
            <View key={k} style={s.logRow}>
              <View style={{ flex: 1 }}>
                <View style={s.nameRow}>
                  <View style={[s.dot, { backgroundColor: t[k] }]} />
                  <Text style={s.name}>{METRICS[k].label}</Text>
                </View>
                <Text style={s.mutedSmall}>{METRICS[k].hint} ({METRICS[k].unit})</Text>
              </View>
              <View style={s.stepper}>
                <SquareButton s={s} label={`Decrease ${METRICS[k].label}`} onPress={() => bump(k, -1)}>−</SquareButton>
                <NumberField t={t} value={day[k]} onCommit={(v) => setVal(k, v)} placeholder="0"
                  label={`${METRICS[k].label} in ${METRICS[k].unit}`} style={s.field} />
                <SquareButton s={s} label={`Increase ${METRICS[k].label}`} onPress={() => bump(k, 1)}>+</SquareButton>
              </View>
            </View>
          ))}

          <View style={s.logRow}>
            <View style={{ flex: 1 }}>
              <View style={s.nameRow}>
                <View style={[s.dot, { backgroundColor: t.weight }]} />
                <Text style={s.name}>Weight</Text>
              </View>
              <Text style={s.mutedSmall}>Optional</Text>
            </View>
            <View style={s.stepper}>
              <NumberField t={t} value={day.weight} onCommit={(v) => setVal('weight', v)} placeholder="–"
                label={`Weight in ${state.unit}`} style={s.field} />
              <Text style={[s.muted, { width: 26 }]}>{state.unit}</Text>
            </View>
          </View>

          <View style={{ paddingVertical: 12 }}>
            <View style={s.nameRow}>
              <View style={[s.dot, { backgroundColor: t.mood }]} />
              <Text style={s.name}>Mood</Text>
            </View>
            <View style={s.moods}>
              {MOODS.map((label, i) => {
                const on = day.mood === i + 1;
                return (
                  <Pressable key={label} onPress={() => setVal('mood', on ? null : i + 1)}
                    accessibilityRole="button" accessibilityState={{ selected: on }}
                    style={[s.moodBtn, on && { backgroundColor: t.ink, borderColor: t.ink }]}>
                    <Text style={[s.moodText, on && { color: t.bg }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <TextInput
            value={day.note || ''}
            onChangeText={(v) => setVal('note', v.trim() ? v : null)}
            placeholder="Note for this day (optional)"
            placeholderTextColor={t.muted}
            multiline
            accessibilityLabel="Note for this day"
            style={[s.field, s.note]}
          />
        </Section>

        {/* Trends */}
        <Section s={s} title="Last 14 days">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 12 }}>
            {Object.keys(METRICS).map((k) => (
              <Pressable key={k} onPress={() => setMetric(k)} accessibilityRole="button"
                accessibilityState={{ selected: metric === k }}
                style={[s.pill, metric === k && { backgroundColor: t.ink, borderColor: t.ink }]}>
                <Text style={[s.pillText, metric === k && { color: t.bg }]}>{METRICS[k].label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <TrendChart days={state.days} cur={cur} metric={metric} goals={state.goals} color={t[metric] || t.ink} t={t} />
          <Text style={[s.muted, { marginTop: 8 }]}>
            {summary
              ? `Average ${num(summary.avg)} ${unitFor(metric)} across ${summary.count} logged ${summary.count === 1 ? 'day' : 'days'}. The axis ends on the selected day.`
              : `No ${METRICS[metric].label.toLowerCase()} logged in this window yet. Add an entry above and it will appear here.`}
          </Text>
        </Section>

        {/* Settings */}
        <Section s={s} title="Goals and data">
          <View style={s.goalGrid}>
            {RING_KEYS.map((k) => (
              <View key={k} style={s.goalCell}>
                <Text style={s.mutedSmall}>{METRICS[k].label} goal ({METRICS[k].unit})</Text>
                <NumberField t={t} allowEmpty={false} value={state.goals[k]} onCommit={(v) => setGoal(k, v)}
                  label={`${METRICS[k].label} goal`} style={[s.field, { width: '100%', textAlign: 'left', paddingHorizontal: 10 }]} />
              </View>
            ))}
          </View>

          <Text style={[s.mutedSmall, { marginTop: 16, marginBottom: 6 }]}>Weight unit</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {['kg', 'lb'].map((u) => (
              <Pressable key={u} onPress={() => setState((p) => ({ ...p, unit: u }))} accessibilityRole="button"
                accessibilityState={{ selected: state.unit === u }}
                style={[s.pill, state.unit === u && { backgroundColor: t.ink, borderColor: t.ink }]}>
                <Text style={[s.pillText, state.unit === u && { color: t.bg }]}>{u}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.actions}>
            <Pressable style={s.btn} onPress={doExport} accessibilityRole="button"><Text style={s.btnText}>Export JSON</Text></Pressable>
            <Pressable style={s.btn} onPress={() => setImportOpen(true)} accessibilityRole="button"><Text style={s.btnText}>Import JSON</Text></Pressable>
            <Pressable style={s.btn} onPress={doReset} accessibilityRole="button"><Text style={[s.btnText, { color: t.danger }]}>Delete all data</Text></Pressable>
          </View>
          <Text style={[s.mutedSmall, { marginTop: 12 }]}>Your entries are stored only on this device.</Text>
        </Section>
      </ScrollView>

      <Modal visible={importOpen} animationType="slide" onRequestClose={() => setImportOpen(false)}>
        <SafeAreaView style={s.screen}>
          <View style={s.content}>
            <Text style={s.h2}>Import data</Text>
            <Text style={[s.muted, { marginVertical: 8 }]}>Paste the JSON you copied from Export. This replaces your current data.</Text>
            <TextInput value={importText} onChangeText={setImportText} multiline autoCapitalize="none" autoCorrect={false}
              placeholder='{"goals": {...}, "days": {...}}' placeholderTextColor={t.muted}
              style={[s.field, { height: 260, textAlignVertical: 'top', paddingTop: 10, width: '100%', textAlign: 'left' }]} />
            <View style={s.actions}>
              <Pressable style={s.btn} onPress={doImport} accessibilityRole="button"><Text style={s.btnText}>Import</Text></Pressable>
              <Pressable style={s.btn} onPress={() => setImportOpen(false)} accessibilityRole="button"><Text style={s.btnText}>Cancel</Text></Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Section({ s, title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.h2} accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}

function IconButton({ s, label, onPress, children }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={s.icon}>
      <Text style={s.iconText}>{children}</Text>
    </Pressable>
  );
}

function SquareButton({ s, label, onPress, children }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={s.square}>
      <Text style={s.squareText}>{children}</Text>
    </Pressable>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { padding: 18, paddingBottom: 48 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    brand: { fontSize: 17, fontWeight: '700', color: t.ink },
    muted: { color: t.muted, fontSize: 14 },
    mutedSmall: { color: t.muted, fontSize: 12.5, marginTop: 2 },
    dateBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 10 },
    dateTitle: { fontSize: 32, fontWeight: '700', color: t.ink, letterSpacing: -0.5 },
    icon: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' },
    iconText: { fontSize: 22, color: t.ink, marginTop: -2 },
    pill: { alignSelf: 'flex-start', borderWidth: 1, borderColor: t.line, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    pillText: { color: t.ink, fontWeight: '500', fontSize: 14 },
    section: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line, paddingVertical: 22, marginTop: 14 },
    h2: { fontSize: 18, fontWeight: '700', color: t.ink, marginBottom: 14 },
    rings: { flexDirection: 'row', justifyContent: 'space-between' },
    ringCell: { flex: 1, alignItems: 'center' },
    ringLabel: { color: t.ink, fontWeight: '600', fontSize: 13, marginTop: 2 },
    logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.line, gap: 8 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    name: { color: t.ink, fontWeight: '600', fontSize: 16 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    square: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' },
    squareText: { fontSize: 22, color: t.ink, marginTop: -2 },
    field: { width: 76, height: 42, borderWidth: 1, borderColor: t.line, borderRadius: 10, backgroundColor: t.surface, color: t.ink, textAlign: 'center', fontSize: 16, paddingHorizontal: 6 },
    note: { width: '100%', height: undefined, minHeight: 80, textAlign: 'left', textAlignVertical: 'top', padding: 10, marginTop: 8 },
    moods: { flexDirection: 'row', gap: 6, marginTop: 10 },
    moodBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: t.line, borderRadius: 10, backgroundColor: t.surface },
    moodText: { color: t.ink, fontSize: 13 },
    goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    goalCell: { width: '47%' },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
    btn: { borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
    btnText: { color: t.ink, fontWeight: '500' },
  });
