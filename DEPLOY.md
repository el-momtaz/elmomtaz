# نشر الموقع في 5 خطوات

الحزمة جاهزة للرفع كما هي. الموقع يعمل مباشرة بعد الرفع، وبعد أن تعرف رابط النشر تشغّل أمرًا واحدًا لإكمال إعدادات SEO.

---

## 0) أنت منشور على GitHub Pages — تحديث سريع

موقعك الحالي: `https://el-momtaz.github.io/elmomtaz` — تم ضبط النطاق والمسار الفرعي في هذه النسخة.

**الملفات التي تغيّرت وتحتاج استبدالاً في المستودع:**

| الملف | التغيير |
|---|---|
| `sitemap.xml` | حُذف رابط `your-domain.com` الوهمي — 6 روابط صحيحة |
| `robots.txt` | مسار `Disallow` الصحيح + سطر Sitemap |
| `index.html` `about.html` `services.html` `service.html` `booking.html` `articles.html` `article.html` `contact.html` | وسوم المشاركة (OG/Twitter) كاملة + `apple-touch-icon` + بيانات Breadcrumb + عنوان/وصف احتياطي أفضل |
| `js/main.js` `js/service-page.js` | حقن `Article`/`Service` JSON-LD وتحديث `og:*` و`canonical` تلقائيًا لكل مقال/خدمة |
| `assets/og-image.jpg` | **جديد** — صورة مشاركة 1200×630 |
| `assets/apple-touch-icon.png` | **جديد** — أيقونة 180×180 لأجهزة iOS |
| `css/style.css` | **جديد** — تنسيق رأس الصفحة المحدّث + درج القائمة |
| `assets/logo-mark.svg` | **جديد** — أيقونة الشعار (البرق) المستخدمة في الرأس |
| `.nojekyll` | يمنع Jekyll من معالجة الملفات (إن لم يكن مرفوعًا) |
| `404.html` | صفحة خطأ تعمل على أي عمق + `<base href="/elmomtaz/">` |

أقل عدد ملفات يكفي لهذا التحديث: **8 صفحات HTML + `css/style.css` + `js/main.js` + `js/service-page.js` + `sitemap.xml` + `assets/og-image.jpg` + `assets/apple-touch-icon.png` + `assets/logo-mark.svg`**.

**طريقة التحديث:** افتح المستودع على GitHub → **Add file → Upload files** → اسحب الملفات المذكورة (بنفس المسارات) → **Commit changes** → انتظر 1–2 دقيقة.

> GitHub Pages يخزّن مؤقتًا ~10 دقائق أحيانًا؛ استخدم `Ctrl+Shift+R` للتحديث القسري.

