// نظام تخزين المقالات باستخدام Firebase Firestore

const articlesCollection = db.collection('articles');

async function getArticles(){
  const snapshot = await articlesCollection.orderBy('createdAt','desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getPublishedArticles(){
  const snapshot = await articlesCollection
    .where('status','==','published')
    .orderBy('createdAt','desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getArticleById(id){
  const doc = await articlesCollection.doc(id).get();
  if(!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function addArticle(article){
  article.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  const docRef = await articlesCollection.add(article);
  return docRef.id;
}

async function updateArticle(id, updated){
  await articlesCollection.doc(id).update(updated);
  return true;
}

async function deleteArticle(id){
  await articlesCollection.doc(id).delete();
}