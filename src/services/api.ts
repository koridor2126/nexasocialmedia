import { 
  User, Post, Comment, Notification, Conversation, Message, AuthResponse, Report, 
  NotificationPreferences, UserDevice, CreatorStats, MonetizationApplication,
  EndorsementCampaign, EndorsementOffer, EndorsementSubmission, CreatorEarning,
  UserWalletInfo, WalletTransaction, WalletRecipient, AdminFinancialDashboard,
  WalletAdjustment, RecipientType,
  MatchProfile, MatchLike, MatchItem, MatchReport, MatchAdminDashboard,
  MatchSearchPreferences, MatchProfileStatus, MatchReportCategory
} from '../types.js';

const TOKEN_KEY = 'nexa_auth_token';

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY)
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    confirm_password?: string;
    avatar_url?: string;
    role?: string;
  }) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

  login: (payload: { identifier: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  getMe: () => request<{ user: User }>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string; success: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  // Users
  getUser: (id: string) => request<{ user: User & { is_following?: boolean; is_self?: boolean }; posts?: Post[]; followers_count?: number; following_count?: number; is_following?: boolean }>(`/users/${id}`),
  getUserProfile: (id: string) => request<{ user: User & { is_following?: boolean; is_self?: boolean }; posts?: Post[]; followers_count?: number; following_count?: number; is_following?: boolean }>(`/users/${id}`),

  updateProfile: (data: Partial<User>) =>
    request<{ message: string; user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  toggleFollow: (userId: string) =>
    request<{ isFollowing: boolean; followersCount: number }>(`/users/${userId}/follow`, {
      method: 'POST'
    }),

  getFollowers: (userId: string) => request<{ followers: User[] }>(`/users/${userId}/followers`),

  getFollowing: (userId: string) => request<{ following: User[] }>(`/users/${userId}/following`),

  getUserPosts: (userId: string) => request<{ posts: Post[] }>(`/users/${userId}/posts`),

  // Posts
  getPosts: (filter?: 'for_you' | 'following' | 'videos', tag?: string) => {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (tag) params.append('tag', tag);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{ posts: Post[] }>(`/posts${qs}`);
  },

  getPost: (id: string) => request<{ post: Post }>(`/posts/${id}`),
  getPostById: (id: string) => request<{ post: Post }>(`/posts/${id}`),

  createPost: (postData: Partial<Post>) =>
    request<{ message: string; post: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    }),

  deletePost: (id: string) => request<{ message: string }>(`/posts/${id}`, { method: 'DELETE' }),

  toggleLike: (postId: string) =>
    request<{ isLiked: boolean; likeCount: number }>(`/posts/${postId}/like`, { method: 'POST' }),

  recordView: (postId: string) =>
    request<{ view_count: number }>(`/posts/${postId}/view`, { method: 'POST' }),

  recordShare: (postId: string) =>
    request<{ share_count: number }>(`/posts/${postId}/share`, { method: 'POST' }),

  // Comments
  getComments: (postId: string) => request<{ comments: Comment[] }>(`/posts/${postId}/comments`),

  createComment: (postId: string, content: string, parentId?: string | null) =>
    request<{ comment: Comment }>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId })
    }),

  deleteComment: (commentId: string) =>
    request<{ message: string }>(`/comments/${commentId}`, { method: 'DELETE' }),

  // Explore & Search
  getExplore: () =>
    request<{
      posts: Post[];
      creators: User[];
      trending_hashtags: { tag: string; count: number }[];
    }>('/explore'),

  search: (query: string) =>
    request<{
      users: (User & { is_following?: boolean })[];
      posts: Post[];
      hashtags: { tag: string; count: number }[];
    }>(`/search?q=${encodeURIComponent(query)}`),

  // Notifications & Push
  getNotifications: () => request<{ notifications: Notification[]; unread_count: number }>('/notifications'),
  getUnreadNotificationCount: () => request<{ unread_count: number }>('/notifications/unread-count'),
  markNotificationsRead: () => request<{ success: boolean; unread_count: number }>('/notifications/read', { method: 'POST' }),
  markNotificationRead: (id: string) => request<{ success: boolean; unread_count: number }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ success: boolean; unread_count: number }>('/notifications/read', { method: 'POST' }),
  deleteNotification: (id: string) => request<{ success: boolean; unread_count: number }>(`/notifications/${id}`, { method: 'DELETE' }),

  // Notification Preferences
  getNotificationPreferences: () => request<{ preferences: NotificationPreferences }>('/notifications/preferences'),
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) =>
    request<{ preferences: NotificationPreferences; message: string }>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    }),

  // Devices & Push
  registerDeviceToken: (data: { fcm_token: string; device_type?: string; browser?: string; user_agent?: string }) =>
    request<{ message: string; device: UserDevice }>('/notifications/devices', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getRegisteredDevices: () => request<{ devices: UserDevice[] }>('/notifications/devices'),
  removeDeviceToken: (tokenOrId: string) =>
    request<{ success: boolean; message: string }>(`/notifications/devices/${tokenOrId}`, {
      method: 'DELETE'
    }),

  // Test Notification Trigger
  sendTestNotification: (data: { type: string; custom_message?: string; post_id?: string }) =>
    request<{ message: string; notification: Notification; unread_count: number }>('/notifications/test', {
      method: 'POST',
      body: JSON.stringify(data)
    }),


  // Chat
  getConversations: () => request<{ conversations: Conversation[] }>('/conversations'),

  startConversation: (targetUserId: string) =>
    request<{ conversation: Conversation }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId })
    }),

  getMessages: (conversationId: string) =>
    request<{ messages: Message[] }>(`/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    request<{ message: Message }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }),

  // Reports
  createReport: (target_type: 'post' | 'user', target_id: string, reason: string) =>
    request<{ message: string; report: Report }>('/reports', {
      method: 'POST',
      body: JSON.stringify({ target_type, target_id, reason })
    }),

  // Admin
  getAdminStats: () =>
    request<{
      stats: {
        total_users: number;
        creators_count: number;
        brands_count: number;
        total_posts: number;
        total_videos: number;
        total_views: number;
        total_likes: number;
        pending_reports: number;
      };
      users: User[];
      reports: Report[];
    }>('/admin/stats'),

  updateUserRole: (userId: string, role: string, is_verified?: boolean) =>
    request<{ message: string; user: User }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, is_verified })
    }),

  // Creator & Monetization
  getCreatorStats: (userId?: string) =>
    request<{ stats: CreatorStats }>(userId ? `/creator/stats/${userId}` : '/creator/stats'),

  applyForMonetization: () =>
    request<{ message: string; application: MonetizationApplication }>('/creator/monetization/apply', {
      method: 'POST'
    }),

  getCreatorEarnings: () =>
    request<{ earnings: { total: number; pending: number; available: number; paid: number; history: CreatorEarning[] } }>('/creator/earnings'),

  // Endorsement Campaigns & Offers
  getEndorsementCampaigns: (params?: { brand_id?: string; status?: string }) => {
    const search = new URLSearchParams();
    if (params?.brand_id) search.set('brand_id', params.brand_id);
    if (params?.status) search.set('status', params.status);
    const qs = search.toString() ? `?${search.toString()}` : '';
    return request<{ campaigns: EndorsementCampaign[] }>(`/endorsements/campaigns${qs}`);
  },

  getEndorsementCampaignById: (id: string) =>
    request<{ campaign: EndorsementCampaign }>(`/endorsements/campaigns/${id}`),

  createEndorsementCampaign: (data: Partial<EndorsementCampaign>) =>
    request<{ message: string; campaign: EndorsementCampaign }>('/endorsements/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getEndorsementOffers: () =>
    request<{ offers: EndorsementOffer[] }>('/endorsements/offers'),

  createEndorsementOffer: (data: { campaign_id: string; creator_id: string; amount: number }) =>
    request<{ message: string; offer: EndorsementOffer }>('/endorsements/offers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  respondEndorsementOffer: (offerId: string, response: 'accepted' | 'rejected', reason?: string) =>
    request<{ message: string; offer: EndorsementOffer }>(`/endorsements/offers/${offerId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response, reason })
    }),

  submitEndorsementContent: (offerId: string, data: { content_id?: string; submitted_content_url?: string; submission_notes?: string }) =>
    request<{ message: string; submission: EndorsementSubmission }>(`/endorsements/offers/${offerId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getEndorsementSubmissions: (params?: { campaign_id?: string; creator_id?: string }) => {
    const search = new URLSearchParams();
    if (params?.campaign_id) search.set('campaign_id', params.campaign_id);
    if (params?.creator_id) search.set('creator_id', params.creator_id);
    const qs = search.toString() ? `?${search.toString()}` : '';
    return request<{ submissions: EndorsementSubmission[] }>(`/endorsements/submissions${qs}`);
  },

  reviewEndorsementSubmission: (submissionId: string, data: { status: 'approved' | 'revision_requested' | 'rejected'; review_note?: string }) =>
    request<{ message: string; submission: EndorsementSubmission }>(`/endorsements/submissions/${submissionId}/review`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Admin Monetization
  getMonetizationApplications: () =>
    request<{ applications: MonetizationApplication[] }>('/admin/monetization/applications'),

  reviewMonetizationApplication: (id: string, data: { status: 'approved' | 'rejected'; reason?: string }) =>
    request<{ message: string; application: MonetizationApplication }>(`/admin/monetization/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // ==================== TAHAP 4: WALLET & FINANCIAL ====================
  getWalletInfo: () =>
    request<UserWalletInfo>('/wallet'),

  setupOrChangePin: (data: { new_pin: string; old_pin?: string }) =>
    request<{ message: string }>('/wallet/pin/setup', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  verifyPin: (pin: string) =>
    request<{ valid: boolean; message: string }>('/wallet/pin/verify', {
      method: 'POST',
      body: JSON.stringify({ pin })
    }),

  updateWalletSettings: (data: { mask_financial_notifs?: boolean }) =>
    request<{ message: string; wallet: UserWalletInfo }>('/wallet/settings', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getWalletTransactions: (params?: { type?: string; status?: string }) => {
    const search = new URLSearchParams();
    if (params?.type) search.set('type', params.type);
    if (params?.status) search.set('status', params.status);
    const qs = search.toString() ? `?${search.toString()}` : '';
    return request<{ transactions: WalletTransaction[] }>(`/wallet/transactions${qs}`);
  },

  getTransactionDetail: (id: string) =>
    request<{ transaction: WalletTransaction }>(`/wallet/transactions/${id}`),

  createTopUp: (data: { amount: number; payment_method: string; payment_proof_url?: string }) =>
    request<{ message: string; transaction: WalletTransaction }>('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  uploadTopUpProof: (transactionId: string, payment_proof_url: string) =>
    request<{ message: string; transaction: WalletTransaction }>(`/wallet/topup/${transactionId}/proof`, {
      method: 'POST',
      body: JSON.stringify({ payment_proof_url })
    }),

  getWalletRecipients: () =>
    request<{ recipients: WalletRecipient[] }>('/wallet/recipients'),

  addWalletRecipient: (data: { recipient_name: string; recipient_type: RecipientType; account_identifier: string; provider: string }) =>
    request<{ message: string; recipient: WalletRecipient }>('/wallet/recipients', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteWalletRecipient: (id: string) =>
    request<{ message: string }>(`/wallet/recipients/${id}`, {
      method: 'DELETE'
    }),

  searchTransferUsers: (query: string) => {
    const qs = query ? `?q=${encodeURIComponent(query)}` : '';
    return request<{ users: Partial<User>[] }>(`/wallet/search-user${qs}`);
  },

  executeTransfer: (data: {
    recipient_type: RecipientType;
    recipient_id?: string;
    recipient_name: string;
    account_identifier: string;
    provider: string;
    amount: number;
    notes?: string;
    idempotency_key?: string;
    pin: string;
  }) =>
    request<{ message: string; transaction: WalletTransaction }>('/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Admin Financial
  getAdminFinancialOverview: () =>
    request<AdminFinancialDashboard>('/admin/financial/overview'),

  adminReviewTopUp: (id: string, data: { action: 'approve' | 'reject'; reason?: string }) =>
    request<{ message: string; transaction: WalletTransaction }>(`/admin/financial/topup/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  adminManualAdjustment: (data: { target_user_id: string; amount: number; type: 'credit' | 'debit'; reason: string }) =>
    request<{ message: string; adjustment: WalletAdjustment }>('/admin/financial/adjustment', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

export const matchApi = {
  getProfile: () =>
    request<{ profile: MatchProfile | null }>('/match/profile'),

  saveProfile: (data: Partial<MatchProfile>) =>
    request<{ message: string; profile: MatchProfile }>('/match/profile', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  toggleStatus: (status?: 'active' | 'paused') =>
    request<{ message: string; profile: MatchProfile }>('/match/status', {
      method: 'POST',
      body: JSON.stringify({ status })
    }),

  deleteProfile: () =>
    request<{ message: string }>('/match/profile', {
      method: 'DELETE'
    }),

  getDiscover: (params?: {
    min_age?: number;
    max_age?: number;
    gender?: string;
    city?: string;
    goal?: string;
    verified_only?: boolean;
    limit?: number;
  }) => {
    const qs = params
      ? '?' +
        Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== '')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    return request<{
      profiles: MatchProfile[];
      remaining_daily: number;
      total_available: number;
      has_reached_limit: boolean;
      user_profile: MatchProfile | null;
    }>(`/match/discover${qs}`);
  },

  likeProfile: (target_user_id: string, is_super_like: boolean = false) =>
    request<{
      isMatch: boolean;
      match?: MatchItem;
      partnerProfile?: MatchProfile;
      like: MatchLike;
    }>('/match/like', {
      method: 'POST',
      body: JSON.stringify({ target_user_id, is_super_like })
    }),

  passProfile: (target_user_id: string) =>
    request<{ message: string }>('/match/pass', {
      method: 'POST',
      body: JSON.stringify({ target_user_id })
    }),

  getMatches: () =>
    request<{ matches: MatchItem[] }>('/match/matches'),

  getLikes: () =>
    request<{ likes: MatchProfile[] }>('/match/likes'),

  unmatch: (match_id: string) =>
    request<{ message: string }>('/match/unmatch', {
      method: 'POST',
      body: JSON.stringify({ match_id })
    }),

  blockUser: (target_user_id: string) =>
    request<{ message: string }>('/match/block', {
      method: 'POST',
      body: JSON.stringify({ target_user_id })
    }),

  reportProfile: (target_user_id: string, category: MatchReportCategory, reason: string) =>
    request<{ message: string; report: MatchReport }>('/match/report', {
      method: 'POST',
      body: JSON.stringify({ target_user_id, category, reason })
    }),

  requestVerification: (photo_url: string) =>
    request<{ message: string; profile: MatchProfile }>('/match/verify', {
      method: 'POST',
      body: JSON.stringify({ photo_url })
    }),

  // Admin Match APIs
  getAdminOverview: () =>
    request<MatchAdminDashboard>('/admin/match/overview'),

  adminGetProfiles: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<{ profiles: MatchProfile[] }>(`/admin/match/profiles${qs}`);
  },

  adminUpdateProfileStatus: (profile_id: string, status: MatchProfileStatus) =>
    request<{ message: string; profile: MatchProfile }>('/admin/match/profile-status', {
      method: 'POST',
      body: JSON.stringify({ profile_id, status })
    }),

  adminReviewVerification: (profile_id: string, status: 'verified' | 'rejected', notes?: string) =>
    request<{ message: string; profile: MatchProfile }>('/admin/match/review-verification', {
      method: 'POST',
      body: JSON.stringify({ profile_id, status, notes })
    }),

  adminGetReports: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<{ reports: MatchReport[] }>(`/admin/match/reports${qs}`);
  },

  adminReviewReport: (report_id: string, status: 'resolved' | 'dismissed', action: 'suspend' | 'warn' | 'none', notes?: string) =>
    request<{ message: string; report: MatchReport }>('/admin/match/review-report', {
      method: 'POST',
      body: JSON.stringify({ report_id, status, action, notes })
    })
};

