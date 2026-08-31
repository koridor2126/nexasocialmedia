import { Router, Response } from 'express';
import { db } from './db.js';
import { 
  AuthRequest, 
  generateToken, 
  hashPassword, 
  comparePassword, 
  requireAuth, 
  optionalAuth, 
  requireRole 
} from './auth.js';

export const apiRouter = Router();

// ==================== AUTHENTICATION ====================

apiRouter.post('/auth/register', (req, res) => {
  try {
    const { full_name, username, email, password, confirm_password, avatar_url, role } = req.body;

    if (!full_name || !username || !email || !password) {
      res.status(400).json({ error: 'Harap isi semua kolom yang diperlukan.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
      return;
    }

    if (confirm_password && password !== confirm_password) {
      res.status(400).json({ error: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
    const cleanEmail = email.trim().toLowerCase();

    // Check unique username
    const existingUser = db.findUserByUsernameOrEmail(cleanUsername);
    if (existingUser) {
      res.status(400).json({ error: 'Username sudah digunakan oleh akun lain.' });
      return;
    }

    // Check unique email
    const existingEmail = db.findUserByUsernameOrEmail(cleanEmail);
    if (existingEmail) {
      res.status(400).json({ error: 'Email sudah terdaftar. Silakan masuk.' });
      return;
    }

    const password_hash = hashPassword(password);
    const newUser = db.createUser({
      full_name: full_name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password_hash,
      avatar_url: avatar_url || undefined,
      role: role && ['user', 'creator', 'brand'].includes(role) ? role : 'user'
    });

    const token = generateToken(newUser);
    res.status(201).json({
      message: 'Registrasi akun NEXA berhasil!',
      user: newUser,
      token
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat mendaftar.' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ error: 'Harap masukkan username/email dan kata sandi.' });
      return;
    }

    const user = db.findUserByUsernameOrEmail(identifier);
    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'Username/Email atau kata sandi tidak sesuai.' });
      return;
    }

    const isMatch = comparePassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Username/Email atau kata sandi tidak sesuai.' });
      return;
    }

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);

    res.json({
      message: 'Berhasil masuk ke NEXA.',
      user: safeUser,
      token
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat masuk.' });
  }
});

apiRouter.get('/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Sesi tidak valid.' });
    return;
  }
  const freshUser = db.findUserById(req.user.id);
  if (!freshUser) {
    res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    return;
  }
  const { password_hash, ...safeUser } = freshUser;
  res.json({ user: safeUser });
});

apiRouter.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Masukkan email Anda.' });
    return;
  }
  const user = db.findUserByUsernameOrEmail(email);
  if (!user) {
    res.status(404).json({ error: 'Akun dengan email tersebut tidak ditemukan.' });
    return;
  }
  // Simulated safe recovery
  res.json({ 
    message: 'Tautan pemulihan kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk.',
    success: true 
  });
});

// ==================== USERS & PROFILES ====================

apiRouter.get('/users/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  const user = db.findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Profil pengguna tidak ditemukan.' });
    return;
  }
  const { password_hash, ...safeUser } = user;
  const isFollowing = req.user ? db.isUserFollowing(req.user.id, user.id) : false;

  res.json({
    user: {
      ...safeUser,
      is_following: isFollowing,
      is_self: req.user?.id === user.id
    }
  });
});

apiRouter.put('/users/profile', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { full_name, bio, avatar_url, cover_url, website, category } = req.body;

  const updated = db.updateUser(req.user.id, {
    full_name: full_name?.trim(),
    bio: bio?.trim(),
    avatar_url: avatar_url?.trim(),
    cover_url: cover_url?.trim(),
    website: website?.trim(),
    category: category?.trim()
  });

  if (!updated) {
    res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    return;
  }

  res.json({ message: 'Profil berhasil diperbarui.', user: updated });
});

apiRouter.post('/users/:id/follow', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const result = db.toggleFollow(req.user.id, req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengubah status ikuti.' });
  }
});

apiRouter.get('/users/:id/followers', (req, res) => {
  const list = db.getFollowers(req.params.id);
  res.json({ followers: list });
});

apiRouter.get('/users/:id/following', (req, res) => {
  const list = db.getFollowing(req.params.id);
  res.json({ following: list });
});

apiRouter.get('/users/:id/posts', optionalAuth, (req: AuthRequest, res: Response) => {
  const allPosts = db.getPosts(req.user?.id);
  const userPosts = allPosts.filter(p => p.user_id === req.params.id);
  res.json({ posts: userPosts });
});

// ==================== POSTS & FEED ====================

