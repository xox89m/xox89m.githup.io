import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
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
  AlertCircle
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLoginGoogle: (data: { name: string; email: string; avatar?: string; id?: string }) => void;
  onLogout?: () => void;
  onUpdateProfile: (name: string, avatar: string) => void;
}

const AVATARS = ['🧑‍🔬', '👨‍🔬', '👩‍🎓', '🧙‍♂️', '👸', '⚡', '🧪', '⚛️', '🏆', '💎'];

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  onLoginGoogle,
  onLogout,
  onUpdateProfile
}) => {
  const [nameInput, setNameInput] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [googleEmailInput, setGoogleEmailInput] = useState(user.email || '');
  const [googleNameInput, setGoogleNameInput] = useState(user.name.includes('นักทดลอง') ? '' : user.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNameInput(user.name);
    setSelectedAvatar(user.avatar);
    setGoogleEmailInput(user.email || '');
  }, [user]);

  // Attempt to initialize Google Identity Services button if available
  useEffect(() => {
    if (!isOpen || !user.isGuest) return;

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
  }, [isOpen, user.isGuest, onLoginGoogle, onClose]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-black shadow-2xl border-2 border-slate-900 dark:border-zinc-800 text-slate-800 dark:text-slate-100 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 dark:border-zinc-800 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-5 py-4 text-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm border-2 border-slate-900">
              {selectedAvatar}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black tracking-tight">โปรไฟล์ผู้เล่น</h2>
                {!user.isGuest && (
                  <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                    <ShieldCheck className="h-2.5 w-2.5" /> Google Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-950 font-bold">
                {user.isGuest ? 'โหมดผู้เล่นทั่วไป (ยังไม่ได้ยืนยันตัวตน)' : `บัญชี: ${user.email}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-900 hover:bg-black/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* User Stats Card */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 dark:bg-zinc-950 p-3 text-center border-2 border-slate-900 dark:border-zinc-800 shadow-[3px_3px_0px_#1e293b] dark:shadow-[3px_3px_0px_#27272a]">
            <div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                เลเวล
              </div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400">Lv.{user.level}</div>
            </div>
            <div className="border-x border-slate-200 dark:border-zinc-800">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <Trophy className="h-3 w-3 text-blue-500 dark:text-cyan-400" />
                คะแนนสะสม
              </div>
              <div className="text-lg font-black text-blue-600 dark:text-cyan-400">{user.totalPoints.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <Award className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                ชนะศึกดวล
              </div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{user.wins} ครั้ง</div>
            </div>
          </div>

          {/* Google Sign-in Section */}
          {user.isGuest || !user.email ? (
            <div className="rounded-2xl border-2 border-blue-600 dark:border-cyan-500 bg-blue-50/90 dark:bg-zinc-950 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-black text-blue-950 dark:text-white">
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
                      className="w-full rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 pl-9 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-hidden"
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
                    className="w-full rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-hidden"
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
                  className="w-full py-2.5 px-4 bg-blue-600 dark:bg-zinc-800 hover:bg-blue-700 dark:hover:bg-zinc-700 active:scale-98 text-white font-black rounded-xl shadow-md border-2 border-slate-900 dark:border-zinc-700 transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="h-4 w-4" />
                  <span>{isSubmitting ? 'กำลังเชื่อมต่อ...' : 'ยืนยันและเข้าสู่ระบบด้วย Google'}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-zinc-950 p-4 space-y-3">
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
          <div className="space-y-3 rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]">
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
                className="w-full rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-black text-slate-900 dark:text-slate-100 focus:border-blue-600 dark:focus:border-cyan-400 focus:outline-hidden"
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
                        : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800'
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

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black px-5 py-3 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 font-bold text-slate-800 dark:text-slate-200 text-xs transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
