document.addEventListener('DOMContentLoaded', function(){
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if(menuToggle){
    menuToggle.addEventListener('click', function(){
      navLinks.classList.toggle('active');
      const icon = menuToggle.querySelector('i');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    });
  }
  document.querySelectorAll('.nav-links a').forEach(link=>{
    link.addEventListener('click', ()=> navLinks.classList.remove('active'));
  });
});

// ==========================================
// تطبيق إعدادات الموقع على كل عناصر data-dynamic
// ==========================================
async function applySiteSettings(){
  let s;
  try{ s = await getSettings(); }catch(err){ console.error(err); return; }

  document.querySelectorAll('[data-dynamic="phone-link"]').forEach(el => el.setAttribute('href','tel:'+s.phone));
  document.querySelectorAll('[data-dynamic="phone-text"]').forEach(el => el.textContent = s.phone);
  document.querySelectorAll('[data-dynamic="whatsapp-link"]').forEach(el => el.setAttribute('href','https://wa.me/'+s.whatsapp.replace(/[^0-9]/g,'')));
  document.querySelectorAll('[data-dynamic="email-text"]').forEach(el => el.textContent = s.email);
  document.querySelectorAll('[data-dynamic="address-text"]').forEach(el => el.textContent = s.address);
  document.querySelectorAll('[data-dynamic="workhours-text"]').forEach(el => el.textContent = s.workHours);
  document.querySelectorAll('[data-dynamic="facebook-link"]').forEach(el => el.setAttribute('href', s.facebook));
  document.querySelectorAll('[data-dynamic="twitter-link"]').forEach(el => el.setAttribute('href', s.twitter));
  document.querySelectorAll('[data-dynamic="instagram-link"]').forEach(el => el.setAttribute('href', s.instagram));

  const heroBadge = document.getElementById('heroBadgeText');
  if(heroBadge) heroBadge.textContent = s.heroBadge;
  const p1 = document.getElementById('heroTitlePart1'); if(p1) p1.textContent = s.heroTitlePart1;
  const hl = document.getElementById('heroHighlight'); if(hl) hl.textContent = s.heroHighlight;
  const p2 = document.getElementById('heroTitlePart2'); if(p2) p2.textContent = s.heroTitlePart2;
  const desc = document.getElementById('heroDescription'); if(desc) desc.textContent = s.heroDescription;

  const statsBox = document.getElementById('heroStats');
  if(statsBox){
    statsBox.innerHTML = `
      <div class="stat-box"><h3>${s.stat1Number}</h3><p>${s.stat1Label}</p></div>
      <div class="stat-box"><h3>${s.stat2Number}</h3><p>${s.stat2Label}</p></div>
      <div class="stat-box"><h3>${s.stat3Number}</h3><p>${s.stat3Label}</p></div>
      <div class="stat-box"><h3>${s.stat4Number}</h3><p>${s.stat4Label}</p></div>
    `;
  }

  const a1 = document.getElementById('aboutText1'); if(a1) a1.textContent = s.aboutText1;
  const a2 = document.getElementById('aboutText2'); if(a2) a2.textContent = s.aboutText2;

  const mapFrame = document.getElementById('mapFrame');
  if(mapFrame) mapFrame.setAttribute('src', s.mapEmbedUrl);

  return s;
}

// ==========================================
// عرض الخدمات ديناميكياً
// ==========================================
async function renderServices(containerId, limit){
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:var(--gray);padding:30px;"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</p>';
  try{
    let services = await getServices();
    // محتوى افتراضي حتى تظهر الخدمات قبل إضافة سجلات Firestore لأول مرة
    if(services.length === 0){
      services = [
        {icon:'fas fa-plug', title:'تأسيس كهرباء', description:'تأسيس الشبكات الكهربائية للمنازل والفلل والمنشآت وفق المخططات ومعايير السلامة.'},
        {icon:'fas fa-lightbulb', title:'تشطيب كهرباء', description:'تركيب الإضاءة والمفاتيح والأفياش واللوحات الكهربائية بتشطيب احترافي.'},
        {icon:'fas fa-tools', title:'صيانة وإصلاح', description:'تشخيص الأعطال الكهربائية وإصلاحها مع الاهتمام بالسلامة وجودة التنفيذ.'},
        {icon:'fas fa-bolt', title:'إصلاح التماسات', description:'فحص التماسات ومشكلات القواطع والتوصيلات ومعالجة أسباب الخلل.'},
        {icon:'fas fa-house', title:'تمديدات كهربائية', description:'تمديدات داخلية وخارجية للمشاريع الجديدة والتجديدات حسب احتياج الموقع.'},
        {icon:'fas fa-shield-halved', title:'فحص السلامة', description:'فحص التوصيلات واللوحات الكهربائية للمساعدة في رفع مستوى السلامة.'}
      ];
    }
    const list = limit ? services.slice(0, limit) : services;
    container.innerHTML = list.map(s => `
      <div class="service-card">
        <div class="service-icon"><i class="${s.icon}"></i></div>
        <h3>${s.title}</h3>
        <p>${s.description}</p>
      </div>
    `).join('');
  }catch(err){
    console.error(err);
    container.innerHTML = '<p style="text-align:center;color:red;grid-column:1/-1;">تعذر تحميل الخدمات</p>';
  }
}