apiRouter.get('/posts', optionalAuth, (req: AuthRequest, res: Response) => {
  const filter = req.query.filter as 'for_you' | 'following' | 'videos' | undefined;
  const tag = req.query.tag as string | undefined;
  const posts = db.getPosts(req.user?.id, filter, tag);
  res.json({ posts });
});

apiRouter.get('/posts/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  const post = db.findPostById(req.params.id, req.user?.id);
  if (!post) {
    res.status(404).json({ error: 'Postingan tidak ditemukan.' });
    return;
  }
  res.json({ post });
});

apiRouter.post('/posts', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { type, caption, hashtags, media_url, thumbnail_url, aspect_ratio, visibility } = req.body;

  if (!caption && !media_url) {
    res.status(400).json({ error: 'Postingan harus memiliki teks atau media foto/video.' });
    return;
  }

  // Parse hashtags from caption if not explicitly provided
  let tags: string[] = Array.isArray(hashtags) ? hashtags : [];
  if (caption && tags.length === 0) {
    const matches = caption.match(/#[a-zA-Z0-9_]+/g);
    if (matches) {
      tags = matches.map((m: string) => m.replace('#', '').toLowerCase());
    }
  }

  const newPost = db.createPost({
    user_id: req.user.id,
    type: type || 'photo',
    caption: caption || '',
    hashtags: tags,
    media_url: media_url || undefined,
    thumbnail_url: thumbnail_url || media_url || undefined,
    aspect_ratio: aspect_ratio || '1:1',
    visibility: visibility || 'public'
  });

  res.status(201).json({
    message: 'Postingan berhasil dibagikan!',
    post: newPost
  });
});

apiRouter.delete('/posts/:id', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const success = db.deletePost(req.params.id, req.user.id);
  if (!success) {
    res.status(403).json({ error: 'Tidak dapat menghapus postingan ini.' });
    return;
  }
  res.json({ message: 'Postingan berhasil dihapus.' });
});

apiRouter.post('/posts/:id/like', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const result = db.toggleLike(req.user.id, req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menyukai postingan.' });
  }
});

apiRouter.post('/posts/:id/view', (req, res) => {
  const views = db.incrementPostView(req.params.id);
  res.json({ view_count: views });
});

apiRouter.post('/posts/:id/share', optionalAuth, (req: AuthRequest, res: Response) => {
  const shares = db.incrementPostShare(req.params.id, req.user?.id);
  res.json({ share_count: shares });
});

// ==================== COMMENTS ====================

apiRouter.get('/posts/:id/comments', (req, res) => {
  const comments = db.getComments(req.params.id);
  res.json({ comments });
});

apiRouter.post('/posts/:id/comments', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { content, parent_id } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Komentar tidak boleh kosong.' });
    return;
  }

  try {
    const comment = db.createComment(req.user.id, req.params.id, content, parent_id);
    res.status(201).json({ comment });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menambahkan komentar.' });
  }
});

apiRouter.delete('/comments/:id', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const success = db.deleteComment(req.params.id, req.user.id);
  if (!success) {
    res.status(403).json({ error: 'Tidak dapat menghapus komentar ini.' });
    return;
  }
  res.json({ message: 'Komentar berhasil dihapus.' });
});

// ==================== EXPLORE & SEARCH ====================

apiRouter.get('/explore', optionalAuth, (req: AuthRequest, res: Response) => {
  const allPosts = db.getPosts(req.user?.id);
  const users = db.getUsers().slice(0, 8);
  
  // Trending hashtags aggregation
  const tagCounts: Record<string, number> = {};
  allPosts.forEach(p => {
    p.hashtags?.forEach(h => {
      const key = h.toLowerCase();
      tagCounts[key] = (tagCounts[key] || 0) + 1;
    });
  });

  const trending = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({
    posts: allPosts,
    creators: users.filter(u => u.id !== req.user?.id),
    trending_hashtags: trending
  });
});

apiRouter.get('/search', optionalAuth, (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string) || '';
  const results = db.search(q, req.user?.id);
  res.json(results);
});

// ==================== NOTIFICATIONS & PUSH ====================

apiRouter.get('/notifications', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const list = db.getNotifications(req.user.id);
  const unreadCount = db.getUnreadNotificationCount(req.user.id);
  res.json({ notifications: list, unread_count: unreadCount });
});

apiRouter.get('/notifications/unread-count', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const unreadCount = db.getUnreadNotificationCount(req.user.id);
  res.json({ unread_count: unreadCount });
});

apiRouter.post('/notifications/read', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  db.markNotificationsAsRead(req.user.id);
  res.json({ success: true, unread_count: 0 });
});

