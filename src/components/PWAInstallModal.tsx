import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  Download, 
  Smartphone, 
  Apple, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  FileDown, 
  AlertTriangle,
  HelpCircle,
  Zap
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'webapk' | 'apk' | 'ios' | 'developer'>('webapk');
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

  const directApkUrl = '/download/periodic-table-game.apk';

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
              <h2 className="text-lg sm:text-xl font-black tracking-tight">ติดตั้งแอป & ดาวน์โหลด APK</h2>
              <p className="text-xs text-blue-100 font-bold">เกมตารางธาตุ</p>
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
        <div className="grid grid-cols-4 border-b-2 border-slate-900 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-1.5 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('webapk')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl font-black transition cursor-pointer ${
              activeTab === 'webapk'
                ? 'bg-emerald-600 text-white shadow-sm border border-emerald-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>WebAPK (แนะนำ)</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl font-black transition cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-blue-600 text-white shadow-sm border border-blue-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>ไฟล์ APK ตรง</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl font-black transition cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-slate-900 dark:bg-zinc-800 text-white shadow-sm border border-slate-950 dark:border-zinc-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Apple className="h-4 w-4" />
            <span>iOS (iPhone)</span>
          </button>
          <button
            onClick={() => setActiveTab('developer')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-xl font-black transition cursor-pointer ${
              activeTab === 'developer'
                ? 'bg-amber-600 text-white shadow-sm border border-amber-700'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Capacitor/Play</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: WebAPK */}
          {activeTab === 'webapk' && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-zinc-950 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-300 font-black text-sm">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>วิธีติดตั้งบน Android ที่ใช้งานได้ 100% (ไร้ปัญหาแยกวิเคราะห์)</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed font-medium">
                  Google และ Android มีระบบ <strong>WebAPK</strong> ในตัว ซึ่งจะแปลงและสร้างแอปเป็น APK แท้ๆ ลงในเครื่องให้โดยตรงผ่าน Chrome / Samsung Internet ปรากฏในหน้ารวมแอปและเปิดแบบเต็มจอเสมือนโหลดจาก Play Store ทุกประการ!
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
                      ? '✨ กดปุ่มด้านบนเพื่อสั่งให้ Android ติดตั้งแอปได้ทันที' 
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

          {/* TAB 2: Direct APK Download & Troubleshooting */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-zinc-950 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-950 dark:text-amber-300 font-black text-sm">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>สาเหตุที่มือถือบางเครื่องขึ้น "เกิดข้อผิดพลาดในการแยกวิเคราะห์แพ็กเกจ"</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed font-medium">
                  บน Android เวอร์ชัน 11, 12, 13 และ 14 ระบบความปลอดภัย Google Play Protect จะบล็อกไฟล์ APK ที่ไม่ได้คอมไพล์ผ่าน Android SDK / Dalvik bytecode และยังไม่ได้เซ็นชื่อ v2 Signature
                </p>
                <div className="text-xs text-amber-950 dark:text-amber-200 font-bold bg-amber-100 dark:bg-amber-900/60 p-2 rounded-xl border border-amber-300 dark:border-amber-700">
                  👉 แนะนำให้ใช้แท็บ <strong>"WebAPK (แนะนำ)"</strong> เพื่อให้ Android ติดตั้งผ่าน WebAPK Service โดยตรง ไร้ข้อผิดพลาด 100%!
                </div>
              </div>

              {/* Direct APK Link */}
              <div className="rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-blue-50 dark:bg-zinc-950 p-4 space-y-3 shadow-[2px_2px_0px_#1e293b] dark:shadow-[2px_2px_0px_#27272a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileDown className="h-6 w-6 text-blue-600 dark:text-cyan-400" />
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">periodic-table-game.apk</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">เวอร์ชัน 1.0.2 · สำหรับ Android / Emulator</div>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2 py-1 bg-blue-200 dark:bg-cyan-950 text-blue-900 dark:text-cyan-300 rounded-lg">
                    APK
                  </span>
                </div>

                <a
                  href={directApkUrl}
                  download="periodic-table-game.apk"
                  className="w-full py-3 px-4 bg-blue-600 dark:bg-zinc-800 hover:bg-blue-700 dark:hover:bg-zinc-700 active:scale-98 text-white font-black text-sm rounded-xl shadow-md border-2 border-slate-900 dark:border-zinc-700 flex items-center justify-center gap-2 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>ดาวน์โหลดไฟล์ APK ตรง</span>
                </a>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3.5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="font-bold text-slate-800 dark:text-white">วิธีอนุญาตติดตั้ง APK ภายนอก:</div>
                <p className="text-[11px] leading-relaxed">
                  ไปที่ <strong>การตั้งค่า (Settings)</strong> ➜ <strong>ความปลอดภัย</strong> ➜ <strong>ติดตั้งแอปที่ไม่รู้จัก (Install unknown apps)</strong> ➜ อนุญาตให้เบราว์เซอร์หรือตัวจัดการไฟล์
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: iOS */}
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

          {/* TAB 4: Developer */}
          {activeTab === 'developer' && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-slate-900 dark:border-zinc-800 bg-zinc-950 text-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <Terminal className="h-4 w-4" />
                    <span>คำสั่งสร้าง Native APK ด้วย Capacitor (สำหรับ Google Play):</span>
                  </div>
                  <button
                    onClick={() => handleCopy('npm install @capacitor/core @capacitor/cli @capacitor/android && npx cap init && npx cap add android && npx cap build android', 'cap')}
                    className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-white px-2 py-1 rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copied === 'cap' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied === 'cap' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-black font-mono text-[11px] text-emerald-400 overflow-x-auto select-all border border-zinc-800">
                  npm install @capacitor/core @capacitor/cli @capacitor/android<br />
                  npx cap add android<br />
                  npx cap sync<br />
                  npx cap open android
                </div>
                <p className="text-[11px] text-slate-400">
                  เปิดโฟลเดอร์ <code>android/</code> ด้วย Android Studio เพื่อกด Build Signed APK หรือ AAB ส่งขึ้น Google Play Store ได้ทันที
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-900 dark:border-zinc-800 bg-slate-50 dark:bg-black px-5 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            รองรับทั้ง Android 8.0+ และ iOS 14.0+
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
