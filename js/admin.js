let quill;

auth.onAuthStateChanged(function(user){
  if(!user){ window.location.href = 'login.html'; }
  else{ initAdminPanel(); }
});

function initAdminPanel(){
  const toolbarOptions = [
    [{ 'header': [1,2,3,false] }],
    ['bold','italic','underline','strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['blockquote','code-block'],
    [{ 'list':'ordered'}, { 'list':'bullet' }],
    [{ 'indent':'-1'}, { 'indent':'+1' }],
    ['link','image','video'],
    ['clean']
  ];
  quill = new Quill('#editor-container', { theme:'snow', modules:{ toolbar: toolbarOptions }, placeholder:'اكتب محتوى المقال هنا...' });

  loadDashboard();
  loadArticlesTable();
  loadSettingsForm();
  loadServicesTable();
  loadTestimonialsTable();
  loadGalleryManage();
  checkUnreadMessages();

  document.querySelectorAll('.admin-nav .nav-item').forEach(item=>{
    item.addEventListener('click', function(e){ e.preventDefault(); switchTab(this.dataset.tab); });
  });

  document.getElementById('gal_image').addEventListener('input', function(){
    const preview = document.getElementById('galPreview');
    if(this.value){ preview.src = this.value; preview.style.display='block'; } else { preview.style.display='none'; }
  });
}

function switchTab(tabName){
  document.querySelectorAll('.tab-content').forEach(t => t.style.display='none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-'+tabName).style.display='block';
  const navItem = document.querySelector(`[data-tab="${tabName}"]`);
  if(navItem) navItem.classList.add('active');

  if(tabName==='new-article' && !document.getElementById('articleId').value) resetEditorForm();
  if(tabName==='dashboard') loadDashboard();
  if(tabName==='articles') loadArticlesTable();
  if(tabName==='services') loadServicesTable();
  if(tabName==='testimonials') loadTestimonialsTable();
  if(tabName==='gallery') loadGalleryManage();
  if(tabName==='messages') loadMessagesTab();
}
// ============================
// إدارة الخدمات (Admin)
// ============================

let serviceQuill = null;
let currentServiceGallery = [];

// تهيئة محرر Quill الخاص بوصف الخدمة (يُستدعى مرة واحدة)
function initServiceQuillEditor() {
  if (serviceQuill) return; // تجنب التهيئة المكررة
  serviceQuill = new Quill("#serviceQuillEditor", {
    theme: "snow",
    placeholder: "اكتب وصفاً تفصيلياً للخدمة...",
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    },
  });
}