apiRouter.patch('/notifications/:id/read', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const success = db.markNotificationAsRead(req.user.id, req.params.id);
  const unreadCount = db.getUnreadNotificationCount(req.user.id);
  res.json({ success, unread_count: unreadCount });
});

apiRouter.delete('/notifications/:id', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const success = db.deleteNotification(req.user.id, req.params.id);
  const unreadCount = db.getUnreadNotificationCount(req.user.id);
  res.json({ success, unread_count: unreadCount });
});

// Notification Preferences
apiRouter.get('/notifications/preferences', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const preferences = db.getNotificationPreferences(req.user.id);
  res.json({ preferences });
});

apiRouter.put('/notifications/preferences', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const updated = db.updateNotificationPreferences(req.user.id, req.body);
  res.json({ preferences: updated, message: 'Preferensi notifikasi berhasil diperbarui.' });
});

// Device Registration & Web Push
apiRouter.get('/notifications/devices', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const devices = db.getUserDevices(req.user.id);
  res.json({ devices });
});

apiRouter.post('/notifications/devices', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { fcm_token, device_type, browser, user_agent } = req.body;
  if (!fcm_token) {
    res.status(400).json({ error: 'FCM / Push Token diperlukan.' });
    return;
  }
  const device = db.registerDevice(req.user.id, {
    fcm_token,
    device_type: device_type || 'web',
    browser: browser || 'Browser',
    user_agent
  });
  res.json({ message: 'Perangkat berhasil didaftarkan untuk notifikasi push.', device });
});

apiRouter.delete('/notifications/devices/:tokenOrId', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const success = db.removeDevice(req.user.id, req.params.tokenOrId);
  res.json({ success, message: success ? 'Perangkat dihapus.' : 'Perangkat tidak ditemukan.' });
});

// Test Notification Endpoint (For Testing / Simulation Verification)
apiRouter.post('/notifications/test', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { type, custom_message, post_id } = req.body;
  const notifType = type || 'system';

  let title = 'Informasi NEXA';
  let message = '🔔 NEXA memiliki informasi baru untuk Anda.';

  switch (notifType) {
    case 'follow':
      title = 'Pengikut Baru';
      message = '👤 @nexa_official mulai mengikuti Anda.';
      break;
    case 'like':
      title = 'Suka Baru';
      message = '❤️ @nexa_official menyukai postingan Anda.';
      break;
    case 'comment':
      title = 'Komentar Baru';
      message = '💬 @nexa_official mengomentari postingan Anda.';
      break;
    case 'share':
      title = 'Postingan Dibagikan';
      message = '↗️ Postingan Anda dibagikan oleh @nexa_official.';
      break;
    case 'message':
      title = 'Pesan Baru';
      message = '💬 Anda memiliki pesan baru dari @nexa_official.';
      break;
    case 'system':
    default:
      title = 'Pengumuman Sistem';
      message = custom_message || '🔔 NEXA memiliki informasi baru untuk Anda.';
      break;
  }

  const newNotif = db.createNotification({
    recipient_id: req.user.id,
    actor_id: req.user.id,
    type: notifType,
    title,
    content: message,
    message,
    post_id: post_id || null,
    related_post_id: post_id || null
  });

  const unreadCount = db.getUnreadNotificationCount(req.user.id);
  res.json({
    message: 'Notifikasi uji coba berhasil dikirim!',
    notification: newNotif,
    unread_count: unreadCount
  });
});

// ==================== DIRECT CHAT ====================

apiRouter.get('/conversations', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const convs = db.getConversations(req.user.id);
  res.json({ conversations: convs });
});

apiRouter.post('/conversations', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { target_user_id } = req.body;
  if (!target_user_id) {
    res.status(400).json({ error: 'Target pengguna diperlukan.' });
    return;
  }
  const conv = db.getOrCreateConversation(req.user.id, target_user_id);
  res.json({ conversation: conv });
});

apiRouter.get('/conversations/:id/messages', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const msgs = db.getMessages(req.params.id, req.user.id);
  res.json({ messages: msgs });
});

apiRouter.post('/conversations/:id/messages', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { content } = req.body;
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    return;
  }
  try {
    const msg = db.createMessage(req.params.id, req.user.id, content);
    res.status(201).json({ message: msg });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengirim pesan.' });
  }
});

// ==================== REPORTS & MODERATION (Foundation) ====================

apiRouter.post('/reports', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const { target_type, target_id, reason } = req.body;
  if (!target_type || !target_id || !reason) {
    res.status(400).json({ error: 'Harap lengkapi detail laporan.' });
    return;
  }
  const report = db.createReport(req.user.id, target_type, target_id, reason);
  res.status(201).json({ message: 'Laporan Anda telah diterima untuk ditinjau.', report });
});

