import React, { useState } from 'react';
import { 
  Heart, ShieldAlert, Sparkles, Check, 
  MapPin, Camera, Plus, Trash2, SlidersHorizontal, ArrowLeft, ArrowRight,
  CheckCircle, Lock
} from 'lucide-react';
import { MatchProfile, Gender, RelationshipGoal, MATCH_CONFIG } from '../../types.js';
import { matchApi } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';

interface MatchOnboardingWizardProps {
  existingProfile: MatchProfile | null;
  onSaved: (profile: MatchProfile) => void;
  onCancel?: () => void;
}

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600'
];

export const MatchOnboardingWizard: React.FC<MatchOnboardingWizardProps> = ({
  existingProfile,
  onSaved,
  onCancel
}) => {
  const { showToast } = useApp();
  const { user } = useAuth();

  // Form State
  const [displayName, setDisplayName] = useState(existingProfile?.display_name || user?.full_name || '');
  const [dob, setDob] = useState(existingProfile?.date_of_birth || '2000-01-01');
  const [gender, setGender] = useState<Gender>(existingProfile?.gender || 'female');
  const [city, setCity] = useState(existingProfile?.city || 'Jakarta');
  const [bio, setBio] = useState(existingProfile?.bio || '');
  const [photos, setPhotos] = useState<string[]>(
    existingProfile?.profile_photos && existingProfile.profile_photos.length > 0
      ? existingProfile.profile_photos
      : [user?.avatar_url || SAMPLE_AVATARS[0]]
  );
  const [photoInput, setPhotoInput] = useState('');
  const [occupation, setOccupation] = useState(existingProfile?.occupation || '');
  const [education, setEducation] = useState(existingProfile?.education || '');
  const [interests, setInterests] = useState<string[]>(existingProfile?.interests || ['Musik', 'Travel', 'Kopi']);
  const [relationshipGoal, setRelationshipGoal] = useState<RelationshipGoal>(existingProfile?.relationship_goal || 'serious');
  const [religion, setReligion] = useState(existingProfile?.religion_preference_optional || '');
  const [height, setHeight] = useState<string>(existingProfile?.height_optional ? String(existingProfile.height_optional) : '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Age calculation helper
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = calculateAge(dob);
  const isAgeValid = calculatedAge >= 18;

  const toggleInterest = (item: string) => {
    if (interests.includes(item)) {
      setInterests(interests.filter(i => i !== item));
    } else {
      if (interests.length >= 8) {
        showToast('Maksimal 8 minat & hobi.', 'info');
        return;
      }
      setInterests([...interests, item]);
    }
  };

  const addPhoto = (url: string) => {
    if (!url) return;
    if (photos.length >= 6) {
      showToast('Maksimal 6 foto profil.', 'info');
      return;
    }
    setPhotos([...photos, url]);
    setPhotoInput('');
  };

  const removePhoto = (index: number) => {
    if (photos.length <= 1) {
      showToast('Minimal harus ada 1 foto profil.', 'error');
      return;
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      showToast('Nama tampilan wajib diisi.', 'error');
      return;
    }

    if (!dob) {
      showToast('Tanggal lahir wajib diisi.', 'error');
      return;
    }

    if (!isAgeValid) {
      showToast('Maaf, Anda harus berusia minimal 18 tahun untuk menggunakan NEXA Match.', 'error');
      return;
    }

    if (!city.trim()) {
      showToast('Kota domisili wajib diisi.', 'error');
      return;
    }

    if (photos.length === 0) {
      showToast('Wajib mengunggah minimal 1 foto profil.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await matchApi.saveProfile({
        display_name: displayName.trim(),
        date_of_birth: dob,
        gender,
        city: city.trim(),
        bio: bio.trim(),
        profile_photos: photos,
        occupation: occupation.trim(),
        education: education.trim(),
        interests,
        relationship_goal: relationshipGoal,
        religion_preference_optional: religion.trim(),
        height_optional: height ? Number(height) : undefined
      });

      showToast(res.message || 'Profil NEXA Match berhasil disimpan!', 'success');
      onSaved(res.profile);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan profil.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-7 animate-fade-in">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {existingProfile ? 'Edit Profil NEXA Match' : 'Buat Profil NEXA Match'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800/40">
                18+
              </span>
            </div>
            <p className="text-xs text-zinc-500">Temukan seseorang yang cocok dengan Anda secara aman & nyaman</p>
          </div>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Batal
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* 18+ Age Gate Verification Block */}
        <div className={`p-4 rounded-2xl border transition ${
          isAgeValid
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-start gap-3">
            <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${isAgeValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider">Verifikasi Usia Dewasa (18+)</span>
                <span className={`font-bold px-2 py-0.5 rounded-md text-xs ${
                  isAgeValid ? 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200' : 'bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                }`}>
                  {calculatedAge} Tahun
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Layanan NEXA Match strictly diperuntukkan bagi pengguna berusia 18 tahun ke atas.
              </p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tanggal Lahir:
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Gender Anda:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`py-2 px-3 rounded-xl font-medium border text-center transition ${
                        gender === 'female'
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Wanita
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`py-2 px-3 rounded-xl font-medium border text-center transition ${
                        gender === 'male'
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold'
                          : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Pria
                    </button>
                  </div>
                </div>
              </div>

              {!isAgeValid && (
                <div className="mt-2 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1">
                  ⚠️ Anda belum memenuhi syarat usia 18+. Anda tidak dapat mendaftar fitur ini.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Nama Tampilan (Panggilan):
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Contoh: Rina, Andi..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Kota / Domisili:
            </label>
            <div className="relative">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Jakarta Selatan, Surabaya..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                required
              />
              <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>

        {/* Photo Manager */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold text-zinc-800 dark:text-zinc-200">
              FOTO PROFIL MATCH ({photos.length}/6):
            </label>
            <span className="text-[11px] text-zinc-400">Minimal 1 foto, maksimal 6</span>
          </div>

          {/* Current Photos Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
            {photos.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 group shadow-sm">
                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                    Utama
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition hover:scale-110"
                  title="Hapus Foto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Sample or Custom URL */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="Tambahkan URL foto (https://...)"
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addPhoto(photoInput.trim())}
                disabled={!photoInput.trim() || photos.length >= 6}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-xl text-xs hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>

            {/* Quick Sample Selector */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-[11px] text-zinc-400 shrink-0">Contoh Foto:</span>
              {SAMPLE_AVATARS.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => addPhoto(sample)}
                  disabled={photos.includes(sample) || photos.length >= 6}
                  className="w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 hover:scale-105 transition disabled:opacity-30"
                >
                  <img src={sample} alt="Sample" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Relationship Goal */}
        <div>
          <label className="block font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
            TUJUAN HUBUNGAN SAYA:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(MATCH_CONFIG.RELATIONSHIP_GOALS) as RelationshipGoal[]).map(key => {
              const label = MATCH_CONFIG.RELATIONSHIP_GOALS[key];
              const isSelected = relationshipGoal === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setRelationshipGoal(key)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <span>{label}</span>
                  {isSelected && <Check className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              BIO & TENTANG SAYA:
            </label>
            <span className="text-[11px] text-zinc-400">{bio.length}/300</span>
          </div>
          <textarea
            rows={3}
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ceritakan sedikit tentang dirimu, apa yang kamu sukai saat akhir pekan, atau hal menarik lainnya..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
          />
        </div>

        {/* Interests Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold text-zinc-800 dark:text-zinc-200">
              MINAT & HOBI ({interests.length}/8):
            </label>
            <span className="text-[11px] text-zinc-400">Pilih 3-8 minat</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            {MATCH_CONFIG.INTERESTS_LIST.map((item) => {
              const isSelected = interests.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleInterest(item)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium transition ${
                    isSelected
                      ? 'border-rose-500 bg-rose-500 text-white font-semibold shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional Optional Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Pekerjaan / Profesi (Opsional):
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Contoh: Desainer Grafis, Barista, Dokter..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Pendidikan Terakhir (Opsional):
            </label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Contoh: S1 Desain, SMA, Magister..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Tinggi Badan (cm, Opsional):
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Contoh: 168"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Agama / Kepercayaan (Opsional):
            </label>
            <input
              type="text"
              value={religion}
              onChange={(e) => setReligion(e.target.value)}
              placeholder="Opsional"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-[11px] text-zinc-500 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
          <span>
            Data finansial, saldo Dompet NEXA, dan alamat email Anda <strong>TIDAK AKAN PERNAH</strong> ditampilkan pada profil publik NEXA Match.
          </span>
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !isAgeValid}
            className="px-7 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-rose-500/25 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Menyimpan Profil...' : (
              <>
                <Heart className="w-4 h-4 fill-current" /> Simpan & Mulai Match
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
