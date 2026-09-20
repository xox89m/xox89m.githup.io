import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Smartphone, 
  Apple, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  HelpCircle,
  Zap,
  Monitor
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-black shadow-2xl border-2 border-slate-900 dark:border-zinc-800 text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 dark:border-zinc-800 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm border-2 border-slate-900">
              📱
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">ติดตั้งแอปลงเครื่อง (PWA)</h2>
              <p className="text-xs text-blue-100 font-bold">เล่นได้เต็มจอ ไม่ต้องโหลดไฟล์ APK</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-white/90 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 border-b-2 border-slate-900 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-1.5 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-black transition cursor-pointer ${
              activeTab === 'android'
                ? 'bg-emerald-600 text-white shadow-sm border border-emerald-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Android</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-black transition cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-slate-900 dark:bg-zinc-800 text-white shadow-sm border border-slate-950 dark:border-zinc-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Apple className="h-4 w-4" />
            <span>iOS (iPhone)</span>
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-black transition cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-blue-600 text-white shadow-sm border border-blue-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Monitor className="h-4 w-4" />
            <span>คอมพิวเตอร์ (PC)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: Android */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-zinc-950 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-300 font-black text-sm">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>ติดตั้งง่ายผ่านระบบ Android WebAPK โดยตรง</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed font-medium">
                  ระบบ <strong>WebAPK</strong> ของ Android จะติดตั้งแอปพร้อมไอคอนลงหน้าจอหลักให้ทันที 
                  เปิดเล่นแบบเต็มจอ (Full Screen) ออฟไลน์ได้ โดยไม่ต้องดาวน์โหลดไฟล์ APK ให้เสี่ยงต่อปัญหาแยกวิเคราะห์
                </p>
              </div>

              {isInstalled || installSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border-2 border-emerald-600 text-center space-y-1 text-emerald-950 dark:text-emerald-200">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <div className="font-black text-sm">แอปนี้ถูกติดตั้งลงในมือถือของคุณแล้ว!</div>
                  <div className="text-xs text-emerald-800 dark:text-emerald-300">คุณสามารถเปิดเล่นจากไอคอนบนหน้าจอหลักได้ทันที</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-black text-base rounded-2xl shadow-lg border-2 border-slate-900 dark:border-zinc-700 flex items-center justify-center gap-2.5 transition cursor-pointer"
                  >
                    <Smartphone className="h-5 w-5" />
                    <span>ติดตั้งลงในมือถือทันที (1-Click Install)</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 font-medium">
                    {isInstallable 
                      ? '✨ กดปุ่มด้านบนเพื่อสั่งให้ระบบติดตั้งแอปได้ทันที' 
                      : '💡 หากปุ่มไม่ตอบสนอง ให้ทำตามขั้นตอนการติดตั้งด้านล่าง'}
                  </p>
                </div>
              )}

              {/* Step-by-step for Android */}
              <div className="rounded-2xl border-2 border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
                  <span>ขั้นตอนติดตั้งผ่าน Google Chrome หรือ Samsung Internet:</span>
                </h4>
                <ol className="list-decimal list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2 pl-1 leading-relaxed font-medium">
                  <li>
                    เปิดหน้านี้ในเบราว์เซอร์ <strong>Google Chrome</strong> หรือ <strong>Samsung Internet</strong> บนมือถือ
                  </li>
                  <li>
                    แตะที่เมนู <strong>จุดสามจุด (⋮)</strong> บริเวณมุมขวาบนของหน้าจอ
                  </li>
                  <li>
                    เลือกเมนู <strong>"ติดตั้งแอป" (Install app)</strong> หรือ <strong>"เพิ่มลงในหน้าจอหลัก" (Add to Home screen)</strong>
                  </li>
                  <li>
                    กดยืนยัน <strong>"ติดตั้ง"</strong> แล้วตัวเกมจะไปปรากฏเป็นแอปในเครื่องทันที!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: iOS */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                  <Apple className="h-5 w-5" />
                  <span>วิธีติดตั้งบน iPhone และ iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2.5 pl-1 leading-relaxed font-medium">
                  <li>
                    เปิดหน้านี้ด้วยแอป <strong>Safari</strong> บน iPhone/iPad
                  </li>
                  <li>
                    แตะที่ปุ่ม <strong>แชร์ (Share)</strong> สัญลักษณ์สี่เหลี่ยมพร้อมลูกศรชี้ขึ้น ⬆️ ด้านล่างหน้าจอ
                  </li>
                  <li>
                    เลื่อนลงมาแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong>
                  </li>
                  <li>
                    แตะ <strong>"เพิ่ม" (Add)</strong> มุมขวาบน เพื่อสร้างไอคอนแอปบนหน้าจอหลัก
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: Desktop */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-blue-50 dark:bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <span>วิธีติดตั้งบนคอมพิวเตอร์ (Google Chrome / Microsoft Edge):</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2.5 pl-1 leading-relaxed font-medium">
                  <li>
                    เปิดเว็บไซต์นี้ในเบราว์เซอร์ <strong>Chrome</strong> หรือ <strong>Edge</strong>
                  </li>
                  <li>
                    สังเกตไอคอน <strong>ติดตั้ง (Install icon)</strong> เล็กๆ บริเวณขวาสุดของช่องใส่ URL Address Bar
                  </li>
                  <li>
                    คลิกที่ไอคอนแล้วเลือก <strong>"ติดตั้ง" (Install)</strong>
                  </li>
                  <li>
                    เกมจะเปิดแยกเป็นหน้าต่างโปรแกรมอิสระ พร้อมสร้างไอคอนลัดบน Desktop ทันที
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-900 dark:border-zinc-800 bg-slate-50 dark:bg-black px-5 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            รองรับทั้ง Android, iOS และ Desktop โดยตรง
          </div>
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-900 dark:bg-zinc-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-zinc-700 transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
