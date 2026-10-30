// ============================================================
// admin.js — لوحة تحكم الممتاز
// ============================================================

let quill = null;            // محرر المقالات
let serviceQuill = null;     // محرر وصف الخدمة
let currentServiceGallery = [];

// ============================
// أدوات عامة
// ============================
function showToast(message, type) {
  let box = document.getElementById('adminToast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'adminToast';
    box.className = 'admin-toast';
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.className = 'admin-toast show ' + (type || 'info');
  clearTimeout(box._timer);
  box._timer = setTimeout(function () { box.className = 'admin-toast'; }, 4000);
}

// تنسيق تاريخ عربي مختصر (نسخة مستقلة عن main.js لأن اللوحة لا تحمّله)
function adminFormatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function $(id) { return document.getElementById(id); }
function setValue(id, value) { const el = $(id); if (el) el.value = value == null ? '' : value; }
function getValue(id) { const el = $(id); return el ? el.value : ''; }
function getTrimmed(id) { return String(getValue(id)).trim(); }

/**
 * إنشاء محرر نصي: يستخدم Quill إن كان محمّلاً، وإلا يعود إلى textarea عادية
 * (حتى لا تتعطل اللوحة عند فشل تحميل مكتبة المحرر من الإنترنت)
 */
function createEditor(containerId, placeholder) {
  const container = $(containerId);
  if (!container) return null;

  if (typeof Quill !== 'undefined') {
    const instance = new Quill(container, {
      theme: 'snow',
      placeholder: placeholder || '',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
      },
    });
    return {
      mode: 'quill',
      instance: instance,
      getHTML: function () { return instance.root.innerHTML; },
      setHTML: function (html) { instance.root.innerHTML = html || ''; },
      clear: function () { instance.setContents([]); },
    };
  }

  // بديل بسيط بدون Quill
  const textarea = document.createElement('textarea');
  textarea.rows = 10;
  textarea.placeholder = (placeholder || '') + ' (يمكنك كتابة وسوم HTML)';
  textarea.className = 'editor-textarea-fallback';
  container.innerHTML = '';
  container.appendChild(textarea);

  return {
    mode: 'textarea',
    instance: textarea,
    getHTML: function () { return textarea.value; },
    setHTML: function (html) { textarea.value = html || ''; },
    clear: function () { textarea.value = ''; },
  };
}

// ============================
// الحماية وتسجيل الدخول
// ============================
auth.onAuthStateChanged(function (user) {
  if (!user) {
    window.location.replace('login.html');
    return;
  }
  initAdminPanel();
});

// ============================
// تهيئة اللوحة
// ============================
function initAdminPanel() {
  const articleEditor = createEditor('editor-container', 'اكتب محتوى المقال هنا...');
  if (articleEditor) window.articleEditor = articleEditor;

  document.querySelectorAll('.admin-nav .nav-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      switchTab(this.dataset.tab);
    });
  });

  const galImage = $('gal_image');
  if (galImage) {
    galImage.addEventListener('input', function () {
      const preview = $('galPreview');
      if (!preview) return;
      if (this.value) {
        preview.src = this.value;
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    });
  }

  // widget رفع صورة المعرض
  if (typeof createImageUploadWidget === 'function' && $('galleryImageUploadWidget')) {
    createImageUploadWidget('galleryImageUploadWidget', '', function (url) {
      setValue('gal_image', url);
      const preview = $('galPreview');
      if (preview) { preview.src = url; preview.style.display = 'block'; }
    });
  }

  document.querySelectorAll('#appointmentFilters .filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('#appointmentFilters .filter-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      appointmentFilter = this.dataset.filter;
      loadAppointments();
    });
  });

  loadDashboard();
  loadArticlesTable();
  loadSettingsForm();
  loadServicesTable();
  loadTestimonialsTable();
  loadGalleryManage();
  checkUnreadMessages();
  loadAppointments();
  checkPendingAppointments();
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(function (t) { t.style.display = 'none'; });
  document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });

  const tab = $('tab-' + tabName);
  if (tab) tab.style.display = 'block';

  const navItem = document.querySelector('[data-tab="' + tabName + '"]');
  if (navItem) navItem.classList.add('active');

  if (tabName === 'new-article' && !getValue('articleId')) resetEditorForm();
  if (tabName === 'dashboard') loadDashboard();
  if (tabName === 'articles') loadArticlesTable();
  if (tabName === 'services') loadServicesTable();
  if (tabName === 'testimonials') loadTestimonialsTable();
  if (tabName === 'gallery') loadGalleryManage();
  if (tabName === 'messages') loadMessagesTab();
  if (tabName === 'appointments') loadAppointments();
  if (tabName === 'site-settings') loadSettingsForm();
}

