# הוראות ל-Claude Code — בניית והפעלת אפליקציית ניהול אשפוז בית

## מה יש כאן

תיקיית `ward-project/` מכילה פרויקט Vite + React מוכן לבנייה.
המשימה שלך: להתקין, לחבר Firebase, להעלות ל-GitHub ולפרוס ב-Render.

---

## שלב 1: התקנה מקומית

```
cd ward-project
npm install
```

ודא שהפרויקט בונה תקין:
```
npm run build
```

אם יש שגיאות — תקן אותן לפני שממשיכים.

---

## שלב 2: הגדרת Firebase

### צור פרויקט Firebase:
1. צריך שהמשתמש יספק ערכי Firebase Config — שאל אותו
2. ברגע שיש את הערכים, צור קובץ `.env` בתיקיית הפרויקט:

```
VITE_FIREBASE_API_KEY=<value>
VITE_FIREBASE_AUTH_DOMAIN=<value>
VITE_FIREBASE_DATABASE_URL=<value>
VITE_FIREBASE_PROJECT_ID=<value>
VITE_FIREBASE_STORAGE_BUCKET=<value>
VITE_FIREBASE_MESSAGING_SENDER_ID=<value>
VITE_FIREBASE_APP_ID=<value>
```

3. ודא שהבנייה עובדת עם ה-env:
```
npm run build
```

---

## שלב 3: GitHub

```
git init
git add .
git commit -m "ward home care app - initial commit"
```

שאל את המשתמש:
- האם יש לו חשבון GitHub?
- מה שם המשתמש שלו ב-GitHub?
- האם gh CLI מותקן? אם כן:

```
gh repo create ward-home-care --public --source=. --push
```

אם gh לא מותקן:
```
# התקן gh
# macOS:
brew install gh
# Linux:
sudo apt install gh

gh auth login
gh repo create ward-home-care --public --source=. --push
```

---

## שלב 4: Render

### אופציה א׳ — עם Render CLI (מומלץ):
```
npm install -g @render/cli
render login
render deploy
```

### אופציה ב׳ — ידנית (שאל את המשתמש לעשות בממשק):
הנחה את המשתמש:
1. להיכנס ל-dashboard.render.com
2. New → Static Site
3. לחבר את ה-GitHub repo `ward-home-care`
4. ההגדרות (מ-render.yaml):
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
5. ב-Environment להוסיף את כל 7 משתני VITE_FIREBASE_*
6. Deploy

---

## שלב 5: אימות

1. ודא שהאתר עולה בכתובת ה-Render
2. פתח את הקונסול בדפדפן — ודא שיש "Firebase connected"
3. הוסף רשומה ניסיונית ובדוק ב-Firebase Console שהנתונים נשמרים

---

## מבנה הקבצים

```
ward-project/
├── index.html              ← HTML entry, Hebrew RTL, Heebo font
├── package.json            ← Vite + React + Firebase deps
├── vite.config.js          ← Vite React plugin config
├── render.yaml             ← Render auto-config (static site)
├── .env.example            ← Template for Firebase env vars
├── .gitignore              ← node_modules, dist, .env
└── src/
    ├── main.jsx            ← ReactDOM.createRoot entry
    ├── firebase.js         ← Firebase init + dbRead/dbWrite/dbListen
    │                         Falls back to localStorage if no config
    └── App.jsx             ← Full app: Dashboard, PatientDetail,
                              LogContact, StaffSection, Settings
                              (~1390 lines, all-in-one React component)
```

## פרטי טכניים

- **Stack:** Vite 6 + React 18 + Firebase 10
- **Storage:** Firebase Realtime Database עם fallback ל-localStorage
- **Sync:** real-time listeners — שינויים מופיעים מיד בכל המכשירים
- **UI:** Hebrew RTL, Heebo font, deep blue theme
- **Mobile:** meta viewport + apple-mobile-web-app-capable

## Firebase Database Rules (test mode)

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