**خطوات لازمة مرة واحدة:**
1. Firebase → **Authentication → Settings → Authorized domains** → أضف `el-momtaz.github.io`.
2. Settings في المستودع → Pages → تأكد أن **Enforce HTTPS** مفعّل.
3. [Google Search Console](https://search.google.com/search-console) → أضف الموقع → أرسل `https://el-momtaz.github.io/elmomtaz/sitemap.xml`.

> ملف `_headers` خاص بـ Cloudflare Pages فقط (سيعطي 404 على GitHub Pages) — لا يؤثر على شيء، يمكنك تجاهله أو حذفه.

---

## 1) ارفع الملفات

### Cloudflare Pages (الأسهل والمجاني)
1. افتح <https://dash.cloudflare.com/> → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. اسحب **محتويات** هذا المجلد (كل الملفات والمجلدات: `index.html`, `css/`, `js/`, `assets/` … وليس المجلد نفسه ولا ملف ZIP).
3. اضغط **Deploy** وانتظر ثوانٍ، ستحصل على رابط مثل `https://alemtiaz.pages.dev`.

> الحجم الكامل للموقع أقل من 400 كيلوبايت، والرفع المباشر لا يحتاج حساب GitHub.

### بدائل
- **GitHub Pages**: ارفع الملفات في المستودع، ثم Settings → Pages → Branch: main / root.
- **Netlify**: اسحب المجلد إلى <https://app.netlify.com/drop>.
- **استضافة عادية (cPanel)**: ارفع المحتويات إلى `public_html`.

---

## 2) اضبط النطاق بأمر واحد

بعد معرفة رابط النشر (أو بعد ربط الدومين الخاص):

```bash
python3 set-domain.py https://alemtiaz.pages.dev
```

هذا يحدّث تلقائيًا: `sitemap.xml` و`robots.txt` و`canonical` و`og:url` و`og:image` في كل الصفحات.

> لا يوجد Python على جهازك؟ أرسل لي النطاق وأنا أعيد توليد الملفات مضبوطة.
> يمكنك حذف `set-domain.py` بعد التشغيل، أو إبقاؤه (لا يؤثر على الموقع).

---

## 3) فعّل Firebase (مطلوب للمقالات واللوحة والمواعيد)

1. [Firebase Console](https://console.firebase.google.com/) → مشروع `elmomtaz` (أو مشروعك).
2. **Authentication → Sign-in method → Email/Password = مفعّل**، وأنشئ حساب المشرف من تبويب **Users**.
3. **Firestore Database → Create database** (وضع Production).
4. **Firestore → Rules**: انسخ القواعد من قسم «قواعد Firestore» في `README.md`، واستبدل `PUT_ADMIN_UID_HERE` بـ UID حساب المشرف، ثم **Publish**.
5. **Authentication → Settings → Authorized domains**: أضف نطاق النشر (`alemtiaz.pages.dev` أو دومينك).

> بدون هذه الخطوة: الموقع يعرض بيانات تجريبية تلقائيًا (وضع Demo) لأن Firebase لا يسمح بالكتابة/القراءة.

**بعد أول تسجيل دخول:** إن كانت القاعدة فارغة سيظهر تنبيه «قاعدة البيانات فارغة» في لوحة البيانات — اضغط **تهيئة المحتوى** لإضافة (الإعدادات + 6 خدمات + 3 مقالات + آراء + معرض) بضغطة واحدة.

---

## 4) اختبر بعد النشر (٣ دقائق)

| الاختبار | المتوقع |
|---|---|
| الرئيسية | 6 خدمات، معرض أعمال، آراء، 3 مقالات |
| خدماتنا → أي خدمة | صفحة خدمة كاملة + زر «احجز موعد» يعبّئ الخدمة |
| حجز موعد | اختيار تاريخ/وقت → رسالة نجاح + زر واتساب |
| اتصل بنا | إرسال النموذج يفتح واتساب ويحفظ الرسالة في اللوحة |
| `login.html` | دخول بحساب المشرف من Firebase |
| لوحة التحكم | إضافة مقال/خدمة، المواعيد، الرسائل، الإعدادات |

---

## 5) ما بعد النشر

- **Google Search Console**: أضف الموقع، وأرسل `https://نطاقك/sitemap.xml`.
- **WhatsApp/الفوتر**: كل الأرقام تُدار من **لوحة التحكم → إعدادات الموقع** (هاتف، واتساب، بريد، عنوان، ساعات العمل، الإحصائيات).
- **الصور**: استبدل `assets/photo-1.jpg` و`photo-2.jpg` بصور مشاريعكم الحقيقية بنفس الأسماء، أو ارفعها من اللوحة (Cloudinary).
- **نسخة احتياطية**: لوحة التحكم → النسخ الاحتياطي → تصدير (مقالات + خدمات JSON).
- **تحديث الملفات**: ارفع الملفات المعدّلة فقط فوق القديمة؛ لا حاجة لإعادة ضبط النطاق إلا إذا تغيّر.

---

## ملفات خاصة بالحزمة

| الملف | وظيفته |
|---|---|
| `_headers` | رؤوس أمان وكاش لـ Cloudflare Pages (يُتجاهل تلقائيًا في الاستضافات الأخرى) |
| `set-domain.py` | ضبط النطاق في كل ملفات SEO |
| `robots.txt` | يمنع فهرسة `admin.html` و`login.html` |
| `manifest.json` | تثبيت الموقع كتطبيق + اختصار «حجز موعد» |

**لا ترفع**: هذا الملف (`DEPLOY.md`) غير ضار لكنه غير مطلوب، ومجلد `uploads/` أو أي ملفات خارج الحزمة.
