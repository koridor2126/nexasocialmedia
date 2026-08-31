import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { 
  User, Post, Like, Comment, Follow, Notification, 
  Conversation, Message, Report, Block, UserRole,
  UserDevice, NotificationPreferences,
  MonetizationApplication, EndorsementCampaign, EndorsementOffer,
  EndorsementSubmission, CreatorEarning, CreatorAchievement,
  CreatorStats, MONETIZATION_REQUIREMENTS, MonetizationStatus,
  WalletTransaction, WalletRecipient, FinancialAuditLog, WalletAdjustment,
  UserWalletInfo, WALLET_CONFIG, RecipientType, WalletTransactionType, WalletTransactionStatus,
  AdminFinancialDashboard,
  MatchProfile, MatchLike, MatchPass, MatchItem, MatchReport,
  MatchSearchPreferences, MatchAdminDashboard, MATCH_CONFIG,
  MatchVerificationStatus, MatchProfileStatus, MatchReportCategory
} from '../types.js';
import { fcmService } from './fcm.js';

interface DatabaseSchema {
  users: User[];
  posts: Post[];
  likes: Like[];
  comments: Comment[];
  follows: Follow[];
  notifications: Notification[];
  conversations: { id: string; member_ids: string[]; created_at: string; updated_at: string }[];
  messages: Message[];
  reports: Report[];
  blocks: Block[];
  user_devices: UserDevice[];
  notification_preferences: NotificationPreferences[];
  monetization_applications: MonetizationApplication[];
  endorsement_campaigns: EndorsementCampaign[];
  endorsement_offers: EndorsementOffer[];
  endorsement_submissions: EndorsementSubmission[];
  creator_earnings: CreatorEarning[];
  creator_achievements: CreatorAchievement[];
  wallet_transactions: WalletTransaction[];
  wallet_recipients: WalletRecipient[];
  financial_audit_logs: FinancialAuditLog[];
  wallet_adjustments: WalletAdjustment[];
  // Tahap 5: NEXA Match (Cari Jodoh) Collections
  match_profiles: MatchProfile[];
  match_likes: MatchLike[];
  match_passes: MatchPass[];
  matches: MatchItem[];
  match_reports: MatchReport[];
  match_daily_limits: Record<string, { date: string; count: number }>;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'nexa_database.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

class DatabaseManager {
  private data: DatabaseSchema = {
    users: [],
    posts: [],
    likes: [],
    comments: [],
    follows: [],
    notifications: [],
    conversations: [],
    messages: [],
    reports: [],
    blocks: [],
    user_devices: [],
    notification_preferences: [],
    monetization_applications: [],
    endorsement_campaigns: [],
    endorsement_offers: [],
    endorsement_submissions: [],
    creator_earnings: [],
    creator_achievements: [],
    wallet_transactions: [],
    wallet_recipients: [],
    financial_audit_logs: [],
    wallet_adjustments: [],
    match_profiles: [],
    match_likes: [],
    match_passes: [],
    matches: [],
    match_reports: [],
    match_daily_limits: {}
  };

  constructor() {
    this.loadDatabase();
  }

  private loadDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.user_devices) this.data.user_devices = [];
        if (!this.data.notification_preferences) this.data.notification_preferences = [];
        if (!this.data.monetization_applications) this.data.monetization_applications = [];
        if (!this.data.endorsement_campaigns) this.data.endorsement_campaigns = [];
        if (!this.data.endorsement_offers) this.data.endorsement_offers = [];
        if (!this.data.endorsement_submissions) this.data.endorsement_submissions = [];
        if (!this.data.creator_earnings) this.data.creator_earnings = [];
        if (!this.data.creator_achievements) this.data.creator_achievements = [];
        if (!this.data.wallet_transactions) this.data.wallet_transactions = [];
        if (!this.data.wallet_recipients) this.data.wallet_recipients = [];
        if (!this.data.financial_audit_logs) this.data.financial_audit_logs = [];
        if (!this.data.wallet_adjustments) this.data.wallet_adjustments = [];
        if (!this.data.match_profiles) this.data.match_profiles = [];
        if (!this.data.match_likes) this.data.match_likes = [];
        if (!this.data.match_passes) this.data.match_passes = [];
        if (!this.data.matches) this.data.matches = [];
        if (!this.data.match_reports) this.data.match_reports = [];
        if (!this.data.match_daily_limits) this.data.match_daily_limits = {};

        // Seed initial match profiles for default users if none exist
        if (this.data.match_profiles.length === 0) {
          this.seedMatchData();
        }

        // Ensure users have monetization & wallet fields initialized
        this.data.users.forEach(u => {
          if (!u.monetization_status) {
            u.monetization_status = u.role === 'creator' ? 'active' : 'none';
          }
          if (u.watch_hours === undefined) {
            u.watch_hours = u.role === 'creator' ? 4200 : 150;
          }
          if (u.pending_balance === undefined) u.pending_balance = 0;
          if (u.available_balance === undefined) u.available_balance = 0;
          if (u.paid_balance === undefined) u.paid_balance = 0;
          if (u.wallet_balance === undefined) u.wallet_balance = 0;
          if (!u.wallet_status) u.wallet_status = 'active';
          if (u.mask_financial_notifs === undefined) u.mask_financial_notifs = false;
        });

        // If no campaigns seeded yet, add initial seed campaigns
        if (this.data.endorsement_campaigns.length === 0) {
          this.seedMonetizationData();
        }

