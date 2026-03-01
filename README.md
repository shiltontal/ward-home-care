# 🏠 בבית עם הלב של המחלקה

אפליקציית ניהול אשפוז בית לילדים — מעקב שיחות, תיעוד קשרים, אסימונים, ניהול צוות.

## מבנה הפרויקט

```
ward-project/
├── index.html           ← דף כניסה
├── package.json         ← תלויות
├── vite.config.js       ← הגדרות Vite
├── render.yaml          ← הגדרות Render (אוטומטי)
├── .env.example         ← תבנית משתני סביבה
└── src/
    ├── main.jsx         ← נקודת כניסה
    ├── firebase.js      ← חיבור Firebase + storage layer
    └── App.jsx          ← כל הלוגיקה והקומפוננטות
```

---

## 🚀 התקנה מקומית

```bash
cd ward-project
npm install
cp .env.example .env     # מלא ערכי Firebase — ראה למטה
npm run dev              # → http://localhost:5173
```

> **ללא Firebase** האפליקציה עובדת מיד עם localStorage, אבל הנתונים לא ישותפו בין מכשירים.

---

## 🔥 הגדרת Firebase (5 דקות)

1. היכנס ל-[console.firebase.google.com](https://console.firebase.google.com)
2. **Create a project** → שם: `ward-home-care` → Continue
3. Google Analytics → **כבה** → Create Project
4. תפריט שמאלי → **Build → Realtime Database** → **Create Database** → **Start in test mode** → Enable
5. ⚙️ **Project settings** → גלול למטה → לחץ `</>` (Web) → שם: `ward-app` → Register
6. **העתק את ערכי firebaseConfig**

### הזנת ההגדרות

צור קובץ `.env` בתיקיית הפרויקט:

```env
VITE_FIREBASE_API_KEY=AIzaSyB1234...
VITE_FIREBASE_AUTH_DOMAIN=ward-home-care.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://ward-home-care-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=ward-home-care
VITE_FIREBASE_STORAGE_BUCKET=ward-home-care.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456
```

### אבטחה

Firebase Console → **Realtime Database → Rules**:

```json
{
  "rules": {
    "ward": {
      ".read": true,
      ".write": true
    }
  }
}
```

---

## 🌐 העלאה ל-Render

### אופציה א׳ — דרך GitHub (מומלץ, עדכון אוטומטי)

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/USERNAME/ward-home-care.git
git push -u origin main
```

1. היכנס ל-[dashboard.render.com](https://dashboard.render.com)
2. **New → Static Site** → חבר את ה-GitHub repo
3. Render יזהה אוטומטית את `render.yaml`
4. **Environment** → הוסף את כל משתני `VITE_FIREBASE_*`
5. **Deploy** → תקבל כתובת כמו `ward-home-care.onrender.com`

### אופציה ב׳ — בלי GitHub

```bash
npm run build
```
ב-Render → **New → Static Site** → גרור את תיקיית `dist/`

---

## 📱 הוספה לנייד

- **iPhone:** Safari → שיתוף → "הוסף למסך הבית"
- **Android:** Chrome → ⋮ → "הוסף למסך הבית"

---

## 🔄 עדכון

**עם GitHub:** `git add . && git commit -m "update" && git push` — Render יבנה אוטומטית.

**ידני:** `npm run build` → גרור `dist/` מחדש.

---

## 🛠️ פתרון בעיות

| בעיה | פתרון |
|------|-------|
| נתונים לא מסתנכרנים | בדוק משתני `VITE_FIREBASE_*` ב-Render Environment |
| שגיאת build | הרץ `npm run build` מקומית |
| מסך לבן | F12 → Console → חפש שגיאות |
| Permission denied | בדוק Rules ב-Firebase Console |
