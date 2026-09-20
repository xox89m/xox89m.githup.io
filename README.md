# เกมเกี่ยวกับตารางธาตุ (เกมของไตตั้น) 🧪⚡

เว็บแอปพลิเคชันเกมการศึกษาตารางธาตุเคมี รองรับทั้งการเล่นบนคอมพิวเตอร์และมือถือ (PWA / WebAPK) พร้อมโหมดดวลเรียลไทม์ กระดานคะแนน และเสียงเอฟเฟกต์วิทยาศาสตร์ครบครัน

---

## 🚀 วิธีนำโปรเจกต์นี้ขึ้น GitHub

### วิธีที่ 1: ส่งออกตรงผ่าน Google AI Studio (ง่ายที่สุด)
1. ที่มุมขวาบนของหน้าต่าง AI Studio ให้คลิกที่เมนู **Settings** หรือสัญลักษณ์ **···**
2. เลือกเมนู **"Export to GitHub"** (หรือ **"Download ZIP"**)
3. ระบบจะเชื่อมต่อไปยังบัญชี GitHub ของคุณและสร้าง Repository ให้อัตโนมัติ

---

### วิธีที่ 2: ใช้คำสั่ง Git Push เข้า Repository ของตัวเอง
หากดาวน์โหลดโค้ดมาในเครื่องแล้ว ให้เปิด Terminal ในโฟลเดอร์นี้ แล้วรันคำสั่ง:

```bash
# 1. เริ่มต้น git
git init
git add .
git commit -m "feat: initial commit เกมเกี่ยวกับตารางธาตุ"

# 2. ผูกกับ GitHub Repo ของคุณ (เปลี่ยน URL เป็นของตัวเอง)
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# 3. นำโค้ดขึ้น GitHub
git push -u origin main
```

---

## 🌐 วิธีเปิดเว็บเกมให้เล่นออนไลน์ฟรีด้วย GitHub Pages

โปรเจกต์นี้มีระบบอัตโนมัติ **GitHub Actions Workflow** (`.github/workflows/deploy.yml`) เตรียมไว้ให้แล้ว:

1. นำโค้ดขึ้น GitHub Repository ของคุณตามขั้นตอนด้านบน
2. บนหน้าเว็บ GitHub ไปที่แท็บ **Settings** ของ Repository นั้น
3. เลือกเมนู **Pages** ที่แถบเมนูด้านซ้าย
4. ในหัวข้อ **Build and deployment**:
   - ตรงช่อง **Source** ให้เปลี่ยนเป็น **GitHub Actions**
5. เมื่อเลือกแล้ว GitHub จะรัน Workflow อัตโนมัติ และสร้างลิงก์สำหรับเข้าเล่นเกม เช่น:
   `https://<YOUR_USERNAME>.github.io/<YOUR_REPOSITORY_NAME>/`

---

## 💻 การติดตั้งและทดสอบในเครื่องตัวเอง (Local Development)

### ข้อกำหนด
- Node.js เวอร์ชัน 18 ขึ้นไป
- npm หรือ yarn หรือ pnpm

### คำสั่งใช้งาน

```bash
# ติดตั้งไลบรารีทั้งหมด
npm install

# รันโหมด Development (Full-stack Express + Vite + WebSocket)
npm run dev
# จากนั้นเปิดเบราว์เซอร์ไปที่ http://localhost:3000

# คอมไพล์สำหรับ Static Web Hosting (เช่น GitHub Pages, Vercel, Netlify)
npm run build:client

# คอมไพล์สำหรับ Full-stack Production Server
npm run build
npm start
```

---

## 🎮 ฟีเจอร์หลักในเกม
- 🧠 **โหมดตอบคำถามตารางธาตุ**: สัญลักษณ์, เลขอะตอม, หมู่และคาบ
- 🧩 **โหมดลากวางธาตุลงในตาราง**: ฝึกจำตำแหน่งจริงของแต่ละธาตุ
- 🔗 **โหมดจับคู่สมบัติธาตุ**: จำแนกโลหะ, อโลหะ, กึ่งโลหะ, แก๊สมีตระกูล
- ⚔️ **โหมดดวลแข่งขัน 1v1**: แข่งขันความเร็วแบบเรียลไทม์ พร้อมระบบเล่นกับบอทเมื่อออฟไลน์
- 🏆 **กระดานผู้นำ (Leaderboard)**: บันทึกสถิติและคะแนนสะสม
- 📱 **รองรับ PWA & ติดตั้งลงมือถือ**: เล่นเต็มจอได้เสมือนแอป Native บน Android & iOS
- 🌓 **ธีมมืดและธีมสว่าง**: สลับโหมดสีได้ตามต้องการ รองรับ Pure Black OLED