// ==================== ADMIN DASHBOARD FOUNDATION ====================

apiRouter.get('/admin/stats', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const users = db.getUsers();
  const posts = db.getPosts();
  const reports = db.getReports();

  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
  const totalVideos = posts.filter(p => p.type === 'video').length;

  res.json({
    stats: {
      total_users: users.length,
      creators_count: users.filter(u => u.role === 'creator').length,
      brands_count: users.filter(u => u.role === 'brand').length,
      total_posts: posts.length,
      total_videos: totalVideos,
      total_views: totalViews,
      total_likes: totalLikes,
      pending_reports: reports.filter(r => r.status === 'pending').length
    },
    users,
    reports
  });
});

apiRouter.put('/admin/users/:id/role', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { role, is_verified } = req.body;
  const updated = db.updateUser(req.params.id, {
    role,
    is_verified: is_verified !== undefined ? Boolean(is_verified) : undefined
  });
  if (!updated) {
    res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    return;
  }
  res.json({ message: 'Role & status verifikasi pengguna diperbarui.', user: updated });
});

// ==================== CREATOR MONETIZATION & ENDORSEMENT ====================

// Get current creator stats & monetization score
apiRouter.get('/creator/stats', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const stats = db.getCreatorStats(req.user.id);
    res.json({ stats });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat statistik kreator.' });
  }
});

// Get creator stats by user ID
apiRouter.get('/creator/stats/:userId', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const stats = db.getCreatorStats(req.params.userId);
    res.json({ stats });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat statistik kreator.' });
  }
});

// Apply for monetization
apiRouter.post('/creator/monetization/apply', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const application = db.applyForMonetization(req.user.id);
    res.status(201).json({
      message: 'Pengajuan monetisasi Anda telah berhasil dikirim.',
      application
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengajukan monetisasi.' });
  }
});

// Get creator earnings
apiRouter.get('/creator/earnings', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const earnings = db.getCreatorEarnings(req.user.id);
    res.json({ earnings });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat penghasilan.' });
  }
});

// ==================== ENDORSEMENT CAMPAIGNS & OFFERS ====================

// List endorsement campaigns
apiRouter.get('/endorsements/campaigns', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { brand_id, status } = req.query;
    const campaigns = db.getEndorsementCampaigns({
      brand_id: brand_id as string,
      status: status as string
    });
    res.json({ campaigns });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat daftar kampanye.' });
  }
});

// Get single campaign
apiRouter.get('/endorsements/campaigns/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const campaign = db.getEndorsementCampaignById(req.params.id);
    if (!campaign) {
      res.status(404).json({ error: 'Kampanye endorsement tidak ditemukan.' });
      return;
    }
    res.json({ campaign });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat kampanye.' });
  }
});

// Create campaign (brand or admin)
apiRouter.post('/endorsements/campaigns', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const campaign = db.createEndorsementCampaign(req.body, req.user.id);
    res.status(201).json({
      message: 'Kampanye endorsement berhasil dibuat.',
      campaign
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal membuat kampanye.' });
  }
});

// List offers for current creator
apiRouter.get('/endorsements/offers', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const offers = db.getEndorsementOffers(req.user.id);
    res.json({ offers });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat tawaran endorsement.' });
  }
});

// Create offer (brand/admin offering to a creator)
apiRouter.post('/endorsements/offers', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { campaign_id, creator_id, amount } = req.body;
    if (!campaign_id || !creator_id) {
      res.status(400).json({ error: 'Harap tentukan kampanye dan kreator target.' });
      return;
    }
    const offer = db.createEndorsementOffer(campaign_id, creator_id, Number(amount));
    res.status(201).json({
      message: 'Tawaran endorsement berhasil dikirimkan ke kreator.',
      offer
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengirim tawaran.' });
  }
});

// Creator respond to offer (accept or reject)
apiRouter.post('/endorsements/offers/:id/respond', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { response, reason } = req.body;
    if (!response || !['accepted', 'rejected'].includes(response)) {
      res.status(400).json({ error: 'Respon harus bernilai accepted atau rejected.' });
      return;
    }
    const updatedOffer = db.respondEndorsementOffer(req.params.id, req.user.id, response, reason);
    res.json({
      message: response === 'accepted' ? 'Tawaran endorsement berhasil diterima!' : 'Tawaran endorsement ditolak.',
      offer: updatedOffer
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal merespon tawaran.' });
  }
});

