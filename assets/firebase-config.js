// إعدادات Firebase الخاصة بمشروع شركة الممتاز
const firebaseConfig = {
  apiKey: "AIzaSyDfqwwtSfGLHJArMTu7D4NUCYjtMfFD-5w",
  authDomain: "elmomtaz.firebaseapp.com",
  projectId: "elmomtaz",
  storageBucket: "elmomtaz.firebasestorage.app",
  messagingSenderId: "824232481334",
  appId: "1:824232481334:web:f419bf5bda91d6b7b2fe97"
};

// تهيئة Firebase (بصيغة compat المتوافقة مع روابط CDN)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();