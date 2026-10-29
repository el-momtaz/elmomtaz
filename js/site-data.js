// ============================================
// نظام إدارة محتوى الموقع العام
// (إعدادات، خدمات، آراء عملاء، معرض أعمال، رسائل)
// ============================================

const settingsDoc = db.collection('settings').doc('general');
const servicesCollection = db.collection('services');
const testimonialsCollection = db.collection('testimonials');
const galleryCollection = db.collection('gallery');
const messagesCollection = db.collection('messages');

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

// ---------- الخدمات ----------
async function getServices(){
  const snap = await servicesCollection.orderBy('order','asc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function addService(data){
  const snap = await servicesCollection.get();
  data.order = snap.size + 1;
  const ref = await servicesCollection.add(data);
  return ref.id;
}
async function updateService(id, data){ await servicesCollection.doc(id).update(data); }
async function deleteService(id){ await servicesCollection.doc(id).delete(); }
async function getServiceById(id){
  const doc = await servicesCollection.doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
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