// Creator submit content for an accepted offer
apiRouter.post('/endorsements/offers/:id/submit', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { content_id, submitted_content_url, submission_notes } = req.body;
    const submission = db.submitEndorsementContent(req.params.id, req.user.id, {
      content_id,
      submitted_content_url,
      submission_notes
    });
    res.status(201).json({
      message: 'Materi konten endorsement berhasil dikirimkan untuk peninjauan.',
      submission
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengirim materi endorsement.' });
  }
});

// List submissions
apiRouter.get('/endorsements/submissions', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { campaign_id, creator_id } = req.query;
    const submissions = db.getEndorsementSubmissions({
      campaign_id: campaign_id as string,
      creator_id: creator_id as string
    });
    res.json({ submissions });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat pengiriman konten.' });
  }
});

// Brand/Admin review submission
apiRouter.post('/endorsements/submissions/:id/review', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { status, review_note } = req.body;
    if (!status || !['approved', 'revision_requested', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status review tidak valid.' });
      return;
    }
    const updated = db.reviewEndorsementSubmission(req.params.id, req.user.id, status, review_note);
    res.json({
      message: 'Review pengiriman konten berhasil disimpan.',
      submission: updated
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mereview pengiriman konten.' });
  }
});

// ==================== ADMIN MONETIZATION APPROVALS ====================

apiRouter.get('/admin/monetization/applications', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  try {
    const applications = db.getMonetizationApplications();
    res.json({ applications });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat permohonan monetisasi.' });
  }
});

apiRouter.post('/admin/monetization/applications/:id/review', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { status, reason } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status harus approved atau rejected.' });
      return;
    }
    const app = db.reviewMonetizationApplication(req.params.id, status, reason, req.user.id);
    res.json({
      message: status === 'approved' ? 'Permohonan monetisasi disetujui.' : 'Permohonan monetisasi ditolak.',
      application: app
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memproses permohonan.' });
  }
});

// ==================== TAHAP 4: WALLET & FINANCIAL API ====================

// Get current user wallet summary, balances, PIN status, limits
apiRouter.get('/wallet', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const walletInfo = db.getUserWalletInfo(req.user.id);
    res.json(walletInfo);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat informasi dompet.' });
  }
});

// Setup or Change 6-Digit PIN
apiRouter.post('/wallet/pin/setup', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { new_pin, old_pin } = req.body;
    if (!new_pin) {
      res.status(400).json({ error: 'PIN baru 6 digit wajib dimasukkan.' });
      return;
    }
    const result = db.setupOrChangePin(req.user.id, String(new_pin), old_pin ? String(old_pin) : undefined);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menyimpan PIN transaksi.' });
  }
});

// Verify PIN (e.g. before sensitive actions)
apiRouter.post('/wallet/pin/verify', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { pin } = req.body;
    if (!pin) {
      res.status(400).json({ error: 'PIN transaksi wajib dimasukkan.' });
      return;
    }
    const isValid = db.verifyPin(req.user.id, String(pin));
    res.json({ valid: isValid, message: 'PIN transaksi valid.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'PIN transaksi tidak valid.' });
  }
});

// Update Wallet Settings (e.g. privacy masking)
apiRouter.post('/wallet/settings', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { mask_financial_notifs } = req.body;
    const updated = db.updateWalletSettings(req.user.id, { mask_financial_notifs });
    res.json({
      message: 'Pengaturan dompet berhasil diperbarui.',
      wallet: updated
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memperbarui pengaturan dompet.' });
  }
});

// Get User Wallet Transactions / Ledger
apiRouter.get('/wallet/transactions', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { type, status } = req.query;
    const transactions = db.getWalletTransactions(req.user.id, {
      type: type as string,
      status: status as string
    });
    res.json({ transactions });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat riwayat transaksi.' });
  }
});

// Get Single Transaction Detail / Digital Receipt
apiRouter.get('/wallet/transactions/:id', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const transaction = db.getTransactionDetail(req.user.id, req.params.id);
    if (!transaction) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan atau Anda tidak memiliki akses.' });
      return;
    }
    res.json({ transaction });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat detail transaksi.' });
  }
});

// Create Top Up Request
apiRouter.post('/wallet/topup', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { amount, payment_method, payment_proof_url } = req.body;
    if (!amount || !payment_method) {
      res.status(400).json({ error: 'Nominal top up dan metode pembayaran wajib dipilih.' });
      return;
    }
    const transaction = db.createTopUpRequest(req.user.id, Number(amount), String(payment_method), payment_proof_url);
    res.status(201).json({
      message: 'Permintaan isi saldo berhasil dibuat. Silakan selesaikan pembayaran.',
      transaction
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal membuat permintaan isi saldo.' });
  }
});

