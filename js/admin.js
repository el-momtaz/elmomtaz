// ============================================
// لوحة التحكم - متصلة بـ Firebase (نسخة مُصلحة)
// ============================================

let quill;

// ⚠️ التعديل الأهم: ننتظر تأكيد حالة تسجيل الدخول قبل أي شيء
auth.onAuthStateChanged(function(user){
  if(!user){
    // المستخدم غير مسجل دخوله، أعده لصفحة الدخول
    window.location.href = 'login.html';
  } else {
    // المستخدم مسجل دخوله بنجاح، الآن ابدأ تحميل لوحة التحكم
    initAdminPanel();
  }
});

function initAdminPanel(){
  // تهيئة محرر Quill
  const toolbarOptions = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link', 'image', 'video'],
    ['clean']
  ];

  quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: { toolbar: toolbarOptions },
    placeholder: 'اكتب محتوى المقال هنا...'
  });

  loadDashboard();
  loadArticlesTable();

  document.querySelectorAll('.admin-nav .nav-item').forEach(item=>{
    item.addEventListener('click', function(e){
      e.preventDefault();
      switchTab(this.dataset.tab);
    });
  });
}

function switchTab(tabName){
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tabName).style.display = 'block';
  const navItem = document.querySelector(`[data-tab="${tabName}"]`);
  if(navItem) navItem.classList.add('active');

  if(tabName === 'new-article' && !document.getElementById('articleId').value){
    resetEditorForm();
  }
  if(tabName === 'dashboard') loadDashboard();
  if(tabName === 'articles') loadArticlesTable();
}

async function loadDashboard(){
  try{
    const articles = await getArticles();
    document.getElementById('statTotal').textContent = articles.length;
    document.getElementById('statPublished').textContent = articles.filter(a=>a.status==='published').length;
    document.getElementById('statDraft').textContent = articles.filter(a=>a.status==='draft').length;

    const recent = articles.slice(0,5);
    document.getElementById('recentArticlesTable').innerHTML = recent.map(a=>`
      <tr>
        <td>${a.title}</td>
        <td>${a.category}</td>
        <td>${a.date}</td>
        <td><span class="badge badge-${a.status==='published'?'published':'draft'}">${a.status==='published'?'منشور':'مسودة'}</span></td>
      </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;">لا توجد مقالات</td></tr>';
  }catch(err){
    console.error('خطأ في تحميل لوحة البيانات:', err);
    alert('حدث خطأ أثناء تحميل البيانات: ' + err.message);
  }
}

async function loadArticlesTable(){
  const tableBody = document.getElementById('articlesTable');
  tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</td></tr>';

  try{
    const articles = await getArticles();
    tableBody.innerHTML = articles.map(a=>`
      <tr>
        <td>${a.title}</td>
        <td>${a.category}</td>
        <td>${a.author}</td>
        <td>${a.date}</td>
        <td><span class="badge badge-${a.status==='published'?'published':'draft'}">${a.status==='published'?'منشور':'مسودة'}</span></td>
        <td class="table-actions">
          <button class="icon-btn edit" onclick="editArticle('${a.id}')"><i class="fas fa-edit"></i></button>
          <button class="icon-btn delete" onclick="confirmDelete('${a.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;padding:40px;">لا توجد مقالات. أضف مقالك الأول!</td></tr>';
  }catch(err){
    console.error('خطأ في تحميل المقالات:', err);
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:red;padding:30px;">خطأ: ${err.message}</td></tr>`;
  }
}

function resetEditorForm(){
  document.getElementById('editorTitle').textContent = 'مقال جديد';
  document.getElementById('articleId').value = '';
  document.getElementById('artTitle').value = '';
  document.getElementById('artImage').value = '';
  document.getElementById('artCategory').value = 'تأسيس';
  document.getElementById('artStatus').value = 'published';
  document.getElementById('artExcerpt').value = '';
  if(quill) quill.setContents([]);
}

async function editArticle(id){
  const article = await getArticleById(id);
  if(!article) return;
  switchTab('new-article');
  document.getElementById('editorTitle').textContent = 'تعديل المقال';
  document.getElementById('articleId').value = article.id;
  document.getElementById('artTitle').value = article.title;
  document.getElementById('artImage').value = article.image;
  document.getElementById('artCategory').value = article.category;
  document.getElementById('artStatus').value = article.status;
  document.getElementById('artExcerpt').value = article.excerpt;
  quill.root.innerHTML = article.content;
}

async function saveArticleForm(){
  const id = document.getElementById('articleId').value;
  const title = document.getElementById('artTitle').value.trim();
  const image = document.getElementById('artImage').value.trim() || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800';
  const category = document.getElementById('artCategory').value;
  const status = document.getElementById('artStatus').value;
  const excerpt = document.getElementById('artExcerpt').value.trim();
  const content = quill.root.innerHTML;

  if(!title){ alert('الرجاء إدخال عنوان المقال'); return; }
  if(!excerpt){ alert('الرجاء إدخال وصف مختصر للمقال (مهم للسيو)'); return; }

  const articleData = {
    title, image, category, status, excerpt, content,
    author: 'فريق الممتاز',
    date: new Date().toISOString().split('T')[0]
  };

  const saveBtn = event.target;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

  try{
    if(id){
      await updateArticle(id, articleData);
      alert('تم تحديث المقال بنجاح ✅');
    } else {
      await addArticle(articleData);
      alert('تم نشر المقال بنجاح ✅');
    }
    switchTab('articles');
  }catch(err){
    console.error(err);
    alert('حدث خطأ أثناء الحفظ: ' + err.message);
  }finally{
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ المقال';
  }
}

async function confirmDelete(id){
  if(confirm('هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.')){
    try{
      await deleteArticle(id);
      loadArticlesTable();
      loadDashboard();
    }catch(err){
      alert('خطأ أثناء الحذف: ' + err.message);
    }
  }
}

async function exportData(){
  const articles = await getArticles();
  const data = JSON.stringify(articles, null, 2);
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `alemtiaz-articles-${Date.now()}.json`;
  a.click();
}

function importData(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async function(e){
    try{
      const imported = JSON.parse(e.target.result);
      if(Array.isArray(imported)){
        for(const art of imported){
          const { id, createdAt, ...data } = art;
          await addArticle(data);
        }
        alert('تم استيراد المقالات بنجاح ✅');
        loadArticlesTable();
        loadDashboard();
      }
    }catch(err){
      alert('خطأ: ملف غير صالح');
    }
  };
  reader.readAsText(file);
}

// دالة تسجيل الخروج (مستخدمة من زر Logout في admin.html)
function logout(){
  auth.signOut().then(()=> window.location.href = 'login.html');
}