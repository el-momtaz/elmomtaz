// ==========================================
// main.js — منطق الموقع العام (الواجهة)
// ==========================================

const PLACEHOLDER_IMAGE = 'assets/placeholder.svg';

// ---------- القائمة في الجوال ----------
document.addEventListener('DOMContentLoaded', function () {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
      const open = navLinks.classList.toggle('active');
      menuToggle.classList.toggle('is-open', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
      const icon = menuToggle.querySelector('i');
      if (!icon) return;
      icon.classList.toggle('fa-bars', !open);
      icon.classList.toggle('fa-times', open);
    });
  }
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    link.addEventListener('click', function () {
      if (navLinks) {
        navLinks.classList.remove('active');
        menuToggle && menuToggle.classList.remove('is-open');
        menuToggle && menuToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
        const ic = menuToggle && menuToggle.querySelector('i');
        if (ic) { ic.classList.add('fa-bars'); ic.classList.remove('fa-times'); }
      }
    });
  });
});

// ==========================================
// تطبيق إعدادات الموقع على كل عناصر data-dynamic
// ==========================================
async function applySiteSettings() {
  let s;
  try {
    s = await getSettings();
  } catch (err) {
    console.error(err);
    return;
  }
  if (!s) return;

  const setAttr = function (selector, attr, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (value) el.setAttribute(attr, value);
    });
  };
  const setText = function (selector, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (value != null) el.textContent = value;
    });
  };

  const waNumber = String(s.whatsapp || '').replace(/[^0-9]/g, '');

  setAttr('[data-dynamic="phone-link"]', 'href', s.phone ? 'tel:' + s.phone : '');
  setText('[data-dynamic="phone-text"]', s.phone);
  setAttr('[data-dynamic="whatsapp-link"]', 'href', waNumber ? 'https://wa.me/' + waNumber : '');
  setText('[data-dynamic="email-text"]', s.email);
  setAttr('[data-dynamic="email-link"]', 'href', s.email ? 'mailto:' + s.email : '');
  setText('[data-dynamic="address-text"]', s.address);
  setText('[data-dynamic="workhours-text"]', s.workHours);
  setAttr('[data-dynamic="facebook-link"]', 'href', s.facebook);
  setAttr('[data-dynamic="twitter-link"]', 'href', s.twitter);
  setAttr('[data-dynamic="instagram-link"]', 'href', s.instagram);

  const heroBadge = document.getElementById('heroBadgeText');
  if (heroBadge) heroBadge.textContent = s.heroBadge;
  const p1 = document.getElementById('heroTitlePart1'); if (p1) p1.textContent = s.heroTitlePart1;
  const hl = document.getElementById('heroHighlight'); if (hl) hl.textContent = s.heroHighlight;
  const p2 = document.getElementById('heroTitlePart2'); if (p2) p2.textContent = s.heroTitlePart2;
  const desc = document.getElementById('heroDescription'); if (desc) desc.textContent = s.heroDescription;

  const statsBox = document.getElementById('heroStats');
  if (statsBox) {
    statsBox.innerHTML =
      '<div class="stat-box"><h3>' + esc(s.stat1Number) + '</h3><p>' + esc(s.stat1Label) + '</p></div>' +
      '<div class="stat-box"><h3>' + esc(s.stat2Number) + '</h3><p>' + esc(s.stat2Label) + '</p></div>' +
      '<div class="stat-box"><h3>' + esc(s.stat3Number) + '</h3><p>' + esc(s.stat3Label) + '</p></div>' +
      '<div class="stat-box"><h3>' + esc(s.stat4Number) + '</h3><p>' + esc(s.stat4Label) + '</p></div>';
  }

  const a1 = document.getElementById('aboutText1'); if (a1) a1.textContent = s.aboutText1;
  const a2 = document.getElementById('aboutText2'); if (a2) a2.textContent = s.aboutText2;

  const mapFrame = document.getElementById('mapFrame');
  if (mapFrame && s.mapEmbedUrl) mapFrame.setAttribute('src', s.mapEmbedUrl);

  return s;
}


