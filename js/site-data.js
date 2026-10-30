// ============================================
// نظام إدارة محتوى الموقع العام
// (إعدادات، خدمات، آراء عملاء، معرض أعمال، رسائل)
// ============================================

const settingsDoc = db.collection('settings').doc('general');
const servicesCollection = db.collection('services');
const testimonialsCollection = db.collection('testimonials');
const galleryCollection = db.collection('gallery');
const messagesCollection = db.collection('messages');
const appointmentsCollection = db.collection('appointments');

const DEFAULT_SETTINGS = {
  phone: "+966508980434",
  whatsapp: "+966508980434",
  email: "info@alemtiaz-electric.com",
  address: "جازان، المملكة العربية السعودية",
  workHours: "يومياً من 8 صباحاً حتى 10 مساءً",
  facebook: "#", twitter: "#", instagram: "#",
  heroBadge: "خبرة تتجاوز 10 سنوات",
  heroTitlePart1: "خدمات ",
  heroHighlight: "كهربائية احترافية",
  heroTitlePart2: " تأسيساً وتشطيباً في جازان",
  heroDescription: "شركة الممتاز تقدم جميع الأعمال الكهربائية بأعلى معايير الجودة والسلامة، فريق فني متخصص وأسعار تنافسية لكافة المناطق المجاورة لجازان.",
  stat1Number: "+500", stat1Label: "مشروع منجز",
  stat2Number: "+10", stat2Label: "سنوات خبرة",
  stat3Number: "24/7", stat3Label: "دعم فني",
  stat4Number: "100%", stat4Label: "رضا العملاء",
  aboutText1: "تأسست شركة الممتاز للأعمال الكهربائية لتكون الخيار الأول في مدينة جازان والمناطق المجاورة.",
  aboutText2: "يضم فريقنا نخبة من الفنيين المدربين والمعتمدين، ملتزمون بتقديم أعلى معايير الجودة والسلامة.",
  mapEmbedUrl: "https://maps.google.com/maps?q=جازان&t=&z=11&ie=UTF8&iwloc=&output=embed"
};

