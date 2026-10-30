# موقع شركة الممتاز للأعمال الكهربائية — جازان

موقع عربي (RTL) متجاوب لشركة كهرباء في جازان: صفحات خدمات ومقالات وتواصل، ولوحة تحكم مبنية على Firebase (Firestore + Authentication)، مع رفع صور عبر Cloudinary.

---

## 1) بنية المشروع

```
alemtiaz-electric/
├── index.html            الصفحة الرئيسية
├── about.html            من نحن
├── services.html         كل الخدمات
├── service.html          صفحة الخدمة الواحدة  (?slug=...)
├── articles.html         كل المقالات
├── article.html          صفحة المقال           (?id=...)
├── booking.html          حجز موعد (خدمة + تاريخ + وقت)
├── contact.html          اتصل بنا + الخريطة + نموذج يُرسل لواتساب
├── login.html            تسجيل دخول المشرف
├── admin.html            لوحة التحكم
├── 404.html              صفحة الخطأ
├── css/style.css         كل الأنماط
├── js/
│   ├── offline-store.js  وضع تجريبي محلي عند تعذر تحميل Firebase
│   ├── site-data.js      إعدادات، خدمات، آراء، معرض، رسائل
│   ├── articles-store.js عمليات المقالات
│   ├── main.js           منطق الواجهة العامة
│   ├── service-page.js   منطق صفحة الخدمة
│   ├── booking.js        منطق صفحة الحجز (أوقات، تحقق، تأكيد)
│   ├── auth.js           تسجيل الدخول/الخروج
│   ├── admin.js          لوحة التحكم
│   ├── image-upload.js   رفع الصور إلى Cloudinary
│   └── icon-fallback.js  أيقونات بديلة عند تعذر تحميل Font Awesome
├── assets/
│   ├── firebase-config.js  إعدادات Firebase + أدوات (esc، sanitizeHtml)
│   ├── logo.svg  logo-light.svg  favicon.svg
│   ├── photo-1.jpg  photo-2.jpg  (صور فريق العمل)
│   ├── photo-3.svg  placeholder.svg  (رسومات تصميمية)
├── manifest.json  robots.txt  sitemap.xml
```

> ملاحظة: المسارات داخل الصفحات تستخدم مجلدات `css/ js/ assets/` فعليًا. إن نسخت الملفات في مجلد واحد مسطّح ستنكسر كل الأنماط والسكربتات.

---

## 2) التجربة محليًا

```bash
cd alemtiaz-electric
python3 -m http.server 8000
# ثم افتح http://localhost:8000
```

لا تفتح الصفحات بنقر مزدوج (`file://`) إلا للاطلاع السريع؛ بعض المتصفحات تمنع تحميل السكربتات في هذا الوضع.

### وضع تجريبي بدون Firebase (Demo Mode)

إذا لم يستطع المتصفح تحميل Firebase SDK (لا إنترنت، أو معاينة محلية، أو `file://`) فإن `js/offline-store.js` يوفّر بديلًا محليًا يحفظ البيانات في `localStorage`، فتعمل الموقع **ولوحة التحكم** كاملة ببيانات تجريبية:

- الدخول للوحة: `admin@alemtiaz.com` / `123456`
- تظهر شارة صغيرة «وضع تجريبي — بيانات محلية» أسفل الصفحة (يمكن إخفاؤها).
- لتصفير البيانات التجريبية: من Console في المتصفح
  `localStorage.removeItem('alemtiaz_offline_db_v1')` ثم تحديث الصفحة.

هذا الوضع **لا يُستخدم** عندما يكون Firebase الحقيقي متاحًا؛ يعمل تلقائيًا فقط عند فشل تحميله.

---

## 3) نظام حجز المواعيد

- الصفحة: `booking.html` — يختار الزائر الخدمة (تُعبّأ تلقائياً عند القدوم من صفحة خدمة `booking.html?service=slug`)، ثم التاريخ (من اليوم حتى 60 يوماً)، ثم أحد الأوقات من 9 صباحاً إلى 9 مساءً.
- الأوقات المنتهية في اليوم الحالي تُعطّل تلقائياً (مع مهلة 30 دقيقة).
- الحجز يُحفظ في مجموعة `appointments` بحالة `pending`، ثم يظهر للعميل ملخص مع زر «إرسال التفاصيل عبر واتساب».
- في لوحة التحكم: تبويب **المواعيد** مع فلاتر (الكل / بانتظار التأكيد / مؤكد / منجز / ملغي)، وأزرار: تأكيد، منجز، إلغاء، مراسلة واتساب برسالة جاهزة، حذف. ويظهر عدد المواعيد المعلّقة كشارة على اسم التبويب وفي لوحة البيانات.
- للخصوصية: **لا يمكن للزائر قراءة المواعيد** (فيها أرقام جوالات)، لذلك لا يتم تعطيل الأوقات المحجوزة مسبقاً للزوار — التأكيد يتم هاتفياً/واتساب. إن رغبت بإظهار الأوقات المتاحة للجميع، أنشئ مجموعة منفصلة `slots` تحتوي التاريخ والوقت فقط وتكون للقراءة العامة.

