function login(email, password){
  return auth.signInWithEmailAndPassword(email, password);
}

function logout(){
  auth.signOut().then(()=> window.location.href = 'login.html');
}

function requireAuth(){
  auth.onAuthStateChanged(function(user){
    if(!user){
      window.location.href = 'login.html';
    }
  });
}