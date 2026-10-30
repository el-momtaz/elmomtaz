// ============================================
// articles-store.js — تخزين المقالات (Firestore)
// ============================================

const articlesCollection = db.collection('articles');

function mapDocs(snapshot){
  return snapshot.docs.map(function(doc){ return Object.assign({ id: doc.id }, doc.data()); });
}

async function getArticles(){
  try{
    const snapshot = await articlesCollection.orderBy('createdAt','desc').get();
    return mapDocs(snapshot);
  }catch(err){
    // في حال عدم وجود حقل createdAt في بعض المستندات القديمة
    console.error('خطأ في جلب المقالات:', err);
    const snapshot = await articlesCollection.get();
    return mapDocs(snapshot);
  }
}

async function getPublishedArticles(){
  try{
    const snapshot = await articlesCollection
      .where('status','==','published')
      .orderBy('createdAt','desc')
      .get();
    return mapDocs(snapshot);
  }catch(err){
    // Firestore يطلب فهرسًا مركبًا لهذا الاستعلام في بعض المشاريع؛
    // في هذه الحالة نجلب الكل ونفلتر محليًا حتى لا تظهر الصفحة فارغة
    if(String(err && err.code).indexOf('failed-precondition') > -1 || String(err && err.message).indexOf('index') > -1){
      console.warn('يحتاج Firestore إلى فهرس مركب. تمت الفلترة محليًا مؤقتًا. راجع README.md');
      const all = await getArticles();
      return all.filter(function(a){ return a.status === 'published'; });
    }
    throw err;
  }
}

async function getArticleById(id){
  if(!id) return null;
  const doc = await articlesCollection.doc(id).get();
  if(!doc.exists) return null;
  return Object.assign({ id: doc.id }, doc.data());
}

async function addArticle(article){
  const data = Object.assign({}, article, {
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  const docRef = await articlesCollection.add(data);
  return docRef.id;
}

async function updateArticle(id, updated){
  await articlesCollection.doc(id).update(updated);
  return true;
}

async function deleteArticle(id){
  await articlesCollection.doc(id).delete();
  return true;
}