// Upload Payment Proof for Top Up
apiRouter.post('/wallet/topup/:id/proof', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { payment_proof_url } = req.body;
    if (!payment_proof_url) {
      res.status(400).json({ error: 'Bukti pembayaran wajib diunggah.' });
      return;
    }
    const tx = db.uploadTopUpProof(req.user.id, req.params.id, payment_proof_url);
    res.json({
      message: 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.',
      transaction: tx
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengunggah bukti pembayaran.' });
  }
});

// Get Saved Recipients
apiRouter.get('/wallet/recipients', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const recipients = db.getWalletRecipients(req.user.id);
    res.json({ recipients });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat daftar penerima.' });
  }
});

// Add Saved Recipient
apiRouter.post('/wallet/recipients', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { recipient_name, recipient_type, account_identifier, provider } = req.body;
    if (!recipient_name || !recipient_type || !account_identifier) {
      res.status(400).json({ error: 'Nama, jenis penerima, dan nomor rekening/username wajib diisi.' });
      return;
    }
    const recipient = db.addWalletRecipient(req.user.id, {
      recipient_name,
      recipient_type,
      account_identifier,
      provider: provider || 'NEXA'
    });
    res.status(201).json({
      message: 'Penerima berhasil disimpan ke daftar Anda.',
      recipient
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menyimpan penerima.' });
  }
});

// Delete Saved Recipient
apiRouter.delete('/wallet/recipients/:id', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const success = db.deleteWalletRecipient(req.user.id, req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Penerima tidak ditemukan.' });
      return;
    }
    res.json({ message: 'Penerima berhasil dihapus.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menghapus penerima.' });
  }
});

// Search NEXA User for Transfer
apiRouter.get('/wallet/search-user', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const q = req.query.q as string || '';
    const users = db.searchNexaUserForTransfer(q, req.user.id);
    res.json({ users });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mencari pengguna.' });
  }
});

// Execute Transfer (Send Money)
apiRouter.post('/wallet/transfer', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { 
      recipient_type, 
      recipient_id, 
      recipient_name, 
      account_identifier, 
      provider, 
      amount, 
      notes, 
      idempotency_key, 
      pin 
    } = req.body;

    if (!recipient_type || !recipient_name || !account_identifier || !amount || !pin) {
      res.status(400).json({ error: 'Semua informasi transfer dan PIN wajib diisi.' });
      return;
    }

    const transaction = db.executeTransfer(req.user.id, {
      recipient_type,
      recipient_id,
      recipient_name,
      account_identifier,
      provider: provider || 'NEXA',
      amount: Number(amount),
      notes,
      idempotency_key,
      pin: String(pin)
    });

    res.status(200).json({
      message: recipient_type === 'nexa_user' 
        ? 'Transfer saldo NEXA berhasil terkirim seketika.' 
        : 'Permintaan transfer berhasil dibuat dan sedang diproses mitra pembayaran.',
      transaction
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memproses transaksi transfer.' });
  }
});

// ==================== ADMIN FINANCIAL MANAGEMENT ====================

// Admin Financial Overview
apiRouter.get('/admin/financial/overview', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  try {
    const dashboard = db.adminGetFinancialDashboard();
    res.json(dashboard);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat dasbor keuangan admin.' });
  }
});

// Admin Review Top Up
apiRouter.post('/admin/financial/topup/:id/review', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { action, reason } = req.body;
    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: 'Aksi harus berupa approve atau reject.' });
      return;
    }
    const tx = db.adminReviewTopUp(req.user.id, req.params.id, action, reason);
    res.json({
      message: action === 'approve' ? 'Top up berhasil disetujui & saldo pengguna ditambahkan.' : 'Top up berhasil ditolak.',
      transaction: tx
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memproses review top up.' });
  }
});

// Admin Manual Balance Adjustment
apiRouter.post('/admin/financial/adjustment', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { target_user_id, amount, type, reason } = req.body;
    if (!target_user_id || !amount || !type || !reason) {
      res.status(400).json({ error: 'ID Pengguna, nominal, jenis (credit/debit), dan alasan penyesuaian wajib diisi.' });
      return;
    }
    const adjustment = db.adminManualAdjustment(req.user.id, target_user_id, Number(amount), type, reason);
    res.json({
      message: 'Penyesuaian saldo berhasil diterapkan ke pengguna.',
      adjustment
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal melakukan penyesuaian saldo.' });
  }
});

