'use client';

import { useMemo, useState } from 'react';
import worldData from '@/data/world.json';
import { WorldMap } from '@/components/world-map';

type Institution = { name: string; type: 'university' | 'college'; city: string };
type Province = { name: string; institutions: Institution[] };
type Country = { name: string; provinces: Province[] };
type Continent = { name: string; countries: Country[] };
type FilterType = 'all' | 'university' | 'college';

const continents = worldData.continents as Continent[];

export function AroundTheWorld() {
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const continent = continents.find((c) => c.name === selectedContinent);
  const country = continent?.countries.find((c) => c.name === selectedCountry);
  const province = country?.provinces.find((p) => p.name === selectedProvince);

  const institutions = useMemo(() => {
    if (!province) return [];
    return province.institutions.filter((inst) => {
      if (filter !== 'all' && inst.type !== filter) return false;
      if (search && !inst.name.toLowerCase().includes(search.toLowerCase()) && !inst.city.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [province, filter, search]);

  const counts = useMemo(() => {
    if (!province) return { university: 0, college: 0, total: 0 };
    const uni = province.institutions.filter((i) => i.type === 'university').length;
    const col = province.institutions.filter((i) => i.type === 'college').length;
    return { university: uni, college: col, total: uni + col };
  }, [province]);

  function reset() {
    setSelectedContinent(null);
    setSelectedCountry(null);
    setSelectedProvince(null);
    setFilter('all');
    setSearch('');
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#6e6a61]">
        <button onClick={reset} className="font-bold text-[#b23a2e] hover:underline">World</button>
        {selectedContinent && <>
          <span>›</span>
          <button onClick={() => { setSelectedCountry(null); setSelectedProvince(null); }} className="font-bold text-[#1b1b18] hover:underline">{selectedContinent}</button>
        </>}
        {selectedCountry && <>
          <span>›</span>
          <button onClick={() => setSelectedProvince(null)} className="font-bold text-[#1b1b18] hover:underline">{selectedCountry}</button>
        </>}
        {selectedProvince && <>
          <span>›</span>
          <span className="font-bold text-[#1b1b18]">{selectedProvince}</span>
        </>}
      </div>

      {!selectedContinent && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {continents.map((c) => {
              const countryCount = c.countries.length;
              const instCount = c.countries.reduce((sum, country) => sum + country.provinces.reduce((s, p) => s + p.institutions.length, 0), 0);
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedContinent(c.name)}
                  className="group flex items-center gap-4 border border-[#cfc6b7] bg-[#f9f6ef] p-5 text-left transition hover:border-[#b23a2e] hover:shadow-[5px_5px_0_#e2d9cb]"
                >
                  <div className="flex-1">
                    <div className="eyebrow">Continent</div>
                    <h3 className="serif mt-1 text-xl font-bold group-hover:text-[#b23a2e]">{c.name}</h3>
                    <p className="mt-1 text-sm text-[#6e6a61]">{countryCount} {countryCount === 1 ? 'country' : 'countries'} · {instCount} institutions</p>
                  </div>
                  <span className="text-2xl text-[#cfc6b7] group-hover:text-[#b23a2e]">›</span>
                </button>
              );
            })}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <WorldMap selectedContinent={selectedContinent} onSelect={setSelectedContinent} />
          </div>
        </div>
      )}

      {selectedContinent && !selectedCountry && continent && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {continent.countries.map((c) => {
              const provinceCount = c.provinces.length;
              const instCount = c.provinces.reduce((s, p) => s + p.institutions.length, 0);
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedCountry(c.name)}
                  className="group border border-[#cfc6b7] bg-[#f9f6ef] p-5 text-left transition hover:border-[#b23a2e] hover:shadow-[5px_5px_0_#e2d9cb]"
                >
                  <div className="eyebrow">Country</div>
                  <h3 className="serif mt-1 text-xl font-bold group-hover:text-[#b23a2e]">{c.name}</h3>
                  <p className="mt-1 text-sm text-[#6e6a61]">{provinceCount} {provinceCount === 1 ? 'province' : 'provinces'} · {instCount} institutions</p>
                </button>
              );
            })}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <WorldMap selectedContinent={selectedContinent} onSelect={setSelectedContinent} />
          </div>
        </div>
      )}

      {selectedCountry && !selectedProvince && country && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {country.provinces.map((p) => (
              <button
                key={p.name}
                onClick={() => setSelectedProvince(p.name)}
                className="group border border-[#cfc6b7] bg-[#f9f6ef] p-5 text-left transition hover:border-[#b23a2e] hover:shadow-[5px_5px_0_#e2d9cb]"
              >
                <div className="eyebrow">Province / State</div>
                <h3 className="serif mt-1 text-xl font-bold group-hover:text-[#b23a2e]">{p.name}</h3>
                <p className="mt-1 text-sm text-[#6e6a61]">{p.institutions.length} institutions</p>
              </button>
            ))}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <WorldMap selectedContinent={selectedContinent} onSelect={setSelectedContinent} />
          </div>
        </div>
      )}

      {selectedProvince && province && (
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#cfc6b7] pb-4">
            <div>
              <h3 className="serif text-2xl font-bold">{province.name}</h3>
              <p className="mt-1 text-sm text-[#6e6a61]">{counts.total} institutions · {counts.university} universities · {counts.college} colleges</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 border border-[#cfc6b7] bg-[#f9f6ef] p-1">
                {(['all', 'university', 'college'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-bold capitalize transition ${filter === f ? 'bg-[#b23a2e] text-white' : 'text-[#6e6a61] hover:text-[#1b1b18]'}`}
                  >
                    {f === 'all' ? 'All' : f + 's'}
                  </button>
                ))}
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or city..."
                className="field max-w-48 py-2 text-sm"
              />
            </div>
          </div>

          {institutions.length > 0 ? (
            <div className="grid gap-3">
              {institutions.map((inst) => (
                <div key={inst.name} className="flex items-center justify-between gap-4 border border-[#cfc6b7] bg-[#f9f6ef] p-4 transition hover:border-[#1b1b18]">
                  <div className="flex items-center gap-4">
                    <span className={`stamp ${inst.type === 'college' ? '!text-[#6e6a61] !border-[#6e6a61]' : ''}`}>{inst.type}</span>
                    <div>
                      <div className="serif text-lg font-bold">{inst.name}</div>
                      <div className="text-sm text-[#6e6a61]">{inst.city}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[#cfc6b7] p-8 text-center text-sm text-[#6e6a61]">
              No institutions match your filter. Try a different search or filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
