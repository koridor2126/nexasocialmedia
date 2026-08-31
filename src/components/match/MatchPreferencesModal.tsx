import React, { useState } from 'react';
import { SlidersHorizontal, X, Check, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { MatchSearchPreferences, RelationshipGoal, MATCH_CONFIG } from '../../types.js';

interface MatchPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: MatchSearchPreferences;
  onSave: (preferences: MatchSearchPreferences) => void;
}

export const MatchPreferencesModal: React.FC<MatchPreferencesModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onSave
}) => {
  const [minAge, setMinAge] = useState<number>(currentPreferences.min_age || 18);
  const [maxAge, setMaxAge] = useState<number>(currentPreferences.max_age || 40);
  const [genderPref, setGenderPref] = useState<'male' | 'female' | 'all'>(
    (currentPreferences.gender_preference && currentPreferences.gender_preference[0]) || 'all'
  );
  const [cityPref, setCityPref] = useState<string>(currentPreferences.city_preference || '');
  const [selectedGoals, setSelectedGoals] = useState<RelationshipGoal[]>(
    currentPreferences.relationship_goals || ['serious', 'dating', 'marriage', 'friendship']
  );
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(currentPreferences.verified_only || false);

  if (!isOpen) return null;

  const toggleGoal = (goal: RelationshipGoal) => {
    if (selectedGoals.includes(goal)) {
      if (selectedGoals.length > 1) {
        setSelectedGoals(selectedGoals.filter(g => g !== goal));
      }
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      min_age: Math.max(18, minAge),
      max_age: Math.max(minAge, maxAge),
      gender_preference: [genderPref],
      city_preference: cityPref.trim(),
      relationship_goals: selectedGoals,
      verified_only: verifiedOnly
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Filter Preferensi Jodoh</h3>
              <p className="text-xs text-zinc-500">Sesuaikan kriteria pasangan yang Anda cari</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Gender Preference */}
          <div>
            <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              SAYA TERTARIK PADA:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'female', label: 'Wanita' },
                { id: 'male', label: 'Pria' },
                { id: 'all', label: 'Semua' }
              ].map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setGenderPref(item.id as any)}
                  className={`py-2.5 px-3 rounded-xl font-medium border text-center transition ${
                    genderPref === item.id
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age Range Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-zinc-800 dark:text-zinc-200">
                RENTANG USIA:
              </label>
              <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-lg">
                {minAge} - {maxAge} Tahun
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-zinc-400">Usia Minimum (Min 18):</span>
                <input
                  type="range"
                  min={18}
                  max={55}
                  value={minAge}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinAge(val);
                    if (val > maxAge) setMaxAge(val);
                  }}
                  className="w-full accent-rose-600 mt-1 cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[11px] text-zinc-400">Usia Maksimum:</span>
                <input
                  type="range"
                  min={18}
                  max={60}
                  value={maxAge}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxAge(val);
                    if (val < minAge) setMinAge(val);
                  }}
                  className="w-full accent-rose-600 mt-1 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* City / Location */}
          <div>
            <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">
              KOTA / LOKASI:
            </label>
            <div className="relative">
              <input
                type="text"
                value={cityPref}
                onChange={(e) => setCityPref(e.target.value)}
                placeholder="Semua Kota (misal: Jakarta, Bandung, Surabaya...)"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Semua', 'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Bali', 'Medan'].map(city => (
                <button
                  type="button"
                  key={city}
                  onClick={() => setCityPref(city === 'Semua' ? '' : city)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] transition ${
                    (city === 'Semua' && !cityPref) || cityPref.toLowerCase() === city.toLowerCase()
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Relationship Goals */}
          <div>
            <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              TUJUAN HUBUNGAN:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MATCH_CONFIG.RELATIONSHIP_GOALS) as RelationshipGoal[]).map(key => {
                const isSelected = selectedGoals.includes(key);
                const label = MATCH_CONFIG.RELATIONSHIP_GOALS[key];
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => toggleGoal(key)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="font-medium text-xs">{label}</span>
                    {isSelected && <Check className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verified Only Toggle */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">Hanya Profil Terverifikasi</div>
                <div className="text-[11px] text-zinc-500">Tampilkan hanya akun yang memiliki centang biru resmi</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-sm"
            >
              Terapkan Filter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