// ============================================================
// TAHAP 5: NEXA MATCH — CARI JODOH (18+ DATING & MATCHMAKING)
// ============================================================

// Get Current User's Match Profile
apiRouter.get('/match/profile', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const profile = db.getMatchProfileByUserId(req.user.id);
    res.json({ profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat profil match.' });
  }
});

// Create or Update Match Profile
apiRouter.post('/match/profile', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { 
      display_name, 
      date_of_birth, 
      gender, 
      city, 
      bio, 
      profile_photos, 
      occupation, 
      education, 
      interests, 
      relationship_goal, 
      religion_preference_optional, 
      height_optional,
      search_preferences 
    } = req.body;

    if (!display_name || !date_of_birth || !gender || !city) {
      res.status(400).json({ error: 'Nama tampilan, tanggal lahir, gender, dan kota wajib diisi.' });
      return;
    }

    // Age validation (18+)
    const calculatedAge = db.calculateAge(date_of_birth);
    if (calculatedAge < 18) {
      res.status(403).json({ error: 'Maaf, fitur NEXA Match hanya diperuntukkan bagi pengguna berusia 18 tahun ke atas.' });
      return;
    }

    const profile = db.createOrUpdateMatchProfile(req.user.id, {
      display_name: display_name.trim(),
      date_of_birth,
      gender,
      city: city.trim(),
      bio: (bio || '').trim(),
      profile_photos: Array.isArray(profile_photos) && profile_photos.length > 0 ? profile_photos : undefined,
      occupation: (occupation || '').trim(),
      education: (education || '').trim(),
      interests: Array.isArray(interests) ? interests : [],
      relationship_goal: relationship_goal || 'serious',
      religion_preference_optional: (religion_preference_optional || '').trim(),
      height_optional: height_optional ? Number(height_optional) : undefined,
      search_preferences
    });

    res.json({
      message: 'Profil NEXA Match berhasil disimpan.',
      profile
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menyimpan profil match.' });
  }
});

// Toggle Match Profile Status (Active / Paused)
apiRouter.post('/match/status', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { status } = req.body; // 'active' | 'paused'
    const profile = db.toggleMatchProfileStatus(req.user.id, status);
    res.json({
      message: `Profil NEXA Match Anda sekarang ${profile.status === 'active' ? 'Aktif' : 'Dijeda (Tidak tampil di pencarian)'}.`,
      profile
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengubah status profil match.' });
  }
});

// Delete Match Profile
apiRouter.delete('/match/profile', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const success = db.deleteMatchProfile(req.user.id);
    if (!success) {
      res.status(404).json({ error: 'Profil match tidak ditemukan.' });
      return;
    }
    res.json({ message: 'Profil NEXA Match Anda telah dihapus.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menghapus profil match.' });
  }
});

// Discover Profiles
apiRouter.get('/match/discover', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { min_age, max_age, gender, city, goal, verified_only, limit } = req.query;

    const filterObj: any = {};
    if (min_age) filterObj.min_age = Number(min_age);
    if (max_age) filterObj.max_age = Number(max_age);
    if (gender) filterObj.gender_preference = [gender as string];
    if (city) filterObj.city_preference = String(city);
    if (goal) filterObj.relationship_goals = [goal as any];
    if (verified_only === 'true') filterObj.verified_only = true;

    const result = db.getDiscoverProfiles(req.user.id, filterObj, limit ? Number(limit) : 20);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat rekomendasi jodoh.' });
  }
});

// Like Profile
apiRouter.post('/match/like', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { target_user_id, is_super_like } = req.body;
    if (!target_user_id) {
      res.status(400).json({ error: 'ID Pengguna target wajib diisi.' });
      return;
    }

    const result = db.likeMatchProfile(req.user.id, target_user_id, Boolean(is_super_like));
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal menyukai profil.' });
  }
});

// Pass Profile
apiRouter.post('/match/pass', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { target_user_id } = req.body;
    if (!target_user_id) {
      res.status(400).json({ error: 'ID Pengguna target wajib diisi.' });
      return;
    }

    db.passMatchProfile(req.user.id, target_user_id);
    res.json({ message: 'Profil dilewati.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal melewati profil.' });
  }
});

// Get My Matches
apiRouter.get('/match/matches', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const matches = db.getMyMatches(req.user.id);
    res.json({ matches });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat daftar match.' });
  }
});

// Get Who Liked Me
apiRouter.get('/match/likes', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const likes = db.getWhoLikedMe(req.user.id);
    res.json({ likes });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat daftar orang yang menyukai Anda.' });
  }
});