// تحديث وسم meta (يدعم name و property) — لوسوم المشاركة
function setMetaContent(key, value) {
  if (!value) return;
  let el = document.querySelector('meta[property="' + key + '"], meta[name="' + key + '"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(key.indexOf(':') > -1 ? 'property' : 'name', key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

// تعيين صورة المشاركة مع إزالة الأبعاد الثابتة عند استخدام صورة محتوى
function setOgImage(url, alt) {
  if (!url) return;
  const abs = new URL(url, window.location.href).href;
  setMetaContent('og:image', abs);
  setMetaContent('twitter:image', abs);
  if (alt) setMetaContent('og:image:alt', alt);
  document.querySelectorAll('meta[property="og:image:width"], meta[property="og:image:height"]').forEach(m => m.remove());
}

// حقن بيانات منظمة JSON-LD أو تحديثها
function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

// ==========================================
// الخدمات
// ==========================================
async function renderServices(containerId, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<p class="loading-line"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</p>';

  try {
    const services = await getServicesWithFallback();
    const list = limit ? services.slice(0, limit) : services;

    if (!list.length) {
      container.innerHTML = '<p class="empty-line">سيتم إضافة الخدمات قريباً</p>';
      return;
    }

    container.innerHTML = list
      .map(function (s) {
        const slug = s.slug || s.id || '';
        const desc = s.shortDesc || s.description || '';
        return (
          '<a class="service-card" href="service.html?slug=' + encodeURIComponent(slug) + '">' +
            '<div class="service-icon"><i class="' + esc(s.icon || 'fas fa-bolt') + '"></i></div>' +
            '<h3>' + esc(s.title) + '</h3>' +
            '<p>' + esc(desc) + '</p>' +
            '<span class="service-card-link">اقرأ المزيد <i class="fas fa-arrow-left"></i></span>' +
          '</a>'
        );
      })
      .join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="empty-line">تعذر تحميل الخدمات، حاول تحديث الصفحة.</p>';
  }
}

// ==========================================
// آراء العملاء
// ==========================================
async function renderTestimonials(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const items = await getTestimonials();
    if (!items.length) {
      container.innerHTML = '<p class="empty-line">لا توجد آراء منشورة بعد</p>';
      return;
    }
    container.innerHTML = items
      .map(function (t) {
        const rating = Math.max(0, Math.min(5, parseInt(t.rating, 10) || 0));
        const avatar = t.image
          ? esc(t.image)
          : 'https://ui-avatars.com/api/?background=0D1B2A&color=FFC107&name=' + encodeURIComponent(t.name || '');
        return (
          '<div class="testimonial-card">' +
            '<div class="stars">' + '★'.repeat(rating) + '☆'.repeat(5 - rating) + '</div>' +
            '<p>"' + esc(t.text) + '"</p>' +
            '<div class="testimonial-author">' +
              '<img src="' + avatar + '" alt="' + esc(t.name) + '" loading="lazy" onerror="this.src=\'' + PLACEHOLDER_IMAGE + '\'">' +
              '<div><h5>' + esc(t.name) + '</h5><span>' + esc(t.role || '') + '</span></div>' +
            '</div>' +
          '</div>'
        );
      })
      .join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="empty-line">تعذر تحميل آراء العملاء</p>';
  }
}

// ==========================================
// معرض الأعمال
// ==========================================
async function renderGallery(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const items = await getGallery();
    if (!items.length) {
      container.innerHTML = '<p class="empty-line">سيتم إضافة صور الأعمال قريباً</p>';
      return;
    }
    container.innerHTML = items
      .map(function (g) {
        return (
          '<div class="gallery-item">' +
            '<img src="' + esc(g.image || PLACEHOLDER_IMAGE) + '" alt="' + esc(g.title || 'عمل من تنفيذ الممتاز') + '" loading="lazy" onerror="this.src=\'' + PLACEHOLDER_IMAGE + '\'">' +
            '<div class="gallery-overlay"><h4>' + esc(g.title) + '</h4></div>' +
          '</div>'
        );
      })
      .join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="empty-line">تعذر تحميل المعرض</p>';
  }
}

// ==========================================
// المقالات
// ==========================================
function articleCard(article) {
  const img = esc(article.image || PLACEHOLDER_IMAGE);
  const url = 'article.html?id=' + encodeURIComponent(article.id);
  return (
    '<article class="article-card">' +
      '<a href="' + url + '" class="article-img">' +
        '<img src="' + img + '" alt="' + esc(article.title) + '" loading="lazy" onerror="this.src=\'' + PLACEHOLDER_IMAGE + '\'">' +
      '</a>' +
      '<div class="article-body">' +
        '<div class="article-meta">' +
          '<span><i class="fas fa-folder"></i> ' + esc(article.category || 'مقالات') + '</span>' +
          '<span><i class="fas fa-calendar"></i> ' + esc(formatDate(article.date || article.createdAt)) + '</span>' +
        '</div>' +
        '<h3><a href="' + url + '" class="article-title-link">' + esc(article.title) + '</a></h3>' +
        '<p>' + esc(article.excerpt || '') + '</p>' +
        '<a href="' + url + '" class="read-more">اقرأ المزيد <i class="fas fa-arrow-left"></i></a>' +
      '</div>' +
    '</article>'
  );
}

