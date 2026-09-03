'use client';

import { useState } from 'react';

type MapContinent = {
  name: string;
  path: string;
  labelX: number;
  labelY: number;
};

const CONTINENTS: MapContinent[] = [
  {
    name: 'North America',
    path: 'M 80 70 Q 70 60 75 50 L 90 45 Q 110 40 130 42 L 165 48 Q 185 52 195 65 L 200 85 Q 195 100 180 108 L 155 112 Q 130 110 110 105 L 90 95 Q 78 85 80 70 Z M 120 115 L 140 118 Q 150 125 145 135 L 130 138 Q 115 132 120 115 Z',
    labelX: 135,
    labelY: 80,
  },
  {
    name: 'South America',
    path: 'M 165 145 Q 175 140 185 148 L 195 165 Q 190 185 178 200 L 168 215 Q 158 210 155 195 L 160 170 Q 162 155 165 145 Z',
    labelX: 175,
    labelY: 180,
  },
  {
    name: 'Europe',
    path: 'M 280 55 Q 290 48 305 52 L 325 58 Q 335 65 330 75 L 315 80 Q 295 78 282 72 L 275 62 Q 278 58 280 55 Z',
    labelX: 302,
    labelY: 68,
  },
  {
    name: 'Africa',
    path: 'M 295 95 Q 310 88 325 95 L 340 110 Q 345 130 335 155 L 320 175 Q 305 178 295 165 L 288 145 Q 285 120 290 105 L 295 95 Z',
    labelX: 315,
    labelY: 135,
  },
  {
    name: 'Asia',
    path: 'M 340 50 Q 360 42 390 48 L 430 55 Q 460 60 480 75 L 485 95 Q 475 115 450 120 L 410 118 Q 370 112 345 100 L 335 80 Q 332 60 340 50 Z',
    labelX: 410,
    labelY: 85,
  },
  {
    name: 'Oceania',
    path: 'M 440 155 Q 455 148 475 155 L 485 168 Q 480 180 465 185 L 445 182 Q 435 172 440 155 Z',
    labelX: 462,
    labelY: 170,
  },
  {
    name: 'Antarctica',
    path: 'M 100 225 Q 200 220 300 225 L 400 228 Q 450 232 470 240 L 460 248 Q 300 252 150 248 L 80 245 Q 85 230 100 225 Z',
    labelX: 280,
    labelY: 240,
  },
];

type WorldMapProps = {
  selectedContinent: string | null;
  onSelect: (continent: string) => void;
};

export function WorldMap({ selectedContinent, onSelect }: WorldMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="border border-[#cfc6b7] bg-[#f9f6ef] p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="eyebrow">World Atlas</div>
        <div className="text-xs text-[#6e6a61]">
          {selectedContinent ? (
            <>Viewing: <span className="font-bold text-[#b23a2e]">{selectedContinent}</span></>
          ) : (
            'Click a continent to explore'
          )}
        </div>
      </div>
      <svg
        viewBox="0 0 540 270"
        className="w-full"
        style={{ background: '#eee7da', borderRadius: 4 }}
      >
        <defs>
          <pattern id="oceanGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(27,27,24,0.06)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="540" height="270" fill="url(#oceanGrid)" />

        {CONTINENTS.map((continent) => {
          const isSelected = selectedContinent === continent.name;
          const isHovered = hovered === continent.name;
          const isDimmed = selectedContinent !== null && !isSelected;

          return (
            <g
              key={continent.name}
              onClick={() => onSelect(continent.name)}
              onMouseEnter={() => setHovered(continent.name)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <path
                d={continent.path}
                fill={isSelected ? '#b23a2e' : isHovered ? '#d4a8a2' : isDimmed ? '#e8e0d2' : '#cfc6b7'}
                stroke={isSelected ? '#8f2d24' : '#1b1b18'}
                strokeWidth={isSelected ? 1.5 : 0.8}
                style={{ transition: 'fill 0.2s, stroke 0.2s' }}
              />
              <text
                x={continent.labelX}
                y={continent.labelY}
                textAnchor="middle"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fill: isSelected ? '#fffaf3' : isDimmed ? '#a8a092' : '#1b1b18',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {continent.name.length > 12 ? continent.name.slice(0, 6) + '…' : continent.name}
              </text>
            </g>
          );
        })}

        <g style={{ pointerEvents: 'none' }}>
          <line x1="0" y1="135" x2="540" y2="135" stroke="rgba(178,58,46,0.15)" strokeWidth="0.8" strokeDasharray="4 4" />
          <text x="530" y="132" textAnchor="end" style={{ fontSize: 7, fill: 'rgba(178,58,46,0.4)', fontWeight: 700 }}>EQUATOR</text>
        </g>
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 border-t border-[#cfc6b7] pt-3 text-xs text-[#6e6a61]">
        {CONTINENTS.map((c) => (
          <button
            key={c.name}
            onClick={() => onSelect(c.name)}
            className={`font-bold transition hover:text-[#b23a2e] ${selectedContinent === c.name ? 'text-[#b23a2e] underline' : ''}`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
