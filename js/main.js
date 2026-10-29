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
    container.innerHTML = '<p style="text-align:center;color:red;grid-column:1/-1;">حدث خطأ في تحميل المقالات، تأكد من إعدادات Firebase</p>';
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