// تحميل جدول الخدمات
async function loadServicesTable() {
  const tbody = document.getElementById("servicesTableBody");
  tbody.innerHTML = `<tr><td colspan="5" class="text-center">جاري التحميل...</td></tr>`;

  const services = await getServices();

  if (services.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center">لا توجد خدمات مضافة بعد</td></tr>`;
    return;
  }

  tbody.innerHTML = services
    .map(
      (s) => `
    <tr>
      <td><img src="${s.image ? optimizedImageUrl(s.image, 100) : 'assets/logo.svg'}" alt="${s.title}"></td>
      <td><strong>${s.title}</strong></td>
      <td>${(s.shortDesc || "").substring(0, 50)}${s.shortDesc && s.shortDesc.length > 50 ? "..." : ""}</td>
      <td><a href="service.html?slug=${s.slug}" target="_blank" style="color:#2563eb">${s.slug}</a></td>
      <td>
        <div class="action-icons-group">
          <button class="icon-btn" onclick="editService('${s.id}')" title="تعديل"><i class="fas fa-edit"></i></button>
          <button class="icon-btn danger" onclick="removeService('${s.id}')" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

// فتح نموذج إضافة خدمة جديدة (فارغ)
function openServiceForm() {
  document.getElementById("serviceFormTitle").textContent = "إضافة خدمة جديدة";
  document.getElementById("serviceId").value = "";
  document.getElementById("serviceTitleInput").value = "";
  document.getElementById("serviceIconInput").value = "fas fa-bolt";
  document.getElementById("serviceSlugInput").value = "";
  document.getElementById("serviceShortDescInput").value = "";
  document.getElementById("serviceFeaturesInput").value = "";
  document.getElementById("serviceMetaTitleInput").value = "";
  document.getElementById("serviceMetaDescInput").value = "";
  currentServiceGallery = [];

  document.getElementById("serviceFormModal").style.display = "flex";

  // تهيئة widget الصورة الرئيسية
  createImageUploadWidget("serviceImageUploadWidget", "", () => {});

  // تهيئة widget صورة المعرض المؤقت
  createImageUploadWidget("serviceGalleryUploadWidget", "", (url) => {
    currentServiceGallery.push(url);
    renderServiceGalleryPreview();
    // إعادة تهيئة الـ widget لصورة جديدة
    createImageUploadWidget("serviceGalleryUploadWidget", "", arguments.callee);
  });

  renderServiceGalleryPreview();

  // تهيئة Quill وتفريغه
  initServiceQuillEditor();
  serviceQuill.root.innerHTML = "";

  // عداد حروف الميتا ديسكريبشن
  setupMetaDescCounter();
}

// عرض/تحديث صور المعرض المؤقتة أثناء التحرير
function renderServiceGalleryPreview() {
  const container = document.getElementById("serviceGalleryPreviewList");
  container.innerHTML = currentServiceGallery
    .map(
      (url, index) => `
    <div class="gallery-manage-item">
      <img src="${optimizedImageUrl(url, 150)}" alt="صورة">
      <button type="button" class="remove-img-btn" onclick="removeServiceGalleryImage(${index})">
        <i class="fas fa-times"></i>
      </button>
    </div>`
    )
    .join("");
}

function removeServiceGalleryImage(index) {
  currentServiceGallery.splice(index, 1);
  renderServiceGalleryPreview();
}

function addServiceGalleryImage() {
  // إعادة تعيين widget المعرض لرفع صورة جديدة (الزر موجود أصلاً، فقط تنبيه بصري)
  document.getElementById("serviceGalleryUploadWidget").scrollIntoView({ behavior: "smooth", block: "center" });
}

// عداد حروف الميتا ديسكريبشن
function setupMetaDescCounter() {
  const input = document.getElementById("serviceMetaDescInput");
  const counter = document.getElementById("metaDescCounter");

  function update() {
    const len = input.value.length;
    counter.textContent = `${len} حرف`;
    counter.style.color = len > 160 ? "#dc2626" : len < 50 && len > 0 ? "#d97706" : "#16a34a";
  }

  input.removeEventListener("input", update);
  input.addEventListener("input", update);
  update();
}

// فتح نموذج تعديل خدمة موجودة
async function editService(id) {
  const service = await getServiceById(id);
  if (!service) return showToast("لم يتم العثور على الخدمة", "error");

  document.getElementById("serviceFormTitle").textContent = "تعديل الخدمة";
  document.getElementById("serviceId").value = service.id;
  document.getElementById("serviceTitleInput").value = service.title || "";
  document.getElementById("serviceIconInput").value = service.icon || "fas fa-bolt";
  document.getElementById("serviceSlugInput").value = service.slug || "";
  document.getElementById("serviceShortDescInput").value = service.shortDesc || "";
  document.getElementById("serviceFeaturesInput").value = (service.features || []).join("\n");
  document.getElementById("serviceMetaTitleInput").value = service.metaTitle || "";
  document.getElementById("serviceMetaDescInput").value = service.metaDescription || "";
  currentServiceGallery = service.gallery ? [...service.gallery] : [];

  document.getElementById("serviceFormModal").style.display = "flex";

  createImageUploadWidget("serviceImageUploadWidget", service.image || "", () => {});

  createImageUploadWidget("serviceGalleryUploadWidget", "", function handler(url) {
    currentServiceGallery.push(url);
    renderServiceGalleryPreview();
    createImageUploadWidget("serviceGalleryUploadWidget", "", handler);
  });

  renderServiceGalleryPreview();

  initServiceQuillEditor();
  serviceQuill.root.innerHTML = service.fullDescription || "";

  setupMetaDescCounter();
}

function closeServiceForm() {
  document.getElementById("serviceFormModal").style.display = "none";
}

// حفظ الخدمة (إضافة أو تعديل)
async function saveServiceForm() {
  const id = document.getElementById("serviceId").value;
  const title = document.getElementById("serviceTitleInput").value.trim();

  if (!title) {
    showToast("يرجى إدخال اسم الخدمة", "error");
    return;
  }

  const featuresRaw = document.getElementById("serviceFeaturesInput").value.trim();
  const features = featuresRaw ? featuresRaw.split("\n").map((f) => f.trim()).filter(Boolean) : [];

  const data = {
    title: title,
    icon: document.getElementById("serviceIconInput").value.trim() || "fas fa-bolt",
    slug: document.getElementById("serviceSlugInput").value.trim() || generateSlug(title),
    shortDesc: document.getElementById("serviceShortDescInput").value.trim(),
    image: getImageWidgetValue("serviceImageUploadWidget"),
    gallery: currentServiceGallery,
    fullDescription: serviceQuill ? serviceQuill.root.innerHTML : "",
    features: features,
    metaTitle: document.getElementById("serviceMetaTitleInput").value.trim(),
    metaDescription: document.getElementById("serviceMetaDescInput").value.trim(),
  };

  try {
    if (id) {
      await updateService(id, data);
      showToast("تم تحديث الخدمة بنجاح", "success");
    } else {
      await addService(data);
      showToast("تم إضافة الخدمة بنجاح", "success");
    }
    closeServiceForm();
    loadServicesTable();
  } catch (e) {
    showToast("حدث خطأ: " + e.message, "error");
  }
}

async function removeService(id) {
  if (!confirm("هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.")) return;
  try {
    await deleteService(id);
    showToast("تم حذف الخدمة", "success");
    loadServicesTable();
  } catch (e) {
    showToast("حدث خطأ أثناء الحذف", "error");
  }
}

// ============== DASHBOARD ==============
async function loadDashboard(){
  try{
    const articles = await getArticles();
    const services = await getServices();
    const messages = await getMessages();
    document.getElementById('statTotal').textContent = articles.length;
    document.getElementById('statPublished').textContent = articles.filter(a=>a.status==='published').length;
    document.getElementById('statServices').textContent = services.length;
    document.getElementById('statMessages').textContent = messages.filter(m=>!m.read).length;

    const recent = articles.slice(0,5);
    document.getElementById('recentArticlesTable').innerHTML = recent.map(a=>`
      <tr><td>${a.title}</td><td>${a.category}</td><td>${a.date}</td>
      <td><span class="badge badge-${a.status==='published'?'published':'draft'}">${a.status==='published'?'منشور':'مسودة'}</span></td></tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;">لا توجد مقالات</td></tr>';
  }catch(err){ console.error(err); }
}

