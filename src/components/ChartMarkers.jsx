import React from 'react';

// Custom Star for Retirement Point
export const StarMarker = ({ cx, cy }) => (cx !== undefined && cy !== undefined) ? (
  <path d={`M ${cx} ${cy - 10} L ${cx + 3} ${cy - 4} L ${cx + 10} ${cy - 3} L ${cx + 5} ${cy + 2} L ${cx + 6} ${cy + 9} L ${cx} ${cy + 6} L ${cx - 6} ${cy + 9} L ${cx - 5} ${cy + 2} L ${cx - 10} ${cy - 3} L ${cx - 3} ${cy - 4} Z`} fill="#fbbf24" stroke="#fff" strokeWidth="1.5" />
) : null;

// Custom SSI Square Marker
export const SsiMarker = ({ cx, cy, fill }) => (cx !== undefined && cy !== undefined) ? (
  <g transform={`translate(${cx - 8}, ${cy - 8})`}>
    <rect width="16" height="16" rx="4" fill={fill} stroke="#fff" strokeWidth="2" />
    <text x="8" y="12" fontSize="9" fill="#fff" textAnchor="middle" fontWeight="bold">S</text>
  </g>
) : null;

// Display Decade Year below Age dynamically
export const CustomizedAxisTick = ({ x, y, payload, baseYear, currentAge }) => {
  if (!payload || payload.value === undefined) return null;
  const ageVal = payload.value;
  const exactYear = baseYear + (ageVal - currentAge);
  const isDecade = Math.abs(exactYear % 10) < 1; // Tolerance for Recharts auto-ticks
  const displayYear = Math.round(exactYear);

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight="bold">{ageVal}</text>
      {isDecade && <text x={0} y={0} dy={32} textAnchor="middle" fill="#64748b" fontSize={9} fontWeight="900">{displayYear}</text>}
    </g>
  );
};