// Unmatch
apiRouter.post('/match/unmatch', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { match_id } = req.body;
    if (!match_id) {
      res.status(400).json({ error: 'ID Match wajib disertakan.' });
      return;
    }

    const success = db.unmatchUser(req.user.id, match_id);
    if (!success) {
      res.status(404).json({ error: 'Match tidak ditemukan atau sudah tidak aktif.' });
      return;
    }

    res.json({ message: 'Berhasil membatalkan match.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal membatalkan match.' });
  }
});

// Block Match User
apiRouter.post('/match/block', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { target_user_id } = req.body;
    if (!target_user_id) {
      res.status(400).json({ error: 'ID Pengguna target wajib diisi.' });
      return;
    }

    db.blockMatchUser(req.user.id, target_user_id);
    res.json({ message: 'Pengguna berhasil diblokir dari NEXA Match dan pesan.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memblokir pengguna.' });
  }
});

// Report Match User
apiRouter.post('/match/report', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { target_user_id, category, reason } = req.body;
    if (!target_user_id || !category || !reason) {
      res.status(400).json({ error: 'ID Pengguna, kategori laporan, dan alasan wajib diisi.' });
      return;
    }

    const report = db.reportMatchProfile(req.user.id, target_user_id, category, reason);
    res.json({
      message: 'Laporan Anda telah diterima dan akan segera ditinjau oleh tim pengawas NEXA Match.',
      report
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengirim laporan.' });
  }
});

// Request Photo Verification
apiRouter.post('/match/verify', requireAuth, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { photo_url } = req.body;
    if (!photo_url) {
      res.status(400).json({ error: 'Foto selfie verifikasi wajib disertakan.' });
      return;
    }

    const profile = db.requestMatchVerification(req.user.id, photo_url);
    res.json({
      message: 'Pengajuan verifikasi foto berhasil dikirim. Tim kurasi kami akan memverifikasi dalam waktu 1x24 jam.',
      profile
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal mengajukan verifikasi.' });
  }
});

// ==================== ADMIN MATCH MODERATION ====================

// Admin Match Dashboard
apiRouter.get('/admin/match/overview', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  try {
    const dashboard = db.adminGetMatchDashboard();
    res.json(dashboard);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat statistik moderasi match.' });
  }
});

// Admin Get Match Profiles
apiRouter.get('/admin/match/profiles', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const profiles = db.adminGetMatchProfiles(status as string, search as string);
    res.json({ profiles });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat daftar profil match.' });
  }
});

// Admin Update Profile Status
apiRouter.post('/admin/match/profile-status', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { profile_id, status } = req.body;
    if (!profile_id || !status) {
      res.status(400).json({ error: 'ID Profil dan status (active/paused/suspended) wajib disertakan.' });
      return;
    }

    const updated = db.adminUpdateMatchProfileStatus(profile_id, status, req.user.id);
    if (!updated) {
      res.status(404).json({ error: 'Profil tidak ditemukan.' });
      return;
    }

    res.json({
      message: `Status profil berhasil diubah menjadi ${status}.`,
      profile: updated
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memperbarui status profil.' });
  }
});

// Admin Review Verification
apiRouter.post('/admin/match/review-verification', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { profile_id, status, notes } = req.body;
    if (!profile_id || !status || !['verified', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'ID Profil dan status verifikasi (verified/rejected) wajib disertakan.' });
      return;
    }

    const updated = db.adminReviewMatchVerification(profile_id, status, req.user.id, notes);
    if (!updated) {
      res.status(404).json({ error: 'Profil tidak ditemukan.' });
      return;
    }

    res.json({
      message: status === 'verified' ? 'Profil berhasil diverifikasi resmi.' : 'Verifikasi profil ditolak.',
      profile: updated
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal meninjau verifikasi.' });
  }
});

// Admin Get Reports
apiRouter.get('/admin/match/reports', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const reports = db.adminGetMatchReports(status as string);
    res.json({ reports });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memuat laporan match.' });
  }
});

// Admin Review Report
apiRouter.post('/admin/match/review-report', requireAuth, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  try {
    const { report_id, status, action, notes } = req.body;
    if (!report_id || !status) {
      res.status(400).json({ error: 'ID Laporan dan status peninjauan wajib disertakan.' });
      return;
    }

    const reviewed = db.adminReviewMatchReport(report_id, status, action || 'none', req.user.id, notes);
    if (!reviewed) {
      res.status(404).json({ error: 'Laporan tidak ditemukan.' });
      return;
    }

    res.json({
      message: 'Laporan berhasil ditinjau dan tindakan telah diterapkan.',
      report: reviewed
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Gagal memproses laporan.' });
  }
});


