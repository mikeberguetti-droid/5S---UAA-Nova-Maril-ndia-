import React, { useState } from 'react';
import { HistoryPoint, Sector } from '../types';

interface EvolutionChartProps {
  data: HistoryPoint[];
  sectors: Sector[];
  selectedSectorId?: string;
  onSelectSector?: (sectorId: string) => void;
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({
  data,
  sectors,
  selectedSectorId = 'all',
  onSelectSector
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const width = 580;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const minY = 65;
  const maxY = 100;

  const getYCoord = (val: number) => {
    const clamped = Math.min(maxY, Math.max(minY, val));
    const ratio = (clamped - minY) / (maxY - minY);
    return paddingTop + chartHeight * (1 - ratio);
  };

  const getXCoord = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  // Get values for line
  const activeSector = sectors.find(s => s.id === selectedSectorId);
  const getPointValue = (pt: HistoryPoint): number => {
    if (selectedSectorId === 'all' || !activeSector) {
      return pt.media_geral;
    }
    return pt.setores_pontos[selectedSectorId] ?? pt.media_geral;
  };

  const points = data.map((pt, idx) => ({
    x: getXCoord(idx),
    y: getYCoord(getPointValue(pt)),
    val: getPointValue(pt),
    label: pt.mes
  }));

  const pathPoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ');
  const pathD = points.length > 0 ? `M ${pathPoints}` : '';

  // Area under curve
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${paddingTop + chartHeight} L ${points[0].x},${paddingTop + chartHeight} Z`
    : '';

  // Factory average line for comparison when a sector is picked
  const avgPoints = selectedSectorId !== 'all'
    ? data.map((pt, idx) => ({
        x: getXCoord(idx),
        y: getYCoord(pt.media_geral),
        val: pt.media_geral
      }))
    : null;

  const avgPathD = avgPoints ? `M ${avgPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` : '';

  return (
    <div className="w-full">
      {/* Selector bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtrar Setor:</span>
          <select
            value={selectedSectorId}
            onChange={(e) => onSelectSector && onSelectSector(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Média Geral da Fábrica (Todos)</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.area})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shadow-sm"></span>
            <span>{selectedSectorId === 'all' ? 'Média Geral' : activeSector?.nome}</span>
          </div>
          {selectedSectorId !== 'all' && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block"></span>
              <span>Média da Unidade</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-slate-500">
            <span className="w-3 h-0.5 bg-rose-400 inline-block"></span>
            <span>Meta (90%)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-64 font-sans select-none"
        >
          <defs>
            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y labels */}
          {[70, 80, 90, 100].map((level) => {
            const y = getYCoord(level);
            return (
              <g key={`y-${level}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={level === 90 ? '#f43f5e' : '#e2e8f0'}
                  strokeWidth={level === 90 ? 1.2 : 0.8}
                  strokeDasharray={level === 90 ? '4 3' : '2 2'}
                  opacity={level === 90 ? 0.85 : 0.8}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  fontSize="9.5"
                  fill={level === 90 ? '#e11d48' : '#94a3b8'}
                  fontWeight={level === 90 ? '700' : '500'}
                  textAnchor="end"
                  className="font-mono"
                >
                  {level}%
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          {areaD && (
            <path
              d={areaD}
              fill="url(#chartAreaGrad)"
              className="transition-all duration-300"
            />
          )}

          {/* Factory average dashed line when single sector is active */}
          {avgPathD && (
            <path
              d={avgPathD}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          )}

          {/* Main line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#059669"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300 drop-shadow-sm"
            />
          )}

          {/* Data points */}
          {points.map((p, idx) => (
            <g
              key={`dot-${idx}`}
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-pointer"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={hoverIndex === idx ? 7 : 5}
                fill={p.val >= 90 ? '#059669' : p.val >= 80 ? '#0284c7' : '#d97706'}
                stroke="#ffffff"
                strokeWidth={hoverIndex === idx ? 3 : 2}
                className="transition-all duration-200"
              />
              {/* Value tag above dot */}
              <text
                x={p.x}
                y={p.y - 10}
                fontSize="10"
                fontWeight="700"
                fill="#0f172a"
                textAnchor="middle"
                className="font-mono pointer-events-none"
              >
                {p.val.toFixed(1)}%
              </text>
              {/* X label */}
              <text
                x={p.x}
                y={height - paddingBottom + 20}
                fontSize="10"
                fontWeight="600"
                fill="#64748b"
                textAnchor="middle"
                className="pointer-events-none"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Meta footnote */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1 border-t border-slate-100">
        <span>* Meta Corporativa UAA: Mínimo 90.0% para Certificação Ouro</span>
        <span>Evolução contínua últimos 5 ciclos</span>
      </div>
    </div>
  );
};
