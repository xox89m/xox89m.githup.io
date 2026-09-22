import { Achievement } from '../types';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'streak_10',
    title: 'ตอบถูก 10 ข้อติดกัน',
    description: 'ทำคอมโบตอบถูกต่อเนื่องครบ 10 ข้อโดยไม่ผิดพลาดเลยแม้แต่ข้อเดียว',
    icon: '⚡',
    category: 'streak',
    target: 10,
    rewardPoints: 150,
    rarity: 'epic'
  },
  {
    id: 'all_5_modes',
    title: 'เล่นครบ 5 โหมด',
    description: 'เข้าเล่นหรือทดลองครบทั้ง 5 โหมดการเรียนรู้ (ตอบคำถาม, ดวล 1v1, จัดเรียง, จับคู่, สารานุกรม)',
    icon: '🌌',
    category: 'mode',
    target: 5,
    rewardPoints: 200,
    rarity: 'legendary'
  },
  {
    id: 'first_correct',
    title: 'ก้าวแรกสู่วงการเคมี',
    description: 'ตอบคำถามเกี่ยวกับตารางธาตุถูกต้องเป็นครั้งแรก',
    icon: '🌱',
    category: 'mastery',
    target: 1,
    rewardPoints: 50,
    rarity: 'common'
  },
  {
    id: 'battle_winner',
    title: 'ผู้ชนะศึกดวลเรียลไทม์',
    description: 'เอาชนะคู่ต่อสู้ในศึกดวลสด 1v1 ได้สำเร็จ',
    icon: '⚔️',
    category: 'combat',
    target: 1,
    rewardPoints: 100,
    rarity: 'rare'
  },
  {
    id: 'boss_slayer',
    title: 'ผู้สยบบอส 3/1',
    description: 'เอาชนะ "บอส3/1" บอสประจำด่านในห้องแบทเทิล',
    icon: '👑',
    category: 'combat',
    target: 1,
    rewardPoints: 250,
    rarity: 'legendary'
  },
  {
    id: 'grid_master',
    title: 'สถาปนิกตารางธาตุ',
    description: 'จัดวางธาตุลงในตารางธาตุถูกต้องครบ 3 ครั้ง',
    icon: '🧩',
    category: 'mastery',
    target: 3,
    rewardPoints: 100,
    rarity: 'rare'
  },
  {
    id: 'match_expert',
    title: 'เซียนจับคู่คุณสมบัติ',
    description: 'จับคู่สัญลักษณ์ธาตุกับคุณสมบัติหรือประโยชน์ใช้สอยถูกต้อง',
    icon: '🔗',
    category: 'mastery',
    target: 1,
    rewardPoints: 100,
    rarity: 'rare'
  },
  {
    id: 'explorer_scholar',
    title: 'นักท่องสารานุกรม',
    description: 'เปิดดูรายละเอียดและข้อมูลในสารานุกรมตารางธาตุครบ 10 ธาตุ',
    icon: '📖',
    category: 'mastery',
    target: 10,
    rewardPoints: 100,
    rarity: 'rare'
  },
  {
    id: 'score_1000',
    title: 'เซียนเคมี 1,000 แต้ม',
    description: 'สะสมคะแนนรวมในเกมทะลุ 1,000 แต้ม',
    icon: '🏆',
    category: 'mastery',
    target: 1000,
    rewardPoints: 150,
    rarity: 'epic'
  },
  {
    id: 'reviewer_badge',
    title: 'นักรีวิวเกมใจดี',
    description: 'ร่วมส่งคะแนนดาวหรือเขียนรีวิวเพื่อพัฒนาเกมตารางธาตุ',
    icon: '⭐',
    category: 'social',
    target: 1,
    rewardPoints: 100,
    rarity: 'rare'
  }
];

export const RARITY_INFO: Record<Achievement['rarity'], { label: string; border: string; bg: string; text: string; glow: string }> = {
  common: {
    label: 'ทั่วไป',
    border: 'border-slate-300 dark:border-zinc-700',
    bg: 'bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200',
    text: 'text-slate-600 dark:text-slate-400',
    glow: 'shadow-slate-400/20'
  },
  rare: {
    label: 'หายาก',
    border: 'border-blue-400 dark:border-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-blue-500/25'
  },
  epic: {
    label: 'มหากาพย์',
    border: 'border-purple-500 dark:border-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300',
    text: 'text-purple-600 dark:text-purple-400',
    glow: 'shadow-purple-500/35'
  },
  legendary: {
    label: 'ตำนาน',
    border: 'border-amber-400 dark:border-amber-500',
    bg: 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-950/80 dark:to-yellow-950/60 text-amber-950 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-400',
    glow: 'shadow-amber-500/40'
  }
};

export function getAchievement(id: string): Achievement | undefined {
  return ALL_ACHIEVEMENTS.find(a => a.id === id);
}

export function getAllAchievements(): Achievement[] {
  return ALL_ACHIEVEMENTS;
}