// ============================
// لوحة البيانات
// ============================
async function loadDashboard() {
  try {
    const articles = await getArticles();
    const services = await getServices();
    const messages = await getMessages();

    if ($('statTotal')) $('statTotal').textContent = articles.length;
    if ($('statPublished')) $('statPublished').textContent = articles.filter(function (a) { return a.status === 'published'; }).length;
    if ($('statServices')) $('statServices').textContent = services.length;
    if ($('statMessages')) $('statMessages').textContent = messages.filter(function (m) { return !m.read; }).length;

    try {
      const appointments = await getAppointments();
      if ($('statAppointments')) {
        $('statAppointments').textContent = appointments.filter(function (a) { return a.status === 'pending'; }).length;
      }
    } catch (err) {
      console.warn('تعذر جلب المواعيد:', err);
    }

    renderSetupBanner(articles.length === 0 && services.length === 0);

    const recent = articles.slice(0, 5);
    const table = $('recentArticlesTable');
    if (table) {
      table.innerHTML = recent.map(function (a) {
        return '<tr><td>' + esc(a.title) + '</td><td>' + esc(a.category) + '</td><td>' + esc(adminFormatDate(a.date)) + '</td>' +
          '<td><span class="badge badge-' + (a.status === 'published' ? 'published' : 'draft') + '">' +
          (a.status === 'published' ? 'منشور' : 'مسودة') + '</span></td></tr>';
      }).join('') || '<tr><td colspan="4" style="text-align:center;">لا توجد مقالات</td></tr>';
    }
  } catch (err) {
    console.error(err);
    showToast(firebaseErrorMessage(err), 'error');
  }
}

async function checkUnreadMessages() {
  try {
    const messages = await getMessages();
    const unread = messages.filter(function (m) { return !m.read; }).length;
    const badge = $('msgBadge');
    if (badge && unread > 0) {
      badge.textContent = unread;
      badge.style.display = 'inline-block';
    }
  } catch (err) {
    console.warn('تعذر جلب الرسائل:', err);
  }
}

// ============================
// تهيئة المحتوى الافتراضي
// ============================
function renderSetupBanner(isEmpty) {
  const box = $('setupBanner');
  if (!box) return;

  if (!isEmpty) {
    box.innerHTML = '';
    return;
  }

  box.innerHTML =
    '<div class="setup-banner">' +
      '<div class="setup-banner-text">' +
        '<h3><i class="fas fa-circle-exclamation"></i> قاعدة البيانات فارغة</h3>' +
        '<p>لم تُضف أي خدمات أو مقالات بعد. اضغط الزر ليتم تعبئة الموقع بمحتوى جاهز (إعدادات + 6 خدمات + 3 مقالات + آراء + معرض) يمكنك تعديله لاحقاً.</p>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="runSeed(this)"><i class="fas fa-wand-magic-sparkles"></i> تهيئة المحتوى</button>' +
    '</div>';
}

async function runSeed(btn) {
  if (!confirm('سيتم إضافة محتوى افتراضي إلى المجموعات الفارغة فقط. هل تريد المتابعة؟')) return;

  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التهيئة...'; }

  try {
    const result = await seedInitialContent();
    const a = result.added;
    const total = a.settings + a.services + a.articles + a.testimonials + a.gallery;

    if (total === 0 && result.errors.length === 0) {
      showToast('كل المجموعات تحتوي بيانات بالفعل — لا شيء ليُضاف', 'success');
    } else {
      showToast('تمت التهيئة: ' + a.services + ' خدمة، ' + a.articles + ' مقال، ' +
        (a.testimonials + a.gallery + a.settings) + ' عنصر إضافي', 'success');
    }

    if (result.errors.length) {
      console.warn('أخطاء التهيئة:', result.errors);
      showToast('بعض العناصر لم تُضف: ' + result.errors[0], 'error');
    }
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = original || '<i class="fas fa-wand-magic-sparkles"></i> تهيئة المحتوى'; }
    loadDashboard();
    loadServicesTable();
    loadArticlesTable();
    loadTestimonialsTable();
    loadGalleryManage();
  }
}

