import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Review, ReviewStats } from '../types';

const REVIEWS_COLLECTION = 'reviews';
const LOCAL_REVIEWS_STORAGE_KEY = 'chem_game_reviews_cache';

// Curated default community reviews so initial state is welcoming and informative
export const DEFAULT_COMMUNITY_REVIEWS: Review[] = [
  {
    id: 'seed-1',
    userId: 'boss_3_1_id',
    userName: 'บอส3/1 👾',
    userAvatar: '👾',
    rating: 5,
    comment: 'ข้าคือบอส3/1! ใครคิดว่าแม่นตารางธาตุแน่จริงมาท้าดวล 1v1 ในห้องประลองได้เลย!',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'seed-4',
    userId: 'somsri_teacher',
    userName: 'คุณครูสมศรีเคมี 📚',
    userAvatar: '👩‍🏫',
    rating: 5,
    comment: 'นำไปใช้เป็นสื่อการสอนในห้องเรียนได้ดีเยี่ยม นักเรียนแย่งกันตอบและสนใจวิชาเคมีมากขึ้นเยอะเลยค่ะ',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

export function calculateReviewStats(reviews: Review[]): ReviewStats {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 5.0,
      totalReviews: 0,
      ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;

  for (const rev of reviews) {
    const r = Math.min(5, Math.max(1, Math.round(rev.rating || 5))) as 1 | 2 | 3 | 4 | 5;
    ratingCounts[r] = (ratingCounts[r] || 0) + 1;
    sum += rev.rating;
  }

  const averageRating = Math.round((sum / reviews.length) * 10) / 10;

  return {
    averageRating,
    totalReviews: reviews.length,
    ratingCounts
  };
}

/**
 * Load cached local reviews from localStorage
 */
export function getLocalCachedReviews(): Review[] {
  if (typeof window === 'undefined') return DEFAULT_COMMUNITY_REVIEWS;
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_STORAGE_KEY);
    if (!raw) return DEFAULT_COMMUNITY_REVIEWS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse local cached reviews', err);
  }
  return DEFAULT_COMMUNITY_REVIEWS;
}

/**
 * Save reviews to local cache
 */
function saveLocalReviews(reviews: Review[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_REVIEWS_STORAGE_KEY, JSON.stringify(reviews.slice(0, 100)));
  } catch (err) {
    console.warn('Failed to save reviews cache locally', err);
  }
}

/**
 * Submit a rating & review to Firestore collection `reviews`
 */
export async function submitGameReview(data: {
  rating: number;
  comment?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}): Promise<Review> {
  const sanitizedRating = Math.min(5, Math.max(1, Math.round(data.rating)));
  const sanitizedComment = (data.comment || '').trim().slice(0, 1000);
  const sanitizedUserId = (data.userId || `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`).slice(0, 128);
  const sanitizedUserName = (data.userName || 'ผู้เล่นทั่วไป').trim().slice(0, 100);
  const sanitizedUserAvatar = (data.userAvatar || '⭐').slice(0, 64);
  const nowIso = new Date().toISOString();

  // Create clean Firestore document ID
  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const reviewPayload: Review = {
    id: reviewId,
    userId: sanitizedUserId,
    userName: sanitizedUserName,
    userAvatar: sanitizedUserAvatar,
    rating: sanitizedRating,
    comment: sanitizedComment,
    timestamp: nowIso,
    createdAt: nowIso
  };

  // Immediate local cache update for snappy feedback
  const existingLocal = getLocalCachedReviews();
  const updatedLocal = [reviewPayload, ...existingLocal.filter((r) => r.id !== reviewId)];
  saveLocalReviews(updatedLocal);

  try {
    // Save to Firestore reviews collection
    const reviewDocRef = doc(db, REVIEWS_COLLECTION, reviewId);
    await setDoc(reviewDocRef, {
      userId: reviewPayload.userId,
      userName: reviewPayload.userName,
      userAvatar: reviewPayload.userAvatar,
      rating: reviewPayload.rating,
      comment: reviewPayload.comment,
      timestamp: reviewPayload.timestamp,
      createdAt: reviewPayload.createdAt
    });

    return reviewPayload;
  } catch (error) {
    // Report using standardized error handler per Firebase skill
    console.warn('Firestore review submission error, cached locally:', error);
    try {
      handleFirestoreError(error, OperationType.CREATE, REVIEWS_COLLECTION);
    } catch {
      // Return the cached review so UX is not blocked even if offline
    }
    return reviewPayload;
  }
}

/**
 * Subscribe to real-time reviews from Firestore
 */
export function subscribeToGameReviews(
  onUpdate: (reviews: Review[], stats: ReviewStats) => void
): () => void {
  // Initial emission from local cache to prevent layout shift
  const initialCached = getLocalCachedReviews();
  onUpdate(initialCached, calculateReviewStats(initialCached));

  try {
    const reviewsColRef = collection(db, REVIEWS_COLLECTION);

    const unsubscribe = onSnapshot(
      reviewsColRef,
      (snapshot) => {
        const firestoreReviews: Review[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          firestoreReviews.push({
            id: docSnap.id,
            userId: d.userId || 'guest',
            userName: d.userName || 'ผู้เล่นทั่วไป',
            userAvatar: d.userAvatar || '⭐',
            rating: typeof d.rating === 'number' ? d.rating : 5,
            comment: d.comment || '',
            timestamp: d.timestamp || d.createdAt || new Date().toISOString(),
            createdAt: d.createdAt || d.timestamp || new Date().toISOString()
          });
        });

        // Sort newest first
        firestoreReviews.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime() || 0;
          const timeB = new Date(b.timestamp).getTime() || 0;
          return timeB - timeA;
        });

        // Merge with seed reviews if collection has fewer items, avoiding duplicates
        const seenIds = new Set(firestoreReviews.map((r) => r.id));
        const mergedList = [...firestoreReviews];

        for (const seed of DEFAULT_COMMUNITY_REVIEWS) {
          if (!seenIds.has(seed.id)) {
            mergedList.push(seed);
          }
        }

        saveLocalReviews(mergedList);
        const stats = calculateReviewStats(mergedList);
        onUpdate(mergedList, stats);
      },
      (error) => {
        console.warn('Firestore onSnapshot error for reviews:', error);
        try {
          handleFirestoreError(error, OperationType.GET, REVIEWS_COLLECTION);
        } catch {
          // Keep using cached data
          const cached = getLocalCachedReviews();
          onUpdate(cached, calculateReviewStats(cached));
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach Firestore snapshot listener:', err);
    return () => {};
  }
}

/**
 * Format relative date time in Thai
 */
export function formatRelativeThaiTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = Date.now();
    const diffSec = Math.floor((now - date.getTime()) / 1000);

    if (diffSec < 60) return 'เมื่อสักครู่';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} นาทีที่แล้ว`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ชั่วโมงที่แล้ว`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} วันที่แล้ว`;

    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  } catch {
    return 'เมื่อเร็วๆ นี้';
  }
}