async function renderArticles(containerId, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '<p class="loading-line"><i class="fas fa-spinner fa-spin"></i> جاري تحميل المقالات...</p>';
  try {
    const articles = await getPublishedArticles();
    const list = limit ? articles.slice(0, limit) : articles;
    if (!list.length) {
      container.innerHTML = '<p class="empty-line">لا توجد مقالات منشورة حالياً</p>';
      return;
    }
    container.innerHTML = list.map(articleCard).join('');
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="empty-line">حدث خطأ في تحميل المقالات</p>';
  }
}

async function loadSingleArticle() {
  const container = document.getElementById('articleContent');
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    renderArticleError(container);
    return;
  }

  container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</p>';

  let article = null;
  try {
    article = await getArticleById(id);
  } catch (err) {
    console.error(err);
  }

  if (!article) {
    renderArticleError(container);
    return;
  }

  const pageTitle = article.title + ' | شركة الممتاز للأعمال الكهربائية';
  document.title = pageTitle;
  const titleTag = document.getElementById('pageTitle');
  if (titleTag) titleTag.textContent = pageTitle;
  const descTag = document.getElementById('pageDesc');
  if (descTag) descTag.setAttribute('content', article.excerpt || '');

  // ===== وسوم المشاركة + بيانات منظمة للمقال =====
  const canonical = window.location.href.split('#')[0];
  setMetaContent('og:type', 'article');
  setMetaContent('og:title', pageTitle);
  setMetaContent('og:description', article.excerpt || '');
  setOgImage(article.image, article.title);
  setMetaContent('og:url', canonical);
  setMetaContent('twitter:title', pageTitle);
  setMetaContent('twitter:description', article.excerpt || '');
  setMetaContent('article:published_time', article.date || '');
  const canonLink = document.querySelector('link[rel="canonical"]');
  if (canonLink) canonLink.setAttribute('href', canonical);

  setJsonLd('schemaArticle', {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || '',
    image: article.image ? [new URL(article.image, window.location.href).href] : [],
    datePublished: article.date || undefined,
    dateModified: article.date || undefined,
    author: { '@type': 'Organization', name: article.author || 'شركة الممتاز للأعمال الكهربائية' },
    publisher: {
      '@type': 'Organization',
      name: 'شركة الممتاز للأعمال الكهربائية',
      logo: { '@type': 'ImageObject', url: new URL('assets/logo.svg', window.location.href).href }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }
  });

  const shareUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent(article.title || '');

  container.innerHTML =
    '<div class="article-header-meta">' +
      '<span><i class="fas fa-folder"></i> ' + esc(article.category || 'مقالات') + '</span>' +
      '<span><i class="fas fa-user"></i> ' + esc(article.author || 'فريق الممتاز') + '</span>' +
      '<span><i class="fas fa-calendar"></i> ' + esc(formatDate(article.date || article.createdAt)) + '</span>' +
    '</div>' +
    '<h1 class="article-main-title">' + esc(article.title) + '</h1>' +
    '<img class="article-main-img" src="' + esc(article.image || PLACEHOLDER_IMAGE) + '" alt="' + esc(article.title) + '" onerror="this.src=\'' + PLACEHOLDER_IMAGE + '\'">' +
    '<div class="article-body-content">' + sanitizeHtml(article.content) + '</div>' +
    '<div class="share-box">' +
      '<span class="share-label">شارك المقال:</span>' +
      '<a href="https://wa.me/?text=' + shareText + '%20' + shareUrl + '" target="_blank" rel="noopener" aria-label="واتساب"><i class="fab fa-whatsapp"></i></a>' +
      '<a href="https://twitter.com/intent/tweet?text=' + shareText + '&url=' + shareUrl + '" target="_blank" rel="noopener" aria-label="تويتر"><i class="fab fa-twitter"></i></a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' + shareUrl + '" target="_blank" rel="noopener" aria-label="فيسبوك"><i class="fab fa-facebook"></i></a>' +
    '</div>';

  renderRelatedArticles(article.id);
}

function renderArticleError(container) {
  container.innerHTML =
    '<div class="empty-state">' +
      '<i class="fas fa-file-circle-question"></i>' +
      '<h2>المقال غير موجود</h2>' +
      '<p>ربما تم حذف المقال أو أن الرابط غير صحيح.</p>' +
      '<a href="articles.html" class="btn btn-primary">العودة إلى المقالات</a>' +
    '</div>';
}

async function renderRelatedArticles(currentId) {
  const container = document.getElementById('relatedArticles');
  if (!container) return;
  try {
    const articles = (await getPublishedArticles()).filter(function (a) { return a.id !== currentId; });
    if (!articles.length) {
      container.closest('section').style.display = 'none';
      return;
    }
    container.innerHTML = articles.slice(0, 3).map(articleCard).join('');
  } catch (err) {
    console.error(err);
  }
}

// ==========================================
// أدوات مساعدة
// ==========================================
function formatDate(dateStr) {
  if (!dateStr) return '';
  let date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (isNaN(date.getTime()) && typeof dateStr === 'number') date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}
