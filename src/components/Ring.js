import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { num } from '../utils';

const R = 36;
const C = 45;

function arcPath(p) {
  const a = p * 2 * Math.PI;
  const x = C + R * Math.sin(a);
  const y = C - R * Math.cos(a);
  return `M ${C} ${C - R} A ${R} ${R} 0 ${p > 0.5 ? 1 : 0} 1 ${x} ${y}`;
}

export default function Ring({ value, goal, color, label, unit, t }) {
  const p = Math.min(value / (goal || 1), 1);
  return (
    <View accessible accessibilityLabel={`${label}: ${num(value)} of ${num(goal)} ${unit}`}>
      <Svg width={76} height={76} viewBox="0 0 90 90">
        <Circle cx={C} cy={C} r={R} fill="none" stroke={t.line} strokeWidth={9} />
        {p >= 0.999 ? (
          <Circle cx={C} cy={C} r={R} fill="none" stroke={color} strokeWidth={9} />
        ) : p > 0 ? (
          <Path d={arcPath(p)} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" />
        ) : null}
        <SvgText x={C} y={50} textAnchor="middle" fontSize={16} fontWeight="600" fill={t.ink}>
          {Math.round((value / (goal || 1)) * 100)}%
        </SvgText>
      </Svg>
    </View>
  );
}
