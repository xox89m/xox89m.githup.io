import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Review, ReviewStats, Achievement } from '../types';
import { 
  X, 
  Trophy, 
  Sparkles, 
  Award, 
  User, 
  LogIn, 
  Mail, 
  ShieldCheck, 
  LogOut, 
  AlertCircle,
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  ChevronRight,
  Lock,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import {
  submitGameReview,
  subscribeToGameReviews,
  formatRelativeThaiTime
} from '../services/reviewService';
import { ALL_ACHIEVEMENTS, RARITY_INFO } from '../data/achievements';
import { AchievementsSection } from './AchievementsSection';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLoginGoogle: (data: { name: string; email: string; avatar?: string; id?: string }) => void;
  onLogout?: () => void;
  onUpdateProfile: (name: string, avatar: string) => void;
  initialTab?: 'account' | 'achievements' | 'rating';
  onRecordReview?: () => void;
}

const AVATARS = ['🧑‍🔬', '👨‍🔬', '👩‍🎓', '🧙‍♂️', '👸', '⚡', '🧪', '⚛️', '🏆', '💎'];

const RATING_LABELS: Record<number, { text: string; emoji: string; color: string }> = {
  5: { text: 'สุดยอดมาก! ชอบมากที่สุด', emoji: '🌟🌟🌟🌟🌟', color: 'text-amber-500' },
  4: { text: 'สนุกมาก เล่นเพลิน แนะนำเลย', emoji: '⭐⭐⭐⭐', color: 'text-amber-400' },
  3: { text: 'สนุกดี เล่นได้เรื่อยๆ', emoji: '⭐⭐⭐', color: 'text-yellow-500' },
  2: { text: 'พอใช้ อยากให้พัฒนาเพิ่ม', emoji: '⭐⭐', color: 'text-orange-400' },
  1: { text: 'ควรปรับปรุงเพิ่มเติม', emoji: '⭐', color: 'text-rose-400' }
};

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  onLoginGoogle,
  onLogout,
  onUpdateProfile,
  initialTab = 'account',
  onRecordReview
}) => {
  // Modal Navigation Tab
  const [modalTab, setModalTab] = useState<'account' | 'achievements' | 'rating'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setModalTab(initialTab);
    }
  }, [initialTab]);

  // Profile Form States
  const [nameInput, setNameInput] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [googleEmailInput, setGoogleEmailInput] = useState(user.email || '');
  const [googleNameInput, setGoogleNameInput] = useState(user.name.includes('นักทดลอง') ? '' : user.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Selected Achievement Detail Modal
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Rating & Review States
  const [reviewSubTab, setReviewSubTab] = useState<'write' | 'list'>('write');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>(
    user.name || (user.isGuest ? 'ผู้เล่นทั่วไป' : 'ผู้เล่นเคมี')
  );
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState<boolean>(false);
  const [filterStar, setFilterStar] = useState<number | null>(null);

  // Real-time Firestore Reviews & Stats
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 5.0,
    totalReviews: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  // Sync initialTab whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setModalTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Sync user profile changes
  useEffect(() => {
    setNameInput(user.name);
    setSelectedAvatar(user.avatar);
    setGoogleEmailInput(user.email || '');
    setReviewerName(user.name || (user.isGuest ? 'ผู้เล่นทั่วไป' : 'ผู้เล่นเคมี'));
  }, [user]);

  // Subscribe to real-time reviews from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToGameReviews((newReviews, newStats) => {
      setReviews(newReviews);
      setStats(newStats);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Attempt to initialize Google Identity Services button if available
  useEffect(() => {
    if (!isOpen || !user.isGuest || modalTab !== 'account') return;

    try {
      const google = (window as unknown as { google?: { accounts?: { id?: { initialize: (cfg: unknown) => void; renderButton: (el: HTMLElement, opts: unknown) => void } } } }).google;
      if (google?.accounts?.id && googleBtnRef.current) {
        const clientId = (import.meta as unknown as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env?.VITE_GOOGLE_CLIENT_ID || '';
        if (clientId) {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: { credential: string }) => {
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const decoded = JSON.parse(jsonPayload);
                onLoginGoogle({
                  name: decoded.name || decoded.given_name || 'นักเคมี Google',
                  email: decoded.email,
                  avatar: decoded.picture || '🧪',
                  id: `google-${decoded.sub || decoded.email}`
                });
                onClose();
              } catch (e) {
                console.error('Error decoding Google JWT', e);
              }
            }
          });
          google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            locale: 'th'
          });
        }
      }
    } catch (e) {
      console.warn('Google GSI initialization notice:', e);
    }
  }, [isOpen, user.isGuest, modalTab, onLoginGoogle, onClose]);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    if (nameInput.trim()) {
      onUpdateProfile(nameInput.trim(), selectedAvatar);
    }
  };

  const handleDirectGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const email = googleEmailInput.trim().toLowerCase();
    if (!email) {
      setErrorMsg('กรุณากรอกอีเมล Google ของคุณ (เช่น user@gmail.com)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('รูปแบบอีเมลไม่ถูกต้อง กรุณากรอกอีเมลจริง');
      return;
    }

    setIsSubmitting(true);

    const displayName = googleNameInput.trim() || email.split('@')[0];
    onLoginGoogle({
      name: displayName,
      email: email,
      avatar: selectedAvatar || '🧪',
      id: `google-${email.replace(/[^a-zA-Z0-9]/g, '_')}`
    });

    setIsSubmitting(false);
  };

  const effectiveRating = hoverRating !== null ? hoverRating : rating;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReview) return;

    soundManager.playClick();
    setIsSubmittingReview(true);

    try {
      await submitGameReview({
        rating,
        comment: comment.trim(),
        userId: user.id || `guest_${Date.now().toString(36)}`,
        userName: reviewerName.trim() || user.name || 'ผู้เล่นทั่วไป',
        userAvatar: user.avatar || selectedAvatar || '⭐'
      });

      // Celebration sound & confetti
      soundManager.playCorrect();
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (onRecordReview) {
        onRecordReview();
      }

      setReviewSubmitSuccess(true);
      setIsSubmittingReview(false);

      setTimeout(() => {
        setReviewSubmitSuccess(false);
        setReviewSubTab('list');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setIsSubmittingReview(false);
    }
  };

  const filteredReviews = filterStar
    ? reviews.filter((r) => Math.round(r.rating) === filterStar)
    : reviews;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-zinc-950 shadow-2xl border-2 border-slate-900 dark:border-zinc-800 text-slate-800 dark:text-slate-100 transition-colors max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 dark:border-zinc-800 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-5 py-3.5 text-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm border-2 border-slate-900">
              {selectedAvatar}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {modalTab === 'account' ? 'บัญชีผู้เล่น & ล็อคอิน' : 'ให้คะแนนและรีวิวเกม'}
                </h2>
                {!user.isGuest ? (
                  <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                    <ShieldCheck className="h-2.5 w-2.5" /> Verified
                  </span>
                ) : (
                  <span className="bg-slate-900 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                    {stats.averageRating.toFixed(1)} ★
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-950 font-bold">
                {user.isGuest ? 'โหมดบุคคลทั่วไป · ส่งคะแนนรีวิวได้ทันที' : `บัญชี: ${user.email}`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            title="ปิดหน้าต่าง"
            className="rounded-full p-1.5 text-slate-900 hover:bg-black/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Segmented Navigation Tabs: Profile vs. Achievements vs. Rating */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-1.5 gap-1 text-xs font-black shrink-0">
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setModalTab('account');
            }}
            className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              modalTab === 'account'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-zinc-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span className="truncate">โปรไฟล์ & บัญชี</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setModalTab('achievements');
            }}
            className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              modalTab === 'achievements'
                ? 'bg-amber-400 dark:bg-amber-500 text-slate-950 shadow-xs border border-amber-500 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-slate-950 shrink-0" />
            <span className="truncate">ความสำเร็จ ({(user.unlockedAchievements || []).length}/{ALL_ACHIEVEMENTS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setModalTab('rating');
            }}
            className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              modalTab === 'rating'
                ? 'bg-amber-400 dark:bg-amber-500 text-slate-950 shadow-xs border border-amber-500 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-600 dark:text-slate-950 shrink-0" />
            <span className="truncate">รีวิว ({stats.averageRating.toFixed(1)}★)</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {modalTab === 'account' ? (
            /* TAB 1: USER STATS & GOOGLE LOGIN & ACHIEVEMENTS SHOWCASE */
            <div className="space-y-4">
              {/* User Stats Card */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 dark:bg-zinc-900 p-3 text-center border-2 border-slate-900 dark:border-zinc-800 shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#27272a]">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    เลเวล
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">Lv.{user.level}</div>
                </div>
                <div className="border-x border-slate-200 dark:border-zinc-800">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                    <Trophy className="h-3 w-3 text-blue-500 dark:text-cyan-400" />
                    คะแนนสะสม
                  </div>
                  <div className="text-base sm:text-lg font-black text-blue-600 dark:text-cyan-400">{user.totalPoints.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                    <Award className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                    ชนะศึกดวล
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">{user.wins} ครั้ง</div>
                </div>
              </div>

              {/* ACHIEVEMENTS SHOWCASE IN PLAYER PROFILE */}
              <div className="rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-850 p-3.5 shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#27272a] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span>เหรียญตราความสำเร็จ</span>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      {(user.unlockedAchievements || []).length}/{ALL_ACHIEVEMENTS.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setModalTab('achievements');
                    }}
                    className="text-[11px] font-black text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>ดูทั้งหมด & ภารกิจ</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Badge Icons Showcase */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                  {ALL_ACHIEVEMENTS.map(ach => {
                    const isUnlocked = (user.unlockedAchievements || []).includes(ach.id);
                    const rarity = RARITY_INFO[ach.rarity];
                    return (
                      <button
                        key={ach.id}
                        type="button"
                        onClick={() => {
                          soundManager.playClick();
                          setSelectedAchievement(ach);
                        }}
                        title={`${ach.title} (${isUnlocked ? 'ปลดล็อกแล้ว' : 'ยังไม่ปลดล็อก'})`}
                        className={`group relative flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-xl border-2 transition-transform active:scale-95 cursor-pointer ${
                          isUnlocked
                            ? `${rarity.border} ${rarity.bg} shadow-sm hover:scale-105`
                            : 'border-slate-300 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/60 opacity-40 hover:opacity-75'
                        }`}
                      >
                        <span className="text-xl">{ach.icon}</span>
                        {!isUnlocked ? (
                          <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white rounded-full p-0.5 text-[7px] border border-slate-700">
                            🔒
                          </span>
                        ) : (
                          <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 text-[7px] shadow-xs">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INTEGRATED RATING & REVIEW CALLOUT IN LOGIN TAB */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border-2 border-amber-300 dark:border-amber-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 text-center sm:text-left">
                  <div className="h-9 w-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-lg font-black shrink-0 border border-slate-900 shadow-xs">
                    ⭐
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        ให้คะแนนความพึงพอใจเกมเคมี
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-900 text-amber-300">
                        {stats.averageRating.toFixed(1)} ★
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                      {stats.totalReviews > 0 ? `จาก ${stats.totalReviews} รีวิวผู้เล่น · แตะเพื่อให้ดาว` : 'ยังไม่มีใครรีวิว ร่วมเป็นคนแรกเลย!'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setRating(starVal);
                        setModalTab('rating');
                        setReviewSubTab('write');
                      }}
                      title={`ให้คะแนน ${starVal} ดาว`}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star className="h-5 w-5 fill-amber-400 text-amber-500 drop-shadow-xs" />
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setModalTab('rating');
                    }}
                    className="ml-1 text-[11px] font-black px-2 py-1 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-500 transition cursor-pointer"
                  >
                    รีวิว
                  </button>
                </div>
              </div>

              {/* Google Sign-in Section */}
              {user.isGuest || !user.email ? (
                <div className="rounded-2xl border-2 border-blue-600 dark:border-cyan-500 bg-blue-50/90 dark:bg-zinc-900 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-blue-950 dark:text-white">
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>เข้าสู่ระบบด้วยบัญชี Google ของคุณ</span>
                  </div>

                  <p className="text-xs text-blue-900 dark:text-slate-300 leading-relaxed font-medium">
                    เชื่อมต่อบัญชี Google จริงเพื่อบันทึกคะแนนสะสมถาวร แสดงชื่อจริงของคุณในกระดานคะแนนเรียลไทม์ และแข่งขันกับผู้เล่นคนอื่น
                  </p>

                  {/* Native GSI Button Target container if available */}
                  <div ref={googleBtnRef} className="w-full min-h-[40px]" />

                  {/* Direct Google Account Form */}
                  <form onSubmit={handleDirectGoogleLogin} className="space-y-2.5 pt-1">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        อีเมล Google ของคุณ (เช่น user@gmail.com):
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="ชื่อบัญชี@gmail.com"
                          value={googleEmailInput}
                          onChange={e => {
                            setGoogleEmailInput(e.target.value);
                            setErrorMsg('');
                          }}
                          className="w-full rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 pl-9 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-hidden"
                        />
                        <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        ชื่อเล่นที่ต้องการแสดง (Display Name):
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น กานต์ นักเคมี (เว้นว่างไว้จะใช้ชื่ออีเมล)"
                        value={googleNameInput}
                        onChange={e => setGoogleNameInput(e.target.value)}
                        maxLength={25}
                        className="w-full rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-hidden"
                      />
                    </div>

                    {errorMsg && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/60 p-2 rounded-xl border border-rose-200 dark:border-rose-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-98 text-white font-black rounded-xl shadow-md border-2 border-slate-900 dark:border-zinc-700 transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>{isSubmitting ? 'กำลังเชื่อมต่อ...' : 'ยืนยันและเข้าสู่ระบบด้วย Google'}</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-zinc-900 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <span>เชื่อมต่อกับบัญชี Google เรียบร้อย</span>
                        </div>
                        <div className="text-xs text-emerald-800 dark:text-emerald-400 font-bold font-mono">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {onLogout && (
                      <button
                        onClick={onLogout}
                        className="py-1 px-2.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center gap-1 cursor-pointer transition"
                        title="ออกจากระบบ Google เพื่อสลับบัญชี"
                      >
                        <LogOut className="h-3 w-3" />
                        <span>สลับบัญชี</span>
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-tight">
                    คะแนนสะสม {user.totalPoints.toLocaleString()} แต้มของคุณถูกบันทึกอย่างปลอดภัยและซิงก์กับกระดานผู้นำเรียลไทม์แล้ว
                  </div>
                </div>
              )}

              {/* Edit Profile Form */}
              <div className="space-y-3 rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-4 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]">
                <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-100">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                    ปรับแต่งชื่อ & สัญลักษณ์ในเกม
                  </span>
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-bold block mb-1">
                    ชื่อที่ใช้แข่งขัน:
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    maxLength={24}
                    className="w-full rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-black text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400 font-bold block mb-1">
                    เลือกสัญลักษณ์ประจำตัว (Avatar):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATARS.map(av => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`h-9 w-9 rounded-xl text-lg flex items-center justify-center transition border-2 cursor-pointer ${
                          selectedAvatar === av
                            ? 'bg-blue-100 dark:bg-cyan-950 border-blue-600 dark:border-cyan-400 scale-110 shadow-[2px_2px_0px_#2563eb] dark:shadow-[2px_2px_0px_#06b6d4]'
                            : 'bg-white dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="w-full py-2.5 bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition cursor-pointer active:scale-98"
                >
                  บันทึกการปรับแต่ง
                </button>
              </div>
            </div>
          ) : modalTab === 'achievements' ? (
            /* TAB 2: ACHIEVEMENTS & MISSIONS */
            <AchievementsSection
              user={user}
              onSelectAchievement={setSelectedAchievement}
              onNavigateTab={tab => setModalTab(tab)}
            />
          ) : (
            /* TAB 3: FULL RATING & REVIEW SYSTEM */
            <div className="space-y-4">
              {/* Review Sub-Tabs: Write Review vs Player Reviews */}
              <div className="flex border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-900 p-1 gap-1 text-xs font-bold">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setReviewSubTab('write');
                  }}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    reviewSubTab === 'write'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>เขียนรีวิว & ให้ดาว</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playClick();
                    setReviewSubTab('list');
                  }}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    reviewSubTab === 'list'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>รีวิวจากผู้เล่น ({stats.totalReviews})</span>
                </button>
              </div>

              {reviewSubTab === 'write' ? (
                /* Write Review View */
                <div>
                  {reviewSubmitSuccess ? (
                    <div className="p-6 text-center bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl space-y-3">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <h3 className="text-base font-black text-emerald-900 dark:text-emerald-300">
                        ส่งคะแนนและรีวิวสำเร็จแล้ว!
                      </h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                        ขอบคุณสำหรับคะแนน {rating} ดาว และความคิดเห็นที่มีค่า ระบบบันทึกข้อมูลเรียบร้อยแล้ว ✨
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      {/* Star Rating Interactive Selector */}
                      <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 border-2 border-amber-300/80 dark:border-amber-800/60 rounded-2xl text-center space-y-2">
                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          แตะเพื่อเลือกจำนวนดาวที่คุณต้องการให้
                        </label>

                        <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                          {[1, 2, 3, 4, 5].map((starNum) => {
                            const isFilled = starNum <= effectiveRating;
                            return (
                              <button
                                key={starNum}
                                type="button"
                                onClick={() => {
                                  soundManager.playClick();
                                  setRating(starNum);
                                }}
                                onMouseEnter={() => setHoverRating(starNum)}
                                onMouseLeave={() => setHoverRating(null)}
                                className="group relative p-1 transition-transform transform active:scale-90 hover:scale-125 focus:outline-hidden cursor-pointer"
                                title={`${starNum} ดาว`}
                              >
                                <Star
                                  className={`h-8 w-8 sm:h-9 sm:w-9 transition-colors duration-200 ${
                                    isFilled
                                      ? 'fill-amber-400 text-amber-500 filter drop-shadow-[0_2px_4px_rgba(251,191,36,0.6)]'
                                      : 'fill-transparent text-slate-300 dark:text-zinc-600 hover:text-amber-300'
                                  }`}
                                />
                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {starNum}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="pt-2">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                            {RATING_LABELS[effectiveRating]?.emoji}{' '}
                            <span className={RATING_LABELS[effectiveRating]?.color}>
                              {RATING_LABELS[effectiveRating]?.text}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Reviewer Name */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                            ชื่อผู้รีวิว:
                          </label>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            {user.isGuest ? 'บุคคลทั่วไป (ไม่ต้องล็อกอินก็รีวิวได้)' : 'บัญชีสมาชิก'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 flex items-center justify-center text-xl shadow-xs">
                            {user.avatar || selectedAvatar || '⭐'}
                          </div>
                          <input
                            type="text"
                            maxLength={50}
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            placeholder="กรอกชื่อผู้เล่นของคุณ..."
                            className="flex-1 px-3.5 py-2 text-xs font-bold rounded-xl border-2 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 dark:focus:border-amber-400 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#000000]"
                          />
                        </div>
                      </div>

                      {/* Comment / Feedback */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                            ข้อเสนอแนะหรือความคิดเห็น (ไม่บังคับ):
                          </label>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {comment.length} / 500
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={500}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="ชอบตรงไหน หรืออยากให้เพิ่มฟีเจอร์ใด แนะนำได้เต็มที่เลยครับ..."
                          className="w-full p-3 text-xs font-medium rounded-xl border-2 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:border-amber-500 dark:focus:border-amber-400 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#000000] resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="w-full py-3 px-4 rounded-xl border-2 border-slate-900 dark:border-zinc-700 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#000000] transition active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingReview ? (
                          <>
                            <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>กำลังบันทึกลง Firestore...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>ส่งรีวิวและคะแนน ({rating} ดาว)</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                /* Community Reviews List & Rating Stats */
                <div className="space-y-4">
                  {/* Rating Stats Box */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-900/90 border-2 border-amber-300 dark:border-zinc-700 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
                    <div className="text-center sm:text-left sm:pr-4 sm:border-r border-amber-200 dark:border-zinc-800 shrink-0">
                      <div className="text-3xl font-black text-slate-950 dark:text-white tabular-nums flex items-center justify-center sm:justify-start gap-1">
                        <span>{stats.averageRating.toFixed(1)}</span>
                        <Star className="h-6 w-6 fill-amber-400 text-amber-500 inline -mt-1" />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                        คะแนนเฉลี่ย ({stats.totalReviews} รีวิว)
                      </p>
                    </div>

                    <div className="flex-1 w-full space-y-1">
                      {[5, 4, 3, 2, 1].map((starVal) => {
                        const count = stats.ratingCounts[starVal as 1|2|3|4|5] || 0;
                        const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                        return (
                          <div
                            key={starVal}
                            onClick={() => {
                              soundManager.playClick();
                              setFilterStar(filterStar === starVal ? null : starVal);
                            }}
                            className={`flex items-center gap-2 text-[11px] font-bold cursor-pointer rounded-lg px-1.5 py-0.5 transition ${
                              filterStar === starVal ? 'bg-amber-200 dark:bg-amber-950/80' : 'hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            <span className="w-9 shrink-0 flex items-center gap-0.5 text-slate-700 dark:text-slate-300 tabular-nums">
                              <span>{starVal}</span>
                              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" />
                            </span>
                            <div className="flex-1 h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setFilterStar(null);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                          filterStar === null
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        ทั้งหมด ({stats.totalReviews})
                      </button>
                      {[5, 4, 3, 2, 1].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            soundManager.playClick();
                            setFilterStar(filterStar === s ? null : s);
                          }}
                          className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                            filterStar === s
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <span>{s}</span>
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" />
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        setReviewSubTab('write');
                      }}
                      className="shrink-0 px-2 py-1 rounded-lg text-[11px] font-black bg-amber-400 text-slate-950 hover:bg-amber-500 transition cursor-pointer"
                    >
                      + ให้ดาว
                    </button>
                  </div>

                  {/* Review Cards List */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
                    {filteredReviews.length === 0 ? (
                      <div className="text-center py-6 px-4 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800">
                        <MessageSquare className="h-6 w-6 mx-auto text-slate-400 dark:text-zinc-600 mb-1" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {filterStar ? `ยังไม่มีรีวิวระดับ ${filterStar} ดาว` : 'ยังไม่มีรีวิวในขณะนี้'}
                        </p>
                      </div>
                    ) : (
                      filteredReviews.map((rev) => (
                        <div
                          key={rev.id || `${rev.userId}_${rev.timestamp}`}
                          className="p-3 rounded-xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-zinc-800 border border-slate-900/10 dark:border-zinc-700 flex items-center justify-center text-sm shrink-0">
                                {rev.userAvatar || '⭐'}
                              </div>
                              <div>
                                <span className="text-xs font-black text-slate-900 dark:text-white block">
                                  {rev.userName || 'ผู้เล่นทั่วไป'}
                                </span>
                                <span className="text-[10px] text-slate-400 tabular-nums">
                                  {formatRelativeThaiTime(rev.timestamp)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${
                                    s <= rev.rating
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'fill-transparent text-slate-200 dark:text-zinc-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {rev.comment && (
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed pl-9">
                              {rev.comment}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black px-5 py-3 text-center shrink-0 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {modalTab === 'account' 
              ? 'บัญชีและเหรียญรางวัลซิงก์เรียลไทม์' 
              : modalTab === 'achievements' 
              ? `ปลดล็อกแล้ว ${(user.unlockedAchievements || []).length} จาก ${ALL_ACHIEVEMENTS.length} รายการ`
              : 'คะแนน & รีวิวซิงก์เรียลไทม์กับ Firestore'}
          </span>
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="py-1.5 px-4 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 font-bold text-slate-800 dark:text-slate-200 text-xs transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

        {/* Selected Achievement Detail Popover */}
        {selectedAchievement && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100"
            onClick={() => setSelectedAchievement(null)}
          >
            <div 
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 p-5 shadow-2xl space-y-3 relative text-center"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedAchievement(null)}
                className="absolute top-3 right-3 p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-zinc-800 text-3xl border-2 border-slate-900 dark:border-zinc-700 shadow-md">
                {selectedAchievement.icon}
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {selectedAchievement.title}
                </h4>
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${RARITY_INFO[selectedAchievement.rarity].border} ${RARITY_INFO[selectedAchievement.rarity].bg}`}>
                    {RARITY_INFO[selectedAchievement.rarity].label}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    +{selectedAchievement.rewardPoints} แต้มโบนัส
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedAchievement.description}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                {(user.unlockedAchievements || []).includes(selectedAchievement.id) ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700">
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>ปลดล็อกความสำเร็จนี้แล้ว!</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <Lock className="h-3.5 w-3.5" />
                    <span>ยังไม่ปลดล็อก เล่นเกมเพื่อทำภารกิจ</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedAchievement(null)}
                className="w-full py-2 bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
