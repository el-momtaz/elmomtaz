# موقع شركة الممتاز للأعمال الكهربائية

موقع احترافي متكامل مع Firebase - جازان

## الإعداد قبل النشر
1. أنشئ مشروع في https://console.firebase.google.com
2. فعّل Firestore Database و Authentication (Email/Password)
3. أنشئ مستخدم أدمن من تبويب Authentication
4. انسخ بيانات firebaseConfig وضعها في assets/firebase-config.js
5. فعّل Firestore Rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /articles/{articleId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}

## النشر على GitHub Pages
git init
git add .
git commit -m "موقع الممتاز"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main

ثم من Settings > Pages فعّل النشر من main branch