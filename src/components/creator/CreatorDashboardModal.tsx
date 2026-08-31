import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Award, DollarSign, TrendingUp, Sparkles, CheckCircle2, 
  Clock, Users, Eye, AlertCircle, Send, Briefcase, Plus,
  ChevronRight, ArrowUpRight, ShieldCheck, FileText, Check, 
  ExternalLink, BarChart3, HelpCircle, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { useAuth } from '../../context/AuthContext.js';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';
import { 
  CreatorStats, EndorsementCampaign, EndorsementOffer, 
  EndorsementSubmission, MonetizationApplication, MONETIZATION_REQUIREMENTS, MonetizationStatus 
} from '../../types.js';

type ActiveViewTab = 'monetization' | 'endorsements' | 'earnings' | 'analytics' | 'achievements' | 'admin_review';
type EndorsementSubTab = 'offers' | 'explore' | 'submissions';

export const CreatorDashboardModal: React.FC = () => {
  const { user } = useAuth();
  const { isCreatorDashboardOpen, closeCreatorDashboard, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveViewTab>('monetization');
  const [endorsementTab, setEndorsementTab] = useState<EndorsementSubTab>('offers');
  
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [campaigns, setCampaigns] = useState<EndorsementCampaign[]>([]);
  const [offers, setOffers] = useState<EndorsementOffer[]>([]);
  const [submissions, setSubmissions] = useState<EndorsementSubmission[]>([]);
  const [pendingApplications, setPendingApplications] = useState<MonetizationApplication[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [isSubmittingContent, setIsSubmittingContent] = useState<boolean>(false);
  const [chartMetric, setChartMetric] = useState<'views' | 'watch_hours' | 'followers' | 'likes'>('views');

  // Admin Review Modal state
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  // Submit Content Form Modal State
  const [selectedOfferToSubmit, setSelectedOfferToSubmit] = useState<EndorsementOffer | null>(null);
  const [contentUrlInput, setContentUrlInput] = useState<string>('');
  const [contentNotesInput, setContentNotesInput] = useState<string>('');

  // Create Campaign Modal State (For Brand / Admin)
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState<boolean>(false);
  const [newCampaignTitle, setNewCampaignTitle] = useState<string>('');
  const [newCampaignDesc, setNewCampaignDesc] = useState<string>('');
  const [newCampaignBrief, setNewCampaignBrief] = useState<string>('');
  const [newCampaignBudget, setNewCampaignBudget] = useState<number>(3000000);
  const [newCampaignContentType, setNewCampaignContentType] = useState<'video' | 'photo' | 'carousel'>('video');
  const [newCampaignRequirements, setNewCampaignRequirements] = useState<string>('Minimal 1.000 follower, konten orisinal');

  const loadAllData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const promises: Promise<any>[] = [
        api.getCreatorStats().catch(() => null),
        api.getEndorsementCampaigns().catch(() => ({ campaigns: [] })),
        api.getEndorsementOffers().catch(() => ({ offers: [] })),
        api.getEndorsementSubmissions().catch(() => ({ submissions: [] }))
      ];

      if (user.role === 'admin') {
        promises.push(api.getMonetizationApplications().catch(() => ({ applications: [] })));
      }

      const results = await Promise.all(promises);
      const statsRes = results[0];
      const campaignsRes = results[1];
      const offersRes = results[2];
      const subsRes = results[3];
      const adminAppsRes = results[4];

      if (statsRes?.stats) setStats(statsRes.stats);
      if (campaignsRes?.campaigns) setCampaigns(campaignsRes.campaigns);
      if (offersRes?.offers) setOffers(offersRes.offers);
      if (subsRes?.submissions) setSubmissions(subsRes.submissions);
      if (adminAppsRes?.applications) setPendingApplications(adminAppsRes.applications);
    } catch (err) {
      console.error('Failed to load creator dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isCreatorDashboardOpen && user) {
      loadAllData();
    }
  }, [isCreatorDashboardOpen, user, loadAllData]);

  if (!isCreatorDashboardOpen) return null;

  const handleReviewApplication = async (applicationId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    try {
      const res = await api.reviewMonetizationApplication(applicationId, {
        status,
        reason: rejectionReason
      });
      showToast(res.message || `Pengajuan monetisasi berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`, 'success');
      setRejectingAppId(null);
      setRejectionReasonInput('');
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses peninjauan aplikasi.', 'error');
    }
  };

  const handleApplyMonetization = async () => {
    setIsApplying(true);
    try {
      const res = await api.applyForMonetization();
      showToast(res.message || 'Pengajuan monetisasi berhasil dikirim!', 'success');
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengajukan monetisasi.', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  const handleOfferResponse = async (offerId: string, response: 'accepted' | 'rejected') => {
    try {
      const res = await api.respondEndorsementOffer(offerId, response);
      showToast(res.message, response === 'accepted' ? 'success' : 'info');
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses respon tawaran.', 'error');
    }
  };

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferToSubmit) return;
    if (!contentUrlInput.trim()) {
      showToast('Harap cantumkan URL atau link konten yang diunggah.', 'error');
      return;
    }

    setIsSubmittingContent(true);
    try {
      const res = await api.submitEndorsementContent(selectedOfferToSubmit.id, {
        submitted_content_url: contentUrlInput.trim(),
        submission_notes: contentNotesInput.trim()
      });
      showToast(res.message || 'Konten endorsement berhasil dikirim!', 'success');
      setSelectedOfferToSubmit(null);
      setContentUrlInput('');
      setContentNotesInput('');
      setEndorsementTab('submissions');
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim konten.', 'error');
    } finally {
      setIsSubmittingContent(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignTitle.trim() || !newCampaignBrief.trim()) {
      showToast('Harap lengkapi judul dan brief kampanye.', 'error');
      return;
    }

    try {
      const res = await api.createEndorsementCampaign({
        title: newCampaignTitle.trim(),
        description: newCampaignDesc.trim(),
        brief: newCampaignBrief.trim(),
        budget: Number(newCampaignBudget) || 1000000,
        content_type: newCampaignContentType,
        requirements: newCampaignRequirements.trim()
      });
      showToast(res.message || 'Kampanye endorsement berhasil dibuat!', 'success');
      setIsCreateCampaignOpen(false);
      setNewCampaignTitle('');
      setNewCampaignDesc('');
      setNewCampaignBrief('');
      await loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat kampanye.', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num || 0);
  };

  // Circular progress calculations
  const totalFollowers = stats?.total_followers || user?.followers_count || 0;
  const totalWatchHours = stats?.total_watch_hours || user?.watch_hours || 0;
  const followerProgress = Math.min(totalFollowers / MONETIZATION_REQUIREMENTS.followers, 1);
  const watchHoursProgress = Math.min(totalWatchHours / MONETIZATION_REQUIREMENTS.watchHours, 1);
  const overallScore = Math.round(((followerProgress + watchHoursProgress) / 2) * 100);
  const isEligible = totalFollowers >= MONETIZATION_REQUIREMENTS.followers && totalWatchHours >= MONETIZATION_REQUIREMENTS.watchHours;
  const currentStatus: MonetizationStatus = stats?.monetization_status || user?.monetization_status || 'none';

  // SVG Circular Meter params
  const circleRadius = 54;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">NEXA Creator Center</h2>
                {currentStatus === 'active' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Monetisasi Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Pusat Monetisasi, Endorsement Brand & Analitik Performa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              title="Perbarui Data"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="creator-modal-close-btn"
              onClick={closeCreatorDashboard}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-100 overflow-x-auto no-scrollbar bg-white">
          <button
            id="tab-monetization-btn"
            onClick={() => setActiveTab('monetization')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'monetization'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Monetisasi</span>
            {currentStatus === 'active' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ) : isEligible ? (
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            ) : null}
          </button>

          <button
            id="tab-endorsements-btn"
            onClick={() => setActiveTab('endorsements')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'endorsements'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Endorsement</span>
            {offers.filter(o => o.status === 'offered').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {offers.filter(o => o.status === 'offered').length}
              </span>
            )}
          </button>

          <button
            id="tab-earnings-btn"
            onClick={() => setActiveTab('earnings')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'earnings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Penghasilan</span>
          </button>

          <button
            id="tab-analytics-btn"
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analitik</span>
          </button>

          <button
            id="tab-achievements-btn"
            onClick={() => setActiveTab('achievements')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'achievements'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Pencapaian</span>
          </button>

          {/* Admin Verification Tab (For Admin Only) */}
          {user?.role === 'admin' && (
            <button
              id="tab-admin-review-btn"
              onClick={() => setActiveTab('admin_review')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'admin_review'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <span>Admin Peninjauan</span>
              {pendingApplications.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {pendingApplications.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/40">
          
          {/* TAB 1: MONETIZATION ELIGIBILITY & PROGRESS */}
          {activeTab === 'monetization' && (
            <div className="space-y-6">
              {/* Top Hero Card: Circular Score & Status */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row items-center gap-6 justify-between">
                
                {/* Score Circular Ring */}
                <div className="flex items-center gap-5">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r={circleRadius}
                        stroke="#F1F5F9"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r={circleRadius}
                        stroke={currentStatus === 'active' ? '#10B981' : '#4F46E5'}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                        {currentStatus === 'active' ? '100%' : `${overallScore}%`}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Kelayakan
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-900">Program Kreator Resmi NEXA</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mb-3">
                      Dapatkan akses ke fitur monetisasi konten, kampanye sponsor brand eksklusif, dan lencana verifikasi kreator.
                    </p>

                    {/* Status Badge */}
                    {currentStatus === 'active' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Akun Telah Dimonetisasi
                      </div>
                    )}
                    {currentStatus === 'pending' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                        Pengajuan Sedang Ditinjau Tim Verifikasi
                      </div>
                    )}
                    {currentStatus === 'rejected' && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Pengajuan Sebelumnya Ditolak
                      </div>
                    )}
                    {currentStatus === 'none' && (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isEligible ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isEligible ? '✨ Syarat Terpenuhi! Siap Diajukan' : 'Belum Memenuhi Kriteria'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-2">
                  {currentStatus === 'active' ? (
                    <button
                      onClick={() => setActiveTab('endorsements')}
                      className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>Buka Hub Endorsement</span>
                    </button>
                  ) : currentStatus === 'pending' ? (
                    <div className="text-center md:text-right">
                      <p className="text-xs font-medium text-slate-500">Estimasi verifikasi: 1-2 hari kerja</p>
                      <span className="text-[11px] text-slate-400">Notifikasi akan dikirimkan otomatis</span>
                    </div>
                  ) : (
                    <button
                      id="apply-monetization-btn"
                      disabled={!isEligible || isApplying}
                      onClick={handleApplyMonetization}
                      className={`w-full md:w-auto px-6 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all ${
                        isEligible
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isApplying ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Mengirim Pengajuan...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Ajukan Monetisasi NEXA</span>
                        </>
                      )}
                    </button>
                  )}
                  {currentStatus === 'rejected' && stats?.rejection_reason && (
                    <p className="text-[11px] text-rose-500 max-w-xs text-center md:text-right">
                      Catatan: {stats.rejection_reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Requirement Meters (Dual Track) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Metric 1: Followers */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Total Pengikut (Followers)</h4>
                        <p className="text-[11px] text-slate-400">Minimal 1.000 pengikut aktif</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      totalFollowers >= MONETIZATION_REQUIREMENTS.followers 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {formatNumber(totalFollowers)} / {formatNumber(MONETIZATION_REQUIREMENTS.followers)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        totalFollowers >= MONETIZATION_REQUIREMENTS.followers ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(followerProgress * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>{Math.round(followerProgress * 100)}% tercapai</span>
                    {totalFollowers >= MONETIZATION_REQUIREMENTS.followers ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Memenuhi Syarat
                      </span>
                    ) : (
                      <span>Kurang {formatNumber(Math.max(0, MONETIZATION_REQUIREMENTS.followers - totalFollowers))} follower</span>
                    )}
                  </div>
                </div>

                {/* Metric 2: Watch Hours */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Jam Waktu Tonton Video</h4>
                        <p className="text-[11px] text-slate-400">Minimal 4.000 jam tayang publik</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                      totalWatchHours >= MONETIZATION_REQUIREMENTS.watchHours 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {formatNumber(totalWatchHours)} / {formatNumber(MONETIZATION_REQUIREMENTS.watchHours)} Jam
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        totalWatchHours >= MONETIZATION_REQUIREMENTS.watchHours ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(watchHoursProgress * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>{Math.round(watchHoursProgress * 100)}% tercapai</span>
                    {totalWatchHours >= MONETIZATION_REQUIREMENTS.watchHours ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Memenuhi Syarat
                      </span>
                    ) : (
                      <span>Kurang {formatNumber(Math.max(0, MONETIZATION_REQUIREMENTS.watchHours - totalWatchHours))} jam</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Policy & Community Guidelines Checklist */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Standar Kelayakan & Kebijakan Kreator NEXA
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Konten Orisinal</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Bebas dari plagiarisme dan re-upload tanpa izin hak cipta.</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Pedoman Komunitas</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Akun bersih dari peringatan moderasi atau pelanggaran keamanan.</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Aktivitas Konsisten</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Memiliki minimal 3 konten aktif yang diunggah dalam 30 hari terakhir.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENDORSEMENT & SPONSORSHIP HUB */}
          {activeTab === 'endorsements' && (
            <div className="space-y-5">
              {/* Sub navigation for endorsement */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
                  <button
                    onClick={() => setEndorsementTab('offers')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      endorsementTab === 'offers'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Tawaran Masuk ({offers.length})
                  </button>
                  <button
                    onClick={() => setEndorsementTab('explore')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      endorsementTab === 'explore'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Jelajahi Kampanye ({campaigns.length})
                  </button>
                  <button
                    onClick={() => setEndorsementTab('submissions')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      endorsementTab === 'submissions'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Proyek Aktif ({submissions.length + offers.filter(o => o.status === 'accepted').length})
                  </button>
                </div>

                {/* If user is brand or admin, show create campaign button */}
                {(user?.role === 'brand' || user?.role === 'admin') && (
                  <button
                    onClick={() => setIsCreateCampaignOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Kampanye</span>
                  </button>
                )}
              </div>

              {/* Sub-tab 1: OFFERS */}
              {endorsementTab === 'offers' && (
                <div className="space-y-3">
                  {offers.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 text-slate-500 space-y-2">
                      <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700">Belum Ada Tawaran Endorsement Baru</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Ketika brand mengirimkan undangan sponsorship langsung ke profil Anda, tawaran akan tampil di sini.
                      </p>
                    </div>
                  ) : (
                    offers.map(offer => (
                      <div 
                        key={offer.id}
                        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <img
                              src={offer.campaign?.brand_logo || 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80'}
                              alt={offer.campaign?.brand_name || 'Brand'}
                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{offer.campaign?.title || 'Endorsement Project'}</h4>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                  {offer.campaign?.content_type === 'video' ? '🎬 Video Reel' : '📸 Foto Post'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">Oleh {offer.campaign?.brand_name || 'Brand Partner'}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-slate-900 font-mono">
                              {formatCurrency(offer.offered_amount)}
                            </span>
                            <p className="text-[10px] text-slate-400">Budget Penawaran</p>
                          </div>
                        </div>

                        {/* Brief Snippet */}
                        {offer.campaign?.brief && (
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                            <p className="font-semibold text-slate-800 mb-1">Brief Konten:</p>
                            {offer.campaign.brief}
                          </div>
                        )}

                        {/* Status & Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <div className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Batas Waktu: {new Date(offer.campaign?.deadline || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {offer.status === 'offered' ? (
                              <>
                                <button
                                  onClick={() => handleOfferResponse(offer.id, 'rejected')}
                                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-colors"
                                >
                                  Tolak
                                </button>
                                <button
                                  onClick={() => handleOfferResponse(offer.id, 'accepted')}
                                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
                                >
                                  Terima Tawaran
                                </button>
                              </>
                            ) : offer.status === 'accepted' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Tawaran Diterima
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedOfferToSubmit(offer);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Kirim Konten</span>
                                </button>
                              </div>
                            ) : offer.status === 'submitted' ? (
                              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Materi Sedang Ditinjau Brand
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Tawaran Ditolak</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Sub-tab 2: EXPLORE CAMPAIGNS */}
              {endorsementTab === 'explore' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campaigns.map(camp => (
                    <div 
                      key={camp.id}
                      className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <img
                            src={camp.brand_logo || 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80'}
                            alt={camp.brand_name}
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-100"
                          />
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {formatCurrency(camp.budget)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1">{camp.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{camp.description || camp.brief}</p>
                        
                        <div className="p-2.5 rounded-2xl bg-slate-50 text-[11px] text-slate-600 space-y-1">
                          <p><span className="font-semibold text-slate-800">Syarat:</span> {camp.requirements || 'Kreator NEXA'}</p>
                          <p><span className="font-semibold text-slate-800">Batas:</span> {new Date(camp.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">Oleh {camp.brand_name}</span>
                        <button
                          onClick={() => {
                            showToast(`Hubungi @${camp.brand_name} melalui chat untuk berpartisipasi pada kampanye ini.`, 'info');
                          }}
                          className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-tab 3: ACTIVE & SUBMISSIONS */}
              {endorsementTab === 'submissions' && (
                <div className="space-y-3">
                  {submissions.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 text-slate-500 space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700">Belum Ada Pengiriman Konten</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Setelah Anda menerima tawaran endorsement dan mengirimkan tautan materi konten, status review brand akan muncul di sini.
                      </p>
                    </div>
                  ) : (
                    submissions.map(sub => (
                      <div 
                        key={sub.id}
                        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{sub.campaign?.title || 'Endorsement Submission'}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Dikirim pada {new Date(sub.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</p>
                          </div>

                          <div>
                            {sub.status === 'submitted' && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 animate-spin text-amber-600" />
                                Menunggu Review Brand
                              </span>
                            )}
                            {sub.status === 'approved' && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Disetujui & Saldo Masuk
                              </span>
                            )}
                            {sub.status === 'revision_requested' && (
                              <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                Perlu Revisi
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Submission Link & Notes */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                          {sub.submitted_content_url && (
                            <div className="flex items-center gap-1.5 text-indigo-600 font-medium truncate">
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              <a href={sub.submitted_content_url} target="_blank" rel="noreferrer" className="hover:underline truncate">
                                {sub.submitted_content_url}
                              </a>
                            </div>
                          )}
                          {sub.submission_notes && (
                            <p className="text-slate-600"><span className="font-semibold text-slate-800">Catatan Kreator:</span> {sub.submission_notes}</p>
                          )}
                          {sub.review_note && (
                            <p className="text-rose-600 font-medium pt-1 border-t border-slate-200"><span className="font-bold">Catatan Brand:</span> {sub.review_note}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EARNINGS & TRANSACTIONS */}
          {activeTab === 'earnings' && (
            <div className="space-y-6">
              {/* Balance Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Available Balance */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">Saldo Tersedia</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrency(stats?.earnings?.available || user?.available_balance || 0)}
                  </span>
                  <p className="text-[11px] text-emerald-600 mt-1">✓ Siap ditransfer ke rekening</p>
                </div>

                {/* Pending Balance */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">Saldo Tertunda (Escrow)</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrency(stats?.earnings?.pending || user?.pending_balance || 0)}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">Dalam proses pengerjaan konten</p>
                </div>

                {/* Total Accumulated */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">Total Akumulasi</span>
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {formatCurrency(stats?.earnings?.total || 0)}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">Total pendapatan sponsorship</p>
                </div>

              </div>

              {/* Transaction / Earning History */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-600" />
                  Riwayat Transaksi Endorsement
                </h4>

                {(!stats?.earnings?.history || stats.earnings.history.length === 0) ? (
                  <p className="text-xs text-slate-400 text-center py-6">Belum ada riwayat transaksi.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {stats.earnings.history.map(earn => (
                      <div key={earn.id} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{earn.campaign_title || 'Proyek Sponsor'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(earn.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            +{formatCurrency(earn.amount)}
                          </span>
                          <div>
                            {earn.status === 'available' && (
                              <span className="text-[10px] text-emerald-600 font-semibold">Tersedia</span>
                            )}
                            {earn.status === 'pending' && (
                              <span className="text-[10px] text-amber-600 font-semibold">Tertunda</span>
                            )}
                            {earn.status === 'paid' && (
                              <span className="text-[10px] text-indigo-600 font-semibold">Telah Ditransfer</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ANALYTICS & GROWTH */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Total Penayangan</span>
                  <p className="text-lg font-black text-slate-900 font-mono mt-1">
                    {formatNumber(stats?.total_views || 0)}
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Jam Tayang</span>
                  <p className="text-lg font-black text-slate-900 font-mono mt-1">
                    {formatNumber(stats?.total_watch_hours || 0)} Jam
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Total Interaksi</span>
                  <p className="text-lg font-black text-slate-900 font-mono mt-1">
                    {formatNumber((stats?.total_likes || 0) + (stats?.total_comments || 0))}
                  </p>
                </div>
                <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Total Pengikut</span>
                  <p className="text-lg font-black text-slate-900 font-mono mt-1">
                    {formatNumber(stats?.total_followers || 0)}
                  </p>
                </div>
              </div>

              {/* 30-Day Growth Chart with Metric Switcher */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Pertumbuhan Performa (30 Hari Terakhir)</h4>
                    <p className="text-[11px] text-slate-400">Metrik aktual interaksi dan penonton saluran Anda</p>
                  </div>

                  {/* Switcher Buttons */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                    <button
                      onClick={() => setChartMetric('views')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        chartMetric === 'views' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Views
                    </button>
                    <button
                      onClick={() => setChartMetric('watch_hours')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        chartMetric === 'watch_hours' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Jam Tayang
                    </button>
                    <button
                      onClick={() => setChartMetric('followers')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        chartMetric === 'followers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Followers
                    </button>
                  </div>
                </div>

                {/* Recharts Area Container */}
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats?.growth_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey={chartMetric}
                        stroke="#4F46E5"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorMetric)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MILESTONES & ACHIEVEMENTS */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs mb-3">
                <h4 className="text-xs font-bold text-slate-900">Sistem Pencapaian Kreator NEXA</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Capai milestone follower, jam tayang, dan penayangan untuk membuka keuntungan eksklusif dan lencana profil. Notifikasi sistem akan dikirimkan otomatis saat Anda mencapai target.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {(stats?.achievements || []).map((ach, idx) => (
                  <div
                    key={idx}
                    className={`rounded-3xl p-4 border transition-all flex flex-col justify-between ${
                      ach.is_achieved 
                        ? 'bg-white border-emerald-100 shadow-xs' 
                        : 'bg-slate-50/70 border-slate-100 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          ach.is_achieved ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'
                        }`}>
                          <Award className="w-4 h-4" />
                        </div>
                        {ach.is_achieved ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            Tercapai
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold">
                            Terkunci
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-bold text-slate-900">{ach.title}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">{ach.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 mt-3 text-[11px]">
                      {ach.is_achieved ? (
                        <span className="text-emerald-600 font-medium">
                          {ach.achieved_at ? `Tercapai ${new Date(ach.achieved_at).toLocaleDateString('id-ID')}` : 'Selesai'}
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-400">
                            <span>Progress</span>
                            <span>{formatNumber(ach.current_value)} / {formatNumber(ach.target_value)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.min((ach.current_value / ach.target_value) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ADMIN PENINJAUAN MONETISASI (For Admin Role) */}
          {activeTab === 'admin_review' && user?.role === 'admin' && (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    Peninjauan Permohonan Monetisasi Pengguna
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verifikasi kelayakan kreator dan berikan persetujuan untuk mengaktifkan status monetisasi resmi NEXA.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold font-mono">
                  {pendingApplications.length} Menunggu
                </span>
              </div>

              {pendingApplications.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-semibold text-slate-700">Semua Pengajuan Telah Ditinjau</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Tidak ada pengajuan monetisasi baru yang tertunda di antrean saat ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApplications.map(app => (
                    <div key={app.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={app.user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                            alt={app.user?.username || 'User'}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{app.user?.full_name}</h4>
                            <p className="text-xs text-slate-500">@{app.user?.username}</p>
                          </div>
                        </div>

                        <div className="text-right text-xs text-slate-400">
                          <span>Diajukan: {new Date(app.applied_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>

                      {/* Criteria verified badges */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Pengikut:</span>
                          <span className="font-bold text-slate-900 font-mono">
                            {formatNumber(app.current_followers)} / {formatNumber(MONETIZATION_REQUIREMENTS.followers)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Jam Tayang:</span>
                          <span className="font-bold text-slate-900 font-mono">
                            {formatNumber(app.current_watch_hours)} / {formatNumber(MONETIZATION_REQUIREMENTS.watchHours)} Jam
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        {rejectingAppId === app.id ? (
                          <div className="w-full space-y-2">
                            <input
                              type="text"
                              placeholder="Alasan penolakan (misal: perlu tingkatkan konten orisinal)..."
                              value={rejectionReasonInput}
                              onChange={e => setRejectionReasonInput(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setRejectingAppId(null)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => handleReviewApplication(app.id, 'rejected', rejectionReasonInput)}
                                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                              >
                                Konfirmasi Tolak
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setRejectingAppId(app.id);
                                setRejectionReasonInput('Belum memenuhi kriteria orisinalitas atau konsistensi.');
                              }}
                              className="px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() => handleReviewApplication(app.id, 'approved')}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Setujui Monetisasi</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* MODAL: SUBMIT CONTENT FOR ENDORSEMENT */}
      {selectedOfferToSubmit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Kirim Materi Konten Endorsement</h3>
              <button onClick={() => setSelectedOfferToSubmit(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Kampanye: <span className="font-semibold text-slate-900">{selectedOfferToSubmit.campaign?.title}</span>
            </p>

            <form onSubmit={handleSubmitContent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tautan / URL Konten yang Diunggah
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://nexa.app/post/123 atau link video..."
                  value={contentUrlInput}
                  onChange={e => setContentUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan untuk Brand (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan detail brief yang telah dicakup atau instruksi review..."
                  value={contentNotesInput}
                  onChange={e => setContentNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOfferToSubmit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContent}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingContent ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Kirim untuk Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CAMPAIGN (For Brand / Admin) */}
      {isCreateCampaignOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Buat Kampanye Endorsement Baru</h3>
              <button onClick={() => setIsCreateCampaignOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Kampanye</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Review Koleksi Terbaru 2026..."
                  value={newCampaignTitle}
                  onChange={e => setNewCampaignTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (IDR)</label>
                  <input
                    type="number"
                    min="100000"
                    step="100000"
                    value={newCampaignBudget}
                    onChange={e => setNewCampaignBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Konten</label>
                  <select
                    value={newCampaignContentType}
                    onChange={e => setNewCampaignContentType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="video">Video Reel (Pendek)</option>
                    <option value="photo">Foto Feed</option>
                    <option value="carousel">Carousel Post</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brief & Instruksi Kreator</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Sebutkan hal penting yang harus ditampilkan kreator..."
                  value={newCampaignBrief}
                  onChange={e => setNewCampaignBrief(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kriteria Kreator</label>
                <input
                  type="text"
                  placeholder="Contoh: Minimal 1.000 followers, niche teknologi / lifestyle"
                  value={newCampaignRequirements}
                  onChange={e => setNewCampaignRequirements(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCampaignOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs"
                >
                  Publikasikan Kampanye
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