// ============================
// إدارة المقالات
// ============================
async function loadArticlesTable() {
  const tableBody = $('articlesTable');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin"></i></td></tr>';
  try {
    const articles = await getArticles();
    tableBody.innerHTML = articles.map(function (a) {
      return '<tr>' +
        '<td>' + esc(a.title) + '</td>' +
        '<td>' + esc(a.category) + '</td>' +
        '<td>' + esc(a.author) + '</td>' +
        '<td>' + esc(a.date) + '</td>' +
        '<td><span class="badge badge-' + (a.status === 'published' ? 'published' : 'draft') + '">' +
          (a.status === 'published' ? 'منشور' : 'مسودة') + '</span></td>' +
        '<td class="table-actions">' +
          '<button class="icon-btn edit" onclick="editArticle(\'' + esc(a.id) + '\')" title="تعديل"><i class="fas fa-edit"></i></button>' +
          '<button class="icon-btn delete" onclick="confirmDelete(\'' + esc(a.id) + '\')" title="حذف"><i class="fas fa-trash"></i></button>' +
        '</td></tr>';
    }).join('') || '<tr><td colspan="6" style="text-align:center;padding:40px;">لا توجد مقالات</td></tr>';
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="6" style="color:#dc2626;text-align:center;">' + esc(firebaseErrorMessage(err)) + '</td></tr>';
  }
}

function resetEditorForm() {
  if ($('editorTitle')) $('editorTitle').textContent = 'مقال جديد';
  setValue('articleId', '');
  setValue('artTitle', '');
  setValue('artImage', '');
  setValue('artCategory', 'تأسيس');
  setValue('artStatus', 'published');
  setValue('artExcerpt', '');
  if (window.articleEditor) window.articleEditor.clear();
}

async function editArticle(id) {
  const article = await getArticleById(id);
  if (!article) return showToast('لم يتم العثور على المقال', 'error');

  switchTab('new-article');
  if ($('editorTitle')) $('editorTitle').textContent = 'تعديل المقال';
  setValue('articleId', article.id);
  setValue('artTitle', article.title);
  setValue('artImage', article.image);
  setValue('artCategory', article.category);
  setValue('artStatus', article.status);
  setValue('artExcerpt', article.excerpt);
  if (window.articleEditor) window.articleEditor.setHTML(article.content || '');
}

async function saveArticleForm(btn) {
  const id = getValue('articleId');
  const title = getTrimmed('artTitle');
  const image = getTrimmed('artImage') || 'assets/photo-1.jpg';
  const category = getValue('artCategory');
  const status = getValue('artStatus');
  const excerpt = getTrimmed('artExcerpt');
  const content = window.articleEditor ? window.articleEditor.getHTML() : '';

  if (!title) return showToast('الرجاء إدخال عنوان المقال', 'error');
  if (!excerpt) return showToast('الرجاء إدخال وصف مختصر', 'error');

  const data = {
    title: title,
    image: image,
    category: category,
    status: status,
    excerpt: excerpt,
    content: content,
    author: 'فريق الممتاز',
    date: new Date().toISOString().split('T')[0],
  };

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...'; }
  try {
    if (id) {
      await updateArticle(id, data);
      showToast('تم تحديث المقال بنجاح', 'success');
    } else {
      await addArticle(data);
      showToast('تم نشر المقال بنجاح', 'success');
    }
    switchTab('articles');
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> حفظ المقال'; }
  }
}

