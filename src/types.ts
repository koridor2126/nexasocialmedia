export type UserRole = 'user' | 'creator' | 'brand' | 'admin';

export const MONETIZATION_REQUIREMENTS = {
  followers: 1000,
  watchHours: 4000
};

export type MonetizationStatus = 'none' | 'pending' | 'active' | 'rejected';

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  password_hash?: string;
  avatar_url: string;
  cover_url?: string;
  bio: string;
  role: UserRole;
  is_verified?: boolean;
  website?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  likes_received_count?: number;
  watch_hours?: number;
  monetization_status?: MonetizationStatus;
  monetization_approved_at?: string;
  rejection_reason?: string;
  pending_balance?: number;
  available_balance?: number;
  paid_balance?: number;
  created_at: string;
  updated_at: string;
  // Wallet & Financial Core (Tahap 4)
  wallet_balance?: number;
  wallet_status?: 'active' | 'restricted' | 'suspended';
  pin_set?: boolean;
  pin_hash?: string;
  pin_failed_attempts?: number;
  pin_locked_until?: string;
  mask_financial_notifs?: boolean;
  category?: string;
  location?: string;
}

export type PostType = 'photo' | 'video' | 'text';
export type PostVisibility = 'public' | 'followers';

export interface Post {
  id: string;
  user_id: string;
  user?: User;
  type: PostType;
  caption: string;
  hashtags: string[];
  media_url?: string;
  thumbnail_url?: string;
  aspect_ratio?: string; // '1:1' | '4:5' | '16:9' | '9:16'
  duration_seconds?: number;
  visibility: PostVisibility;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
  updated_at: string;
  // User interaction flags for current viewer
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  user?: User;
  post_id: string;
  parent_id?: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export type NotificationType = 
  | 'follow' 
  | 'like' 
  | 'comment' 
  | 'share' 
  | 'message' 
  | 'system' 
  | 'endorsement' 
  | 'monetization'
  | 'match'
  | 'match_message'
  | 'match_activity'
  | 'match_security'
  | 'match_moderation';

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id?: string;
  actor?: User;
  type: NotificationType;
  title?: string;
  message?: string;
  content?: string;
  post_id?: string | null;
  post?: Post;
  related_post_id?: string | null;
  related_user_id?: string | null;
  conversation_id?: string | null;
  match_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface UserDevice {
  id: string;
  user_id: string;
  fcm_token: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'web';
  browser: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  new_followers: boolean;
  likes: boolean;
  comments: boolean;
  shares: boolean;
  messages: boolean;
  system: boolean;
  push_enabled: boolean;
  email_enabled?: boolean;
  // Tahap 5: NEXA Match Notification Settings
  match_new?: boolean;
  match_message?: boolean;
  match_like?: boolean;
  match_recommendation?: boolean;
  updated_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  members: User[];
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'user';
  target_id: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ==================== MONETIZATION & ENDORSEMENT ====================

export interface MonetizationApplication {
  id: string;
  user_id: string;
  user?: User;
  followers_at_application: number;
  watch_hours_at_application: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export type CampaignStatus = 
  | 'draft' 
  | 'offered' 
  | 'accepted' 
  | 'in_progress' 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'completed' 
  | 'rejected' 
  | 'cancelled';

export interface EndorsementCampaign {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_logo: string;
  title: string;
  description: string;
  brief: string;
  content_type: 'video' | 'post' | 'photo' | 'other';
  content_quantity: number;
  budget: number;
  deadline: string;
  requirements?: string;
  notes?: string;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EndorsementOffer {
  id: string;
  campaign_id: string;
  campaign?: EndorsementCampaign;
  creator_id: string;
  creator?: User;
  status: CampaignStatus;
  offered_amount: number;
  offered_at: string;
  responded_at?: string;
  rejection_reason?: string;
}

export type SubmissionStatus = 'submitted' | 'approved' | 'revision_requested' | 'rejected';

export interface EndorsementSubmission {
  id: string;
  campaign_id: string;
  campaign?: EndorsementCampaign;
  creator_id: string;
  content_id?: string;
  content_post?: Post;
  submitted_content_url?: string;
  submission_notes?: string;
  submitted_at: string;
  status: SubmissionStatus;
  reviewed_at?: string;
  review_note?: string;
}

export interface CreatorEarning {
  id: string;
  creator_id: string;
  campaign_id: string;
  campaign_title?: string;
  amount: number;
  status: 'pending' | 'available' | 'paid';
  created_at: string;
  completed_at?: string;
  paid_at?: string;
}

export interface CreatorAchievement {
  id: string;
  creator_id: string;
  achievement_type: string;
  achieved_at: string;
  notification_sent: boolean;
}

export interface CreatorAchievementItem {
  type: string;
  title: string;
  description: string;
  icon: string;
  is_achieved: boolean;
  current_value: number;
  target_value: number;
  achieved_at?: string;
}

export interface CreatorStats {
  total_followers: number;
  total_views: number;
  total_videos: number;
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_watch_hours: number;
  monetization_score: number;
  follower_progress: number;
  watch_hours_progress: number;
  eligible_for_monetization: boolean;
  monetization_status: MonetizationStatus;
  rejection_reason?: string;
  growth_chart: {
    date: string;
    followers: number;
    views: number;
    watch_hours: number;
    likes: number;
  }[];
  top_content: Post[];
  achievements: CreatorAchievementItem[];
  earnings: {
    total: number;
    pending: number;
    available: number;
    paid: number;
    history: CreatorEarning[];
  };
}

// ==========================================
// TAHAP 4: NEXA FINANCIAL & WALLET CORE
// ==========================================

export const WALLET_CONFIG = {
  minTopup: 10000,
  maxTopup: 10000000,
  minTransfer: 10000,
  maxTransfer: 5000000,
  dailyTransferLimit: 20000000,
  transferFee: 0, // Configurable standard fee (Rp 0 promo/standard)
  MIN_TOPUP_AMOUNT: 10000,
  MAX_TOPUP_AMOUNT: 10000000,
  MIN_TRANSFER_AMOUNT: 10000,
  MAX_TRANSFER_AMOUNT: 5000000,
  DAILY_TRANSFER_LIMIT: 20000000
};

export type WalletTransactionType = 'topup' | 'transfer' | 'refund' | 'adjustment';
export type WalletTransactionDirection = 'credit' | 'debit';
export type WalletTransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export type RecipientType = 'nexa_user' | 'bank_account' | 'ewallet';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: WalletTransactionType;
  direction: WalletTransactionDirection;
  amount: number;
  fee: number;
  total_amount: number;
  balance_before: number;
  balance_after: number;
  status: WalletTransactionStatus;
  reference_id: string;
  idempotency_key?: string;
  description: string;
  recipient_id?: string;
  recipient_name?: string;
  recipient_type?: RecipientType;
  recipient_account?: string;
  recipient_provider?: string;
  sender_id?: string;
  sender_name?: string;
  payment_method?: string;
  payment_proof_url?: string;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  completed_at?: string;
}

export interface WalletRecipient {
  id: string;
  owner_user_id: string;
  recipient_id?: string;
  recipient_name: string;
  recipient_type: RecipientType;
  account_identifier: string; // username if nexa_user, account/phone number if bank/ewallet
  provider: string; // 'NEXA', 'BCA', 'Mandiri', 'BRI', 'BNI', 'GoPay', 'OVO', 'Dana', 'ShopeePay'
  created_at: string;
  updated_at?: string;
  user_avatar?: string;
  user_verified?: boolean;
}

export interface WalletAdjustment {
  id: string;
  admin_id: string;
  admin_name?: string;
  user_id: string;
  user_name?: string;
  amount: number;
  type: 'credit' | 'debit';
  reason: string;
  reference_id: string;
  created_at: string;
}

export interface FinancialAuditLog {
  id: string;
  admin_id: string;
  admin_name?: string;
  action: 
  | 'topup_approval' 
  | 'topup_rejection' 
  | 'refund_processed' 
  | 'manual_adjustment' 
  | 'transfer_cancellation' 
  | 'payment_status_change'
  | 'pin_reset';
  target_type: 'topup' | 'transfer' | 'user_wallet' | 'refund';
  target_id: string;
  amount?: number;
  reason: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UserWalletInfo {
  balance: number;
  wallet_balance: number;
  available_balance: number;
  pending_balance: number;
  wallet_status: 'active' | 'restricted' | 'suspended';
  pin_set: boolean;
  pin_locked_until?: string;
  mask_financial_notifs: boolean;
  today_transfer_total: number;
  remaining_daily_limit: number;
  daily_limit_remaining?: number;
  config: typeof WALLET_CONFIG;
}

export interface AdminFinancialDashboard {
  overview: {
    total_circulating_balance: number;
    total_topup_volume: number;
    total_transfer_volume: number;
    pending_topups_count: number;
    pending_topups_volume: number;
    completed_transactions_count: number;
  };
  topups: WalletTransaction[];
  transfers: WalletTransaction[];
  ledger: WalletTransaction[];
  audit_logs: FinancialAuditLog[];
  adjustments: WalletAdjustment[];
}

// ============================================================
// TAHAP 5: NEXA MATCH — CARI JODOH (18+ DATING & MATCHMAKING)
// ============================================================

export type MatchGender = 'pria' | 'wanita' | 'lainnya' | 'male' | 'female';
export type Gender = MatchGender;
export type MatchRelationshipGoal = 'serious' | 'marriage' | 'dating_first';
export type RelationshipGoal = MatchRelationshipGoal;
export type MatchVerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type MatchProfileStatus = 'active' | 'paused' | 'suspended' | 'deleted';
export type MatchReportCategory = 
  | 'scam' 
  | 'fake_profile' 
  | 'harassment' 
  | 'inappropriate' 
  | 'asking_money' 
  | 'spam' 
  | 'suspicious' 
  | 'scam_financial'
  | 'inappropriate_content'
  | 'underage'
  | 'spam_bot'
  | 'other';

export interface MatchSearchPreferences {
  gender_preference: ('pria' | 'wanita' | 'semua' | 'all' | 'male' | 'female')[];
  min_age: number;
  max_age: number;
  city_preference?: string;
  relationship_goals?: ('serious' | 'marriage' | 'dating_first')[];
  interests?: string[];
  verified_only?: boolean;
}

export interface MatchProfile {
  id: string; // match_profile_id
  user_id: string;
  user?: Partial<User>; // Safe public user info (NO private/financial fields)
  display_name: string;
  date_of_birth: string; // YYYY-MM-DD
  age: number; // dynamically computed
  age_verified?: boolean;
  is_verified?: boolean;
  gender: MatchGender;
  city: string; // general city (e.g. 'Bandung')
  bio: string;
  profile_photos: string[]; // 1 to 6 photos
  occupation?: string;
  education?: string;
  interests: string[];
  relationship_goal: MatchRelationshipGoal;
  religion_preference_optional?: string;
  height_optional?: number | string;
  verification_status: MatchVerificationStatus;
  verification_photo_url?: string;
  verification_notes?: string;
  is_active: boolean;
  status: MatchProfileStatus;
  search_preferences: MatchSearchPreferences;
  compatibility_score?: number; // 0-100% computed relative to viewer
  match_score?: number;
  has_liked?: boolean;
  has_super_liked?: boolean;
  is_matched?: boolean;
  match_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MatchLike {
  id: string;
  from_user_id: string;
  to_user_id: string;
  is_super_like?: boolean;
  created_at: string;
}

export interface MatchPass {
  id: string;
  from_user_id: string;
  to_user_id: string;
  created_at: string;
}

export interface MatchItem {
  id: string;
  user_a: string;
  user_b: string;
  user_a_profile?: MatchProfile;
  user_b_profile?: MatchProfile;
  partner?: MatchProfile; // The other user's profile for the viewer
  status: 'active' | 'unmatched' | 'blocked';
  created_at: string;
  conversation_id?: string;
  last_message_at?: string;
  last_message_preview?: string;
}

export interface MatchReport {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  reported_user_id: string;
  reported_profile?: MatchProfile;
  category: MatchReportCategory;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
}

export interface MatchAdminDashboard {
  overview: {
    total_matches: number;
    matches_today: number;
    active_profiles: number;
    paused_profiles: number;
    suspended_profiles: number;
    pending_verifications: number;
    new_reports: number;
    blocked_users_count: number;
  };
  profiles: MatchProfile[];
  reports: MatchReport[];
  verifications: MatchProfile[];
}

export const MATCH_CONFIG = {
  MIN_AGE: 18,
  MAX_DAILY_DISCOVER: 50,
  AVAILABLE_INTERESTS: [
    'Musik', 'Kuliner', 'Traveling', 'Kopi', 'Olahraga', 'Film',
    'Fotografi', 'Game', 'Seni', 'Buku', 'Bisnis', 'Teknologi',
    'Hewan Peliharaan', 'Alam & Hiking', 'Desain', 'Fashion', 'Fitness', 'Podcast'
  ],
  INTERESTS_LIST: [
    'Musik', 'Kuliner', 'Traveling', 'Kopi', 'Olahraga', 'Film',
    'Fotografi', 'Game', 'Seni', 'Buku', 'Bisnis', 'Teknologi',
    'Hewan Peliharaan', 'Alam & Hiking', 'Desain', 'Fashion', 'Fitness', 'Podcast'
  ],
  RELATIONSHIP_GOALS: {
    serious: 'Hubungan serius',
    marriage: 'Mencari pasangan hidup',
    dating_first: 'Kenalan terlebih dahulu'
  } as Record<MatchRelationshipGoal, string>,
  RELATIONSHIP_GOAL_LABELS: {
    serious: 'Hubungan serius',
    marriage: 'Mencari pasangan hidup',
    dating_first: 'Kenalan terlebih dahulu'
  } as Record<MatchRelationshipGoal, string>,
  REPORT_CATEGORY_LABELS: {
    scam: 'Penipuan',
    fake_profile: 'Profil palsu',
    harassment: 'Pelecehan',
    inappropriate: 'Konten tidak pantas',
    asking_money: 'Meminta uang',
    spam: 'Spam',
    suspicious: 'Perilaku mencurigakan',
    scam_financial: 'Penipuan finansial',
    inappropriate_content: 'Konten tidak pantas',
    underage: 'Di bawah umur (18-)',
    spam_bot: 'Bot atau spam',
    other: 'Lainnya'
  } as Record<MatchReportCategory, string>
};