## 4) إعداد Firebase قبل النشر

1. افتح المشروع في [Firebase Console](https://console.firebase.google.com/) — الإعدادات الحالية في `assets/firebase-config.js` تخص مشروع `elmomtaz`.
2. فعّل **Authentication → Email/Password** وأنشئ حساب المشرف.
3. فعّل **Cloud Firestore**.
4. حدّث بيانات `assets/firebase-config.js` إن استخدمت مشروعًا آخر.
5. انشر قواعد الأمان التالية بعد استبدال `PUT_ADMIN_UID_HERE` بـ UID حساب المشرف.

> مفاتيح Firebase في الواجهة ليست أسرارًا، لكن الحماية الحقيقية = قواعد Firestore + تقييد الـ API key بنطاق موقعك من Google Cloud Console. لا تضع كلمة مرور المشرف في أي ملف.

### قواعد Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.uid == 'PUT_ADMIN_UID_HERE';
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

    match /appointments/{appointmentId} {
      // الزائر يستطيع إنشاء طلب حجز فقط، ولا يستطيع قراءة مواعيد الآخرين
      allow create: if request.resource.data.keys().hasAll(['name', 'phone', 'service', 'date', 'time'])
        && request.resource.data.keys().hasOnly(['name', 'phone', 'service', 'date', 'time', 'notes', 'status', 'createdAt'])
        && request.resource.data.name is string && request.resource.data.name.size() <= 100
        && request.resource.data.phone is string && request.resource.data.phone.size() <= 30
        && request.resource.data.service is string && request.resource.data.service.size() <= 100
        && request.resource.data.date is string && request.resource.data.date.size() == 10
        && request.resource.data.time is string && request.resource.data.time.size() <= 5
        && request.resource.data.notes is string && request.resource.data.notes.size() <= 1000
        && request.resource.data.status == 'pending';
      allow read, update, delete: if isAdmin();
    }

    match /messages/{messageId} {
      allow create: if request.resource.data.keys().hasAll(['name', 'phone', 'service', 'message'])
        && request.resource.data.keys().hasOnly(['name', 'phone', 'service', 'message', 'read', 'createdAt', 'date'])
        && request.resource.data.name is string && request.resource.data.name.size() <= 100
        && request.resource.data.phone is string && request.resource.data.phone.size() <= 30
        && request.resource.data.service is string && request.resource.data.service.size() <= 100
        && request.resource.data.message is string && request.resource.data.message.size() <= 2000;
      allow read, update, delete: if isAdmin();
    }
  }
}
```

### ملاحظات تشغيلية

- استعلام المقالات المنشورة يستخدم `where('status','==','published')` + `orderBy('createdAt','desc')`، وقد يطلب Firestore إنشاء **فهرس مركب**. الموقع الآن يفلتر محليًا كخطة بديلة حتى لا تظهر الصفحة فارغة، لكن الأفضل إنشاء الفهرس من رابط الخطأ في Console.
- الخدمات ظاهرة للجميع حتى بدون تسجيل دخول (قراءة فقط) — التعديل للمشرف فقط.

---

## 5) النشر على Cloudflare Pages

1. افتح [Cloudflare](https://dash.cloudflare.com/) → **Workers & Pages → Create → Pages**.
2. اختر **Upload assets** وارفع **محتويات** مجلد `alemtiaz-electric` (لا ترفع المجلد نفسه ولا ملف ZIP).
3. بعد النشر، افتح الرابط واختبر: الرئيسية، الخدمات، صفحة خدمة، المقالات، التواصل، دخول المشرف.
4. حدّث النطاق في: `sitemap.xml` (كل الروابط)، `robots.txt` (سطر Sitemap)، و`<link rel="canonical">` في الصفحات.
5. أضف نطاقك في **Firebase → Authentication → Settings → Authorized domains**.

يمكن النشر أيضًا على GitHub Pages، لكن روابط الخدمات تعتمد على `?slug=` وستعمل كما هي.

---

## 6) ما تم إصلاحه وإضافته

| المشكلة | الحل |
|---|---|
| كل الملفات كانت مسطّحة بينما الصفحات تطلب `css/ js/ assets/` فلم يعمل أي شيء | أُعيد ترتيب المجلدات وتصحيح المسارات |
| `services.html` مفقودة مع أنها مرتبطة من القائمة (10 روابط) | أُنشئت صفحة الخدمات، وصفحة `service.html` مستقلة لكل خدمة |
| `assets/logo.svg` و`assets/favicon.svg` و`sitemap.xml` غير موجودة | أُنشئت بالكامل (SVG خفيف + خريطة موقع) |
| `admin.html` لا يحمّل `js/image-upload.js` ⇒ رفع الصور معطّل | أُضيف الملف، وأُضيف Widget لرفع صورة المعرض |
| دالتا `loadServicesTable/editService/saveServiceForm/removeService` مكررتان في `admin.js` والنسخة القديمة تتغلب ⇒ نموذج الخدمة معطّل | حُذفت النسخة القديمة، وبقيت نسخة واحدة متسقة مع `admin.html` |
| `showToast` مستدعاة وغير معرّفة ⇒ أي حفظ خدمة يفشل بصمت | أُضيفت دالة التنبيهات `admin-toast` |
| `arguments.callee` (ممنوعة في strict mode) في معالج معرض صور الخدمة | استُبدلت بدالة مسماة |
| `formatDate` مستخدمة في لوحة التحكم لكن `main.js` غير محمّل هناك | أُضيف `adminFormatDate` محلي |
| `renderServices` تقرأ `s.description` بينما مستندات الخدمات تخزّن `shortDesc` ⇒ كروت فارغة | تُقرأ `shortDesc` مع الرجوع إلى `description` |
| كروت الخدمات بلا روابط ⇒ لا يمكن الوصول لصفحة الخدمة | كل كرت الآن رابط إلى `service.html?slug=` |
| تعطل كامل للواجهة عند تعذر تحميل Firebase (بدون إنترنت) | `offline-store.js` يوفر وضعًا تجريبيًا كاملًا |
| Quill يُحمّل من CDN؛ فشله يعطّل اللوحة | `createEditor()` يعود إلى `textarea` عند غياب Quill |
| شعارات/صور من Unsplash تظهر مكسورة عند بطء الشبكة | صور محلية + `onerror` احتياطي |
| `role` و`image` في آراء العملاء تُدرج في HTML بدون تهريب | تمر جميعها عبر `esc()` |
| رمز Alt/Canonical/Manifest ناقص في معظم الصفحات | أُضيفت `canonical` و`manifest` و`theme-color` وأوصاف Alt |
| نموذج التواصل يفتح واتساب فقط بلا تحقق | تحقق من الاسم والجوال + رسالة نجاح + محاولة حفظ في لوحة التحكم |
| `robots.txt`/`sitemap.xml` بنطاق وهمي غير موثّق | موثّق بوضوح في الأعلى أنه يجب استبدال `YOUR-DOMAIN` |
| **جديد:** لا وسيلة لحجز موعد أو معاينة من الموقع | صفحة `booking.html` + تبويب المواعيد في اللوحة مع فلاتر وحالات وتنبيهات واتساب |
| **جديد:** صور مؤقتة برسومات بسيطة | صور حقيقية للفريق (`photo-1.jpg`, `photo-2.jpg`) + شعار احترافي بملفّين (فاتح/داكن) |
| الأيقونات وملف الخط تختفي عند تعذر تحميل CDN | `icon-fallback.js` يستبدلها برموز بديلة تلقائياً |
| فشل Quill/رفع الصور كان يعطّل اللوحة | محرر بديل + تهيئة آمنة لكل العناصر |

---

## 7) أدوات إضافية داخل المشروع

- `esc(value)` — تهريب أي نص قبل إدراجه في HTML (حماية XSS).
- `sanitizeHtml(html)` — تنقية محتوى المقالات عبر DOMPurify (مع رجوع آمن عند غيابها).
- `optimizedImageUrl(url, width)` — تحسين أحجام صور Cloudinary تلقائيًا.
- `firebaseErrorMessage(err)` — تحويل أكواد أخطاء Firebase إلى رسائل عربية مفهومة.

---

## 8) حقوق الصور

- `assets/photo-1.jpg` و`assets/photo-2.jpg`: صور من [Unsplash](https://unsplash.com/license) — مجانية للاستخدام التجاري دون إلزام بالإسناد.
- الرسومات `photo-3.svg` و`placeholder.svg` والشعارات: صُممت داخل المشروع، وتخص الشركة.
- **مهم:** يُفضّل استبدال الصور بصور حقيقية من مشاريع الشركة (نفس أسماء الملفات يكفي، أو ارفعها من لوحة التحكم عبر Cloudinary).
