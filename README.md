# موقع شركة الممتاز للأعمال الكهربائية

موقع عربي متجاوب لشركة الممتاز في جازان، مع صفحات الخدمات والمقالات وصفحات التواصل ولوحة تحكم مبنية على Firebase.

## قبل النشر

1. افتح مشروع Firebase المرتبط بالموقع من [Firebase Console](https://console.firebase.google.com/).
2. فعّل **Authentication → Email/Password**.
3. أنشئ حساب المشرف من Authentication، ثم سجّل الدخول به من `login.html`.
4. تأكد أن بيانات `assets/firebase-config.js` تخص مشروع Firebase الصحيح. إعدادات Firebase في الواجهة الأمامية ليست كلمة مرور؛ الحماية الحقيقية تكون عبر Firestore Security Rules.
5. فعّل **Cloud Firestore**.
6. في Firestore Rules، استبدل `PUT_ADMIN_UID_HERE` بمعرّف UID لحساب المشرف من صفحة Authentication ثم انشر القواعد التالية.

## قواعد Firestore مقترحة

هذه القواعد تسمح للزوار بقراءة المحتوى المنشور وإرسال رسائل التواصل، وتقيّد التعديل والحذف بحساب المشرف المحدد. لا تستخدم قاعدة عامة تسمح بالكتابة لكل مستخدم مسجّل الدخول.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.uid == 'PUT_ADMIN_UID_HERE';
    }

    match /articles/{articleId} {
      allow read: if (resource.data.status == 'published' || isAdmin());
      allow create, update, delete: if isAdmin();
    }

    match /settings/{settingId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /services/{serviceId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /testimonials/{testimonialId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /gallery/{itemId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /messages/{messageId} {
      allow create: if request.resource.data.keys().hasAll(['name', 'phone', 'service', 'message']);
      allow read, update, delete: if isAdmin();
    }
  }
}
```

## النشر على Cloudflare Pages

1. فك ضغط الملف `alemtiaz-electric.zip` على جهازك.
2. افتح لوحة [Cloudflare](https://dash.cloudflare.com/) ثم **Workers & Pages → Create → Pages**.
3. للنشر المباشر اختر **Upload assets / Direct Upload**، وارفع محتويات مجلد `alemtiaz-electric` (الملفات والمجلدات داخله، وليس اختصار Windows).
4. بعد النشر افتح رابط `pages.dev` واختبر الرئيسية والخدمات والمقالات والتواصل وتسجيل دخول المشرف.
5. بعد معرفة النطاق النهائي، حدّث الروابط داخل `sitemap.xml` و`robots.txt` لتطابق نطاق الموقع الفعلي.

## ملاحظات

- المقالات والخدمات والإعدادات والرسائل تحتاج اتصالاً صحيحاً بـ Firebase وقواعد Firestore المنشورة.
- أنشئ حساب المشرف يدوياً من Firebase Authentication؛ لا يوجد حساب افتراضي مضمّن في الموقع.
- عند عرض المقالات لأول مرة، قد يطلب Firestore إنشاء فهرس (index) للاستعلام المستخدم. اتبع رابط إنشاء الفهرس الذي يظهر في رسالة الخطأ.
- لا تضع كلمة مرور المشرف داخل ملفات الموقع أو مستودع عام.