async function checkUnreadMessages(){
  try{
    const messages = await getMessages();
    const unread = messages.filter(m=>!m.read).length;
    const badge = document.getElementById('msgBadge');
    if(unread > 0){ badge.textContent = unread; badge.style.display='inline-block'; }
  }catch(err){ console.error(err); }
}

// ============== ARTICLES ==============
async function loadArticlesTable(){
  const tableBody = document.getElementById('articlesTable');
  tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i></td></tr>';
  try{
    const articles = await getArticles();
    tableBody.innerHTML = articles.map(a=>`
      <tr>
        <td>${a.title}</td><td>${a.category}</td><td>${a.author}</td><td>${a.date}</td>
        <td><span class="badge badge-${a.status==='published'?'published':'draft'}">${a.status==='published'?'منشور':'مسودة'}</span></td>
        <td class="table-actions">
          <button class="icon-btn edit" onclick="editArticle('${a.id}')"><i class="fas fa-edit"></i></button>
          <button class="icon-btn delete" onclick="confirmDelete('${a.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;padding:40px;">لا توجد مقالات</td></tr>';
  }catch(err){ tableBody.innerHTML = `<tr><td colspan="6" style="color:red;text-align:center;">${err.message}</td></tr>`; }
}

function resetEditorForm(){
  document.getElementById('editorTitle').textContent='مقال جديد';
  document.getElementById('articleId').value='';
  document.getElementById('artTitle').value='';
  document.getElementById('artImage').value='';
  document.getElementById('artCategory').value='تأسيس';
  document.getElementById('artStatus').value='published';
  document.getElementById('artExcerpt').value='';
  if(quill) quill.setContents([]);
}

async function editArticle(id){
  const article = await getArticleById(id);
  if(!article) return;
  switchTab('new-article');
  document.getElementById('editorTitle').textContent='تعديل المقال';
  document.getElementById('articleId').value=article.id;
  document.getElementById('artTitle').value=article.title;
  document.getElementById('artImage').value=article.image;
  document.getElementById('artCategory').value=article.category;
  document.getElementById('artStatus').value=article.status;
  document.getElementById('artExcerpt').value=article.excerpt;
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
  if(!excerpt){ alert('الرجاء إدخال وصف مختصر'); return; }
  const data = { title, image, category, status, excerpt, content, author:'فريق الممتاز', date:new Date().toISOString().split('T')[0] };
  const btn = event.target;
  btn.disabled = true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
  try{
    if(id){ await updateArticle(id, data); alert('تم التحديث بنجاح ✅'); }
    else{ await addArticle(data); alert('تم النشر بنجاح ✅'); }
    switchTab('articles');
  }catch(err){ alert('خطأ: '+err.message); }
  finally{ btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i> حفظ المقال'; }
}

async function confirmDelete(id){
  if(confirm('هل أنت متأكد من حذف هذا المقال؟')){
    await deleteArticle(id); loadArticlesTable(); loadDashboard();
  }
}

// ============== SITE SETTINGS ==============
async function loadSettingsForm(){
  const s = await getSettings();
  Object.keys(s).forEach(key=>{
    const el = document.getElementById('set_'+key);
    if(el) el.value = s[key];
  });
}

async function saveSettingsForm(){
  const fields = ['phone','whatsapp','email','address','workHours','facebook','twitter','instagram',
    'heroBadge','heroTitlePart1','heroHighlight','heroTitlePart2','heroDescription',
    'stat1Number','stat1Label','stat2Number','stat2Label','stat3Number','stat3Label','stat4Number','stat4Label',
    'aboutText1','aboutText2','mapEmbedUrl'];
  const data = {};
  fields.forEach(f=>{
    const el = document.getElementById('set_'+f);
    if(el) data[f] = el.value;
  });
  const btn = event.target;
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
  try{
    await saveSettings(data);
    alert('تم حفظ الإعدادات بنجاح ✅ (ستظهر التحديثات فوراً على الموقع)');
  }catch(err){ alert('خطأ: '+err.message); }
  finally{ btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i> حفظ جميع الإعدادات'; }
}

// ============== SERVICES ==============
async function loadServicesTable(){
  const tableBody = document.getElementById('servicesTable');
  tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i></td></tr>';
  const services = await getServices();
  tableBody.innerHTML = services.map(s=>`
    <tr>
      <td><i class="${s.icon}" style="font-size:20px;color:var(--accent-dark);"></i></td>
      <td>${s.title}</td>
      <td style="max-width:300px;">${s.description}</td>
      <td class="table-actions">
        <button class="icon-btn edit" onclick="editService('${s.id}')"><i class="fas fa-edit"></i></button>
        <button class="icon-btn delete" onclick="removeService('${s.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="text-align:center;padding:30px;">لا توجد خدمات بعد</td></tr>';
}

function resetServiceForm(){
  document.getElementById('serviceFormTitle').textContent = 'إضافة خدمة جديدة';
  document.getElementById('serviceId').value='';
  document.getElementById('srv_icon').value='';
  document.getElementById('srv_title').value='';
  document.getElementById('srv_desc').value='';
}

async function editService(id){
  const s = await getServiceById(id);
  if(!s) return;
  document.getElementById('serviceFormTitle').textContent='تعديل الخدمة';
  document.getElementById('serviceId').value=s.id;
  document.getElementById('srv_icon').value=s.icon;
  document.getElementById('srv_title').value=s.title;
  document.getElementById('srv_desc').value=s.description;
  window.scrollTo({top:0, behavior:'smooth'});
}

async function saveServiceForm(){
  const id = document.getElementById('serviceId').value;
  const icon = document.getElementById('srv_icon').value.trim() || 'fas fa-bolt';
  const title = document.getElementById('srv_title').value.trim();
  const description = document.getElementById('srv_desc').value.trim();
  if(!title || !description){ alert('الرجاء تعبئة جميع الحقول'); return; }
  try{
    if(id){ await updateService(id, {icon,title,description}); alert('تم تحديث الخدمة ✅'); }
    else{ await addService({icon,title,description}); alert('تمت إضافة الخدمة ✅'); }
    resetServiceForm();
    loadServicesTable();
  }catch(err){ alert('خطأ: '+err.message); }
}

async function removeService(id){
  if(confirm('حذف هذه الخدمة؟')){ await deleteService(id); loadServicesTable(); }
}

// ============== TESTIMONIALS ==============
async function loadTestimonialsTable(){
  const tableBody = document.getElementById('testimonialsTable');
  const items = await getTestimonials();
  tableBody.innerHTML = items.map(t=>`
    <tr>
      <td>${t.name}</td>
      <td>${'⭐'.repeat(t.rating)}</td>
      <td style="max-width:300px;">${t.text}</td>
      <td class="table-actions">
        <button class="icon-btn delete" onclick="removeTestimonial('${t.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="text-align:center;padding:30px;">لا توجد آراء بعد</td></tr>';
}

async function saveTestimonialForm(){
  const name = document.getElementById('tst_name').value.trim();
  const role = document.getElementById('tst_role').value.trim();
  const image = document.getElementById('tst_image').value.trim();
  const rating = parseInt(document.getElementById('tst_rating').value);
  const text = document.getElementById('tst_text').value.trim();
  if(!name || !text){ alert('الرجاء تعبئة الاسم والنص'); return; }
  try{
    await addTestimonial({name, role, image, rating, text});
    alert('تمت إضافة الرأي ✅');
    document.getElementById('tst_name').value='';
    document.getElementById('tst_role').value='';
    document.getElementById('tst_image').value='';
    document.getElementById('tst_text').value='';
    loadTestimonialsTable();
  }catch(err){ alert('خطأ: '+err.message); }
}

async function removeTestimonial(id){
  if(confirm('حذف هذا الرأي؟')){ await deleteTestimonial(id); loadTestimonialsTable(); }
}

// ============== GALLERY ==============
async function loadGalleryManage(){
  const container = document.getElementById('galleryManageGrid');
  const items = await getGallery();
  container.innerHTML = items.map(g=>`
    <div class="service-card" style="text-align:right;">
      <img src="${g.image}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:12px;">
      <h3 style="font-size:16px;">${g.title}</h3>
      <button class="btn btn-dark" style="width:100%;margin-top:10px;" onclick="removeGalleryItem('${g.id}')"><i class="fas fa-trash"></i> حذف</button>
    </div>
  `).join('') || '<p style="grid-column:1/-1;text-align:center;color:var(--gray);">لا توجد صور بعد</p>';
}

async function saveGalleryForm(){
  const image = document.getElementById('gal_image').value.trim();
  const title = document.getElementById('gal_title').value.trim();
  if(!image || !title){ alert('الرجاء تعبئة رابط الصورة والعنوان'); return; }
  try{
    await addGalleryItem({image, title});
    alert('تمت الإضافة للمعرض ✅');
    document.getElementById('gal_image').value='';
    document.getElementById('gal_title').value='';
    document.getElementById('galPreview').style.display='none';
    loadGalleryManage();
  }catch(err){ alert('خطأ: '+err.message); }
}

async function removeGalleryItem(id){
  if(confirm('حذف هذه الصورة؟')){ await deleteGalleryItem(id); loadGalleryManage(); }
}

// ============== MESSAGES ==============
async function loadMessagesTab(){
  const container = document.getElementById('messagesContainer');
  container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</p>';
  const messages = await getMessages();
  if(messages.length === 0){
    container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;">لا توجد رسائل بعد</p>';
    return;
  }
  container.innerHTML = messages.map(m=>`
    <div class="msg-card ${m.read ? '' : 'unread'}">
      <h4>${m.name} ${m.read ? '' : '<span class="badge badge-draft">جديد</span>'}</h4>
      <div class="msg-meta">
        <span><i class="fas fa-phone"></i> ${m.phone}</span>
        <span><i class="fas fa-tag"></i> ${m.service||'-'}</span>
        <span><i class="fas fa-calendar"></i> ${m.date ? new Date(m.date).toLocaleDateString('ar-SA') : ''}</span>
      </div>
      <p>${m.message || 'لا توجد تفاصيل إضافية'}</p>
      <div style="display:flex;gap:10px;">
        <a href="https://wa.me/${m.phone.replace(/[^0-9]/g,'')}" target="_blank" class="btn btn-primary" style="padding:8px 18px;font-size:13px;"><i class="fab fa-whatsapp"></i> رد عبر واتساب</a>
        ${!m.read ? `<button class="btn btn-dark" style="padding:8px 18px;font-size:13px;" onclick="markRead('${m.id}')">تمييز كمقروء</button>` : ''}
        <button class="icon-btn delete" onclick="removeMessage('${m.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

async function markRead(id){ await markMessageRead(id); loadMessagesTab(); checkUnreadMessages(); }
async function removeMessage(id){ if(confirm('حذف هذه الرسالة؟')){ await deleteMessage(id); loadMessagesTab(); checkUnreadMessages(); } }

// ============== BACKUP ==============
async function exportData(){
  const articles = await getArticles();
  const blob = new Blob([JSON.stringify(articles,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`alemtiaz-articles-${Date.now()}.json`; a.click();
}

function importData(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async function(e){
    try{
      const imported = JSON.parse(e.target.result);
      for(const art of imported){
        const { id, createdAt, ...data } = art;
        await addArticle(data);
      }
      alert('تم الاستيراد بنجاح ✅');
      loadArticlesTable(); loadDashboard();
    }catch(err){ alert('ملف غير صالح'); }
  };
  reader.readAsText(file);
}

function logout(){ auth.signOut().then(()=> window.location.href='login.html'); }