async function confirmDelete(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
  try {
    await deleteArticle(id);
    showToast('تم حذف المقال', 'success');
    loadArticlesTable();
    loadDashboard();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

// ============================
// إعدادات الموقع
// ============================
const SETTINGS_FIELDS = [
  'phone', 'whatsapp', 'email', 'address', 'workHours', 'facebook', 'twitter', 'instagram',
  'heroBadge', 'heroTitlePart1', 'heroHighlight', 'heroTitlePart2', 'heroDescription',
  'stat1Number', 'stat1Label', 'stat2Number', 'stat2Label', 'stat3Number', 'stat3Label', 'stat4Number', 'stat4Label',
  'aboutText1', 'aboutText2', 'mapEmbedUrl',
];

async function loadSettingsForm() {
  try {
    const s = await getSettings();
    SETTINGS_FIELDS.forEach(function (key) {
      if (s[key] !== undefined) setValue('set_' + key, s[key]);
    });
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

async function saveSettingsForm(btn) {
  const data = {};
  SETTINGS_FIELDS.forEach(function (f) {
    const el = $('set_' + f);
    if (el) data[f] = el.value;
  });

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...'; }
  try {
    await saveSettings(data);
    showToast('تم حفظ الإعدادات، وستظهر على الموقع فوراً', 'success');
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> حفظ جميع الإعدادات'; }
  }
}

// ============================
// إدارة الخدمات
// ============================
function initServiceQuillEditor() {
  if (serviceQuill) return;
  serviceQuill = createEditor('serviceQuillEditor', 'اكتب وصفاً تفصيلياً للخدمة...');
}

async function loadServicesTable() {
  const tbody = $('servicesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">جاري التحميل...</td></tr>';

  const services = await getServices();

  if (!services.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">لا توجد خدمات مضافة بعد. اضغط "إضافة خدمة جديدة".</td></tr>';
    return;
  }

  tbody.innerHTML = services.map(function (s) {
    const thumb = s.image ? optimizedImageUrl(s.image, 100) : 'assets/logo.svg';
    const shortDesc = String(s.shortDesc || s.description || '');
    return '<tr>' +
      '<td><img src="' + esc(thumb) + '" alt="' + esc(s.title) + '" onerror="this.src=\'assets/placeholder.svg\'"></td>' +
      '<td><strong>' + esc(s.title) + '</strong></td>' +
      '<td>' + esc(shortDesc.substring(0, 50)) + (shortDesc.length > 50 ? '...' : '') + '</td>' +
      '<td><a href="service.html?slug=' + encodeURIComponent(s.slug || s.id) + '" target="_blank" rel="noopener" style="color:#2563eb" dir="ltr">' + esc(s.slug || s.id) + '</a></td>' +
      '<td><div class="action-icons-group">' +
        '<button class="icon-btn edit" onclick="editService(\'' + esc(s.id) + '\')" title="تعديل"><i class="fas fa-edit"></i></button>' +
        '<button class="icon-btn danger" onclick="removeService(\'' + esc(s.id) + '\')" title="حذف"><i class="fas fa-trash"></i></button>' +
      '</div></td></tr>';
  }).join('');
}

function openServiceForm() {
  if ($('serviceFormTitle')) $('serviceFormTitle').textContent = 'إضافة خدمة جديدة';
  setValue('serviceId', '');
  setValue('serviceTitleInput', '');
  setValue('serviceIconInput', 'fas fa-bolt');
  setValue('serviceSlugInput', '');
  setValue('serviceShortDescInput', '');
  setValue('serviceFeaturesInput', '');
  setValue('serviceMetaTitleInput', '');
  setValue('serviceMetaDescInput', '');
  currentServiceGallery = [];

  if ($('serviceFormModal')) $('serviceFormModal').style.display = 'flex';

  if (typeof createImageUploadWidget === 'function') {
    createImageUploadWidget('serviceImageUploadWidget', '', function () {});
    createImageUploadWidget('serviceGalleryUploadWidget', '', addGalleryImageHandler);
  }

  renderServiceGalleryPreview();
  initServiceQuillEditor();
  if (serviceQuill) serviceQuill.clear();
  setupMetaDescCounter();
}

// إضافة صورة إلى معرض الخدمة المؤقت (يُعاد ربط الـ widget بعد النجاح)
function addGalleryImageHandler(url) {
  currentServiceGallery.push(url);
  renderServiceGalleryPreview();
  if (typeof createImageUploadWidget === 'function') {
    createImageUploadWidget('serviceGalleryUploadWidget', '', addGalleryImageHandler);
  }
}

function renderServiceGalleryPreview() {
  const container = $('serviceGalleryPreviewList');
  if (!container) return;
  container.innerHTML = currentServiceGallery.map(function (url, index) {
    return '<div class="gallery-manage-item">' +
      '<img src="' + esc(optimizedImageUrl(url, 150)) + '" alt="صورة الخدمة">' +
      '<button type="button" class="remove-img-btn" onclick="removeServiceGalleryImage(' + index + ')"><i class="fas fa-times"></i></button>' +
      '</div>';
  }).join('');
}

function removeServiceGalleryImage(index) {
  currentServiceGallery.splice(index, 1);
  renderServiceGalleryPreview();
}

function addServiceGalleryImage() {
  const widget = $('serviceGalleryUploadWidget');
  if (widget && typeof widget.scrollIntoView === 'function') widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setupMetaDescCounter() {
  const input = $('serviceMetaDescInput');
  const counter = $('metaDescCounter');
  if (!input || !counter) return;

  function update() {
    const len = input.value.length;
    counter.textContent = len + ' حرف';
    counter.style.color = len > 160 ? '#dc2626' : (len < 50 && len > 0 ? '#d97706' : '#16a34a');
  }
  input.removeEventListener('input', update);
  input.addEventListener('input', update);
  update();
}

async function editService(id) {
  const service = await getServiceById(id);
  if (!service) return showToast('لم يتم العثور على الخدمة', 'error');

  if ($('serviceFormTitle')) $('serviceFormTitle').textContent = 'تعديل الخدمة';
  setValue('serviceId', service.id);
  setValue('serviceTitleInput', service.title);
  setValue('serviceIconInput', service.icon || 'fas fa-bolt');
  setValue('serviceSlugInput', service.slug || '');
  setValue('serviceShortDescInput', service.shortDesc || '');
  setValue('serviceFeaturesInput', (service.features || []).join('\n'));
  setValue('serviceMetaTitleInput', service.metaTitle || '');
  setValue('serviceMetaDescInput', service.metaDescription || '');
  currentServiceGallery = service.gallery ? service.gallery.slice() : [];

  if ($('serviceFormModal')) $('serviceFormModal').style.display = 'flex';

  if (typeof createImageUploadWidget === 'function') {
    createImageUploadWidget('serviceImageUploadWidget', service.image || '', function () {});
    createImageUploadWidget('serviceGalleryUploadWidget', '', addGalleryImageHandler);
  }

  renderServiceGalleryPreview();
  initServiceQuillEditor();
  if (serviceQuill) serviceQuill.setHTML(service.fullDescription || '');
  setupMetaDescCounter();
}

function closeServiceForm() {
  if ($('serviceFormModal')) $('serviceFormModal').style.display = 'none';
}

async function saveServiceForm(btn) {
  const id = getValue('serviceId');
  const title = getTrimmed('serviceTitleInput');
  if (!title) return showToast('يرجى إدخال اسم الخدمة', 'error');

  const featuresRaw = getTrimmed('serviceFeaturesInput');
  const features = featuresRaw ? featuresRaw.split('\n').map(function (f) { return f.trim(); }).filter(Boolean) : [];

  const data = {
    title: title,
    icon: getTrimmed('serviceIconInput') || 'fas fa-bolt',
    slug: getTrimmed('serviceSlugInput') || generateSlug(title),
    shortDesc: getTrimmed('serviceShortDescInput'),
    image: (typeof getImageWidgetValue === 'function' ? getImageWidgetValue('serviceImageUploadWidget') : '') || '',
    gallery: currentServiceGallery,
    fullDescription: serviceQuill ? serviceQuill.getHTML() : '',
    features: features,
    metaTitle: getTrimmed('serviceMetaTitleInput'),
    metaDescription: getTrimmed('serviceMetaDescInput'),
  };

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...'; }
  try {
    if (id) {
      await updateService(id, data);
      showToast('تم تحديث الخدمة بنجاح', 'success');
    } else {
      await addService(data);
      showToast('تمت إضافة الخدمة بنجاح', 'success');
    }
    closeServiceForm();
    loadServicesTable();
    loadDashboard();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> حفظ الخدمة'; }
  }
}

async function removeService(id) {
  if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
  try {
    await deleteService(id);
    showToast('تم حذف الخدمة', 'success');
    loadServicesTable();
    loadDashboard();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

// ============================
// آراء العملاء
// ============================
async function loadTestimonialsTable() {
  const tableBody = $('testimonialsTable');
  if (!tableBody) return;
  try {
    const items = await getTestimonials();
    tableBody.innerHTML = items.map(function (t) {
      const rating = Math.max(0, Math.min(5, parseInt(t.rating, 10) || 0));
      return '<tr>' +
        '<td>' + esc(t.name) + '</td>' +
        '<td>' + '★'.repeat(rating) + '</td>' +
        '<td style="max-width:300px;">' + esc(t.text) + '</td>' +
        '<td class="table-actions"><button class="icon-btn delete" onclick="removeTestimonial(\'' + esc(t.id) + '\')" title="حذف"><i class="fas fa-trash"></i></button></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="4" style="text-align:center;padding:30px;">لا توجد آراء بعد</td></tr>';
  } catch (err) {
    tableBody.innerHTML = '<tr><td colspan="4" style="color:#dc2626;text-align:center;">' + esc(firebaseErrorMessage(err)) + '</td></tr>';
  }
}

async function saveTestimonialForm() {
  const name = getTrimmed('tst_name');
  const role = getTrimmed('tst_role');
  const image = getTrimmed('tst_image');
  const rating = parseInt(getValue('tst_rating'), 10);
  const text = getTrimmed('tst_text');
  if (!name || !text) return showToast('الرجاء تعبئة الاسم والنص', 'error');

  try {
    await addTestimonial({ name: name, role: role, image: image, rating: rating, text: text });
    showToast('تمت إضافة الرأي', 'success');
    ['tst_name', 'tst_role', 'tst_image', 'tst_text'].forEach(function (id) { setValue(id, ''); });
    loadTestimonialsTable();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

async function removeTestimonial(id) {
  if (!confirm('حذف هذا الرأي؟')) return;
  try {
    await deleteTestimonial(id);
    showToast('تم الحذف', 'success');
    loadTestimonialsTable();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

// ============================
// معرض الأعمال
// ============================
async function loadGalleryManage() {
  const container = $('galleryManageGrid');
  if (!container) return;
  try {
    const items = await getGallery();
    container.innerHTML = items.map(function (g) {
      return '<div class="service-card" style="text-align:right;">' +
        '<img src="' + esc(g.image) + '" alt="' + esc(g.title) + '" style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:12px;" onerror="this.src=\'assets/placeholder.svg\'">' +
        '<h3 style="font-size:16px;">' + esc(g.title) + '</h3>' +
        '<button class="btn btn-dark" style="width:100%;margin-top:10px;" onclick="removeGalleryItem(\'' + esc(g.id) + '\')"><i class="fas fa-trash"></i> حذف</button>' +
        '</div>';
    }).join('') || '<p style="grid-column:1/-1;text-align:center;color:var(--gray);">لا توجد صور بعد</p>';
  } catch (err) {
    container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#dc2626;">' + esc(firebaseErrorMessage(err)) + '</p>';
  }
}

async function saveGalleryForm() {
  const image = getTrimmed('gal_image');
  const title = getTrimmed('gal_title');
  if (!image || !title) return showToast('الرجاء تعبئة رابط الصورة والعنوان', 'error');
  try {
    await addGalleryItem({ image: image, title: title });
    showToast('تمت الإضافة للمعرض', 'success');
    setValue('gal_image', '');
    setValue('gal_title', '');
    if ($('galPreview')) $('galPreview').style.display = 'none';
    loadGalleryManage();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

async function removeGalleryItem(id) {
  if (!confirm('حذف هذه الصورة؟')) return;
  try {
    await deleteGalleryItem(id);
    showToast('تم الحذف', 'success');
    loadGalleryManage();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

// ============================
// المواعيد
// ============================
let appointmentFilter = 'all';
let appointmentsCache = [];

async function loadAppointments() {
  const container = $('appointmentsContainer');
  if (!container) return;
  container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> جاري تحميل المواعيد...</p>';

  try {
    appointmentsCache = await getAppointments();
  } catch (err) {
    container.innerHTML = '<p style="color:#dc2626;">' + esc(firebaseErrorMessage(err)) + '</p>';
    return;
  }

  const list = appointmentFilter === 'all'
    ? appointmentsCache
    : appointmentsCache.filter(function (a) { return a.status === appointmentFilter; });

  if (!list.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;">لا توجد مواعيد في هذا التصنيف</p>';
    return;
  }

  container.innerHTML = list.map(function (a) {
    const status = a.status || 'pending';
    const label = APPOINTMENT_STATUS[status] || status;
    const phoneDigits = String(a.phone || '').replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(
      'مرحباً ' + (a.name || '') + '، بخصوص موعدكم مع شركة الممتاز للأعمال الكهربائية يوم ' +
      (a.date || '') + ' الساعة ' + (a.time || '') + ' لخدمة ' + (a.service || '') + '.'
    );

    const actions = [];
    if (status !== 'confirmed' && status !== 'done') {
      actions.push('<button class="btn btn-primary" style="padding:8px 16px;font-size:13px;" onclick="setAppointmentStatus(\'' + esc(a.id) + '\', \'confirmed\')"><i class="fas fa-check"></i> تأكيد</button>');
    }
    if (status !== 'done') {
      actions.push('<button class="btn btn-dark" style="padding:8px 16px;font-size:13px;" onclick="setAppointmentStatus(\'' + esc(a.id) + '\', \'done\')"><i class="fas fa-flag-checkered"></i> منجز</button>');
    }
    if (status !== 'cancelled') {
      actions.push('<button class="btn btn-outline" style="padding:8px 16px;font-size:13px;" onclick="setAppointmentStatus(\'' + esc(a.id) + '\', \'cancelled\')"><i class="fas fa-ban"></i> إلغاء</button>');
    }
    actions.push('<a href="https://wa.me/' + esc(phoneDigits) + '?text=' + waText + '" target="_blank" rel="noopener" class="btn btn-outline" style="padding:8px 16px;font-size:13px;"><i class="fab fa-whatsapp"></i> واتساب</a>');
    actions.push('<button class="icon-btn delete" onclick="removeAppointment(\'' + esc(a.id) + '\')" title="حذف"><i class="fas fa-trash"></i></button>');

    return '<div class="appointment-card status-' + esc(status) + '">' +
      '<div class="appointment-head">' +
        '<h4>' + esc(a.name || 'بدون اسم') + ' <span class="status-badge status-' + esc(status) + '">' + esc(label) + '</span></h4>' +
        '<span style="color:var(--gray);font-size:12.5px;">أُضيف: ' + esc(adminFormatDate(a.createdAt)) + '</span>' +
      '</div>' +
      '<div class="appointment-when">' +
        '<span><i class="fas fa-calendar"></i> ' + esc(adminFormatDate(a.date)) + '</span>' +
        '<span><i class="fas fa-clock"></i> ' + esc(a.time || '') + '</span>' +
        '<span><i class="fas fa-tools"></i> ' + esc(a.service || '-') + '</span>' +
        '<span><i class="fas fa-phone"></i> <span dir="ltr">' + esc(a.phone || '') + '</span></span>' +
      '</div>' +
      (a.notes ? '<div class="appointment-notes">' + esc(a.notes) + '</div>' : '') +
      '<div class="appointment-actions">' + actions.join('') + '</div>' +
      '</div>';
  }).join('');
}

async function setAppointmentStatus(id, status) {
  try {
    await updateAppointmentStatus(id, status);
    showToast('تم تحديث حالة الموعد: ' + (APPOINTMENT_STATUS[status] || status), 'success');
    loadAppointments();
    checkPendingAppointments();
    loadDashboard();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

async function removeAppointment(id) {
  if (!confirm('حذف هذا الموعد نهائياً؟')) return;
  try {
    await deleteAppointment(id);
    showToast('تم حذف الموعد', 'success');
    loadAppointments();
    checkPendingAppointments();
    loadDashboard();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

async function checkPendingAppointments() {
  try {
    const items = await getAppointments();
    const pending = items.filter(function (a) { return a.status === 'pending'; }).length;
    const badge = $('aptBadge');
    if (badge && pending > 0) {
      badge.textContent = pending;
      badge.style.display = 'inline-block';
    }
  } catch (err) {
    console.warn('تعذر تحديث شارة المواعيد:', err);
  }
}

// ============================
// الرسائل
// ============================
async function loadMessagesTab() {
  const container = $('messagesContainer');
  if (!container) return;
  container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</p>';

  let messages = [];
  try {
    messages = await getMessages();
  } catch (err) {
    container.innerHTML = '<p style="color:#dc2626;">' + esc(firebaseErrorMessage(err)) + '</p>';
    return;
  }

  if (!messages.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:40px;">لا توجد رسائل بعد</p>';
    return;
  }

  container.innerHTML = messages.map(function (m) {
    const phoneDigits = String(m.phone || '').replace(/[^0-9]/g, '');
    return '<div class="msg-card ' + (m.read ? '' : 'unread') + '">' +
      '<h4>' + esc(m.name) + ' ' + (m.read ? '' : '<span class="badge badge-draft">جديد</span>') + '</h4>' +
      '<div class="msg-meta">' +
        '<span><i class="fas fa-phone"></i> ' + esc(m.phone) + '</span>' +
        '<span><i class="fas fa-tag"></i> ' + esc(m.service || '-') + '</span>' +
        '<span><i class="fas fa-calendar"></i> ' + esc(m.date || '') + '</span>' +
      '</div>' +
      '<p>' + (esc(m.message) || 'لا توجد تفاصيل إضافية') + '</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<a href="https://wa.me/' + esc(phoneDigits) + '" target="_blank" rel="noopener" class="btn btn-primary" style="padding:8px 18px;font-size:13px;"><i class="fab fa-whatsapp"></i> رد عبر واتساب</a>' +
        (m.read ? '' : '<button class="btn btn-dark" style="padding:8px 18px;font-size:13px;" onclick="markRead(\'' + esc(m.id) + '\')">تمييز كمقروء</button>') +
        '<button class="icon-btn delete" onclick="removeMessage(\'' + esc(m.id) + '\')" title="حذف"><i class="fas fa-trash"></i></button>' +
      '</div></div>';
  }).join('');
}

async function markRead(id) {
  try {
    await markMessageRead(id);
    loadMessagesTab();
    checkUnreadMessages();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

async function removeMessage(id) {
  if (!confirm('حذف هذه الرسالة؟')) return;
  try {
    await deleteMessage(id);
    loadMessagesTab();
    checkUnreadMessages();
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

// ============================
// النسخ الاحتياطي
// ============================
async function exportData() {
  try {
    const [articles, services] = await Promise.all([getArticles(), getServices()]);
    const payload = { exportedAt: new Date().toISOString(), articles: articles, services: services };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alemtiaz-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    showToast('تم تصدير النسخة الاحتياطية', 'success');
  } catch (err) {
    showToast(firebaseErrorMessage(err), 'error');
  }
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      const articles = Array.isArray(parsed) ? parsed : (parsed.articles || []);
      if (!articles.length) throw new Error('لا توجد مقالات في الملف');

      let count = 0;
      for (const art of articles) {
        const data = Object.assign({}, art);
        delete data.id;
        delete data.createdAt;
        await addArticle(data);
        count++;
      }
      showToast('تم استيراد ' + count + ' مقال', 'success');
      loadArticlesTable();
      loadDashboard();
    } catch (err) {
      showToast('ملف غير صالح: ' + err.message, 'error');
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

// ============================
// الخروج
// ============================
function logout() {
  auth.signOut().then(function () { window.location.replace('login.html'); });
}
