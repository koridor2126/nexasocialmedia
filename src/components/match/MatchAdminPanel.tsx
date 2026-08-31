import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Users, Heart, CheckCircle2, 
  XCircle, Filter, Search, Eye, Sparkles, RefreshCw, X, Ban, ShieldAlert 
} from 'lucide-react';
import { MatchAdminDashboard, MatchProfile, MatchReport, MatchProfileStatus } from '../../types.js';
import { matchApi } from '../../services/api.js';
import { useApp } from '../../context/AppContext.js';

interface MatchAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MatchAdminPanel: React.FC<MatchAdminPanelProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'verifications' | 'reports' | 'profiles'>('overview');
  const [dashboard, setDashboard] = useState<MatchAdminDashboard | null>(null);
  const [profiles, setProfiles] = useState<MatchProfile[]>([]);
  const [reports, setReports] = useState<MatchReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected for inspection
  const [selectedProfile, setSelectedProfile] = useState<MatchProfile | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, repRes, profRes] = await Promise.all([
        matchApi.getAdminOverview(),
        matchApi.adminGetReports(),
        matchApi.adminGetProfiles(statusFilter || undefined, searchQuery || undefined)
      ]);
      setDashboard(dashRes);
      setReports(repRes.reports || []);
      setProfiles(profRes.profiles || []);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data admin match.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, statusFilter]);

  if (!isOpen) return null;

  const handleReviewVerification = async (profileId: string, status: 'verified' | 'rejected') => {
    try {
      const res = await matchApi.adminReviewVerification(profileId, status);
      showToast(res.message, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal meninjau verifikasi.', 'error');
    }
  };

  const handleReviewReport = async (reportId: string, status: 'resolved' | 'dismissed', action: 'suspend' | 'warn' | 'none') => {
    try {
      const res = await matchApi.adminReviewReport(reportId, status, action);
      showToast(res.message, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses laporan.', 'error');
    }
  };

  const handleUpdateProfileStatus = async (profileId: string, status: MatchProfileStatus) => {
    try {
      const res = await matchApi.adminUpdateProfileStatus(profileId, status);
      showToast(res.message, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui status profil.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-4xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base flex items-center gap-2">
                Moderasi & Manajemen NEXA Match
              </h3>
              <p className="text-xs text-zinc-500">Panel pengawasan keamanan kencan 18+, verifikasi foto, dan laporan pengguna</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-4 bg-zinc-50/50 dark:bg-zinc-850 text-xs font-semibold overflow-x-auto">
          {[
            { key: 'overview', label: 'Ringkasan & Metrik' },
            { 
              key: 'verifications', 
              label: `Verifikasi Foto ${dashboard?.pending_verifications_count ? `(${dashboard.pending_verifications_count})` : ''}` 
            },
            { 
              key: 'reports', 
              label: `Laporan Pelanggaran ${dashboard?.pending_reports_count ? `(${dashboard.pending_reports_count})` : ''}` 
            },
            { key: 'profiles', label: 'Daftar Profil Match' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-4 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1 text-xs space-y-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                  <div className="text-zinc-500 text-[11px] font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" /> Total Profil
                  </div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
                    {dashboard?.total_profiles || 0}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">
                    {dashboard?.active_profiles || 0} Aktif
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                  <div className="text-zinc-500 text-[11px] font-medium flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" /> Pasangan Cocok
                  </div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
                    {dashboard?.total_matches || 0}
                  </div>
                  <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">
                    Mutual Matches
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                  <div className="text-zinc-500 text-[11px] font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Antrean Verifikasi
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {dashboard?.pending_verifications_count || 0}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    Menunggu Review
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80">
                  <div className="text-zinc-500 text-[11px] font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Laporan Aktif
                  </div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    {dashboard?.pending_reports_count || 0}
                  </div>
                  <span className="text-[10px] text-rose-500 font-medium mt-0.5 block">
                    Perlu Ditindak
                  </span>
                </div>
              </div>

              {/* Safety Rules & Directives */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 space-y-2">
                <div className="font-bold text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Kebijakan Moderasi NEXA Match:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <li><strong>Proteksi 18+:</strong> Akun di bawah 18 tahun harus segera di-suspend secara permanen dari matchmaking.</li>
                  <li><strong>Zero Tolerance Penipuan Finansial:</strong> Permintaan transfer uang, rekening, atau penipuan investasi langsung disuspend.</li>
                  <li><strong>Kerahasiaan Dompet NEXA:</strong> Tidak ada data finansial yang tertaut secara publik dengan profil pencarian jodoh.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFICATIONS */}
          {activeTab === 'verifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Antrean Verifikasi Foto</h4>
                <span className="text-zinc-500">{dashboard?.pending_verifications?.length || 0} permohonan</span>
              </div>

              {(!dashboard?.pending_verifications || dashboard.pending_verifications.length === 0) ? (
                <div className="text-center py-12 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">Semua permohonan verifikasi telah ditinjau!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboard.pending_verifications.map(item => (
                    <div key={item.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            {item.display_name}, {item.age}
                          </div>
                          <div className="text-[11px] text-zinc-500">{item.city} • @{item.user?.username}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                          Pending
                        </span>
                      </div>

                      {/* Photo Comparison */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-400 font-medium">Foto Profil:</span>
                          <div className="aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                            <img src={item.profile_photos[0]} alt="Profile" className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-blue-500 font-medium">Selfie Verifikasi:</span>
                          <div className="aspect-square rounded-xl overflow-hidden border-2 border-blue-500 shadow-sm">
                            <img src={item.verification_photo_url || item.profile_photos[0]} alt="Verification" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleReviewVerification(item.id, 'rejected')}
                          className="flex-1 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleReviewVerification(item.id, 'verified')}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Setujui Centang Biru
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Laporan Pelanggaran Pengguna</h4>
                <span className="text-zinc-500">{reports.length} total laporan</span>
              </div>

              {reports.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">Tidak ada laporan pelanggaran yang belum diproses!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map(rep => (
                    <div key={rep.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 shadow-sm space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-200 dark:border-rose-900/40">
                              {rep.category.toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rep.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-600'
                            }`}>
                              {rep.status}
                            </span>
                          </div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-1.5">
                            Target: {rep.target_user?.full_name} (@{rep.target_user?.username})
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            Pelapor: {rep.reporter_user?.full_name} • {new Date(rep.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800">
                        <strong className="text-zinc-900 dark:text-zinc-100">Alasan Pelapor:</strong> {rep.reason}
                      </div>

                      {rep.status === 'pending' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleReviewReport(rep.id, 'dismissed', 'none')}
                            className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs transition"
                          >
                            Abaikan (Dismiss)
                          </button>
                          <button
                            onClick={() => handleReviewReport(rep.id, 'resolved', 'warn')}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition"
                          >
                            Beri Peringatan
                          </button>
                          <button
                            onClick={() => handleReviewReport(rep.id, 'resolved', 'suspend')}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5" /> Suspend Akun Target
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ALL PROFILES */}
          {activeTab === 'profiles' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[200px] relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, kota, pekerjaan..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="paused">Dijeda</option>
                  <option value="suspended">Disuspend</option>
                </select>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-xl text-xs hover:opacity-90 transition"
                >
                  Cari
                </button>
              </div>

              {/* Profiles Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-700">
                      <tr>
                        <th className="p-3">Pengguna</th>
                        <th className="p-3">Usia / Kota</th>
                        <th className="p-3">Tujuan</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {profiles.map(p => (
                        <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={p.profile_photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                alt={p.display_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                                  {p.display_name}
                                  {p.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 inline" />}
                                </div>
                                <div className="text-[10px] text-zinc-400">@{p.user?.username || 'user'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-zinc-600 dark:text-zinc-300">
                            {p.age} th • {p.city}
                          </td>
                          <td className="p-3 text-zinc-600 dark:text-zinc-300">
                            {p.relationship_goal}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                : p.status === 'paused' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.status !== 'suspended' ? (
                                <button
                                  onClick={() => handleUpdateProfileStatus(p.id, 'suspended')}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                                  title="Suspend Profil"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateProfileStatus(p.id, 'active')}
                                  className="px-2 py-1 text-emerald-600 hover:bg-emerald-50 text-[10px] font-bold rounded-lg transition"
                                >
                                  Pulihkan
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
