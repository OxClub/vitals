import React from 'react';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { METRICS } from '../theme';
import { parse, shiftDay } from '../utils';

const W = 640, H = 190, PL = 6, PR = 6, PT = 14, PB = 26;

export function chartSummary(days, cur, metric) {
  const vals = windowKeys(cur).map((k) => (days[k] || {})[metric]).filter((v) => v !== undefined);
  if (!vals.length) return null;
  return { avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length };
}

function windowKeys(cur) {
  const keys = [];
  for (let i = 13; i >= 0; i--) keys.push(shiftDay(cur, -i));
  return keys;
}

export default function TrendChart({ days, cur, metric, goals, color, t }) {
  const keys = windowKeys(cur);
  const vals = keys.map((k) => {
    const v = (days[k] || {})[metric];
    return v === undefined ? null : v;
  });
  const logged = vals.filter((v) => v !== null);
  const iw = W - PL - PR, ih = H - PT - PB, bw = iw / 14;

  let lo = 0, hi;
  if (metric === 'weight') {
    if (logged.length) {
      lo = Math.min(...logged);
      hi = Math.max(...logged);
      const pad = Math.max((hi - lo) * 0.25, 1);
      lo -= pad;
      hi += pad;
    } else hi = 1;
  } else if (metric === 'mood') hi = 5;
  else hi = Math.max(goals[metric] * 1.15, 1, ...logged);

  const y = (v) => PT + ih - ((v - lo) / (hi - lo)) * ih;
  const hasGoal = metric !== 'weight' && metric !== 'mood';
  const pts = [];
  vals.forEach((v, i) => { if (v !== null) pts.push([PL + i * bw + bw / 2, y(v)]); });

  return (
    <Svg width="100%" height={190} viewBox={`0 0 ${W} ${H}`} accessibilityLabel={`${METRICS[metric].label} over the last 14 days`}>
      <Line x1={PL} x2={W - PR} y1={PT + ih} y2={PT + ih} stroke={t.line} strokeWidth={1} />
      {hasGoal && (
        <>
          <Line x1={PL} x2={W - PR} y1={y(goals[metric])} y2={y(goals[metric])} stroke={t.muted} strokeWidth={1} strokeDasharray="4 4" />
          <SvgText x={W - PR} y={y(goals[metric]) - 5} textAnchor="end" fontSize={12} fill={t.muted}>
            {`goal ${goals[metric]}`}
          </SvgText>
        </>
      )}
      {metric === 'weight' ? (
        <>
          {pts.length > 1 && <Polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />}
          {pts.map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={4} fill={color} />)}
        </>
      ) : (
        vals.map((v, i) =>
          v !== null && v > 0 ? (
            <Rect key={i} x={PL + i * bw + bw * 0.2} y={y(v)} width={bw * 0.6} height={PT + ih - y(v)} rx={3} fill={color} />
          ) : null
        )
      )}
      {keys.map((k, i) => (
        <SvgText key={k} x={PL + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize={12}
          fontWeight={i === 13 ? '700' : '400'} fill={i === 13 ? t.ink : t.muted}>
          {parse(k).getDate()}
        </SvgText>
      ))}
    </Svg>
  );
}
