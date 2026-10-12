# Hlongheng Law Backend Starter

## สิ่งที่มีในชุดนี้
- หน้าแรกเดิม
- สมัครสมาชิก/เข้าสู่ระบบด้วย Firebase Email & Password
- สร้างโปรไฟล์ผู้ใช้ใน Firestore
- Dashboard สมาชิก
- ต้นแบบ Dashboard ผู้ดูแล
- Firestore Rules ป้องกันสมาชิกแก้ role, plan และ quota เอง

## ขั้นติดตั้ง
1. นำไฟล์ไปแทนใน GitHub repository
2. ใน Cloudflare > Worker > Settings > Variables and Secrets เพิ่มตัวแปร VITE_FIREBASE_* ตาม `.env.example`
3. นำ `firestore.rules` ไปวางใน Firebase Console > Firestore Database > Rules แล้ว Publish
4. บัญชี admin ต้องตั้ง custom claim `admin: true` ผ่าน Firebase Admin SDK เท่านั้น ห้ามตั้งจากหน้าเว็บ
5. Commit แล้วรอ Cloudflare build

## ข้อจำกัดสำคัญ
- ยังไม่เปิดรับชำระเงินจริง
- ยังไม่เปิดการปรับแพ็กเกจจาก client
- ตัวเลขใน Admin Dashboard เป็น placeholder จนกว่าจะเพิ่ม queries/Cloud Functions