        console.log(`[Database] Loaded existing database with ${this.data.users.length} users, ${this.data.posts.length} posts, and ${this.data.endorsement_campaigns.length} campaigns.`);
      } else {
        console.log(`[Database] Initializing fresh database with seed data...`);
        this.seedDatabase();
        this.saveDatabase();
      }
    } catch (err) {
      console.error(`[Database] Error reading database file, re-seeding:`, err);
      this.seedDatabase();
      this.saveDatabase();
    }
  }

  public saveDatabase() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`[Database] Failed to write database:`, err);
    }
  }

  private seedDatabase() {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('password123', salt);

    const now = new Date().toISOString();
    const timePast = (hours: number) => new Date(Date.now() - hours * 3600 * 1000).toISOString();

    const users: User[] = [
      {
        id: 'user_admin',
        full_name: 'NEXA Official',
        username: 'nexa',
        email: 'admin@nexa.app',
        password_hash: defaultPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
        bio: 'Akun resmi ekosistem NEXA. Membangun masa depan interaksi digital, kreator, dan inovasi teknologi.',
        role: 'admin',
        is_verified: true,
        website: 'https://nexa.app',
        followers_count: 3450,
        following_count: 12,
        posts_count: 2,
        likes_received_count: 5820,
        created_at: timePast(720),
        updated_at: now
      },
      {
        id: 'user_1',
        full_name: 'Arvin Pratama',
        username: 'arvin',
        email: 'arvin@example.com',
        password_hash: defaultPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
        bio: 'Product Designer & Visual Storyteller. Berbagi perspektif estetika, arsitektur, dan teknologi modern.',
        role: 'creator',
        is_verified: true,
        website: 'https://arvinpratama.design',
        followers_count: 1240,
        following_count: 215,
        posts_count: 4,
        likes_received_count: 3420,
        created_at: timePast(500),
        updated_at: now
      },
      {
        id: 'user_2',
        full_name: 'Clara Salsabila',
        username: 'clarasals',
        email: 'clara@example.com',
        password_hash: defaultPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200&auto=format&fit=crop&q=80',
        bio: 'Tech Enthusiast & Filmmaker. Menangkap momen estetis dan inspirasi harian di Jakarta & Bali.',
        role: 'creator',
        is_verified: true,
        website: 'https://youtube.com/@claratech',
        followers_count: 2890,
        following_count: 180,
        posts_count: 3,
        likes_received_count: 4100,
        created_at: timePast(400),
        updated_at: now
      },
      {
        id: 'user_3',
        full_name: 'Studio Kroma Indonesia',
        username: 'studiokroma',
        email: 'contact@studiokroma.id',
        password_hash: defaultPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=200&auto=format&fit=crop&q=80',
        cover_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
        bio: 'Kreatif studio berbasis di Bandung. Menghubungkan seni arsitektur dan inovasi interior masa depan.',
        role: 'brand',
        is_verified: true,
        website: 'https://studiokroma.id',
        followers_count: 4150,
        following_count: 95,
        posts_count: 3,
        likes_received_count: 6720,
        created_at: timePast(350),
        updated_at: now
      },
      {
        id: 'user_4',
        full_name: 'Dion Wicaksono',
        username: 'diondev',
        email: 'dion@example.com',
        password_hash: defaultPasswordHash,
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        bio: 'Software Engineer & AI Builder. Senang membangun pengalaman mobile web yang cepat dan intuitif.',
        role: 'user',
        is_verified: false,
        followers_count: 650,
        following_count: 340,
        posts_count: 2,
        likes_received_count: 890,
        created_at: timePast(200),
        updated_at: now
      }
    ];

    const posts: Post[] = [
      {
        id: 'post_video_1',
        user_id: 'user_2',
        type: 'video',
        caption: 'Eksplorasi sinematik pagi hari di pesisir Sanur. Cahaya alami selalu memberikan ketenangan tersendiri bagi proses kreatif.',
        hashtags: ['creative', 'cinematic', 'filmmaking', 'nexa'],
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        aspect_ratio: '16:9',
        duration_seconds: 15,
        visibility: 'public',
        view_count: 1420,
        like_count: 184,
        comment_count: 28,
        share_count: 42,
        created_at: timePast(3),
        updated_at: timePast(3)
      },
      {
        id: 'post_photo_1',
        user_id: 'user_1',
        type: 'photo',
        caption: 'Mendefinisikan kembali antarmuka digital yang tenang. Desain yang baik bukan hanya tentang bagaimana tampilannya, tetapi bagaimana rasanya saat digunakan setiap hari.',
        hashtags: ['design', 'minimalism', 'technology', 'uiux'],
        media_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&auto=format&fit=crop&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop&q=80',
        aspect_ratio: '4:5',
        visibility: 'public',
        view_count: 2850,
        like_count: 320,
        comment_count: 45,
        share_count: 67,
        created_at: timePast(8),
        updated_at: timePast(8)
      },
      {
        id: 'post_video_2',
        user_id: 'user_admin',
        type: 'video',
        caption: 'Selamat datang di NEXA Tahap 1! Fondasi awal ekosistem digital mobile-first yang menghubungkan Anda dengan creator dan ide-ide terbaik.',
        hashtags: ['nexa', 'launch', 'startup', 'innovation'],
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
        thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
        aspect_ratio: '16:9',
        duration_seconds: 15,
        visibility: 'public',
        view_count: 4920,
        like_count: 610,
        comment_count: 84,
        share_count: 120,
        created_at: timePast(14),
        updated_at: timePast(14)
      },
      {
        id: 'post_photo_2',
        user_id: 'user_3',
        type: 'photo',
        caption: 'Proyek terbaru Studio Kroma: Ruang kerja terbuka dengan perpaduan material kayu jati natural dan pencahayaan skylight lembut.',
        hashtags: ['architecture', 'interior', 'minimalist', 'workspace'],
        media_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80',
        aspect_ratio: '1:1',
        visibility: 'public',
        view_count: 1780,
        like_count: 245,
        comment_count: 19,
        share_count: 31,
        created_at: timePast(24),
        updated_at: timePast(24)
      },
      {
        id: 'post_photo_3',
        user_id: 'user_4',
        type: 'photo',
        caption: 'Setup pagi untuk sprint pengembangan kode. TypeScript dan Tailwind CSS membuat proses prototyping terasa begitu menyenangkan.',
        hashtags: ['developer', 'coding', 'tech', 'buildinpublic'],
        media_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&auto=format&fit=crop&q=80',
        thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&auto=format&fit=crop&q=80',
        aspect_ratio: '4:5',
        visibility: 'public',
        view_count: 980,
        like_count: 112,
        comment_count: 14,
        share_count: 8,
        created_at: timePast(36),
        updated_at: timePast(36)
      }
    ];

    const follows: Follow[] = [
      { id: 'f_1', follower_id: 'user_1', following_id: 'user_admin', created_at: timePast(100) },
      { id: 'f_2', follower_id: 'user_2', following_id: 'user_admin', created_at: timePast(100) },
      { id: 'f_3', follower_id: 'user_1', following_id: 'user_2', created_at: timePast(90) },
      { id: 'f_4', follower_id: 'user_2', following_id: 'user_1', created_at: timePast(80) },
      { id: 'f_5', follower_id: 'user_4', following_id: 'user_1', created_at: timePast(50) },
      { id: 'f_6', follower_id: 'user_4', following_id: 'user_2', created_at: timePast(50) }
    ];

    const likes: Like[] = [
      { id: 'l_1', user_id: 'user_1', post_id: 'post_video_1', created_at: timePast(2) },
      { id: 'l_2', user_id: 'user_admin', post_id: 'post_video_1', created_at: timePast(2) },
      { id: 'l_3', user_id: 'user_2', post_id: 'post_photo_1', created_at: timePast(5) },
      { id: 'l_4', user_id: 'user_4', post_id: 'post_photo_1', created_at: timePast(4) },
      { id: 'l_5', user_id: 'user_1', post_id: 'post_video_2', created_at: timePast(12) }
    ];

    const comments: Comment[] = [
      {
        id: 'c_1',
        user_id: 'user_1',
        post_id: 'post_video_1',
        parent_id: null,
        content: 'Tone warnanya sangat halus dan natural! Menggunakan lensa apa untuk capture ini?',
        created_at: timePast(2),
        updated_at: timePast(2)
      },
      {
        id: 'c_2',
        user_id: 'user_2',
        post_id: 'post_video_1',
        parent_id: 'c_1',
        content: 'Terima kasih Arvin! Ini menggunakan 35mm f/1.4 dengan filter ND variabel.',
        created_at: timePast(1.5),
        updated_at: timePast(1.5)
      },
      {
        id: 'c_3',
        user_id: 'user_4',
        post_id: 'post_photo_1',
        parent_id: null,
        content: 'Sangat setuju! Simplicity is the ultimate sophistication.',
        created_at: timePast(6),
        updated_at: timePast(6)
      },
      {
        id: 'c_4',
        user_id: 'user_2',
        post_id: 'post_video_2',
        parent_id: null,
        content: 'Bangga menjadi bagian dari peluncuran awal NEXA! Sukses untuk seluruh tim.',
        created_at: timePast(13),
        updated_at: timePast(13)
      }
    ];

    const notifications: Notification[] = [
      {
        id: 'n_1',
        recipient_id: 'user_1',
        actor_id: 'user_2',
        type: 'like',
        post_id: 'post_photo_1',
        is_read: false,
        created_at: timePast(1)
      },
      {
        id: 'n_2',
        recipient_id: 'user_1',
        actor_id: 'user_4',
        type: 'comment',
        post_id: 'post_photo_1',
        content: 'Sangat setuju! Simplicity is the ultimate sophistication.',
        is_read: false,
        created_at: timePast(4)
      },
      {
        id: 'n_3',
        recipient_id: 'user_1',
        actor_id: 'user_3',
        type: 'follow',
        is_read: true,
        created_at: timePast(15)
      },
      {
        id: 'n_4',
        recipient_id: 'user_1',
        actor_id: 'user_2',
        type: 'share',
        post_id: 'post_photo_1',
        is_read: true,
        created_at: timePast(20)
      }
    ];

    const conversations = [
      {
        id: 'conv_1',
        member_ids: ['user_1', 'user_2'],
        created_at: timePast(24),
        updated_at: timePast(0.5)
      },
      {
        id: 'conv_2',
        member_ids: ['user_1', 'user_admin'],
        created_at: timePast(48),
        updated_at: timePast(10)
      }
    ];

    const messages: Message[] = [
      {
        id: 'msg_1',
        conversation_id: 'conv_1',
        sender_id: 'user_2',
        content: 'Halo Arvin! Menarik sekali konsep desain antarmuka yang kamu posting kemarin.',
        created_at: timePast(1),
        is_read: true
      },
      {
        id: 'msg_2',
        conversation_id: 'conv_1',
        sender_id: 'user_1',
        content: 'Halo Clara, terima kasih banyak! Sedang eksplorasi sistem design token yang lebih scalable.',
        created_at: timePast(0.8),
        is_read: true
      },
      {
        id: 'msg_3',
        conversation_id: 'conv_1',
        sender_id: 'user_2',
        content: 'Bagus sekali! Nanti kalau ada project kolaborasi video tech kita bisa kombinasikan.',
        created_at: timePast(0.5),
        is_read: false
      },
      {
        id: 'msg_4',
        conversation_id: 'conv_2',
        sender_id: 'user_admin',
        content: 'Selamat datang di NEXA! Jika membutuhkan panduan creator, hubungi kami kapan saja.',
        created_at: timePast(10),
        is_read: true
      }
    ];

    this.data = {
      users,
      posts,
      likes,
      comments,
      follows,
      notifications,
      conversations,
      messages,
      reports: [],
      blocks: [],
      user_devices: [],
      notification_preferences: [],
      monetization_applications: [],
      endorsement_campaigns: [],
      endorsement_offers: [],
      endorsement_submissions: [],
      creator_earnings: [],
      creator_achievements: [],
      wallet_transactions: [],
      wallet_recipients: [],
      financial_audit_logs: [],
      wallet_adjustments: [],
      match_profiles: [],
      match_likes: [],
      match_passes: [],
      matches: [],
      match_reports: [],
      match_daily_limits: {}
    };
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users.map(u => {
      const { password_hash, ...safeUser } = u;
      return safeUser as User;
    });
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByUsernameOrEmail(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );
  }

  public createUser(userData: Partial<User> & { password_hash: string }): User {
    const newUser: User = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      full_name: userData.full_name || '',
      username: (userData.username || '').toLowerCase().replace(/[^a-z0-9_.]/g, ''),
      email: (userData.email || '').toLowerCase().trim(),
      password_hash: userData.password_hash,
      avatar_url: userData.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${userData.username}`,
      bio: userData.bio || 'Pengguna baru di NEXA.',
      role: userData.role || 'user',
      is_verified: false,
      website: userData.website || '',
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
      likes_received_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.saveDatabase();
    const { password_hash, ...safeUser } = newUser;
    return safeUser as User;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveDatabase();
    const { password_hash, ...safeUser } = this.data.users[idx];
    return safeUser as User;
  }

  // --- Posts ---
  public getPosts(currentUserId?: string, filter?: 'for_you' | 'following' | 'videos', tag?: string): Post[] {
    let list = [...this.data.posts];

    // Filter by tag
    if (tag) {
      const cleanTag = tag.replace('#', '').toLowerCase();
      list = list.filter(p => p.hashtags?.some(h => h.toLowerCase() === cleanTag));
    }

    // Filter by type
    if (filter === 'videos') {
      list = list.filter(p => p.type === 'video');
    }

    // Filter by following
    if (filter === 'following' && currentUserId) {
      const followingIds = this.data.follows
        .filter(f => f.follower_id === currentUserId)
        .map(f => f.following_id);
      // include own posts too in following feed
      followingIds.push(currentUserId);
      list = list.filter(p => followingIds.includes(p.user_id));
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Enrich with author & user state
    return list.map(p => this.enrichPost(p, currentUserId));
  }

  public findPostById(id: string, currentUserId?: string): Post | undefined {
    const post = this.data.posts.find(p => p.id === id);
    if (!post) return undefined;
    return this.enrichPost(post, currentUserId);
  }

  public createPost(postData: Partial<Post> & { user_id: string }): Post {
    const newPost: Post = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: postData.user_id,
      type: postData.type || 'photo',
      caption: postData.caption || '',
      hashtags: postData.hashtags || [],
      media_url: postData.media_url,
      thumbnail_url: postData.thumbnail_url || postData.media_url,
      aspect_ratio: postData.aspect_ratio || '1:1',
      duration_seconds: postData.duration_seconds || 0,
      visibility: postData.visibility || 'public',
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      share_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data.posts.unshift(newPost);

    // Increment user's posts_count
    const user = this.data.users.find(u => u.id === postData.user_id);
    if (user) {
      user.posts_count = (user.posts_count || 0) + 1;
    }

    this.saveDatabase();
    return this.enrichPost(newPost, postData.user_id);
  }

  public deletePost(id: string, userId: string): boolean {
    const idx = this.data.posts.findIndex(p => p.id === id);
    if (idx === -1) return false;
    const post = this.data.posts[idx];

    // Check ownership or admin
    const requester = this.data.users.find(u => u.id === userId);
    if (post.user_id !== userId && requester?.role !== 'admin') {
      return false;
    }

    this.data.posts.splice(idx, 1);
    // Cleanup likes, comments, notifications
    this.data.likes = this.data.likes.filter(l => l.post_id !== id);
    this.data.comments = this.data.comments.filter(c => c.post_id !== id);
    this.data.notifications = this.data.notifications.filter(n => n.post_id !== id);

    // Decrement user post count
    const author = this.data.users.find(u => u.id === post.user_id);
    if (author && author.posts_count > 0) {
      author.posts_count -= 1;
    }

    this.saveDatabase();
    return true;
  }

  public incrementPostView(postId: string): number {
    const post = this.data.posts.find(p => p.id === postId);
    if (post) {
      post.view_count = (post.view_count || 0) + 1;
      const author = this.data.users.find(u => u.id === post.user_id);
      if (author) {
        // Increment watch hours proportionally
        const hoursDelta = post.type === 'video' ? 0.05 : 0.01;
        author.watch_hours = Math.round(((author.watch_hours || 0) + hoursDelta) * 100) / 100;
        this.checkCreatorMilestones(author.id);
      }
      this.saveDatabase();
      return post.view_count;
    }
    return 0;
  }

  public incrementPostShare(postId: string, userId?: string): number {
    const post = this.data.posts.find(p => p.id === postId);
    if (post) {
      post.share_count = (post.share_count || 0) + 1;
      // Notify author if viewer is different
      if (userId && userId !== post.user_id) {
        const actor = this.findUserById(userId);
        const actorUsername = actor?.username || 'seseorang';
        this.createNotification({
          recipient_id: post.user_id,
          actor_id: userId,
          type: 'share',
          post_id: post.id,
          related_post_id: post.id,
          related_user_id: userId,
          title: 'Postingan Dibagikan',
          content: `↗️ Postingan Anda dibagikan oleh @${actorUsername}.`,
          message: `↗️ Postingan Anda dibagikan oleh @${actorUsername}.`
        });
      }
      this.saveDatabase();
      return post.share_count;
    }
    return 0;
  }

  // --- Likes ---
  public toggleLike(userId: string, postId: string): { isLiked: boolean; likeCount: number } {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    const existingIdx = this.data.likes.findIndex(
      l => l.user_id === userId && l.post_id === postId
    );

    let isLiked = false;
    if (existingIdx >= 0) {
      // Unlike
      this.data.likes.splice(existingIdx, 1);
      post.like_count = Math.max(0, (post.like_count || 0) - 1);
      isLiked = false;
      // Decrement author's received likes
      const author = this.data.users.find(u => u.id === post.user_id);
      if (author && (author.likes_received_count || 0) > 0) {
        author.likes_received_count = (author.likes_received_count || 1) - 1;
      }
    } else {
      // Like
      const newLike: Like = {
        id: 'like_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString()
      };
      this.data.likes.push(newLike);
      post.like_count = (post.like_count || 0) + 1;
      isLiked = true;

      // Update author likes received count
      const author = this.data.users.find(u => u.id === post.user_id);
      if (author) {
        author.likes_received_count = (author.likes_received_count || 0) + 1;
      }

      // Notify post owner
      if (userId !== post.user_id) {
        const actor = this.findUserById(userId);
        const actorUsername = actor?.username || 'seseorang';
        this.createNotification({
          recipient_id: post.user_id,
          actor_id: userId,
          type: 'like',
          post_id: postId,
          related_post_id: postId,
          related_user_id: userId,
          title: 'Suka Baru',
          content: `❤️ @${actorUsername} menyukai postingan Anda.`,
          message: `❤️ @${actorUsername} menyukai postingan Anda.`
        });
      }
    }

    this.saveDatabase();
    return { isLiked, likeCount: post.like_count };
  }

  // --- Comments ---
  public getComments(postId: string): Comment[] {
    const rawComments = this.data.comments
      .filter(c => c.post_id === postId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Enrich with user object
    const enriched = rawComments.map(c => {
      const u = this.findUserById(c.user_id);
      let safeU: User | undefined;
      if (u) {
        const { password_hash, ...rest } = u;
        safeU = rest as User;
      }
      return { ...c, user: safeU };
    });

    // Group tree (top-level and replies)
    const topLevel: Comment[] = [];
    const replyMap = new Map<string, Comment[]>();

    enriched.forEach(c => {
      if (c.parent_id) {
        const existing = replyMap.get(c.parent_id) || [];
        existing.push(c);
        replyMap.set(c.parent_id, existing);
      } else {
        topLevel.push(c);
      }
    });

    return topLevel.map(c => ({
      ...c,
      replies: replyMap.get(c.id) || []
    }));
  }

  public createComment(userId: string, postId: string, content: string, parentId?: string | null): Comment {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    const newComment: Comment = {
      id: 'comment_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      post_id: postId,
      parent_id: parentId || null,
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.comments.push(newComment);
    post.comment_count = (post.comment_count || 0) + 1;

    // Send notification
    const actor = this.findUserById(userId);
    const actorUsername = actor?.username || 'seseorang';
    if (parentId) {
      const parentComment = this.data.comments.find(c => c.id === parentId);
      if (parentComment && parentComment.user_id !== userId) {
        this.createNotification({
          recipient_id: parentComment.user_id,
          actor_id: userId,
          type: 'comment',
          post_id: postId,
          related_post_id: postId,
          related_user_id: userId,
          title: 'Komentar Baru',
          content: `💬 @${actorUsername} mengomentari postingan Anda.`,
          message: `💬 @${actorUsername} mengomentari postingan Anda.`
        });
      }
    } else if (post.user_id !== userId) {
      this.createNotification({
        recipient_id: post.user_id,
        actor_id: userId,
        type: 'comment',
        post_id: postId,
        related_post_id: postId,
        related_user_id: userId,
        title: 'Komentar Baru',
        content: `💬 @${actorUsername} mengomentari postingan Anda.`,
        message: `💬 @${actorUsername} mengomentari postingan Anda.`
      });
    }

    this.saveDatabase();

    const u = this.findUserById(userId);
    let safeU: User | undefined;
    if (u) {
      const { password_hash, ...rest } = u;
      safeU = rest as User;
    }

    return { ...newComment, user: safeU, replies: [] };
  }

  public deleteComment(commentId: string, userId: string): boolean {
    const idx = this.data.comments.findIndex(c => c.id === commentId);
    if (idx === -1) return false;
    const comment = this.data.comments[idx];

    const requester = this.data.users.find(u => u.id === userId);
    if (comment.user_id !== userId && requester?.role !== 'admin') {
      return false;
    }

    // Also remove child replies
    const toRemoveIds = [commentId];
    this.data.comments.forEach(c => {
      if (c.parent_id === commentId) {
        toRemoveIds.push(c.id);
      }
    });

    this.data.comments = this.data.comments.filter(c => !toRemoveIds.includes(c.id));

    const post = this.data.posts.find(p => p.id === comment.post_id);
    if (post) {
      post.comment_count = Math.max(0, (post.comment_count || 0) - toRemoveIds.length);
    }

    this.saveDatabase();
    return true;
  }

  // --- Follows ---
  public toggleFollow(followerId: string, followingId: string): { isFollowing: boolean; followersCount: number } {
    if (followerId === followingId) throw new Error('Cannot follow yourself');

    const follower = this.data.users.find(u => u.id === followerId);
    const target = this.data.users.find(u => u.id === followingId);
    if (!follower || !target) throw new Error('User not found');

    const idx = this.data.follows.findIndex(
      f => f.follower_id === followerId && f.following_id === followingId
    );

    let isFollowing = false;
    if (idx >= 0) {
      // Unfollow
      this.data.follows.splice(idx, 1);
      follower.following_count = Math.max(0, (follower.following_count || 0) - 1);
      target.followers_count = Math.max(0, (target.followers_count || 0) - 1);
      isFollowing = false;
    } else {
      // Follow
      const newFollow: Follow = {
        id: 'follow_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString()
      };
      this.data.follows.push(newFollow);
      follower.following_count = (follower.following_count || 0) + 1;
      target.followers_count = (target.followers_count || 0) + 1;
      isFollowing = true;

      // Notification
      const followerUser = this.findUserById(followerId);
      const actorUsername = followerUser?.username || 'seseorang';
      this.createNotification({
        recipient_id: followingId,
        actor_id: followerId,
        type: 'follow',
        related_user_id: followerId,
        title: 'Pengikut Baru',
        content: `👤 @${actorUsername} mulai mengikuti Anda.`,
        message: `👤 @${actorUsername} mulai mengikuti Anda.`
      });

      this.checkCreatorMilestones(target.id);
    }

    this.saveDatabase();
    return { isFollowing, followersCount: target.followers_count };
  }

  public isUserFollowing(followerId: string, followingId: string): boolean {
    return this.data.follows.some(
      f => f.follower_id === followerId && f.following_id === followingId
    );
  }

  public getFollowers(userId: string): User[] {
    const followerIds = this.data.follows
      .filter(f => f.following_id === userId)
      .map(f => f.follower_id);
    return this.data.users
      .filter(u => followerIds.includes(u.id))
      .map(u => {
        const { password_hash, ...safe } = u;
        return safe as User;
      });
  }

  public getFollowing(userId: string): User[] {
    const followingIds = this.data.follows
      .filter(f => f.follower_id === userId)
      .map(f => f.following_id);
    return this.data.users
      .filter(u => followingIds.includes(u.id))
      .map(u => {
        const { password_hash, ...safe } = u;
        return safe as User;
      });
  }

  // --- Notifications & Preferences ---
  public getNotifications(userId: string): Notification[] {
    const notifs = this.data.notifications
      .filter(n => n.recipient_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return notifs.map(n => {
      const actor = n.actor_id ? this.findUserById(n.actor_id) : undefined;
      let safeActor: User | undefined;
      if (actor) {
        const { password_hash, ...rest } = actor;
        safeActor = rest as User;
      }
      const post = n.post_id ? this.data.posts.find(p => p.id === n.post_id) : undefined;
      return {
        ...n,
        actor: safeActor,
        post
      };
    });
  }

  public createNotification(notifData: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Notification {
    const newNotif: Notification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      recipient_id: notifData.recipient_id,
      actor_id: notifData.actor_id,
      type: notifData.type,
      title: notifData.title || this.getDefaultNotificationTitle(notifData.type),
      content: notifData.content || notifData.message || '',
      message: notifData.message || notifData.content || '',
      post_id: notifData.post_id || notifData.related_post_id || null,
      related_post_id: notifData.related_post_id || notifData.post_id || null,
      related_user_id: notifData.related_user_id || notifData.actor_id || null,
      conversation_id: notifData.conversation_id || null,
      is_read: false,
      created_at: new Date().toISOString()
    };

    this.data.notifications.unshift(newNotif);
    this.saveDatabase();

    // Check user's notification preferences before dispatching push notification
    try {
      const prefs = this.getNotificationPreferences(notifData.recipient_id);
      let isCategoryAllowed = true;

      if (!prefs.push_enabled) {
        isCategoryAllowed = false;
      } else {
        switch (notifData.type) {
          case 'follow':
            isCategoryAllowed = prefs.new_followers;
            break;
          case 'like':
            isCategoryAllowed = prefs.likes;
            break;
          case 'comment':
            isCategoryAllowed = prefs.comments;
            break;
          case 'share':
            isCategoryAllowed = prefs.shares;
            break;
          case 'message':
            isCategoryAllowed = prefs.messages;
            break;
          case 'system':
          default:
            isCategoryAllowed = prefs.system;
            break;
        }
      }

      if (isCategoryAllowed) {
        const userDevices = (this.data.user_devices || []).filter(
          d => d.user_id === notifData.recipient_id && d.is_active
        );

        if (userDevices.length > 0) {
          // Asynchronously dispatch push payload
          fcmService.sendToDevices(userDevices, {
            title: newNotif.title || 'NEXA',
            body: newNotif.content || newNotif.message || 'Pemberitahuan baru di NEXA',
            tag: `nexa-${newNotif.type}-${newNotif.id}`,
            data: {
              type: newNotif.type,
              postId: newNotif.post_id || undefined,
              actorId: newNotif.actor_id || undefined,
              conversationId: newNotif.conversation_id || undefined,
              notificationId: newNotif.id
            }
          }).catch(e => console.error('[Notification Push Dispatch Error]:', e));
        }
      }
    } catch (pushErr) {
      console.error('[Notification Preferences/Push Error]:', pushErr);
    }

    return newNotif;
  }

  private getDefaultNotificationTitle(type: string): string {
    switch (type) {
      case 'follow':
        return 'Pengikut Baru';
      case 'like':
        return 'Suka Baru';
      case 'comment':
        return 'Komentar Baru';
      case 'share':
        return 'Postingan Dibagikan';
      case 'message':
        return 'Pesan Baru';
      case 'endorsement':
        return 'Tawaran Endorsement';
      case 'monetization':
        return 'Pembaruan Monetisasi';
      case 'system':
      default:
        return 'Informasi NEXA';
    }
  }

  public markNotificationsAsRead(userId: string): void {
    this.data.notifications.forEach(n => {
      if (n.recipient_id === userId) {
        n.is_read = true;
      }
    });
    this.saveDatabase();
  }

  public markNotificationAsRead(userId: string, notifId: string): boolean {
    const notif = this.data.notifications.find(n => n.id === notifId && n.recipient_id === userId);
    if (notif) {
      notif.is_read = true;
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public deleteNotification(userId: string, notifId: string): boolean {
    const idx = this.data.notifications.findIndex(n => n.id === notifId && n.recipient_id === userId);
    if (idx !== -1) {
      this.data.notifications.splice(idx, 1);
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public getUnreadNotificationCount(userId: string): number {
    return this.data.notifications.filter(n => n.recipient_id === userId && !n.is_read).length;
  }

  // --- Device Management (FCM / Web Push Devices) ---
  public registerDevice(
    userId: string,
    deviceData: {
      fcm_token: string;
      device_type?: 'desktop' | 'mobile' | 'tablet' | 'web';
      browser?: string;
      user_agent?: string;
    }
  ): UserDevice {
    if (!this.data.user_devices) {
      this.data.user_devices = [];
    }

    const now = new Date().toISOString();
    const token = deviceData.fcm_token.trim();

    // Check if device with this token already exists
    const existingIdx = this.data.user_devices.findIndex(d => d.fcm_token === token);

    if (existingIdx >= 0) {
      // Update existing token registration
      this.data.user_devices[existingIdx] = {
        ...this.data.user_devices[existingIdx],
        user_id: userId,
        device_type: deviceData.device_type || this.data.user_devices[existingIdx].device_type || 'web',
        browser: deviceData.browser || this.data.user_devices[existingIdx].browser || 'Browser',
        user_agent: deviceData.user_agent || this.data.user_devices[existingIdx].user_agent,
        is_active: true,
        updated_at: now,
        last_seen_at: now
      };
      this.saveDatabase();
      return this.data.user_devices[existingIdx];
    }

    // Create new device registration
    const newDevice: UserDevice = {
      id: 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: userId,
      fcm_token: token,
      device_type: deviceData.device_type || 'web',
      browser: deviceData.browser || 'Browser',
      user_agent: deviceData.user_agent,
      is_active: true,
      created_at: now,
      updated_at: now,
      last_seen_at: now
    };

    this.data.user_devices.push(newDevice);
    this.saveDatabase();
    return newDevice;
  }

  public getUserDevices(userId: string): UserDevice[] {
    return (this.data.user_devices || []).filter(d => d.user_id === userId);
  }

  public removeDevice(userId: string, deviceIdOrToken: string): boolean {
    const idx = (this.data.user_devices || []).findIndex(
      d => d.user_id === userId && (d.id === deviceIdOrToken || d.fcm_token === deviceIdOrToken)
    );
    if (idx !== -1) {
      this.data.user_devices.splice(idx, 1);
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public deactivateToken(token: string): boolean {
    let found = false;
    (this.data.user_devices || []).forEach(d => {
      if (d.fcm_token === token) {
        d.is_active = false;
        d.updated_at = new Date().toISOString();
        found = true;
      }
    });
    if (found) {
      this.saveDatabase();
    }
    return found;
  }

  // --- Notification Preferences ---
  public getNotificationPreferences(userId: string): NotificationPreferences {
    if (!this.data.notification_preferences) {
      this.data.notification_preferences = [];
    }

    let pref = this.data.notification_preferences.find(p => p.user_id === userId);
    if (!pref) {
      pref = {
        id: 'pref_' + userId,
        user_id: userId,
        new_followers: true,
        likes: true,
        comments: true,
        shares: true,
        messages: true,
        system: true,
        push_enabled: true,
        email_enabled: false,
        updated_at: new Date().toISOString()
      };
      this.data.notification_preferences.push(pref);
      this.saveDatabase();
    }
    return pref;
  }

  public updateNotificationPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): NotificationPreferences {
    if (!this.data.notification_preferences) {
      this.data.notification_preferences = [];
    }

    const current = this.getNotificationPreferences(userId);
    const updated: NotificationPreferences = {
      ...current,
      ...updates,
      user_id: userId,
      updated_at: new Date().toISOString()
    };

    const idx = this.data.notification_preferences.findIndex(p => p.user_id === userId);
    if (idx >= 0) {
      this.data.notification_preferences[idx] = updated;
    } else {
      this.data.notification_preferences.push(updated);
    }

    this.saveDatabase();
    return updated;
  }

  // --- Conversations & Direct Messaging ---
  public getConversations(userId: string): Conversation[] {
    const userConvs = this.data.conversations.filter(c => c.member_ids.includes(userId));

    return userConvs.map(c => {
      const members = this.data.users
        .filter(u => c.member_ids.includes(u.id))
        .map(u => {
          const { password_hash, ...safe } = u;
          return safe as User;
        });

      const convMessages = this.data.messages
        .filter(m => m.conversation_id === c.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const last_message = convMessages[0];
      const unread_count = convMessages.filter(m => m.sender_id !== userId && !m.is_read).length;

      return {
        id: c.id,
        created_at: c.created_at,
        updated_at: c.updated_at,
        members,
        last_message,
        unread_count
      };
    }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  public getOrCreateConversation(userA: string, userB: string): Conversation {
    let conv = this.data.conversations.find(
      c => c.member_ids.includes(userA) && c.member_ids.includes(userB) && c.member_ids.length === 2
    );

    if (!conv) {
      conv = {
        id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        member_ids: [userA, userB],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.data.conversations.push(conv);
      this.saveDatabase();
    }

    const members = this.data.users
      .filter(u => conv!.member_ids.includes(u.id))
      .map(u => {
        const { password_hash, ...safe } = u;
        return safe as User;
      });

    return {
      id: conv.id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      members
    };
  }

  public getMessages(conversationId: string, userId: string): Message[] {
    // Mark incoming messages as read
    this.data.messages.forEach(m => {
      if (m.conversation_id === conversationId && m.sender_id !== userId) {
        m.is_read = true;
      }
    });
    this.saveDatabase();

    const list = this.data.messages
      .filter(m => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return list.map(m => {
      const sender = this.findUserById(m.sender_id);
      let safeSender: User | undefined;
      if (sender) {
        const { password_hash, ...rest } = sender;
        safeSender = rest as User;
      }
      return { ...m, sender: safeSender };
    });
  }

  public createMessage(conversationId: string, senderId: string, content: string): Message {
    const conv = this.data.conversations.find(c => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found');

    const newMessage: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_read: false
    };

    this.data.messages.push(newMessage);
    conv.updated_at = new Date().toISOString();
    this.saveDatabase();

    const sender = this.findUserById(senderId);
    let safeSender: User | undefined;
    if (sender) {
      const { password_hash, ...rest } = sender;
      safeSender = rest as User;
    }

    // Send direct message notification to conversation recipient(s)
    const recipientId = conv.member_ids.find(id => id !== senderId);
    if (recipientId) {
      const senderUsername = sender?.username || 'seseorang';
      this.createNotification({
        recipient_id: recipientId,
        actor_id: senderId,
        type: 'message',
        conversation_id: conversationId,
        related_user_id: senderId,
        title: 'Pesan Baru',
        content: `💬 Anda memiliki pesan baru dari @${senderUsername}.`,
        message: `💬 Anda memiliki pesan baru dari @${senderUsername}.`
      });
    }

    return { ...newMessage, sender: safeSender };
  }

  // --- Reports & Moderation (Future-ready Foundation) ---
  public createReport(reporterId: string, targetType: 'post' | 'user', targetId: string, reason: string): Report {
    const newReport: Report = {
      id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };
    this.data.reports.push(newReport);
    this.saveDatabase();
    return newReport;
  }

  public getReports(): Report[] {
    return [...this.data.reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'): boolean {
    const rep = this.data.reports.find(r => r.id === reportId);
    if (rep) {
      rep.status = status;
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- Search ---
  public search(query: string, currentUserId?: string) {
    const q = query.trim().toLowerCase();
    if (!q) return { users: [], posts: [], hashtags: [] };

    // Search users
    const matchedUsers = this.data.users
      .filter(u => u.username.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q) || u.bio.toLowerCase().includes(q))
      .map(u => {
        const { password_hash, ...safe } = u;
        return {
          ...safe,
          is_following: currentUserId ? this.isUserFollowing(currentUserId, u.id) : false
        };
      });

    // Search posts
    const matchedPosts = this.data.posts
      .filter(p => p.caption.toLowerCase().includes(q) || p.hashtags?.some(h => h.toLowerCase().includes(q)))
      .map(p => this.enrichPost(p, currentUserId));

    // Extract matched hashtags
    const tagSet = new Set<string>();
    this.data.posts.forEach(p => {
      p.hashtags?.forEach(h => {
        if (h.toLowerCase().includes(q.replace('#', ''))) {
          tagSet.add(h.toLowerCase());
        }
      });
    });

    const hashtags = Array.from(tagSet).map(tag => {
      const count = this.data.posts.filter(p => p.hashtags?.some(h => h.toLowerCase() === tag)).length;
      return { tag, count };
    });

    return { users: matchedUsers, posts: matchedPosts, hashtags };
  }

  // --- Helpers ---
  private enrichPost(post: Post, currentUserId?: string): Post {
    const author = this.findUserById(post.user_id);
    let safeAuthor: User | undefined;
    if (author) {
      const { password_hash, ...rest } = author;
      safeAuthor = rest as User;
    }

    const is_liked = currentUserId
      ? this.data.likes.some(l => l.user_id === currentUserId && l.post_id === post.id)
      : false;

    return {
      ...post,
      user: safeAuthor,
      is_liked
    };
  }

  // ==================== MONETIZATION & ENDORSEMENT MODULE ====================

  public seedMonetizationData() {
    const now = new Date().toISOString();
    const daysAgo = (days: number) => new Date(Date.now() - days * 86400 * 1000).toISOString();

    // Seed realistic endorsement campaigns
    this.data.endorsement_campaigns = [
      {
        id: 'camp_1',
        brand_id: 'user_3',
        brand_name: 'Studio Kroma Indonesia',
        brand_logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80',
        title: 'Review Studio Setup & Minimalist Desk Aesthetics',
        description: 'Mencari kreator dengan audiens produktivitas dan estetika kerja untuk menampilkan workstation modern & aksesoris meja Studio Kroma.',
        brief: 'Buat 1 video pendek / reel (minimal 30 detik) yang menyoroti kabel manajemen, desk mat kulit vegan, dan pencahayaan studio. Tautkan @studiokroma di caption.',
        content_type: 'video',
        content_quantity: 1,
        budget: 3500000,
        deadline: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
        requirements: 'Minimal 1.000 follower, kualitas video 1080p+, nuansa minimalis modern.',
        notes: 'Produk akan dikirim ke alamat kreator setelah tawaran disetujui.',
        status: 'approved',
        created_at: daysAgo(5),
        updated_at: daysAgo(5),
        created_by: 'user_3'
      },
      {
        id: 'camp_2',
        brand_id: 'user_3',
        brand_name: 'Studio Kroma Indonesia',
        brand_logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80',
        title: 'Unboxing Koleksi Tas Kamera Minimalis 2026',
        description: 'Tampilkan kepraktisan dan durabilitas tas kamera urban NEXA x Kroma dalam aktivitas sehari-hari di kota.',
        brief: 'Buat foto carousel atau video unboxing detail material waterproof dan kompartemen modular kamera.',
        content_type: 'video',
        content_quantity: 1,
        budget: 5000000,
        deadline: new Date(Date.now() + 21 * 86400 * 1000).toISOString(),
        requirements: 'Kreator fotografi, visual storyteller, atau lifestyle.',
        notes: 'Pencahayaan natural & audio jernih.',
        status: 'approved',
        created_at: daysAgo(2),
        updated_at: daysAgo(2),
        created_by: 'user_3'
      },
      {
        id: 'camp_3',
        brand_id: 'user_admin',
        brand_name: 'NEXA Brand Studio',
        brand_logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
        title: 'NEXA Creator Spotlight Showcase',
        description: 'Program akselerasi kreator resmi NEXA untuk memamerkan karya visual terbaik dan tips kreasi konten digital.',
        brief: 'Bagikan pengalaman dan tips berkarya di platform NEXA dengan tagar #NEXACreator dan #NextGenSocial.',
        content_type: 'video',
        content_quantity: 1,
        budget: 4000000,
        deadline: new Date(Date.now() + 10 * 86400 * 1000).toISOString(),
        requirements: 'Akun terverifikasi atau telah memenuhi syarat monetisasi.',
        status: 'approved',
        created_at: daysAgo(7),
        updated_at: daysAgo(7),
        created_by: 'user_admin'
      }
    ];

    // Seed realistic offers for creator user_1 (Arvin)
    this.data.endorsement_offers = [
      {
        id: 'offer_1',
        campaign_id: 'camp_1',
        creator_id: 'user_1',
        status: 'accepted',
        offered_amount: 3500000,
        offered_at: daysAgo(4),
        responded_at: daysAgo(3)
      },
      {
        id: 'offer_2',
        campaign_id: 'camp_2',
        creator_id: 'user_1',
        status: 'offered',
        offered_amount: 5000000,
        offered_at: daysAgo(1)
      }
    ];

    // Seed earnings for user_1
    this.data.creator_earnings = [
      {
        id: 'earn_1',
        creator_id: 'user_1',
        campaign_id: 'camp_1',
        campaign_title: 'Review Studio Setup & Minimalist Desk Aesthetics',
        amount: 3500000,
        status: 'pending',
        created_at: daysAgo(3)
      },
      {
        id: 'earn_2',
        creator_id: 'user_1',
        campaign_id: 'camp_3',
        campaign_title: 'NEXA Creator Spotlight Showcase',
        amount: 4000000,
        status: 'available',
        created_at: daysAgo(15),
        completed_at: daysAgo(10)
      }
    ];

    // Seed initial milestones for user_1 & user_2
    this.data.creator_achievements = [
      {
        id: 'ach_1',
        creator_id: 'user_1',
        achievement_type: 'followers_100',
        achieved_at: daysAgo(60),
        notification_sent: true
      },
      {
        id: 'ach_2',
        creator_id: 'user_1',
        achievement_type: 'followers_500',
        achieved_at: daysAgo(40),
        notification_sent: true
      },
      {
        id: 'ach_3',
        creator_id: 'user_1',
        achievement_type: 'followers_1000',
        achieved_at: daysAgo(20),
        notification_sent: true
      },
      {
        id: 'ach_4',
        creator_id: 'user_1',
        achievement_type: 'watch_hours_1000',
        achieved_at: daysAgo(45),
        notification_sent: true
      },
      {
        id: 'ach_5',
        creator_id: 'user_1',
        achievement_type: 'watch_hours_2000',
        achieved_at: daysAgo(30),
        notification_sent: true
      },
      {
        id: 'ach_6',
        creator_id: 'user_1',
        achievement_type: 'watch_hours_4000',
        achieved_at: daysAgo(10),
        notification_sent: true
      },
      {
        id: 'ach_7',
        creator_id: 'user_1',
        achievement_type: 'views_10000',
        achieved_at: daysAgo(25),
        notification_sent: true
      },
      {
        id: 'ach_8',
        creator_id: 'user_1',
        achievement_type: 'monetization_unlocked',
        achieved_at: daysAgo(10),
        notification_sent: true
      }
    ];

    // Ensure user balances are synchronized
    const u1 = this.data.users.find(u => u.id === 'user_1');
    if (u1) {
      u1.monetization_status = 'active';
      u1.watch_hours = 4250;
      u1.pending_balance = 3500000;
      u1.available_balance = 4000000;
      u1.paid_balance = 0;
    }
  }

  public checkCreatorMilestones(userId: string) {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return;

    const followers = user.followers_count || 0;
    const userPosts = this.data.posts.filter(p => p.user_id === userId);
    const totalViews = userPosts.reduce((sum, p) => sum + (p.view_count || 0), 0);
    const watchHours = user.watch_hours || Math.round(totalViews * 0.4);

    const checkAndRecord = (milestoneKey: string, title: string, content: string) => {
      if (!this.data.creator_achievements) this.data.creator_achievements = [];
      const exists = this.data.creator_achievements.some(
        a => a.creator_id === userId && a.achievement_type === milestoneKey
      );
      if (!exists) {
        this.data.creator_achievements.push({
          id: 'achieve_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          creator_id: userId,
          achievement_type: milestoneKey,
          achieved_at: new Date().toISOString(),
          notification_sent: true
        });

        // Trigger in-app & FCM Web Push Notification
        this.createNotification({
          recipient_id: userId,
          type: 'system',
          title: title,
          content: content,
          message: content
        });
      }
    };

    // Follower thresholds
    if (followers >= 100) {
      checkAndRecord('followers_100', '🎉 100 Follower Tercapai', 'Selamat! Anda telah mencapai 100 follower di NEXA.');
    }
    if (followers >= 500) {
      checkAndRecord('followers_500', '🎉 500 Follower Tercapai', 'Luar biasa! Komunitas Anda kini mencapai 500 follower di NEXA.');
    }
    if (followers >= 1000) {
      checkAndRecord('followers_1000', '🎉 1.000 Follower Tercapai', 'Selamat! Anda telah mencapai target 1.000 follower untuk monetisasi NEXA.');
    }

    // Watch hours thresholds
    if (watchHours >= 1000) {
      checkAndRecord('watch_hours_1000', '🎉 1.000 Jam Tayang Tercapai', 'Anda telah mencapai 1.000 jam tayang video di NEXA.');
    }
    if (watchHours >= 2000) {
      checkAndRecord('watch_hours_2000', '🎉 2.000 Jam Tayang Tercapai', 'Performa hebat! 2.000 jam tayang video telah terkumpul.');
    }
    if (watchHours >= 4000) {
      checkAndRecord('watch_hours_4000', '🎉 4.000 Jam Tayang Tercapai', 'Luar biasa! Target 4.000 jam tayang monetisasi telah terpenuhi.');
    }

    // View thresholds
    if (totalViews >= 10000) {
      checkAndRecord('views_10000', '🚀 10.000 Views Tercapai', 'Total penayangan konten Anda telah melampaui 10.000 views di NEXA.');
    }
    if (totalViews >= 100000) {
      checkAndRecord('views_100000', '🌟 100.000 Views Tercapai', 'Pencapaian fantastis! Konten Anda telah ditonton lebih dari 100.000 kali.');
    }

    // Monetization Unlock
    if (followers >= MONETIZATION_REQUIREMENTS.followers && watchHours >= MONETIZATION_REQUIREMENTS.watchHours) {
      checkAndRecord('monetization_unlocked', '💰 Syarat Monetisasi Terpenuhi', 'Selamat! Akun Anda telah memenuhi semua syarat dan kini dapat mengajukan monetisasi NEXA.');
    }

    this.saveDatabase();
  }

  public getCreatorStats(userId: string): CreatorStats {
    const user = this.findUserById(userId);
    if (!user) throw new Error('User not found');

    const userPosts = this.data.posts.filter(p => p.user_id === userId);
    const videoPosts = userPosts.filter(p => p.type === 'video');

    const totalFollowers = user.followers_count || 0;
    const totalPosts = userPosts.length;
    const totalVideos = videoPosts.length;
    const totalViews = userPosts.reduce((sum, p) => sum + (p.view_count || 0), 0);
    const totalLikes = userPosts.reduce((sum, p) => sum + (p.like_count || 0), 0);
    const totalComments = userPosts.reduce((sum, p) => sum + (p.comment_count || 0), 0);
    const totalShares = userPosts.reduce((sum, p) => sum + (p.share_count || 0), 0);

    // Derived or explicit watch hours
    const totalWatchHours = user.watch_hours !== undefined 
      ? user.watch_hours 
      : Math.round(totalViews * 0.4);

    // Monetization progress calculation according to exact formula
    const followerProgress = Math.min(totalFollowers / MONETIZATION_REQUIREMENTS.followers, 1);
    const watchHoursProgress = Math.min(totalWatchHours / MONETIZATION_REQUIREMENTS.watchHours, 1);
    const monetizationScore = Math.round(((followerProgress + watchHoursProgress) / 2) * 100);
    const eligibleForMonetization = totalFollowers >= MONETIZATION_REQUIREMENTS.followers && totalWatchHours >= MONETIZATION_REQUIREMENTS.watchHours;

    // Build 30-day realistic growth chart data leading up to current totals
    const growthChart = [];
    const days = 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400 * 1000);
      const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const factor = (days - i) / days;
      const smoothRandom = 0.85 + Math.sin(i * 0.5) * 0.15;
      growthChart.push({
        date: dateStr,
        followers: Math.max(1, Math.round(totalFollowers * factor * smoothRandom)),
        views: Math.max(10, Math.round(totalViews * factor * smoothRandom)),
        watch_hours: Math.max(1, Math.round(totalWatchHours * factor * smoothRandom)),
        likes: Math.max(5, Math.round(totalLikes * factor * smoothRandom))
      });
    }

    // Top content sorted by views and likes
    const topContent = [...userPosts]
      .sort((a, b) => ((b.view_count || 0) + (b.like_count || 0) * 2) - ((a.view_count || 0) + (a.like_count || 0) * 2))
      .slice(0, 6)
      .map(p => this.enrichPost(p, userId));

    // Achievements list
    const userAchievements = (this.data.creator_achievements || []).filter(a => a.creator_id === userId);
    const getAchievedDate = (type: string) => userAchievements.find(a => a.achievement_type === type)?.achieved_at;

    const achievementsList = [
      {
        type: 'followers_100',
        title: '100 Follower',
        description: 'Membangun 100 pengikut pertama di ekosistem NEXA',
        icon: 'Users',
        is_achieved: totalFollowers >= 100,
        current_value: totalFollowers,
        target_value: 100,
        achieved_at: getAchievedDate('followers_100')
      },
      {
        type: 'followers_500',
        title: '500 Follower',
        description: 'Mencapai 500 audiens aktif',
        icon: 'UserPlus',
        is_achieved: totalFollowers >= 500,
        current_value: totalFollowers,
        target_value: 500,
        achieved_at: getAchievedDate('followers_500')
      },
      {
        type: 'followers_1000',
        title: '1.000 Follower',
        description: 'Target pengikut monetisasi kreator resmi tercapai',
        icon: 'Award',
        is_achieved: totalFollowers >= 1000,
        current_value: totalFollowers,
        target_value: 1000,
        achieved_at: getAchievedDate('followers_1000')
      },
      {
        type: 'watch_hours_1000',
        title: '1.000 Jam Tayang',
        description: 'Mengumpulkan 1.000 jam waktu tonton video',
        icon: 'Clock',
        is_achieved: totalWatchHours >= 1000,
        current_value: totalWatchHours,
        target_value: 1000,
        achieved_at: getAchievedDate('watch_hours_1000')
      },
      {
        type: 'watch_hours_2000',
        title: '2.000 Jam Tayang',
        description: 'Setengah jalan menuju ambang batas monetisasi',
        icon: 'TrendingUp',
        is_achieved: totalWatchHours >= 2000,
        current_value: totalWatchHours,
        target_value: 2000,
        achieved_at: getAchievedDate('watch_hours_2000')
      },
      {
        type: 'watch_hours_4000',
        title: '4.000 Jam Tayang',
        description: 'Target penuh jam tayang monetisasi NEXA terpenuhi',
        icon: 'Zap',
        is_achieved: totalWatchHours >= 4000,
        current_value: totalWatchHours,
        target_value: 4000,
        achieved_at: getAchievedDate('watch_hours_4000')
      },
      {
        type: 'views_10000',
        title: '10.000 Penayangan',
        description: 'Total impresi konten melampaui 10 ribu views',
        icon: 'Eye',
        is_achieved: totalViews >= 10000,
        current_value: totalViews,
        target_value: 10000,
        achieved_at: getAchievedDate('views_10000')
      },
      {
        type: 'views_100000',
        title: '100.000 Penayangan',
        description: 'Pencapaian mega 100.000 penayangan konten',
        icon: 'Sparkles',
        is_achieved: totalViews >= 100000,
        current_value: totalViews,
        target_value: 100000,
        achieved_at: getAchievedDate('views_100000')
      },
      {
        type: 'monetization_unlocked',
        title: 'Monetisasi Terbuka',
        description: 'Memenuhi kedua kriteria 1k follower & 4k jam tayang',
        icon: 'ShieldCheck',
        is_achieved: eligibleForMonetization,
        current_value: monetizationScore,
        target_value: 100,
        achieved_at: getAchievedDate('monetization_unlocked')
      }
    ];

    // Earnings breakdown
    const userEarnings = (this.data.creator_earnings || []).filter(e => e.creator_id === userId);
    const pendingEarn = userEarnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
    const availableEarn = userEarnings.filter(e => e.status === 'available').reduce((sum, e) => sum + e.amount, 0);
    const paidEarn = userEarnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
    const totalEarn = pendingEarn + availableEarn + paidEarn;

    return {
      total_followers: totalFollowers,
      total_views: totalViews,
      total_videos: totalVideos,
      total_posts: totalPosts,
      total_likes: totalLikes,
      total_comments: totalComments,
      total_shares: totalShares,
      total_watch_hours: totalWatchHours,
      monetization_score: monetizationScore,
      follower_progress: followerProgress,
      watch_hours_progress: watchHoursProgress,
      eligible_for_monetization: eligibleForMonetization,
      monetization_status: user.monetization_status || 'none',
      rejection_reason: user.rejection_reason,
      growth_chart: growthChart,
      top_content: topContent,
      achievements: achievementsList,
      earnings: {
        total: totalEarn,
        pending: pendingEarn,
        available: availableEarn,
        paid: paidEarn,
        history: userEarnings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }
    };
  }

  // --- Monetization Application ---
  public applyForMonetization(userId: string): MonetizationApplication {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    const stats = this.getCreatorStats(userId);
    if (!stats.eligible_for_monetization) {
      throw new Error('Akun Anda belum memenuhi syarat minimal 1.000 follower dan 4.000 jam tayang.');
    }

    if (user.monetization_status === 'pending') {
      throw new Error('Pengajuan monetisasi Anda sedang dalam proses peninjauan.');
    }

    if (user.monetization_status === 'active') {
      throw new Error('Akun Anda sudah berstatus monetisasi aktif.');
    }

    const newApp: MonetizationApplication = {
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      followers_at_application: stats.total_followers,
      watch_hours_at_application: stats.total_watch_hours,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (!this.data.monetization_applications) this.data.monetization_applications = [];
    this.data.monetization_applications.unshift(newApp);

    user.monetization_status = 'pending';
    this.saveDatabase();

    // Notify user
    this.createNotification({
      recipient_id: userId,
      type: 'system',
      title: '📄 Pengajuan Monetisasi Terkirim',
      content: 'Pengajuan monetisasi Anda telah diterima dan sedang ditinjau oleh tim verifikasi NEXA.',
      message: 'Pengajuan monetisasi Anda telah diterima dan sedang ditinjau oleh tim verifikasi NEXA.'
    });

    // Notify admins
    const admins = this.data.users.filter(u => u.role === 'admin');
    admins.forEach(adm => {
      this.createNotification({
        recipient_id: adm.id,
        type: 'system',
        title: '⚡ Pengajuan Monetisasi Baru',
        content: `@${user.username} telah mengajukan monetisasi kreator (${stats.total_followers} followers, ${stats.total_watch_hours} jam tayang).`,
        message: `@${user.username} telah mengajukan monetisasi kreator (${stats.total_followers} followers, ${stats.total_watch_hours} jam tayang).`
      });
    });

    return newApp;
  }

  public getMonetizationApplications(): MonetizationApplication[] {
    if (!this.data.monetization_applications) this.data.monetization_applications = [];
    return this.data.monetization_applications.map(app => {
      const u = this.findUserById(app.user_id);
      return {
        ...app,
        user: u
      };
    });
  }

  public reviewMonetizationApplication(
    applicationId: string, 
    status: 'approved' | 'rejected', 
    reason?: string, 
    adminId?: string
  ): MonetizationApplication {
    if (!this.data.monetization_applications) this.data.monetization_applications = [];
    const app = this.data.monetization_applications.find(a => a.id === applicationId);
    if (!app) throw new Error('Application not found');

    const user = this.data.users.find(u => u.id === app.user_id);
    if (!user) throw new Error('Applicant user not found');

    const now = new Date().toISOString();
    app.status = status;
    app.reviewed_at = now;
    app.reviewed_by = adminId || 'admin';
    app.rejection_reason = reason;

    if (status === 'approved') {
      user.monetization_status = 'active';
      user.monetization_approved_at = now;
      user.role = 'creator';
      user.is_verified = true;
      user.rejection_reason = undefined;

      this.createNotification({
        recipient_id: user.id,
        type: 'system',
        title: '🎉 Monetisasi Disetujui',
        content: 'Selamat! Akun Anda telah disetujui untuk monetisasi NEXA. Anda kini dapat menerima tawaran endorsement dan sponsorship.',
        message: 'Selamat! Akun Anda telah disetujui untuk monetisasi NEXA. Anda kini dapat menerima tawaran endorsement dan sponsorship.'
      });
    } else {
      user.monetization_status = 'rejected';
      user.rejection_reason = reason || 'Pengajuan belum memenuhi standar orisinalitas dan pedoman komunitas NEXA.';

      this.createNotification({
        recipient_id: user.id,
        type: 'system',
        title: '❌ Pengajuan Monetisasi Ditolak',
        content: `Pengajuan monetisasi Anda belum dapat disetujui: ${user.rejection_reason}`,
        message: `Pengajuan monetisasi Anda belum dapat disetujui: ${user.rejection_reason}`
      });
    }

    this.saveDatabase();
    return {
      ...app,
      user
    };
  }

  // ==================== ENDORSEMENT OPERATIONS ====================

  public getEndorsementCampaigns(filter?: { brand_id?: string; status?: string }): EndorsementCampaign[] {
    if (!this.data.endorsement_campaigns) this.data.endorsement_campaigns = [];
    let list = this.data.endorsement_campaigns;

    if (filter?.brand_id) {
      list = list.filter(c => c.brand_id === filter.brand_id);
    }
    if (filter?.status) {
      list = list.filter(c => c.status === filter.status);
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getEndorsementCampaignById(campaignId: string): EndorsementCampaign | undefined {
    if (!this.data.endorsement_campaigns) this.data.endorsement_campaigns = [];
    return this.data.endorsement_campaigns.find(c => c.id === campaignId);
  }

  public createEndorsementCampaign(data: Partial<EndorsementCampaign>, brandId: string): EndorsementCampaign {
    const brandUser = this.findUserById(brandId);
    const brandName = brandUser?.full_name || brandUser?.username || 'Brand Partner';
    const brandLogo = brandUser?.avatar_url || 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80';

    const newCampaign: EndorsementCampaign = {
      id: 'camp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      brand_id: brandId,
      brand_name: data.brand_name || brandName,
      brand_logo: data.brand_logo || brandLogo,
      title: data.title?.trim() || 'Kampanye Endorsement Baru',
      description: data.description?.trim() || '',
      brief: data.brief?.trim() || '',
      content_type: data.content_type || 'video',
      content_quantity: data.content_quantity || 1,
      budget: Number(data.budget) || 1000000,
      deadline: data.deadline || new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
      requirements: data.requirements || 'Kreator aktif NEXA',
      notes: data.notes || '',
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: brandId
    };

    if (!this.data.endorsement_campaigns) this.data.endorsement_campaigns = [];
    this.data.endorsement_campaigns.unshift(newCampaign);
    this.saveDatabase();
    return newCampaign;
  }

  public getEndorsementOffers(creatorId: string): EndorsementOffer[] {
    if (!this.data.endorsement_offers) this.data.endorsement_offers = [];
    return this.data.endorsement_offers
      .filter(o => o.creator_id === creatorId)
      .map(o => {
        const campaign = this.getEndorsementCampaignById(o.campaign_id);
        const creator = this.findUserById(o.creator_id);
        return {
          ...o,
          campaign,
          creator
        };
      })
      .sort((a, b) => new Date(b.offered_at).getTime() - new Date(a.offered_at).getTime());
  }

  public getEndorsementOfferById(offerId: string): EndorsementOffer | undefined {
    if (!this.data.endorsement_offers) this.data.endorsement_offers = [];
    const o = this.data.endorsement_offers.find(offer => offer.id === offerId);
    if (!o) return undefined;

    const campaign = this.getEndorsementCampaignById(o.campaign_id);
    const creator = this.findUserById(o.creator_id);
    return {
      ...o,
      campaign,
      creator
    };
  }

  public createEndorsementOffer(campaignId: string, creatorId: string, amount: number): EndorsementOffer {
    const campaign = this.getEndorsementCampaignById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const creator = this.findUserById(creatorId);
    if (!creator) throw new Error('Creator not found');

    const newOffer: EndorsementOffer = {
      id: 'offer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      campaign_id: campaignId,
      creator_id: creatorId,
      status: 'offered',
      offered_amount: amount || campaign.budget,
      offered_at: new Date().toISOString()
    };

    if (!this.data.endorsement_offers) this.data.endorsement_offers = [];
    this.data.endorsement_offers.unshift(newOffer);
    this.saveDatabase();

    // Trigger push notification to creator
    this.createNotification({
      recipient_id: creatorId,
      type: 'system',
      title: '💼 Tawaran Endorsement Baru',
      content: `Anda mendapatkan tawaran endorsement "${campaign.title}" dari ${campaign.brand_name} senilai Rp ${new Intl.NumberFormat('id-ID').format(newOffer.offered_amount)}.`,
      message: `Anda mendapatkan tawaran endorsement "${campaign.title}" dari ${campaign.brand_name} senilai Rp ${new Intl.NumberFormat('id-ID').format(newOffer.offered_amount)}.`
    });

    return {
      ...newOffer,
      campaign,
      creator
    };
  }

  public respondEndorsementOffer(
    offerId: string, 
    creatorId: string, 
    response: 'accepted' | 'rejected', 
    reason?: string
  ): EndorsementOffer {
    if (!this.data.endorsement_offers) this.data.endorsement_offers = [];
    const offer = this.data.endorsement_offers.find(o => o.id === offerId);
    if (!offer) throw new Error('Offer not found');
    if (offer.creator_id !== creatorId) throw new Error('Unauthorized');

    const campaign = this.getEndorsementCampaignById(offer.campaign_id);
    offer.status = response === 'accepted' ? 'accepted' : 'rejected';
    offer.responded_at = new Date().toISOString();
    offer.rejection_reason = reason;

    if (response === 'accepted') {
      // Add pending earning
      if (!this.data.creator_earnings) this.data.creator_earnings = [];
      const existingEarn = this.data.creator_earnings.find(e => e.campaign_id === offer.campaign_id && e.creator_id === creatorId);
      if (!existingEarn) {
        this.data.creator_earnings.unshift({
          id: 'earn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          creator_id: creatorId,
          campaign_id: offer.campaign_id,
          campaign_title: campaign?.title || 'Endorsement Project',
          amount: offer.offered_amount,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      }

      // Update creator pending balance
      const creator = this.data.users.find(u => u.id === creatorId);
      if (creator) {
        creator.pending_balance = (creator.pending_balance || 0) + offer.offered_amount;
      }

      // Notify brand
      if (campaign) {
        this.createNotification({
          recipient_id: campaign.brand_id,
          type: 'system',
          title: '✓ Endorsement Diterima',
          content: `Kreator telah menerima tawaran endorsement untuk kampanye "${campaign.title}".`,
          message: `Kreator telah menerima tawaran endorsement untuk kampanye "${campaign.title}".`
        });
      }
    }

    this.saveDatabase();
    return {
      ...offer,
      campaign,
      creator: this.findUserById(creatorId)
    };
  }

  public getEndorsementSubmissions(filter?: { campaign_id?: string; creator_id?: string }): EndorsementSubmission[] {
    if (!this.data.endorsement_submissions) this.data.endorsement_submissions = [];
    let list = this.data.endorsement_submissions;
    if (filter?.campaign_id) list = list.filter(s => s.campaign_id === filter.campaign_id);
    if (filter?.creator_id) list = list.filter(s => s.creator_id === filter.creator_id);

    return list.map(sub => {
      const campaign = this.getEndorsementCampaignById(sub.campaign_id);
      const post = sub.content_id ? this.data.posts.find(p => p.id === sub.content_id) : undefined;
      return {
        ...sub,
        campaign,
        content_post: post ? this.enrichPost(post, sub.creator_id) : undefined
      };
    }).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }

  public submitEndorsementContent(
    offerId: string, 
    creatorId: string, 
    data: { content_id?: string; submitted_content_url?: string; submission_notes?: string }
  ): EndorsementSubmission {
    const offer = this.getEndorsementOfferById(offerId);
    if (!offer) throw new Error('Offer not found');
    if (offer.creator_id !== creatorId) throw new Error('Unauthorized');

    const campaign = this.getEndorsementCampaignById(offer.campaign_id);

    const submission: EndorsementSubmission = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      campaign_id: offer.campaign_id,
      creator_id: creatorId,
      content_id: data.content_id,
      submitted_content_url: data.submitted_content_url,
      submission_notes: data.submission_notes,
      submitted_at: new Date().toISOString(),
      status: 'submitted'
    };

    if (!this.data.endorsement_submissions) this.data.endorsement_submissions = [];
    this.data.endorsement_submissions.unshift(submission);

    // Update offer status
    offer.status = 'submitted';
    const rawOffer = this.data.endorsement_offers.find(o => o.id === offerId);
    if (rawOffer) rawOffer.status = 'submitted';

    this.saveDatabase();

    // Notify brand
    if (campaign) {
      this.createNotification({
        recipient_id: campaign.brand_id,
        type: 'system',
        title: '📩 Konten Endorsement Dikirim',
        content: `Kreator telah mengirimkan materi konten untuk ditinjau pada kampanye "${campaign.title}".`,
        message: `Kreator telah mengirimkan materi konten untuk ditinjau pada kampanye "${campaign.title}".`
      });
    }

    return submission;
  }

  public reviewEndorsementSubmission(
    submissionId: string, 
    reviewerId: string, 
    status: 'approved' | 'revision_requested' | 'rejected', 
    reviewNote?: string
  ): EndorsementSubmission {
    if (!this.data.endorsement_submissions) this.data.endorsement_submissions = [];
    const sub = this.data.endorsement_submissions.find(s => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');

    const campaign = this.getEndorsementCampaignById(sub.campaign_id);
    const now = new Date().toISOString();

    sub.status = status;
    sub.reviewed_at = now;
    sub.review_note = reviewNote;

    const offer = this.data.endorsement_offers.find(o => o.campaign_id === sub.campaign_id && o.creator_id === sub.creator_id);

    if (status === 'approved') {
      if (offer) offer.status = 'approved';

      // Move creator earning from pending to available
      const earn = this.data.creator_earnings.find(e => e.campaign_id === sub.campaign_id && e.creator_id === sub.creator_id);
      if (earn) {
        earn.status = 'available';
        earn.completed_at = now;

        const creator = this.data.users.find(u => u.id === sub.creator_id);
        if (creator) {
          creator.pending_balance = Math.max(0, (creator.pending_balance || 0) - earn.amount);
          creator.available_balance = (creator.available_balance || 0) + earn.amount;
        }
      }

      this.createNotification({
        recipient_id: sub.creator_id,
        type: 'system',
        title: '🎉 Endorsement Selesai & Disetujui',
        content: `Konten endorsement Anda untuk "${campaign?.title || 'Kampanye'}" telah disetujui! Dana sebesar Rp ${new Intl.NumberFormat('id-ID').format(offer?.offered_amount || 0)} telah masuk ke saldo tersedia.`,
        message: `Konten endorsement Anda untuk "${campaign?.title || 'Kampanye'}" telah disetujui! Dana sebesar Rp ${new Intl.NumberFormat('id-ID').format(offer?.offered_amount || 0)} telah masuk ke saldo tersedia.`
      });
    } else if (status === 'revision_requested') {
      if (offer) offer.status = 'in_progress';

      this.createNotification({
        recipient_id: sub.creator_id,
        type: 'system',
        title: '📝 Revisi Diperlukan',
        content: `Catatan revisi untuk kampanye "${campaign?.title}": ${reviewNote || 'Harap sesuaikan dengan brief.'}`,
        message: `Catatan revisi untuk kampanye "${campaign?.title}": ${reviewNote || 'Harap sesuaikan dengan brief.'}`
      });
    }

    this.saveDatabase();
    return sub;
  }

  public getCreatorEarnings(creatorId: string) {
    if (!this.data.creator_earnings) this.data.creator_earnings = [];
    const list = this.data.creator_earnings.filter(e => e.creator_id === creatorId);
    const pending = list.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
    const available = list.filter(e => e.status === 'available').reduce((sum, e) => sum + e.amount, 0);
    const paid = list.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
    const total = pending + available + paid;

    return {
      total,
      pending,
      available,
      paid,
      history: list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    };
  }

  // ==========================================
  // TAHAP 4: NEXA WALLET & FINANCIAL ENGINE
  // ==========================================

  public getUserWalletInfo(userId: string): UserWalletInfo {
    const user = this.findUserById(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    const transactions = this.data.wallet_transactions || [];
    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate today's debit transfers for daily limit check
    const todayTransfers = transactions.filter(tx => 
      tx.user_id === userId &&
      tx.type === 'transfer' &&
      tx.direction === 'debit' &&
      tx.status === 'completed' &&
      tx.created_at.startsWith(todayStr)
    );

    const today_transfer_total = todayTransfers.reduce((sum, tx) => sum + tx.amount, 0);
    const remaining_daily_limit = Math.max(0, WALLET_CONFIG.dailyTransferLimit - today_transfer_total);

    const currentBalance = user.wallet_balance || 0;
    const availableBalance = user.available_balance !== undefined ? user.available_balance : currentBalance;
    const pendingBalance = user.pending_balance || 0;

    return {
      balance: currentBalance,
      wallet_balance: currentBalance,
      available_balance: availableBalance,
      pending_balance: pendingBalance,
      wallet_status: user.wallet_status || 'active',
      pin_set: Boolean(user.pin_hash),
      pin_locked_until: user.pin_locked_until,
      mask_financial_notifs: Boolean(user.mask_financial_notifs),
      today_transfer_total,
      remaining_daily_limit,
      daily_limit_remaining: remaining_daily_limit,
      config: WALLET_CONFIG
    };
  }

  public setupOrChangePin(userId: string, newPin: string, oldPin?: string): { message: string } {
    const user = this.findUserById(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    // Validate 6 digits
    if (!/^\d{6}$/.test(newPin)) {
      throw new Error('PIN Transaksi harus terdiri dari 6 digit angka.');
    }

    // If user already has PIN, verify old PIN
    if (user.pin_hash) {
      if (!oldPin) {
        throw new Error('PIN lama diperlukan untuk mengubah PIN transaksi.');
      }
      const isMatch = bcrypt.compareSync(oldPin, user.pin_hash);
      if (!isMatch) {
        throw new Error('PIN lama yang Anda masukkan salah.');
      }
    }

    const hashed = bcrypt.hashSync(newPin, 10);
    user.pin_hash = hashed;
    user.pin_set = true;
    user.pin_failed_attempts = 0;
    user.pin_locked_until = undefined;
    user.updated_at = new Date().toISOString();

    this.saveDatabase();

    // Create Audit Log
    this.createFinancialAuditLog({
      admin_id: userId,
      action: 'pin_reset',
      target_type: 'user_wallet',
      target_id: userId,
      reason: user.pin_hash ? 'User mengubah PIN transaksi 6-digit.' : 'User membuat PIN transaksi baru.'
    });

    this.createNotification({
      recipient_id: userId,
      type: 'system',
      title: '🔒 Keamanan Saldo Diperbarui',
      content: 'PIN Transaksi akun NEXA Anda berhasil diperbarui dengan aman.',
      message: 'PIN Transaksi akun NEXA Anda berhasil diperbarui dengan aman.'
    });

    return { message: 'PIN Transaksi 6-digit berhasil disimpan dan diaktifkan.' };
  }

  public verifyPin(userId: string, pin: string): boolean {
    const user = this.findUserById(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    if (!user.pin_hash) {
      throw new Error('Anda belum mengatur PIN Transaksi. Silakan atur PIN terlebih dahulu.');
    }

    const now = new Date();
    if (user.pin_locked_until && new Date(user.pin_locked_until) > now) {
      const remainingMinutes = Math.ceil((new Date(user.pin_locked_until).getTime() - now.getTime()) / 60000);
      throw new Error(`Transaksi terkunci sementara demi keamanan karena percobaan gagal berkali-kali. Coba lagi dalam ${remainingMinutes} menit.`);
    }

    const isMatch = bcrypt.compareSync(pin, user.pin_hash);
    if (!isMatch) {
      user.pin_failed_attempts = (user.pin_failed_attempts || 0) + 1;
      if (user.pin_failed_attempts >= 5) {
        user.pin_locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lock
        user.pin_failed_attempts = 0;
        this.saveDatabase();
        throw new Error('PIN salah 5 kali berturut-turut. Transaksi diblokir sementara selama 15 menit.');
      }
      this.saveDatabase();
      const remainingAttempts = 5 - (user.pin_failed_attempts || 0);
      throw new Error(`PIN Transaksi tidak valid. Sisa percobaan: ${remainingAttempts}.`);
    }

    // Success -> reset attempts
    user.pin_failed_attempts = 0;
    user.pin_locked_until = undefined;
    this.saveDatabase();
    return true;
  }

  public updateWalletSettings(userId: string, settings: { mask_financial_notifs?: boolean }): UserWalletInfo {
    const user = this.findUserById(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    if (settings.mask_financial_notifs !== undefined) {
      user.mask_financial_notifs = settings.mask_financial_notifs;
    }
    user.updated_at = new Date().toISOString();
    this.saveDatabase();

    return this.getUserWalletInfo(userId);
  }

  public createTopUpRequest(
    userId: string, 
    amount: number, 
    paymentMethod: string, 
    paymentProofUrl?: string
  ): WalletTransaction {
    const user = this.findUserById(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    if (user.wallet_status === 'suspended') {
      throw new Error('Dompet NEXA Anda sedang ditangguhkan. Silakan hubungi dukungan.');
    }

    if (isNaN(amount) || amount < WALLET_CONFIG.minTopup || amount > WALLET_CONFIG.maxTopup) {
      throw new Error(`Nominal top up harus antara Rp ${new Intl.NumberFormat('id-ID').format(WALLET_CONFIG.minTopup)} dan Rp ${new Intl.NumberFormat('id-ID').format(WALLET_CONFIG.maxTopup)}.`);
    }

    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];

    const now = new Date().toISOString();
    const dateCode = now.slice(0, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference_id = `TOPUP-${dateCode}-${randCode}`;

    const currentBal = user.wallet_balance || 0;

    const newTx: WalletTransaction = {
      id: 'wtx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      type: 'topup',
      direction: 'credit',
      amount: Math.round(amount),
      fee: 0,
      total_amount: Math.round(amount),
      balance_before: currentBal,
      balance_after: currentBal, // Will only increase upon approval / completion
      status: 'pending',
      reference_id,
      description: `Isi Saldo NEXA via ${paymentMethod}`,
      payment_method: paymentMethod,
      payment_proof_url: paymentProofUrl || undefined,
      created_at: now
    };

    this.data.wallet_transactions.unshift(newTx);
    this.saveDatabase();

    return newTx;
  }

  public uploadTopUpProof(userId: string, transactionId: string, proofUrl: string): WalletTransaction {
    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];
    const tx = this.data.wallet_transactions.find(t => t.id === transactionId && t.user_id === userId);
    if (!tx) throw new Error('Permintaan top up tidak ditemukan.');
    if (tx.status !== 'pending') throw new Error('Permintaan top up ini sudah diproses sebelumnya.');

    tx.payment_proof_url = proofUrl;
    tx.status = 'pending';
    this.saveDatabase();

    return tx;
  }

  public adminReviewTopUp(
    adminId: string, 
    transactionId: string, 
    action: 'approve' | 'reject', 
    reason?: string
  ): WalletTransaction {
    const admin = this.findUserById(adminId);
    if (!admin || admin.role !== 'admin') throw new Error('Akses khusus administrator.');

    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];
    const tx = this.data.wallet_transactions.find(t => t.id === transactionId);
    if (!tx) throw new Error('Transaksi top up tidak ditemukan.');
    if (tx.status !== 'pending') throw new Error('Transaksi ini sudah ditinjau sebelumnya.');

    const user = this.findUserById(tx.user_id);
    if (!user) throw new Error('Pengguna pemilik transaksi tidak ditemukan.');

    const now = new Date().toISOString();

    if (action === 'approve') {
      // ATOMIC SERVER-SIDE BALANCE UPDATE
      const balBefore = user.wallet_balance || 0;
      user.wallet_balance = balBefore + tx.amount;
      user.available_balance = (user.available_balance || 0) + tx.amount;
      user.updated_at = now;

      tx.balance_before = balBefore;
      tx.balance_after = user.wallet_balance;
      tx.status = 'completed';
      tx.completed_at = now;

      // Financial Audit Log
      this.createFinancialAuditLog({
        admin_id: adminId,
        admin_name: admin.full_name,
        action: 'topup_approval',
        target_type: 'topup',
        target_id: tx.id,
        amount: tx.amount,
        reason: 'Verifikasi bukti pembayaran valid oleh admin.',
        metadata: { reference_id: tx.reference_id, user_id: user.id }
      });

      // Notification with privacy masking capability
      const notifBody = user.mask_financial_notifs 
        ? 'Top up saldo NEXA Anda berhasil diverifikasi dan ditambahkan.' 
        : `Top up sebesar Rp ${new Intl.NumberFormat('id-ID').format(tx.amount)} berhasil.`;

      this.createNotification({
        recipient_id: user.id,
        type: 'system',
        title: '💰 Saldo Bertambah',
        content: notifBody,
        message: notifBody
      });

    } else {
      if (!reason || reason.trim().length === 0) {
        throw new Error('Alasan penolakan wajib dicantumkan.');
      }

      tx.status = 'failed';
      tx.rejection_reason = reason.trim();

      // Financial Audit Log
      this.createFinancialAuditLog({
        admin_id: adminId,
        admin_name: admin.full_name,
        action: 'topup_rejection',
        target_type: 'topup',
        target_id: tx.id,
        amount: tx.amount,
        reason: reason.trim(),
        metadata: { reference_id: tx.reference_id, user_id: user.id }
      });

      this.createNotification({
        recipient_id: user.id,
        type: 'system',
        title: 'Top Up Ditolak',
        content: `Permintaan top up Anda ditolak: ${reason.trim()}`,
        message: `Permintaan top up Anda ditolak: ${reason.trim()}`
      });
    }

    this.saveDatabase();
    return tx;
  }

  public getWalletRecipients(userId: string): WalletRecipient[] {
    if (!this.data.wallet_recipients) this.data.wallet_recipients = [];
    const list = this.data.wallet_recipients.filter(r => r.owner_user_id === userId);

    // Populate user avatars for nexa_user
    return list.map(r => {
      if (r.recipient_type === 'nexa_user') {
        const u = this.findUserByUsernameOrEmail(r.account_identifier);
        if (u) {
          return {
            ...r,
            user_avatar: u.avatar_url,
            user_verified: u.is_verified
          };
        }
      }
      return r;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addWalletRecipient(
    userId: string, 
    data: { recipient_name: string; recipient_type: RecipientType; account_identifier: string; provider: string }
  ): WalletRecipient {
    if (!this.data.wallet_recipients) this.data.wallet_recipients = [];

    const cleanIdentifier = data.account_identifier.trim();
    const cleanName = data.recipient_name.trim();

    if (!cleanIdentifier || !cleanName) {
      throw new Error('Nama penerima dan nomor rekening / username wajib diisi.');
    }

    // Check duplicate
    const exists = this.data.wallet_recipients.find(
      r => r.owner_user_id === userId && 
           r.account_identifier.toLowerCase() === cleanIdentifier.toLowerCase() &&
           r.provider.toLowerCase() === data.provider.toLowerCase()
    );

    if (exists) {
      throw new Error('Penerima dengan rincian ini sudah tersimpan dalam daftar Anda.');
    }

    let userAvatar: string | undefined;
    let userVerified: boolean | undefined;

    if (data.recipient_type === 'nexa_user') {
      const u = this.findUserByUsernameOrEmail(cleanIdentifier);
      if (!u) {
        throw new Error('Pengguna NEXA dengan username tersebut tidak ditemukan.');
      }
      if (u.id === userId) {
        throw new Error('Anda tidak dapat menyimpan akun Anda sendiri sebagai penerima transfer.');
      }
      userAvatar = u.avatar_url;
      userVerified = u.is_verified;
    }

    const newRecipient: WalletRecipient = {
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      owner_user_id: userId,
      recipient_name: cleanName,
      recipient_type: data.recipient_type,
      account_identifier: cleanIdentifier,
      provider: data.provider || 'NEXA',
      created_at: new Date().toISOString(),
      user_avatar: userAvatar,
      user_verified: userVerified
    };

    this.data.wallet_recipients.unshift(newRecipient);
    this.saveDatabase();

    return newRecipient;
  }

  public deleteWalletRecipient(userId: string, recipientId: string): boolean {
    if (!this.data.wallet_recipients) this.data.wallet_recipients = [];
    const idx = this.data.wallet_recipients.findIndex(r => r.id === recipientId && r.owner_user_id === userId);
    if (idx !== -1) {
      this.data.wallet_recipients.splice(idx, 1);
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public searchNexaUserForTransfer(query: string, currentUserId: string): any[] {
    const clean = query.trim().toLowerCase().replace(/^@/, '');
    if (!clean) return [];

    return this.data.users
      .filter(u => u.id !== currentUserId && (
        u.username.toLowerCase().includes(clean) || 
        u.full_name.toLowerCase().includes(clean)
      ))
      .slice(0, 8)
      .map(u => ({
        id: u.id,
        full_name: u.full_name,
        username: u.username,
        avatar_url: u.avatar_url,
        is_verified: u.is_verified,
        role: u.role
      }));
  }

  public executeTransfer(
    senderId: string, 
    payload: {
      recipient_type: RecipientType;
      recipient_id?: string;
      recipient_name: string;
      account_identifier: string;
      provider: string;
      amount: number;
      notes?: string;
      idempotency_key?: string;
      pin: string;
    }
  ): WalletTransaction {
    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];

    // 1. Anti-Duplicate Protection via Idempotency Key
    if (payload.idempotency_key) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const existingTx = this.data.wallet_transactions.find(
        tx => tx.user_id === senderId && 
              tx.idempotency_key === payload.idempotency_key && 
              tx.created_at > tenMinutesAgo
      );
      if (existingTx) {
        return existingTx;
      }
    }

    const sender = this.findUserById(senderId);
    if (!sender) throw new Error('Pengguna pengirim tidak ditemukan.');

    if (sender.wallet_status === 'suspended' || sender.wallet_status === 'restricted') {
      throw new Error('Dompet NEXA Anda sedang dibatasi atau ditangguhkan dari melakukan transfer.');
    }

    // 2. Validate PIN
    this.verifyPin(senderId, payload.pin);

    // 3. Validate Amount & Daily Limits
    const amount = Math.round(payload.amount);
    if (isNaN(amount) || amount < WALLET_CONFIG.minTransfer) {
      throw new Error(`Minimal transfer adalah Rp ${new Intl.NumberFormat('id-ID').format(WALLET_CONFIG.minTransfer)}.`);
    }
    if (amount > WALLET_CONFIG.maxTransfer) {
      throw new Error(`Maksimal per transaksi adalah Rp ${new Intl.NumberFormat('id-ID').format(WALLET_CONFIG.maxTransfer)}.`);
    }

    const walletInfo = this.getUserWalletInfo(senderId);
    if (walletInfo.today_transfer_total + amount > WALLET_CONFIG.dailyTransferLimit) {
      throw new Error(`Transfer melebihi limit harian (Sisa limit hari ini: Rp ${new Intl.NumberFormat('id-ID').format(walletInfo.remaining_daily_limit)}).`);
    }

    const fee = WALLET_CONFIG.transferFee;
    const totalDebit = amount + fee;

    const senderBalance = sender.wallet_balance || 0;
    if (senderBalance < totalDebit) {
      throw new Error('Saldo NEXA Anda tidak mencukupi untuk melakukan transaksi ini.');
    }

    const now = new Date().toISOString();
    const dateCode = now.slice(0, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference_id = `TRF-${dateCode}-${randCode}`;

    // 4. Atomic Execution for Internal Transfer vs External Transfer
    if (payload.recipient_type === 'nexa_user') {
      let recipientUser = payload.recipient_id ? this.findUserById(payload.recipient_id) : null;
      if (!recipientUser && payload.account_identifier) {
        recipientUser = this.findUserByUsernameOrEmail(payload.account_identifier) || null;
      }

      if (!recipientUser) {
        throw new Error('Penerima pengguna NEXA tidak ditemukan.');
      }
      if (recipientUser.id === sender.id) {
        throw new Error('Anda tidak dapat mentransfer uang ke akun Anda sendiri.');
      }

      // ATOMIC TRANSACTION: DEBIT SENDER & CREDIT RECIPIENT
      const senderBalBefore = sender.wallet_balance || 0;
      sender.wallet_balance = senderBalBefore - totalDebit;
      sender.available_balance = Math.max(0, (sender.available_balance || 0) - totalDebit);
      const senderBalAfter = sender.wallet_balance;

      const recBalBefore = recipientUser.wallet_balance || 0;
      recipientUser.wallet_balance = recBalBefore + amount;
      recipientUser.available_balance = (recipientUser.available_balance || 0) + amount;
      const recBalAfter = recipientUser.wallet_balance;

      sender.updated_at = now;
      recipientUser.updated_at = now;

      // Sender Ledger Entry
      const senderTx: WalletTransaction = {
        id: 'wtx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        user_id: sender.id,
        type: 'transfer',
        direction: 'debit',
        amount,
        fee,
        total_amount: totalDebit,
        balance_before: senderBalBefore,
        balance_after: senderBalAfter,
        status: 'completed',
        reference_id,
        idempotency_key: payload.idempotency_key,
        description: `Transfer ke @${recipientUser.username} (${recipientUser.full_name})`,
        recipient_id: recipientUser.id,
        recipient_name: recipientUser.full_name,
        recipient_type: 'nexa_user',
        recipient_account: recipientUser.username,
        recipient_provider: 'NEXA',
        sender_id: sender.id,
        sender_name: sender.full_name,
        notes: payload.notes || undefined,
        created_at: now,
        completed_at: now
      };

      // Recipient Ledger Entry
      const recipientTx: WalletTransaction = {
        id: 'wtx_' + (Date.now() + 1) + '_' + Math.random().toString(36).substring(2, 6),
        user_id: recipientUser.id,
        type: 'transfer',
        direction: 'credit',
        amount,
        fee: 0,
        total_amount: amount,
        balance_before: recBalBefore,
        balance_after: recBalAfter,
        status: 'completed',
        reference_id,
        description: `Uang Masuk dari @${sender.username} (${sender.full_name})`,
        recipient_id: recipientUser.id,
        recipient_name: recipientUser.full_name,
        recipient_type: 'nexa_user',
        recipient_account: recipientUser.username,
        recipient_provider: 'NEXA',
        sender_id: sender.id,
        sender_name: sender.full_name,
        notes: payload.notes || undefined,
        created_at: now,
        completed_at: now
      };

      this.data.wallet_transactions.unshift(senderTx, recipientTx);
      this.saveDatabase();

      // Notifications
      const senderNotifBody = sender.mask_financial_notifs
        ? `Transfer ke @${recipientUser.username} berhasil diproses.`
        : `Transfer sebesar Rp ${new Intl.NumberFormat('id-ID').format(amount)} ke ${recipientUser.full_name} berhasil diproses.`;

      this.createNotification({
        recipient_id: sender.id,
        type: 'system',
        title: '💸 Transfer Berhasil',
        content: senderNotifBody,
        message: senderNotifBody
      });

      const recNotifBody = recipientUser.mask_financial_notifs
        ? `Anda menerima transaksi baru dari @${sender.username}.`
        : `Anda menerima transfer sebesar Rp ${new Intl.NumberFormat('id-ID').format(amount)} dari ${sender.full_name}.`;

      this.createNotification({
        recipient_id: recipientUser.id,
        type: 'system',
        title: '💰 Uang Masuk',
        content: recNotifBody,
        message: recNotifBody
      });

      return senderTx;

    } else {
      // External Transfer (Bank / E-Wallet Interface layer)
      const senderBalBefore = sender.wallet_balance || 0;
      sender.wallet_balance = senderBalBefore - totalDebit;
      sender.available_balance = Math.max(0, (sender.available_balance || 0) - totalDebit);
      const senderBalAfter = sender.wallet_balance;
      sender.updated_at = now;

      const senderTx: WalletTransaction = {
        id: 'wtx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        user_id: sender.id,
        type: 'transfer',
        direction: 'debit',
        amount,
        fee,
        total_amount: totalDebit,
        balance_before: senderBalBefore,
        balance_after: senderBalAfter,
        status: 'processing', // Menunggu Pemrosesan oleh Mitra Pembayaran
        reference_id,
        idempotency_key: payload.idempotency_key,
        description: `Transfer ke ${payload.provider} - ${payload.recipient_name} (${payload.account_identifier})`,
        recipient_name: payload.recipient_name,
        recipient_type: payload.recipient_type,
        recipient_account: payload.account_identifier,
        recipient_provider: payload.provider,
        sender_id: sender.id,
        sender_name: sender.full_name,
        notes: payload.notes || undefined,
        created_at: now
      };

      this.data.wallet_transactions.unshift(senderTx);
      this.saveDatabase();

      this.createNotification({
        recipient_id: sender.id,
        type: 'system',
        title: '💸 Transfer Diproses',
        content: `Permintaan transfer sebesar Rp ${new Intl.NumberFormat('id-ID').format(amount)} ke ${payload.provider} (${payload.recipient_name}) sedang diproses mitra pembayaran.`,
        message: `Permintaan transfer sebesar Rp ${new Intl.NumberFormat('id-ID').format(amount)} ke ${payload.provider} (${payload.recipient_name}) sedang diproses mitra pembayaran.`
      });

      return senderTx;
    }
  }

  public getWalletTransactions(userId: string, filter?: { type?: string; status?: string }): WalletTransaction[] {
    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];
    let list = this.data.wallet_transactions.filter(t => t.user_id === userId);

    if (filter?.type && filter.type !== 'all') {
      if (filter.type === 'income') {
        list = list.filter(t => t.direction === 'credit');
      } else if (filter.type === 'expense') {
        list = list.filter(t => t.direction === 'debit');
      } else {
        list = list.filter(t => t.type === filter.type);
      }
    }

    if (filter?.status && filter.status !== 'all') {
      list = list.filter(t => t.status === filter.status);
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getTransactionDetail(userId: string, transactionId: string): WalletTransaction | null {
    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];
    const tx = this.data.wallet_transactions.find(t => t.id === transactionId || t.reference_id === transactionId);
    if (!tx) return null;

    const user = this.findUserById(userId);
    const isOwner = tx.user_id === userId || tx.sender_id === userId || tx.recipient_id === userId;
    const isAdmin = user?.role === 'admin';

    if (!isOwner && !isAdmin) return null;
    return tx;
  }

  public adminGetFinancialDashboard(): AdminFinancialDashboard {
    const transactions = this.data.wallet_transactions || [];
    const adjustments = this.data.wallet_adjustments || [];
    const auditLogs = this.data.financial_audit_logs || [];

    const totalCirculating = this.data.users.reduce((sum, u) => sum + (u.wallet_balance || 0), 0);
    const completedTopups = transactions.filter(t => t.type === 'topup' && t.status === 'completed');
    const totalTopupVolume = completedTopups.reduce((sum, t) => sum + t.amount, 0);

    const completedTransfers = transactions.filter(t => t.type === 'transfer' && t.direction === 'debit' && t.status === 'completed');
    const totalTransferVolume = completedTransfers.reduce((sum, t) => sum + t.amount, 0);

    const pendingTopups = transactions.filter(t => t.type === 'topup' && t.status === 'pending');
    const pendingTopupVolume = pendingTopups.reduce((sum, t) => sum + t.amount, 0);

    return {
      overview: {
        total_circulating_balance: totalCirculating,
        total_topup_volume: totalTopupVolume,
        total_transfer_volume: totalTransferVolume,
        pending_topups_count: pendingTopups.length,
        pending_topups_volume: pendingTopupVolume,
        completed_transactions_count: transactions.filter(t => t.status === 'completed').length
      },
      topups: transactions.filter(t => t.type === 'topup').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      transfers: transactions.filter(t => t.type === 'transfer').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      ledger: [...transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      audit_logs: [...auditLogs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      adjustments: [...adjustments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    };
  }

  public adminManualAdjustment(
    adminId: string, 
    targetUserId: string, 
    amount: number, 
    type: 'credit' | 'debit', 
    reason: string
  ): WalletAdjustment {
    const admin = this.findUserById(adminId);
    if (!admin || admin.role !== 'admin') throw new Error('Akses khusus administrator.');

    const user = this.findUserById(targetUserId);
    if (!user) throw new Error('Pengguna target tidak ditemukan.');

    if (!reason || reason.trim().length === 0) {
      throw new Error('Alasan adjustment saldo wajib diisi.');
    }

    const cleanAmount = Math.round(Math.abs(amount));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      throw new Error('Nominal adjustment harus lebih besar dari 0.');
    }

    if (!this.data.wallet_adjustments) this.data.wallet_adjustments = [];
    if (!this.data.wallet_transactions) this.data.wallet_transactions = [];

    const now = new Date().toISOString();
    const dateCode = now.slice(0, 10).replace(/-/g, '');
    const randCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const reference_id = `ADJ-${dateCode}-${randCode}`;

    const balBefore = user.wallet_balance || 0;
    let balAfter = balBefore;

    if (type === 'credit') {
      balAfter = balBefore + cleanAmount;
    } else {
      if (balBefore < cleanAmount) {
        throw new Error(`Saldo pengguna (Rp ${new Intl.NumberFormat('id-ID').format(balBefore)}) tidak mencukupi untuk pengurangan sebesar Rp ${new Intl.NumberFormat('id-ID').format(cleanAmount)}.`);
      }
      balAfter = balBefore - cleanAmount;
    }

    user.wallet_balance = balAfter;
    user.available_balance = (user.available_balance || 0) + (type === 'credit' ? cleanAmount : -cleanAmount);
    user.updated_at = now;

    // Ledger Transaction Record
    const txRecord: WalletTransaction = {
      id: 'wtx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: user.id,
      type: 'adjustment',
      direction: type === 'credit' ? 'credit' : 'debit',
      amount: cleanAmount,
      fee: 0,
      total_amount: cleanAmount,
      balance_before: balBefore,
      balance_after: balAfter,
      status: 'completed',
      reference_id,
      description: `Penyesuaian Saldo oleh Administrator: ${reason.trim()}`,
      notes: reason.trim(),
      created_at: now,
      completed_at: now
    };
    this.data.wallet_transactions.unshift(txRecord);

    const adjRecord: WalletAdjustment = {
      id: 'adj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      admin_id: adminId,
      admin_name: admin.full_name,
      user_id: user.id,
      user_name: user.full_name,
      amount: cleanAmount,
      type,
      reason: reason.trim(),
      reference_id,
      created_at: now
    };
    this.data.wallet_adjustments.unshift(adjRecord);

    // Financial Audit Log
    this.createFinancialAuditLog({
      admin_id: adminId,
      admin_name: admin.full_name,
      action: 'manual_adjustment',
      target_type: 'user_wallet',
      target_id: user.id,
      amount: cleanAmount,
      reason: reason.trim(),
      metadata: { type, reference_id, balance_before: balBefore, balance_after: balAfter }
    });

    this.createNotification({
      recipient_id: user.id,
      type: 'system',
      title: type === 'credit' ? '💰 Penyesuaian Saldo (Masuk)' : 'ℹ️ Penyesuaian Saldo (Keluar)',
      content: `Penyesuaian saldo sebesar Rp ${new Intl.NumberFormat('id-ID').format(cleanAmount)} telah diterapkan ke akun Anda: ${reason.trim()}`,
      message: `Penyesuaian saldo sebesar Rp ${new Intl.NumberFormat('id-ID').format(cleanAmount)} telah diterapkan ke akun Anda: ${reason.trim()}`
    });

    this.saveDatabase();
    return adjRecord;
  }

  public createFinancialAuditLog(logData: Omit<FinancialAuditLog, 'id' | 'created_at'>): FinancialAuditLog {
    if (!this.data.financial_audit_logs) this.data.financial_audit_logs = [];
    const newLog: FinancialAuditLog = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString(),
      ...logData
    };
    this.data.financial_audit_logs.unshift(newLog);
    this.saveDatabase();
    return newLog;
  }

  // ============================================================
  // TAHAP 5: NEXA MATCH — CARI JODOH (18+ DATING & MATCHMAKING)
  // ============================================================

  public calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }

  public calculateMatchScore(userProfile: MatchProfile | null, targetProfile: MatchProfile): number {
    if (!userProfile) return 75;

    let score = 50;

    // 1. Age Range Alignment (+20 max)
    const userPrefs: MatchSearchPreferences = userProfile.search_preferences || { 
      min_age: 18, 
      max_age: 50, 
      gender_preference: ['semua'], 
      city_preference: '', 
      relationship_goals: ['serious', 'marriage', 'dating_first'], 
      interests: [] 
    };
    if (targetProfile.age >= (userPrefs.min_age || 18) && targetProfile.age <= (userPrefs.max_age || 50)) {
      score += 20;
    } else {
      const diff = Math.min(
        Math.abs(targetProfile.age - (userPrefs.min_age || 18)),
        Math.abs(targetProfile.age - (userPrefs.max_age || 50))
      );
      score += Math.max(0, 15 - diff * 3);
    }

    // 2. City / Location Match (+20 max)
    const userCity = (userProfile.city || '').trim().toLowerCase();
    const targetCity = (targetProfile.city || '').trim().toLowerCase();
    const prefCity = (userPrefs.city_preference || '').trim().toLowerCase();

    if (prefCity && targetCity.includes(prefCity)) {
      score += 20;
    } else if (userCity && targetCity && (userCity === targetCity || targetCity.includes(userCity) || userCity.includes(targetCity))) {
      score += 20;
    } else {
      score += 5;
    }

    // 3. Relationship Goal Match (+25 max)
    if (userPrefs.relationship_goals && userPrefs.relationship_goals.length > 0) {
      if (userPrefs.relationship_goals.includes(targetProfile.relationship_goal)) {
        score += 25;
      }
    } else if (userProfile.relationship_goal === targetProfile.relationship_goal) {
      score += 25;
    } else {
      score += 8;
    }

    // 4. Shared Interests (+5 each, max +20)
    const userInterests = userProfile.interests || [];
    const targetInterests = targetProfile.interests || [];
    const shared = userInterests.filter(i => targetInterests.includes(i));
    score += Math.min(20, shared.length * 5);

    // 5. Complete Profile (+5)
    if (targetProfile.bio && targetProfile.bio.length >= 20 && targetProfile.profile_photos.length >= 2) {
      score += 5;
    }

    // 6. Verified Profile (+5)
    if (targetProfile.verification_status === 'verified') {
      score += 5;
    }

    return Math.min(98, Math.max(52, score));
  }

  public seedMatchData() {
    const timePast = (hours: number) => new Date(Date.now() - hours * 3600 * 1000).toISOString();

    const sampleProfiles: MatchProfile[] = [
      {
        id: 'match_prof_clara',
        user_id: 'user_2',
        display_name: 'Clara Salsabila',
        date_of_birth: '1999-04-12',
        age: 27,
        age_verified: true,
        gender: 'wanita',
        city: 'Bandung',
        bio: 'Tech enthusiast & filmmaker. Suka ngobrol santai seputar buku, kopi hangat, dan mencari hubungan yang saling mendukung.',
        profile_photos: [
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80'
        ],
        occupation: 'Filmmaker & Content Creator',
        education: 'S1 Desain Komunikasi Visual',
        interests: ['Kopi', 'Fotografi', 'Film', 'Traveling', 'Musik'],
        relationship_goal: 'serious',
        religion_preference_optional: 'Islam',
        height_optional: 165,
        verification_status: 'verified',
        is_active: true,
        status: 'active',
        search_preferences: {
          gender_preference: ['pria'],
          min_age: 24,
          max_age: 34,
          city_preference: 'Bandung',
          relationship_goals: ['serious', 'marriage'],
          interests: ['Kopi', 'Musik', 'Traveling']
        },
        created_at: timePast(300),
        updated_at: timePast(20)
      },
      {
        id: 'match_prof_arvin',
        user_id: 'user_1',
        display_name: 'Arvin Pratama',
        date_of_birth: '1998-08-20',
        age: 28,
        age_verified: true,
        gender: 'pria',
        city: 'Bandung',
        bio: 'Product Designer yang gemar arsitektur minimalis dan hiking di akhir pekan. Mencari seseorang yang hangat dan satu frekuensi.',
        profile_photos: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80'
        ],
        occupation: 'Product Designer',
        education: 'S1 Arsitektur',
        interests: ['Desain', 'Alam & Hiking', 'Kopi', 'Buku', 'Fotografi'],
        relationship_goal: 'marriage',
        religion_preference_optional: 'Islam',
        height_optional: 178,
        verification_status: 'verified',
        is_active: true,
        status: 'active',
        search_preferences: {
          gender_preference: ['wanita'],
          min_age: 22,
          max_age: 30,
          city_preference: 'Bandung',
          relationship_goals: ['serious', 'marriage'],
          interests: ['Desain', 'Kopi', 'Alam & Hiking']
        },
        created_at: timePast(280),
        updated_at: timePast(15)
      },
      {
        id: 'match_prof_dion',
        user_id: 'user_4',
        display_name: 'Dion Wicaksono',
        date_of_birth: '1999-11-05',
        age: 26,
        age_verified: true,
        gender: 'pria',
        city: 'Jakarta Selatan',
        bio: 'Software engineer by day, acoustic guitarist by night. Mari ngobrol seputar ide teknologi dan kuliner lokal!',
        profile_photos: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80'
        ],
        occupation: 'Senior Software Engineer',
        education: 'S1 Ilmu Komputer',
        interests: ['Musik', 'Kuliner', 'Teknologi', 'Game', 'Kopi'],
        relationship_goal: 'dating_first',
        religion_preference_optional: 'Kristen',
        height_optional: 175,
        verification_status: 'none',
        is_active: true,
        status: 'active',
        search_preferences: {
          gender_preference: ['wanita'],
          min_age: 21,
          max_age: 30,
          city_preference: '',
          relationship_goals: ['dating_first', 'serious'],
          interests: ['Musik', 'Kuliner']
        },
        created_at: timePast(150),
        updated_at: timePast(10)
      }
    ];

    this.data.match_profiles = sampleProfiles;
    this.saveDatabase();
  }

  public getMatchProfileByUserId(userId: string): MatchProfile | null {
    if (!this.data.match_profiles) this.data.match_profiles = [];
    const prof = this.data.match_profiles.find(p => p.user_id === userId && p.status !== 'deleted');
    if (!prof) return null;

    // Recalculate dynamic age
    const age = this.calculateAge(prof.date_of_birth);
    return {
      ...prof,
      age: age || prof.age
    };
  }

  public getMatchProfileById(profileId: string): MatchProfile | null {
    if (!this.data.match_profiles) this.data.match_profiles = [];
    const prof = this.data.match_profiles.find(p => p.id === profileId && p.status !== 'deleted');
    if (!prof) return null;
    return {
      ...prof,
      age: this.calculateAge(prof.date_of_birth) || prof.age
    };
  }

  public createOrUpdateMatchProfile(userId: string, data: Partial<MatchProfile>): MatchProfile {
    if (!this.data.match_profiles) this.data.match_profiles = [];
    const now = new Date().toISOString();

    const user = this.findUserById(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    // Age verification requirement
    const dob = data.date_of_birth;
    if (dob) {
      const calculatedAge = this.calculateAge(dob);
      if (calculatedAge < MATCH_CONFIG.MIN_AGE) {
        throw new Error(`Fitur NEXA Match hanya diperbolehkan untuk pengguna berusia minimal ${MATCH_CONFIG.MIN_AGE} tahun.`);
      }
    }

    let existing = this.data.match_profiles.find(p => p.user_id === userId);

    if (existing) {
      const age = data.date_of_birth ? this.calculateAge(data.date_of_birth) : existing.age;
      const updated: MatchProfile = {
        ...existing,
        ...data,
        age: age || existing.age,
        age_verified: true,
        updated_at: now
      };
      const idx = this.data.match_profiles.findIndex(p => p.id === existing!.id);
      this.data.match_profiles[idx] = updated;
      this.saveDatabase();
      return updated;
    } else {
      const calculatedAge = dob ? this.calculateAge(dob) : 18;
      const newProfile: MatchProfile = {
        id: 'match_prof_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        display_name: (data.display_name || user.full_name || user.username).trim(),
        date_of_birth: dob || '2000-01-01',
        age: calculatedAge,
        age_verified: true,
        gender: data.gender || 'pria',
        city: (data.city || 'Jakarta').trim(),
        bio: (data.bio || '').trim(),
        profile_photos: data.profile_photos && data.profile_photos.length > 0 ? data.profile_photos : (user.avatar_url ? [user.avatar_url] : []),
        occupation: (data.occupation || '').trim(),
        education: (data.education || '').trim(),
        interests: data.interests || ['Musik', 'Kopi', 'Traveling'],
        relationship_goal: data.relationship_goal || 'serious',
        religion_preference_optional: data.religion_preference_optional || '',
        height_optional: data.height_optional || undefined,
        verification_status: 'none',
        is_active: data.is_active !== undefined ? data.is_active : true,
        status: 'active',
        search_preferences: data.search_preferences || {
          gender_preference: data.gender === 'pria' ? ['wanita'] : ['pria'],
          min_age: 18,
          max_age: 45,
          city_preference: '',
          relationship_goals: ['serious', 'marriage', 'dating_first'],
          interests: []
        },
        created_at: now,
        updated_at: now
      };

      this.data.match_profiles.push(newProfile);
      this.saveDatabase();
      return newProfile;
    }
  }

  public toggleMatchProfileStatus(userId: string, targetStatus?: 'active' | 'paused'): MatchProfile {
    const profile = this.getMatchProfileByUserId(userId);
    if (!profile) throw new Error('Profil NEXA Match belum dibuat.');

    const newStatus = targetStatus || (profile.status === 'active' ? 'paused' : 'active');
    profile.status = newStatus;
    profile.is_active = newStatus === 'active';
    profile.updated_at = new Date().toISOString();

    const idx = this.data.match_profiles.findIndex(p => p.id === profile.id);
    if (idx !== -1) {
      this.data.match_profiles[idx] = profile;
    }
    this.saveDatabase();
    return profile;
  }

  public deleteMatchProfile(userId: string): boolean {
    if (!this.data.match_profiles) return false;
    const idx = this.data.match_profiles.findIndex(p => p.user_id === userId);
    if (idx === -1) return false;

    this.data.match_profiles[idx].status = 'deleted';
    this.data.match_profiles[idx].is_active = false;
    this.data.match_profiles[idx].updated_at = new Date().toISOString();
    this.saveDatabase();
    return true;
  }

  public getDiscoverProfiles(
    userId: string,
    filter?: Partial<MatchSearchPreferences>,
    limit: number = 20
  ): {
    profiles: MatchProfile[];
    remaining_daily: number;
    total_available: number;
    has_reached_limit: boolean;
    user_profile: MatchProfile | null;
  } {
    if (!this.data.match_profiles) this.data.match_profiles = [];
    if (!this.data.match_likes) this.data.match_likes = [];
    if (!this.data.match_passes) this.data.match_passes = [];
    if (!this.data.blocks) this.data.blocks = [];
    if (!this.data.match_daily_limits) this.data.match_daily_limits = {};

    const userProfile = this.getMatchProfileByUserId(userId);

    // Verify age >= 18
    if (userProfile && userProfile.age < MATCH_CONFIG.MIN_AGE) {
      throw new Error('Akses ditolak: Pengguna harus berusia minimal 18 tahun.');
    }

    const todayKey = `${userId}_${new Date().toISOString().slice(0, 10)}`;
    const dailyRecord = this.data.match_daily_limits[todayKey] || { date: new Date().toISOString().slice(0, 10), count: 0 };
    const maxDaily = MATCH_CONFIG.MAX_DAILY_DISCOVER;
    const remainingDaily = Math.max(0, maxDaily - dailyRecord.count);

    if (remainingDaily <= 0) {
      return {
        profiles: [],
        remaining_daily: 0,
        total_available: 0,
        has_reached_limit: true,
        user_profile: userProfile
      };
    }

    // Get list of user IDs to exclude
    const likedIds = new Set(this.data.match_likes.filter(l => l.from_user_id === userId).map(l => l.to_user_id));
    const passedIds = new Set(this.data.match_passes.filter(p => p.from_user_id === userId).map(p => p.to_user_id));
    const blockedIds = new Set([
      ...this.data.blocks.filter(b => b.blocker_id === userId).map(b => b.blocked_id),
      ...this.data.blocks.filter(b => b.blocked_id === userId).map(b => b.blocker_id)
    ]);

    const activePrefs = {
      ...(userProfile?.search_preferences || {}),
      ...(filter || {})
    };

    const eligible = this.data.match_profiles.filter(p => {
      if (p.user_id === userId) return false;
      if (p.status !== 'active' || !p.is_active) return false;
      if (likedIds.has(p.user_id) || passedIds.has(p.user_id) || blockedIds.has(p.user_id)) return false;

      // Age filter
      const pAge = this.calculateAge(p.date_of_birth) || p.age;
      if (activePrefs.min_age && pAge < activePrefs.min_age) return false;
      if (activePrefs.max_age && pAge > activePrefs.max_age) return false;

      // Gender preference filter
      if (activePrefs.gender_preference && activePrefs.gender_preference.length > 0 && !activePrefs.gender_preference.includes('semua')) {
        if (!activePrefs.gender_preference.includes(p.gender as any)) return false;
      }

      // City filter
      if (activePrefs.city_preference && activePrefs.city_preference.trim() !== '') {
        if (!p.city.toLowerCase().includes(activePrefs.city_preference.toLowerCase())) return false;
      }

      // Relationship goal filter
      if (activePrefs.relationship_goals && activePrefs.relationship_goals.length > 0) {
        if (!activePrefs.relationship_goals.includes(p.relationship_goal as any)) return false;
      }

      // Verified only
      if (activePrefs.verified_only && p.verification_status !== 'verified') return false;

      return true;
    });

    // Score and rank profiles
    const scoredProfiles = eligible.map(p => {
      const u = this.findUserById(p.user_id);
      let safeUser: Partial<User> | undefined;
      if (u) {
        safeUser = {
          id: u.id,
          full_name: u.full_name,
          username: u.username,
          avatar_url: u.avatar_url,
          is_verified: u.is_verified
        };
      }

      const score = this.calculateMatchScore(userProfile, p);

      return {
        ...p,
        age: this.calculateAge(p.date_of_birth) || p.age,
        user: safeUser,
        compatibility_score: score
      };
    });

    // Sort by compatibility score descending
    scoredProfiles.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));

    const result = scoredProfiles.slice(0, Math.min(limit, remainingDaily));

    return {
      profiles: result,
      remaining_daily: remainingDaily,
      total_available: scoredProfiles.length,
      has_reached_limit: false,
      user_profile: userProfile
    };
  }

  public likeMatchProfile(
    fromUserId: string,
    toUserId: string,
    isSuperLike: boolean = false
  ): {
    isMatch: boolean;
    match?: MatchItem;
    partnerProfile?: MatchProfile;
    like: MatchLike;
  } {
    if (!this.data.match_likes) this.data.match_likes = [];
    if (!this.data.matches) this.data.matches = [];
    if (!this.data.match_daily_limits) this.data.match_daily_limits = {};

    if (fromUserId === toUserId) {
      throw new Error('Anda tidak dapat menyukai profil Anda sendiri.');
    }

    const fromProfile = this.getMatchProfileByUserId(fromUserId);
    const toProfile = this.getMatchProfileByUserId(toUserId);

    if (!toProfile || toProfile.status !== 'active') {
      throw new Error('Profil yang Anda sukai tidak aktif atau tidak ditemukan.');
    }

    // Increment daily discover view count
    const todayKey = `${fromUserId}_${new Date().toISOString().slice(0, 10)}`;
    if (!this.data.match_daily_limits[todayKey]) {
      this.data.match_daily_limits[todayKey] = { date: new Date().toISOString().slice(0, 10), count: 0 };
    }
    this.data.match_daily_limits[todayKey].count += 1;

    // Check duplicate like
    const existingLike = this.data.match_likes.find(l => l.from_user_id === fromUserId && l.to_user_id === toUserId);
    let likeRecord: MatchLike;

    if (existingLike) {
      likeRecord = existingLike;
    } else {
      likeRecord = {
        id: 'like_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        from_user_id: fromUserId,
        to_user_id: toUserId,
        is_super_like: isSuperLike,
        created_at: new Date().toISOString()
      };
      this.data.match_likes.push(likeRecord);
    }

    // Check mutual like
    const reciprocalLike = this.data.match_likes.find(l => l.from_user_id === toUserId && l.to_user_id === fromUserId);

    if (reciprocalLike) {
      // Check if match already exists
      let match = this.data.matches.find(
        m => (m.user_a === fromUserId && m.user_b === toUserId) || (m.user_a === toUserId && m.user_b === fromUserId)
      );

      const now = new Date().toISOString();

      if (!match) {
        match = {
          id: 'match_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          user_a: fromUserId,
          user_b: toUserId,
          status: 'active',
          created_at: now
        };
        this.data.matches.unshift(match);
      } else {
        match.status = 'active';
      }

      // Ensure a conversation exists between both users
      let conv = this.data.conversations.find(
        c => c.member_ids.includes(fromUserId) && c.member_ids.includes(toUserId)
      );

      if (!conv) {
        conv = {
          id: 'conv_match_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          member_ids: [fromUserId, toUserId],
          created_at: now,
          updated_at: now
        };
        this.data.conversations.unshift(conv);
      }

      match.conversation_id = conv.id;

      // Send Match Notifications to both users
      const fromUser = this.findUserById(fromUserId);
      const toUser = this.findUserById(toUserId);

      const fromName = fromProfile?.display_name || fromUser?.full_name || 'Seseorang';
      const toName = toProfile?.display_name || toUser?.full_name || 'Seseorang';

      // Notif to toUser
      this.createNotification({
        recipient_id: toUserId,
        actor_id: fromUserId,
        type: 'match',
        title: '❤️ Kalian Match!',
        message: `Kamu dan ${fromName} saling menyukai. Mulai obrolan sekarang!`,
        content: `Kamu dan ${fromName} saling menyukai.`,
        match_id: match.id,
        conversation_id: conv.id
      });

      // Notif to fromUser
      this.createNotification({
        recipient_id: fromUserId,
        actor_id: toUserId,
        type: 'match',
        title: '❤️ Kalian Match!',
        message: `Kamu dan ${toName} saling menyukai. Mulai obrolan sekarang!`,
        content: `Kamu dan ${toName} saling menyukai.`,
        match_id: match.id,
        conversation_id: conv.id
      });

      this.saveDatabase();

      return {
        isMatch: true,
        match,
        partnerProfile: toProfile,
        like: likeRecord
      };
    } else {
      // Non-mutual single like
      const fromUser = this.findUserById(fromUserId);
      const fromName = fromProfile?.display_name || fromUser?.full_name || 'Seseorang';

      // Optional discreet like notification
      this.createNotification({
        recipient_id: toUserId,
        actor_id: fromUserId,
        type: 'match_activity',
        title: '✨ Ada yang Menyukai Anda',
        message: `Seseorang menyukai profil Match Anda. Buka NEXA Match untuk melihat!`,
        content: `Ada like baru di profil Match Anda.`
      });

      this.saveDatabase();

      return {
        isMatch: false,
        like: likeRecord
      };
    }
  }

  public passMatchProfile(fromUserId: string, toUserId: string): boolean {
    if (!this.data.match_passes) this.data.match_passes = [];
    if (!this.data.match_daily_limits) this.data.match_daily_limits = {};

    // Increment daily discover view count
    const todayKey = `${fromUserId}_${new Date().toISOString().slice(0, 10)}`;
    if (!this.data.match_daily_limits[todayKey]) {
      this.data.match_daily_limits[todayKey] = { date: new Date().toISOString().slice(0, 10), count: 0 };
    }
    this.data.match_daily_limits[todayKey].count += 1;

    const exists = this.data.match_passes.some(p => p.from_user_id === fromUserId && p.to_user_id === toUserId);
    if (!exists) {
      this.data.match_passes.push({
        id: 'pass_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        from_user_id: fromUserId,
        to_user_id: toUserId,
        created_at: new Date().toISOString()
      });
      this.saveDatabase();
    }
    return true;
  }

  public getMyMatches(userId: string): MatchItem[] {
    if (!this.data.matches) this.data.matches = [];
    if (!this.data.blocks) this.data.blocks = [];

    const blockedIds = new Set([
      ...this.data.blocks.filter(b => b.blocker_id === userId).map(b => b.blocked_id),
      ...this.data.blocks.filter(b => b.blocked_id === userId).map(b => b.blocker_id)
    ]);

    const activeMatches = this.data.matches.filter(
      m => (m.user_a === userId || m.user_b === userId) && m.status === 'active'
    );

    return activeMatches.filter(m => {
      const partnerId = m.user_a === userId ? m.user_b : m.user_a;
      return !blockedIds.has(partnerId);
    }).map(m => {
      const partnerId = m.user_a === userId ? m.user_b : m.user_a;
      const partnerProf = this.getMatchProfileByUserId(partnerId);
      const partnerUser = this.findUserById(partnerId);

      let safePartnerProf: MatchProfile | undefined;
      if (partnerProf) {
        safePartnerProf = {
          ...partnerProf,
          user: partnerUser ? {
            id: partnerUser.id,
            full_name: partnerUser.full_name,
            username: partnerUser.username,
            avatar_url: partnerUser.avatar_url,
            is_verified: partnerUser.is_verified
          } : undefined
        };
      }

      // Check last message
      let lastMsg: Message | undefined;
      if (m.conversation_id) {
        const msgs = this.data.messages.filter(msg => msg.conversation_id === m.conversation_id);
        if (msgs.length > 0) {
          lastMsg = msgs[msgs.length - 1];
        }
      }

      return {
        ...m,
        partner: safePartnerProf,
        last_message_at: lastMsg?.created_at,
        last_message_preview: lastMsg?.content
      };
    });
  }

  public getWhoLikedMe(userId: string): MatchProfile[] {
    if (!this.data.match_likes) this.data.match_likes = [];
    if (!this.data.matches) this.data.matches = [];
    if (!this.data.blocks) this.data.blocks = [];

    const userProfile = this.getMatchProfileByUserId(userId);

    const alreadyMatchedIds = new Set(
      this.data.matches
        .filter(m => (m.user_a === userId || m.user_b === userId) && m.status === 'active')
        .map(m => (m.user_a === userId ? m.user_b : m.user_a))
    );

    const blockedIds = new Set([
      ...this.data.blocks.filter(b => b.blocker_id === userId).map(b => b.blocked_id),
      ...this.data.blocks.filter(b => b.blocked_id === userId).map(b => b.blocker_id)
    ]);

    const likes = this.data.match_likes.filter(
      l => l.to_user_id === userId && !alreadyMatchedIds.has(l.from_user_id) && !blockedIds.has(l.from_user_id)
    );

    const profiles: MatchProfile[] = [];

    likes.forEach(like => {
      const prof = this.getMatchProfileByUserId(like.from_user_id);
      if (prof && prof.status === 'active') {
        const u = this.findUserById(prof.user_id);
        const score = this.calculateMatchScore(userProfile, prof);
        profiles.push({
          ...prof,
          user: u ? {
            id: u.id,
            full_name: u.full_name,
            username: u.username,
            avatar_url: u.avatar_url,
            is_verified: u.is_verified
          } : undefined,
          compatibility_score: score,
          has_super_liked: like.is_super_like
        });
      }
    });

    return profiles;
  }

  public unmatchUser(userId: string, matchId: string): boolean {
    if (!this.data.matches) return false;
    const match = this.data.matches.find(m => m.id === matchId && (m.user_a === userId || m.user_b === userId));
    if (!match) return false;

    match.status = 'unmatched';
    this.saveDatabase();
    return true;
  }

  public blockMatchUser(blockerId: string, blockedId: string): boolean {
    // 1. Record block
    if (!this.data.blocks) {
      this.data.blocks = [];
    }
    const alreadyBlocked = this.data.blocks.some(b => b.blocker_id === blockerId && b.blocked_id === blockedId);
    if (!alreadyBlocked) {
      this.data.blocks.push({
        id: 'blk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        blocker_id: blockerId,
        blocked_id: blockedId,
        created_at: new Date().toISOString()
      });
    }

    // 2. Set any active match to blocked
    if (this.data.matches) {
      this.data.matches.forEach(m => {
        if ((m.user_a === blockerId && m.user_b === blockedId) || (m.user_a === blockedId && m.user_b === blockerId)) {
          m.status = 'blocked';
        }
      });
    }

    // 3. Remove likes
    if (this.data.match_likes) {
      this.data.match_likes = this.data.match_likes.filter(
        l => !(l.from_user_id === blockerId && l.to_user_id === blockedId) &&
             !(l.from_user_id === blockedId && l.to_user_id === blockerId)
      );
    }

    this.saveDatabase();
    return true;
  }

  public reportMatchProfile(
    reporterId: string,
    reportedUserId: string,
    category: MatchReportCategory,
    reason: string
  ): MatchReport {
    if (!this.data.match_reports) this.data.match_reports = [];

    const reporter = this.findUserById(reporterId);
    const reportedProfile = this.getMatchProfileByUserId(reportedUserId);

    const report: MatchReport = {
      id: 'mrep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      reporter_id: reporterId,
      reporter_name: reporter?.full_name || reporter?.username,
      reported_user_id: reportedUserId,
      reported_profile: reportedProfile || undefined,
      category,
      reason: reason.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    this.data.match_reports.unshift(report);

    // Also register in general reports table
    this.createReport(reporterId, 'user', reportedUserId, `[NEXA MATCH] ${category}: ${reason.trim()}`);

    this.saveDatabase();
    return report;
  }

  public requestMatchVerification(userId: string, photoUrl: string): MatchProfile {
    const profile = this.getMatchProfileByUserId(userId);
    if (!profile) throw new Error('Profil NEXA Match tidak ditemukan.');

    profile.verification_status = 'pending';
    profile.verification_photo_url = photoUrl;
    profile.updated_at = new Date().toISOString();

    const idx = this.data.match_profiles.findIndex(p => p.id === profile.id);
    if (idx !== -1) {
      this.data.match_profiles[idx] = profile;
    }
    this.saveDatabase();
    return profile;
  }

  public adminGetMatchDashboard(): MatchAdminDashboard {
    if (!this.data.match_profiles) this.data.match_profiles = [];
    if (!this.data.matches) this.data.matches = [];
    if (!this.data.match_reports) this.data.match_reports = [];
    if (!this.data.blocks) this.data.blocks = [];

    const todayStr = new Date().toISOString().slice(0, 10);
    const matchesToday = this.data.matches.filter(m => m.created_at.startsWith(todayStr) && m.status === 'active').length;
    const activeProfiles = this.data.match_profiles.filter(p => p.status === 'active').length;
    const pausedProfiles = this.data.match_profiles.filter(p => p.status === 'paused').length;
    const suspendedProfiles = this.data.match_profiles.filter(p => p.status === 'suspended').length;
    const pendingVerifs = this.data.match_profiles.filter(p => p.verification_status === 'pending');
    const newReports = this.data.match_reports.filter(r => r.status === 'pending');

    return {
      overview: {
        total_matches: this.data.matches.filter(m => m.status === 'active').length,
        matches_today: matchesToday,
        active_profiles: activeProfiles,
        paused_profiles: pausedProfiles,
        suspended_profiles: suspendedProfiles,
        pending_verifications: pendingVerifs.length,
        new_reports: newReports.length,
        blocked_users_count: this.data.blocks.length
      },
      profiles: this.data.match_profiles.slice(0, 50),
      reports: this.data.match_reports.slice(0, 50),
      verifications: pendingVerifs
    };
  }

  public adminGetMatchProfiles(status?: string, search?: string): MatchProfile[] {
    if (!this.data.match_profiles) this.data.match_profiles = [];
    let list = this.data.match_profiles;

    if (status && status !== 'all') {
      list = list.filter(p => p.status === status);
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.display_name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.bio.toLowerCase().includes(q));
    }

    return list;
  }

  public adminUpdateMatchProfileStatus(profileId: string, status: MatchProfileStatus, adminId: string): MatchProfile | null {
    if (!this.data.match_profiles) return null;
    const idx = this.data.match_profiles.findIndex(p => p.id === profileId);
    if (idx === -1) return null;

    const prof = this.data.match_profiles[idx];
    prof.status = status;
    prof.is_active = status === 'active';
    prof.updated_at = new Date().toISOString();

    // Send moderation notification
    this.createNotification({
      recipient_id: prof.user_id,
      type: 'match_moderation',
      title: status === 'suspended' ? '⚠️ Profil NEXA Match Ditangguhkan' : 'ℹ️ Status Profil NEXA Match Diperbarui',
      message: status === 'suspended'
        ? 'Profil NEXA Match Anda telah ditangguhkan oleh tim moderasi karena melanggar panduan komunitas.'
        : `Status profil Match Anda telah diubah menjadi ${status}.`,
      content: `Pembaruan status profil Match oleh Admin.`
    });

    this.saveDatabase();
    return prof;
  }

  public adminReviewMatchVerification(profileId: string, status: 'verified' | 'rejected', adminId: string, notes?: string): MatchProfile | null {
    if (!this.data.match_profiles) return null;
    const idx = this.data.match_profiles.findIndex(p => p.id === profileId);
    if (idx === -1) return null;

    const prof = this.data.match_profiles[idx];
    prof.verification_status = status;
    prof.verification_notes = notes || '';
    prof.updated_at = new Date().toISOString();

    this.createNotification({
      recipient_id: prof.user_id,
      type: 'match_security',
      title: status === 'verified' ? '✓ Profil Match Terverifikasi!' : 'ℹ️ Verifikasi Profil Match Ditolak',
      message: status === 'verified'
        ? 'Selamat! Profil NEXA Match Anda kini telah mendapatkan badge Terverifikasi resmi.'
        : `Pengajuan verifikasi profil Anda belum dapat disetujui: ${notes || 'Foto tidak memenuhi syarat.'}`,
      content: `Status verifikasi NEXA Match.`
    });

    this.saveDatabase();
    return prof;
  }

  public adminGetMatchReports(status?: string): MatchReport[] {
    if (!this.data.match_reports) this.data.match_reports = [];
    if (status && status !== 'all') {
      return this.data.match_reports.filter(r => r.status === status);
    }
    return this.data.match_reports;
  }

  public adminReviewMatchReport(
    reportId: string,
    status: 'resolved' | 'dismissed',
    action: 'suspend' | 'warn' | 'none',
    adminId: string,
    notes?: string
  ): MatchReport | null {
    if (!this.data.match_reports) return null;
    const report = this.data.match_reports.find(r => r.id === reportId);
    if (!report) return null;

    report.status = status;
    report.admin_notes = notes || '';

    if (action === 'suspend') {
      const prof = this.getMatchProfileByUserId(report.reported_user_id);
      if (prof) {
        this.adminUpdateMatchProfileStatus(prof.id, 'suspended', adminId);
      }
    } else if (action === 'warn') {
      this.createNotification({
        recipient_id: report.reported_user_id,
        type: 'match_security',
        title: '⚠️ Peringatan Komunitas NEXA Match',
        message: `Akun Anda menerima laporan terkait aktivitas yang mencurigakan atau tidak pantas. Harap patuhi panduan keamanan NEXA: ${notes || 'Dilarang meminta uang atau menyalahgunakan fitur match.'}`,
        content: `Peringatan moderasi Match.`
      });
    }

    this.saveDatabase();
    return report;
  }
}

export const db = new DatabaseManager();

