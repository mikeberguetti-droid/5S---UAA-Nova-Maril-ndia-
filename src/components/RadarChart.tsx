import React from 'react';
import { SensoType } from '../types';
import { SENSOS_CONFIG } from '../data/initialData';

interface RadarChartProps {
  scores: Record<SensoType, number>; // 0 to 100 for each senso
  benchmarkScores?: Record<SensoType, number>; // e.g. Factory average or meta
  benchmarkLabel?: string;
  size?: number;
  showLabels?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  scores,
  benchmarkScores,
  benchmarkLabel = 'Meta (90%)',
  size = 320,
  showLabels = true
}) => {
  const sensos: SensoType[] = ['seiri', 'seiton', 'seiso', 'seiketsu', 'shitsuke'];
  const total = sensos.length;
  const radius = size * 0.38;
  const center = size / 2;

  // Convert angle and value (0-100) to SVG coordinates (x, y)
  const getCoordinates = (index: number, value: number, maxRadius: number) => {
    // Angle in radians; start from top (-PI / 2)
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (Math.min(100, Math.max(0, value)) / 100) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Build polygon points string
  const getPolygonPoints = (data: Record<SensoType, number>, maxRadius: number) => {
    return sensos
      .map((senso, i) => {
        const val = data[senso] ?? 0;
        const pt = getCoordinates(i, val, maxRadius);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');
  };

  const gridLevels = [20, 40, 60, 80, 100];
  const currentPoints = getPolygonPoints(scores, radius);
  const benchmarkPoints = benchmarkScores ? getPolygonPoints(benchmarkScores, radius) : null;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible transition-all duration-300"
      >
        <defs>
          <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.25" />
          </linearGradient>
          <filter id="radarShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Concentric Grid Polygons */}
        {gridLevels.map((level) => {
          const levelPoints = sensos
            .map((_, i) => {
              const pt = getCoordinates(i, level, radius);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <g key={`grid-${level}`}>
              <polygon
                points={levelPoints}
                fill={level === 100 ? '#f8fafc' : 'none'}
                stroke="#cbd5e1"
                strokeWidth={level === 100 ? 1.5 : 0.8}
                strokeDasharray={level === 100 ? undefined : '3 3'}
              />
              {/* Level percentage label at the vertical axis */}
              <text
                x={center}
                y={center - (level / 100) * radius - 2}
                fontSize="9"
                fill="#94a3b8"
                textAnchor="middle"
                className="font-mono font-medium"
              >
                {level}%
              </text>
            </g>
          );
        })}

        {/* Radial Axis Lines */}
        {sensos.map((_, i) => {
          const outerPt = getCoordinates(i, 100, radius);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={outerPt.x}
              y2={outerPt.y}
              stroke="#e2e8f0"
              strokeWidth="1.2"
            />
          );
        })}

        {/* Optional Benchmark / Meta Polygon */}
        {benchmarkPoints && (
          <polygon
            points={benchmarkPoints}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.8"
          />
        )}

        {/* Current Score Polygon */}
        <polygon
          points={currentPoints}
          fill="url(#radarFillGrad)"
          stroke="#059669"
          strokeWidth="2.5"
          filter="url(#radarShadow)"
          className="transition-all duration-500 ease-out"
        />

        {/* Dots on Current Score Vertices */}
        {sensos.map((senso, i) => {
          const val = scores[senso] ?? 0;
          const pt = getCoordinates(i, val, radius);
          const cfg = SENSOS_CONFIG[senso];

          return (
            <g key={`point-${senso}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                fill={cfg ? cfg.corPrimaria : '#059669'}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-500"
              />
              {/* Score label badge next to dot */}
              <text
                x={pt.x}
                y={pt.y - 8}
                fontSize="10"
                fontWeight="700"
                fill="#0f172a"
                textAnchor="middle"
                className="font-mono"
              >
                {Math.round(val)}%
              </text>
            </g>
          );
        })}

        {/* Outer Axis Labels */}
        {showLabels &&
          sensos.map((senso, i) => {
            const labelDist = radius + 26;
            const pt = getCoordinates(i, 100, labelDist);
            const cfg = SENSOS_CONFIG[senso];

            return (
              <g key={`label-${senso}`}>
                <text
                  x={pt.x}
                  y={pt.y - 2}
                  fontSize="11"
                  fontWeight="700"
                  fill="#1e293b"
                  textAnchor="middle"
                  className="tracking-tight"
                >
                  {cfg.nomeJapones}
                </text>
                <text
                  x={pt.x}
                  y={pt.y + 11}
                  fontSize="9.5"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {cfg.nomePortugues.split(' ')[0]}
                </text>
              </g>
            );
          })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shadow-sm"></span>
          <span>Desempenho Atual</span>
        </div>
        {benchmarkScores && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
            <span>{benchmarkLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};