async function getSettings(){
  try{
    const doc = await settingsDoc.get();
    return doc.exists ? { ...DEFAULT_SETTINGS, ...doc.data() } : DEFAULT_SETTINGS;
  }catch(err){
    console.error('خطأ في جلب الإعدادات:', err);
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(data){
  await settingsDoc.set(data, { merge: true });
}

// ============================
// إدارة الخدمات (نسخة موسّعة بصفحات مستقلة)
// ============================

// توليد slug عربي/إنجليزي صديق للروابط
function generateSlug(text) {
  return text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, "")
    .toLowerCase();
}

// خدمات احتياطية تظهر عند عدم وجود خدمات في قاعدة البيانات (أو تعذر الاتصال)
// حتى لا تظهر الصفحة فارغة أمام الزائر
const DEMO_SERVICES = [
  {
    id: "demo-taasis",
    title: "تأسيس كهرباء",
    slug: "تأسيس-كهرباء",
    icon: "fas fa-plug",
    shortDesc: "تأسيس الشبكات الكهربائية للمنازل والفلل والمنشآت وفق المخططات ومعايير السلامة.",
    fullDescription: "<p>نقوم بتأسيس الكهرباء من الصفر وفق المخططات، من تمديد المواسير داخل الجدران والأسقف إلى توزيع الدوائر على لوحة التوزيع الرئيسية.</p><ul><li>كابلات نحاسية مطابقة للمواصفات.</li><li>ترقيم وتوثيق كل دائرة.</li><li>اختبار العزل قبل اللياسة.</li></ul>",
    image: "assets/photo-1.jpg",
    gallery: [],
    features: ["مطابقة كود البناء السعودي", "كابلات نحاسية أصلية", "ترقيم وتوثيق كل دائرة", "ضمان على التنفيذ"],
    metaTitle: "تأسيس كهرباء في جازان",
    metaDescription: "تأسيس كهرباء احترافي للمنازل والفلل والمنشآت في جازان.",
    order: 1
  },
  {
    id: "demo-tashreeb",
    title: "تشطيب وتمديدات",
    slug: "تشطيب-وتمديدات",
    icon: "fas fa-tools",
    shortDesc: "تركيب الإضاءة والمفاتيح والأفياش ولوحات التوزيع بتشطيب احترافي.",
    fullDescription: "<p>تشطيب كهرباء كامل: نقاط الإنارة، المفاتيح والأفياش، المراوح والثريات، وتنظيم لوحة التوزيع مع قواطع تفاضلية.</p>",
    image: "assets/photo-3.svg",
    gallery: [],
    features: ["تركيب إضاءة LED", "قواطع تفاضلية", "تنظيم أسلاك اللوحة", "تنظيف الموقع بعد الانتهاء"],
    metaTitle: "تشطيب كهرباء في جازان",
    metaDescription: "تشطيب كهرباء المنازل والفلل بجازان.",
    order: 2
  },
  {
    id: "demo-maintenance",
    title: "صيانة وإصلاح الأعطال",
    slug: "صيانة-وإصلاح",
    icon: "fas fa-screwdriver-wrench",
    shortDesc: "تشخيص الأعطال الكهربائية وإصلاحها مع الاهتمام بالسلامة وجودة التنفيذ.",
    fullDescription: "<p>زيارة فني مختص لتشخيص العطل بالأجهزة المناسبة، مع توضيح السبب والتكلفة قبل بدء الإصلاح.</p>",
    image: "assets/photo-2.jpg",
    gallery: [],
    features: ["تحديد العطل بدقة", "سعر واضح قبل التنفيذ", "خدمة طوارئ", "قطع غيار أصلية"],
    metaTitle: "صيانة كهرباء جازان",
    metaDescription: "فني كهربائي للصيانة وإصلاح الأعطال في جازان.",
    order: 3
  },
  {
    id: "demo-panels",
    title: "لوحات التوزيع",
    slug: "لوحات-التوزيع",
    icon: "fas fa-table-cells-large",
    shortDesc: "تصميم وتنفيذ لوحات توزيع رئيسية وفرعية بتوزيع أحمال متوازن.",
    fullDescription: "<p>حساب الأحمال وتوزيعها على الأطوار، اختيار القواطع المناسبة، وتنظيم وترقيم الأسلاك مع مخطط داخل اللوحة.</p>",
    image: "assets/photo-2.jpg",
    gallery: [],
    features: ["حساب أحمال دقيق", "ترتيب وترقيم الأسلاك", "حماية من التماس", "مخطط معتمد داخل اللوحة"],
    metaTitle: "لوحات توزيع كهرباء جازان",
    metaDescription: "تصميم وتنفيذ لوحات التوزيع الرئيسية والفرعية في جازان.",
    order: 4
  },
  {
    id: "demo-lighting",
    title: "إضاءة LED وحدائق",
    slug: "إضاءة-ليد",
    icon: "fas fa-lightbulb",
    shortDesc: "تركيب إضاءة داخلية وخارجية وكشافات حدائق وواجهات بتوفير في الطاقة.",
    fullDescription: "<p>اختيار وحدات إضاءة موفرة مناسبة لكل مساحة، مع تركيب كشافات الواجهات والحدائق بعزل جيد ضد الرطوبة.</p>",
    image: "assets/photo-3.svg",
    gallery: [],
    features: ["توفير في الطاقة", "كشافات مقاومة للماء", "توزيع إضاءة مدروس", "ضمان على القطع"],
    metaTitle: "إضاءة LED في جازان",
    metaDescription: "تركيب إضاءة LED داخلية وخارجية بجازان مع ضمان.",
    order: 5
  },
  {
    id: "demo-safety",
    title: "فحص السلامة الكهربائية",
    slug: "فحص-السلامة",
    icon: "fas fa-shield-halved",
    shortDesc: "فحص التوصيلات واللوحات الكهربائية للمساعدة في رفع مستوى السلامة.",
    fullDescription: "<p>فحص شامل للوحة الرئيسية ونقاط الأرضي والتوصيلات وقياس مقاومة العزل، مع تقرير بالملاحظات والأولويات.</p>",
    image: "assets/photo-1.jpg",
    gallery: [],
    features: ["فحص نقطة الأرضي", "قياس مقاومة العزل", "تقرير مكتوب", "توصيات مرتبة بالأولوية"],
    metaTitle: "فحص السلامة الكهربائية جازان",
    metaDescription: "فحص واختبار السلامة الكهربائية للمنازل والمنشآت في جازان.",
    order: 6
  }
];

async function getServices() {
  try {
    const snapshot = await db.collection("services").orderBy("order", "asc").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("خطأ في جلب الخدمات:", e);
    return [];
  }
}

// تُستخدم في صفحات العرض العامة: تعيد المحتوى الحقيقي، أو نسخة تجريبية
// عند عدم وجود بيانات، بدل عرض صفحة فارغة
async function getServicesWithFallback() {
  const services = await getServices();
  return services.length ? services : DEMO_SERVICES;
}

async function getServiceById(id) {
  try {
    const doc = await db.collection("services").doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (e) {
    console.error("خطأ في جلب الخدمة:", e);
    return null;
  }
}

async function getServiceBySlug(slug) {
  try {
    const snapshot = await db.collection("services").where("slug", "==", slug).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (e) {
    console.error("خطأ في جلب الخدمة بالـ slug:", e);
    return null;
  }
}

// نسخة احتياطية: تبحث في قاعدة البيانات أولاً ثم في الخدمات التجريبية
async function getServiceBySlugWithFallback(slug) {
  if (!slug) return null;
  const real = await getServiceBySlug(slug);
  if (real) return real;
  return DEMO_SERVICES.find((s) => s.slug === slug || s.id === slug) || null;
}

/**
 * إضافة خدمة جديدة
 * data = {
 *   title, icon, shortDesc, fullDescription (HTML من محرر غني),
 *   image, gallery (array of urls), features (array of strings),
 *   metaTitle, metaDescription, order
 * }
 */
async function addService(data) {
  try {
    const slug = data.slug || generateSlug(data.title);
    const docRef = await db.collection("services").add({
      title: data.title || "",
      slug: slug,
      icon: data.icon || "fas fa-bolt",
      shortDesc: data.shortDesc || "",
      fullDescription: data.fullDescription || "",
      image: data.image || "",
      gallery: data.gallery || [],
      features: data.features || [],
      metaTitle: data.metaTitle || data.title || "",
      metaDescription: data.metaDescription || data.shortDesc || "",
      order: data.order !== undefined ? data.order : Date.now(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (e) {
    console.error("خطأ في إضافة الخدمة:", e);
    throw e;
  }
}

async function updateService(id, data) {
  try {
    const updateData = { ...data };
    if (data.title && !data.slug) {
      updateData.slug = generateSlug(data.title);
    }
    await db.collection("services").doc(id).update(updateData);
  } catch (e) {
    console.error("خطأ في تحديث الخدمة:", e);
    throw e;
  }
}

async function deleteService(id) {
  try {
    await db.collection("services").doc(id).delete();
  } catch (e) {
    console.error("خطأ في حذف الخدمة:", e);
    throw e;
  }
}

// ---------- آراء العملاء ----------
async function getTestimonials(){
  const snap = await testimonialsCollection.orderBy('createdAt','desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function addTestimonial(data){
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  const ref = await testimonialsCollection.add(data);
  return ref.id;
}
async function deleteTestimonial(id){ await testimonialsCollection.doc(id).delete(); }

// ---------- معرض الأعمال ----------
async function getGallery(){
  const snap = await galleryCollection.orderBy('createdAt','desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function addGalleryItem(data){
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  const ref = await galleryCollection.add(data);
  return ref.id;
}
async function deleteGalleryItem(id){ await galleryCollection.doc(id).delete(); }

// ---------- رسائل التواصل ----------
async function sendMessage(data){
  data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  data.read = false;
  await messagesCollection.add(data);
}
async function getMessages(){
  const snap = await messagesCollection.orderBy('createdAt','desc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function markMessageRead(id){ await messagesCollection.doc(id).update({ read: true }); }
async function deleteMessage(id){ await messagesCollection.doc(id).delete(); }

// ============================
// المواعيد (حجز موعد زيارة/معاينة)
// ============================

const BOOKING_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

const APPOINTMENT_STATUS = {
  pending: 'بانتظار التأكيد',
  confirmed: 'مؤكد',
  done: 'منجز',
  cancelled: 'ملغي'
};

// إضافة موعد: الحقول المسموح بها فقط (مطابقة لقواعد Firestore)
async function addAppointment(data){
  const payload = {
    name: String(data.name || '').trim().slice(0, 100),
    phone: String(data.phone || '').trim().slice(0, 30),
    service: String(data.service || '').trim().slice(0, 100),
    date: String(data.date || '').slice(0, 10),
    time: String(data.time || '').slice(0, 5),
    notes: String(data.notes || '').trim().slice(0, 1000),
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  const ref = await appointmentsCollection.add(payload);
  return ref.id;
}

async function getAppointments(){
  try{
    const snap = await appointmentsCollection.orderBy('createdAt','desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }catch(err){
    console.error('خطأ في جلب المواعيد:', err);
    throw err;
  }
}

async function updateAppointmentStatus(id, status){
  await appointmentsCollection.doc(id).update({ status });
}

async function deleteAppointment(id){
  await appointmentsCollection.doc(id).delete();
}
