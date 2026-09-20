import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star,
  MessageSquare,
  Send,
  X,
  CheckCircle2,
  Sparkles,
  Users,
  Award,
  TrendingUp,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';
import {
  submitGameReview,
  subscribeToGameReviews,
  formatRelativeThaiTime
} from '../services/reviewService';
import { Review, ReviewStats, UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

const RATING_LABELS: Record<number, { text: string; emoji: string; color: string }> = {
  5: { text: 'สุดยอดมาก! ชอบมากที่สุด', emoji: '🌟🌟🌟🌟🌟', color: 'text-amber-500' },
  4: { text: 'สนุกมาก เล่นเพลิน แนะนำเลย', emoji: '⭐⭐⭐⭐', color: 'text-amber-400' },
  3: { text: 'สนุกดี เล่นได้เรื่อยๆ', emoji: '⭐⭐⭐', color: 'text-yellow-500' },
  2: { text: 'พอใช้ อยากให้พัฒนาเพิ่ม', emoji: '⭐⭐', color: 'text-orange-400' },
  1: { text: 'ควรปรับปรุงเพิ่มเติม', emoji: '⭐', color: 'text-rose-400' }
};

export const RatingReviewModal: React.FC<Props> = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState<'write' | 'list'>('write');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [customName, setCustomName] = useState<string>(
    user.name || (user.isGuest ? 'ผู้เล่นทั่วไป' : 'ผู้เล่นเคมี')
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [filterStar, setFilterStar] = useState<number | null>(null);

  // Real-time Firestore state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 5.0,
    totalReviews: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  // Subscribe to real-time reviews from Firestore on mount
  useEffect(() => {
    const unsubscribe = subscribeToGameReviews((newReviews, newStats) => {
      setReviews(newReviews);
      setStats(newStats);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update default name when user prop changes
  useEffect(() => {
    if (user.name) {
      setCustomName(user.name);
    }
  }, [user.name]);

  if (!isOpen) return null;

  const effectiveRating = hoverRating !== null ? hoverRating : rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    soundManager.playClick();
    setIsSubmitting(true);

    try {
      await submitGameReview({
        rating,
        comment: comment.trim(),
        userId: user.id || `guest_${Date.now().toString(36)}`,
        userName: customName.trim() || 'ผู้เล่นทั่วไป',
        userAvatar: user.avatar || '⭐'
      });

      // Celebration sound & confetti
      soundManager.playCorrect();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSubmitSuccess(true);
      setIsSubmitting(false);

      // Auto switch to community reviews after a brief celebratory view
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('list');
      }, 1600);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setIsSubmitting(false);
    }
  };

  const filteredReviews = filterStar
    ? reviews.filter((r) => Math.round(r.rating) === filterStar)
    : reviews;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-zinc-950 border-2 border-slate-900 dark:border-zinc-700 rounded-3xl shadow-[6px_6px_0px_#1e293b] dark:shadow-[6px_6px_0px_#000000] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-900 dark:border-zinc-800 bg-amber-400 dark:bg-amber-500 text-slate-950 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-amber-400 border border-slate-900 shadow-sm text-lg">
              ⭐
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight leading-none">
                  ให้คะแนนและรีวิวเกม
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950 text-white">
                  {stats.averageRating.toFixed(1)} ★
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-900/80 mt-0.5">
                ไม่ต้องล็อกอิน ทุกความคิดเห็นช่วยพัฒนาเกมให้ดียิ่งขึ้น!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            title="ปิดหน้าต่าง"
            className="rounded-full p-1.5 bg-slate-950/10 hover:bg-slate-950 hover:text-white transition cursor-pointer text-slate-950"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 p-1.5 gap-1.5 text-xs font-black">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('write');
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'write'
                ? 'bg-amber-400 dark:bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>เขียนรีวิว & ให้ดาว</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('list');
            }}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'list'
                ? 'bg-amber-400 dark:bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>รีวิวจากผู้เล่น ({stats.totalReviews})</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'write' ? (
              <motion.div
                key="tab-write"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {submitSuccess ? (
                  /* Celebratory Success State */
                  <div className="p-6 text-center bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl animate-in zoom-in-95 duration-200 space-y-3">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-300">
                      ส่งคะแนนและรีวิวสำเร็จแล้ว!
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      ขอบคุณสำหรับคะแนน {rating} ดาว และความคิดเห็นที่มีค่า รีวิวของคุณถูกบันทึกขึ้นระบบเรียบร้อยแล้ว ✨
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Star Rating Interactive Selector */}
                    <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border-2 border-amber-300/80 dark:border-amber-800/60 rounded-2xl text-center space-y-2">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        แตะเพื่อเลือกจำนวนดาวที่คุณต้องการให้
                      </label>

                      {/* 5 Big Stars with smooth hover & press animations */}
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

                      {/* Descriptive rating badge */}
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 text-slate-800 dark:text-slate-200 shadow-2xs">
                          {RATING_LABELS[effectiveRating]?.emoji}{' '}
                          <span className={RATING_LABELS[effectiveRating]?.color}>
                            {RATING_LABELS[effectiveRating]?.text}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Reviewer Name / Identity */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>ชื่อผู้รีวิว</span>
                          <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                            (เปลี่ยนได้ตามต้องการ)
                          </span>
                        </label>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {user.isGuest ? 'โหมดบุคคลทั่วไป (Guest)' : 'สมาชิกยืนยัน'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-zinc-900 border-2 border-slate-900 dark:border-zinc-700 flex items-center justify-center text-xl shadow-xs">
                          {user.avatar || '⭐'}
                        </div>
                        <input
                          type="text"
                          maxLength={50}
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="กรอกชื่อผู้เล่นของคุณ..."
                          className="flex-1 px-3.5 py-2 text-xs font-bold rounded-xl border-2 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500 dark:focus:border-amber-400 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#000000]"
                        />
                      </div>
                    </div>

                    {/* Comment / Feedback Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300">
                          ข้อเสนอแนะหรือความคิดเห็น (ไม่บังคับ)
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
                        placeholder="ชอบตรงไหน อยากให้เพิ่มธาตุหรือโหมดอะไร แนะนำได้เต็มที่เลยครับ..."
                        className="w-full p-3 text-xs font-medium rounded-xl border-2 border-slate-900 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-hidden focus:border-amber-500 dark:focus:border-amber-400 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#000000] resize-none"
                      />
                    </div>

                    {/* Submit Review Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 rounded-xl border-2 border-slate-900 dark:border-zinc-700 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#000000] transition active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
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
              </motion.div>
            ) : (
              /* Community Reviews List & Rating Statistics */
              <motion.div
                key="tab-list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Rating Overview Summary Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900 dark:to-zinc-900/90 border-2 border-amber-300 dark:border-zinc-700 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
                  {/* Big Rating Number */}
                  <div className="text-center sm:text-left sm:pr-4 sm:border-r border-amber-200 dark:border-zinc-800 shrink-0">
                    <div className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tabular-nums flex items-center justify-center sm:justify-start gap-1">
                      <span>{stats.averageRating.toFixed(1)}</span>
                      <Star className="h-6 w-6 sm:h-7 sm:w-7 fill-amber-400 text-amber-500 inline -mt-1" />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                      คะแนนเฉลี่ยจาก {stats.totalReviews} รีวิว
                    </p>
                    <div className="flex items-center gap-1 justify-center sm:justify-start mt-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        ⚡ ซิงก์เรียลไทม์
                      </span>
                    </div>
                  </div>

                  {/* 5-Star Breakdown Progress Bars */}
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
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
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
                        className={`px-2 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
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
                      setActiveTab('write');
                    }}
                    className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-400 text-slate-950 hover:bg-amber-500 transition cursor-pointer"
                  >
                    + ให้คะแนน
                  </button>
                </div>

                {/* Reviews List */}
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-0.5">
                  {filteredReviews.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-800">
                      <MessageSquare className="h-8 w-8 mx-auto text-slate-400 dark:text-zinc-600 mb-2" />
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {filterStar ? `ยังไม่มีรีวิวระดับ ${filterStar} ดาว` : 'ยังไม่มีรีวิวในขณะนี้'}
                      </p>
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          setActiveTab('write');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-400 text-slate-950 hover:bg-amber-500 transition cursor-pointer"
                      >
                        ร่วมเป็นคนแรกที่รีวิวเลย!
                      </button>
                    </div>
                  ) : (
                    filteredReviews.map((rev) => (
                      <div
                        key={rev.id || `${rev.userId}_${rev.timestamp}`}
                        className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 shadow-2xs space-y-1.5"
                      >
                        {/* Header: Avatar, Name, Rating & Time */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-zinc-800 border border-slate-900/10 dark:border-zinc-700 flex items-center justify-center text-base shrink-0">
                              {rev.userAvatar || '⭐'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-900 dark:text-white">
                                  {rev.userName || 'ผู้เล่นทั่วไป'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 tabular-nums">
                                {formatRelativeThaiTime(rev.timestamp)}
                              </span>
                            </div>
                          </div>

                          {/* Star Icons for this review */}
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

                        {/* Comment Body */}
                        {rev.comment && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed pl-10">
                            {rev.comment}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer Banner */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span>ขอบคุณทุกความคิดเห็นเพื่อพัฒนาเกมเคมี</span>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="font-bold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
