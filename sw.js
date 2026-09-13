/* ============================================================
   Service worker — นับสต็อคอะไหล่
   หน้าที่: ให้แอปเปิดใช้งานได้แม้ไม่มีสัญญาณ และอัปเดตเวอร์ชันใหม่ให้เอง

   ** ทุกครั้งที่แก้ index.html ให้เปลี่ยนเลข CACHE ข้างล่างด้วย **
   เครื่องพนักงานจะดึงเวอร์ชันใหม่และรีเฟรชให้อัตโนมัติ
   ============================================================ */

const CACHE = "stock-count-v11";

const SHELL = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;

  // ทุกอย่างที่คุยกับ Apps Script ต้องผ่านตรงไป ห้ามแคชเด็ดขาด
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  // หน้าเว็บหลัก: เอาของใหม่ก่อน ถ้าไม่มีเน็ตค่อยใช้ของที่เก็บไว้
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // ไฟล์ประกอบ: ใช้ของที่เก็บไว้ก่อนเพื่อความเร็ว
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }))
  );
});
