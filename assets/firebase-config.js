// ============================================
// إعدادات Firebase الخاصة بمشروع شركة الممتاز
// ============================================
// ملاحظة أمنية: مفاتيح Firebase للواجهة الأمامية (apiKey/appId) ليست
// كلمات مرور ولا أسرارًا — الحماية الحقيقية تكون عبر:
//   1) Firestore Security Rules (انظر README.md)
//   2) تقييد الـ API key في Google Cloud Console بنطاق موقعك فقط
// لا تضع أبدًا كلمة مرور المشرف أو Service Account داخل هذه الملفات.
//
// إذا لم يستطع المتصفح تحميل Firebase SDK (انقطاع إنترنت / معاينة محلية)
// فإن js/offline-store.js يوفّر بديلاً محليًا تلقائيًا حتى لا تتعطل الواجهة.
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyDfqwwtSfGLHJArMTu7D4NUCYjtMfFD-5w",
  authDomain: "elmomtaz.firebaseapp.com",
  projectId: "elmomtaz",
  storageBucket: "elmomtaz.firebasestorage.app",
  messagingSenderId: "824232481334",
  appId: "1:824232481334:web:f419bf5bda91d6b7b2fe97"
};

// تهيئة Firebase (بصيغة compat المتوافقة مع روابط CDN)
if (typeof firebase === "undefined") {
  // حماية إضافية في حال عدم تحميل offline-store.js قبل هذا الملف
  console.error("Firebase SDK غير محمّل: تحقق من ترتيب ملفات السكربت في الصفحة.");
}
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ---------- أدوات الحماية ----------
// تهريب النصوص قبل إدراجها في HTML (حماية من XSS)
function esc(v){
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
// تنقية HTML الغني (محتوى المقالات) باستخدام DOMPurify
function sanitizeHtml(html){
  return (window.DOMPurify) ? DOMPurify.sanitize(html || '') : esc(html);
}
// رسالة خطأ عربية مفهومة من أخطاء Firebase الشائعة
function firebaseErrorMessage(err){
  const code = (err && err.code) || '';
  if(code.indexOf('permission-denied') > -1) return 'لا تملك صلاحية لهذا الإجراء. تحقق من قواعد Firestore.';
  if(code.indexOf('unavailable') > -1) return 'تعذر الاتصال بالخدمة. تحقق من الإنترنت وحاول مرة أخرى.';
  if(code.indexOf('failed-precondition') > -1) return 'يحتاج Firestore إلى إنشاء فهرس (index) لهذا الاستعلام. راجع رسالة الخطأ في وحدة التحكم.';
  if(code.indexOf('invalid-credential') > -1 || code.indexOf('wrong-password') > -1 || code.indexOf('user-not-found') > -1) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if(code.indexOf('too-many-requests') > -1) return 'محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.';
  return (err && err.message) ? err.message : 'حدث خطأ غير متوقع.';
}