// ==========================================
// عرض آراء العملاء
// ==========================================
async function renderTestimonials(containerId){
  const container = document.getElementById(containerId);
  if(!container) return;
  try{
    const items = await getTestimonials();
    if(items.length === 0){
      container.innerHTML = '<p style="text-align:center;color:var(--gray);grid-column:1/-1;">لا توجد آراء بعد</p>';
      return;
    }
    container.innerHTML = items.map(t => `
      <div class="testimonial-card">
        <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div>
        <p>"${t.text}"</p>
        <div class="testimonial-author">
          <img src="${t.image || ('https://ui-avatars.com/api/?background=0D1B2A&color=FFC107&name='+encodeURIComponent(t.name))}" alt="${t.name}">
          <div><h5>${t.name}</h5><span>${t.role||''}</span></div>
        </div>
      </div>
    `).join('');
  }catch(err){ console.error(err); }
}

// ==========================================
// عرض معرض الأعمال
// ==========================================
async function renderGallery(containerId){
  const container = document.getElementById(containerId);
  if(!container) return;
  try{
    const items = await getGallery();
    if(items.length === 0){
      container.innerHTML = '<p style="text-align:center;color:var(--gray);grid-column:1/-1;">سيتم إضافة صور الأعمال قريباً</p>';
      return;
    }
    container.innerHTML = items.map(g => `
      <div class="gallery-item">
        <img src="${g.image}" alt="${g.title}">
        <div class="gallery-overlay"><h4>${g.title}</h4></div>
      </div>
    `).join('');
  }catch(err){ console.error(err); }
}

// ==========================================
// المقالات
// ==========================================
async function renderArticles(containerId, limit){
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:var(--gray);padding:40px;"><i class="fas fa-spinner fa-spin"></i> جاري تحميل المقالات...</p>';
  try{
    const articles = (await getPublishedArticles()).slice(0, limit);
    if(articles.length === 0){
      container.innerHTML = '<p style="text-align:center;color:var(--gray);grid-column:1/-1;">لا توجد مقالات حالياً</p>';
      return;
    }
    container.innerHTML = articles.map(article => `
      <div class="article-card">
        <a href="article.html?id=${article.id}">
          <div class="article-img"><img src="${article.image}" alt="${article.title}"></div>
        </a>
        <div class="article-body">
          <div class="article-meta">
            <span><i class="fas fa-folder"></i> ${article.category}</span>
            <span><i class="fas fa-calendar"></i> ${formatDate(article.date)}</span>
          </div>
          <h3><a href="article.html?id=${article.id}" style="color:inherit;">${article.title}</a></h3>
          <p>${article.excerpt}</p>
          <a href="article.html?id=${article.id}" class="read-more">اقرأ المزيد <i class="fas fa-arrow-left"></i></a>
        </div>
      </div>
    `).join('');
  }catch(err){
    console.error(err);
    container.innerHTML = '<p style="text-align:center;color:red;grid-column:1/-1;">حدث خطأ في تحميل المقالات</p>';
  }
}

async function loadSingleArticle(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const container = document.getElementById('articleContent');
  container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</p>';
  const article = await getArticleById(id);
  if(!article){
    container.innerHTML = '<h2>المقال غير موجود</h2><a href="articles.html" class="btn btn-primary">العودة للمقالات</a>';
    return;
  }
  document.title = article.title + ' | شركة الممتاز';
  const descTag = document.getElementById('pageDesc');
  if(descTag) descTag.setAttribute('content', article.excerpt);
  const titleTag = document.getElementById('pageTitle');
  if(titleTag) titleTag.textContent = article.title + ' | شركة الممتاز';

  container.innerHTML = `
    <div class="article-header-meta">
      <span><i class="fas fa-folder"></i> ${article.category}</span>
      <span><i class="fas fa-user"></i> ${article.author}</span>
      <span><i class="fas fa-calendar"></i> ${formatDate(article.date)}</span>
    </div>
    <h1 style="color:var(--primary);font-size:32px;margin-bottom:20px;">${article.title}</h1>
    <img src="${article.image}" alt="${article.title}" style="width:100%;border-radius:12px;margin-bottom:25px;">
    <div class="article-body-content">${article.content}</div>
    <div class="share-box">
      <span style="font-weight:700;color:var(--primary);">شارك المقال:</span>
      <a href="https://wa.me/?text=${encodeURIComponent(article.title)}" target="_blank"><i class="fab fa-whatsapp"></i></a>
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}" target="_blank"><i class="fab fa-twitter"></i></a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${window.location.href}" target="_blank"><i class="fab fa-facebook"></i></a>
    </div>
  `;
  renderArticles('relatedArticles', 3);
}

function formatDate(dateStr){
  const date = new Date(dateStr);
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
