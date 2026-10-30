// ============================
// service-page.js — صفحة الخدمة الواحدة (service.html?slug=...)
// ============================

const SERVICE_PLACEHOLDER = 'assets/placeholder.svg';

function setTextIf(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value == null ? '' : value;
}
function setAttrIf(id, attr, value) {
  const el = document.getElementById(id);
  if (el && value) el.setAttribute(attr, value);
}

async function initServicePage() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  const titleEl = document.getElementById('serviceTitle');
  if (!titleEl) return;

  if (!slug) {
    renderServiceError('لم يتم تحديد الخدمة');
    return;
  }

  let service = null;
  try {
    service = await getServiceBySlugWithFallback(slug);
  } catch (err) {
    console.error(err);
  }

  if (!service) {
    renderServiceError('عذراً، لم نعثر على هذه الخدمة');
    return;
  }

  const pageTitle = service.metaTitle || service.title;
  const metaDescription = service.metaDescription || service.shortDesc || '';

  // ===== تحديث عناصر السيو =====
  document.title = pageTitle + ' | شركة الممتاز للأعمال الكهربائية';
  setTextIf('pageTitle', document.title);
  setAttrIf('metaDesc', 'content', metaDescription);
  setAttrIf('ogTitle', 'content', pageTitle);
  setAttrIf('ogDesc', 'content', metaDescription);
  setAttrIf('ogImage', 'content', service.image || SERVICE_PLACEHOLDER);
  setAttrIf('canonicalLink', 'href', window.location.href.split('?')[0] + '?slug=' + encodeURIComponent(slug));
  setTextIf('breadcrumbCurrent', service.title);

  // ===== Schema.org JSON-LD =====
  const schemaTag = document.getElementById('schemaService');
  if (schemaTag) {
    schemaTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description: metaDescription,
      provider: {
        '@type': 'ElectricalContractor',
        name: 'شركة الممتاز للأعمال الكهربائية',
        areaServed: 'جازان، المملكة العربية السعودية',
        telephone: '+966508980434'
      },
      image: service.image || SERVICE_PLACEHOLDER
    });
  }

  // ===== تعبئة المحتوى =====
  titleEl.textContent = service.title;
  setTextIf('serviceShortDesc', service.shortDesc || '');

  const iconEl = document.getElementById('serviceIcon');
  if (iconEl) iconEl.className = service.icon || 'fas fa-bolt';

  const mainImage = document.getElementById('serviceMainImage');
  if (mainImage) {
    mainImage.src = optimizedImageUrl(service.image, 800) || SERVICE_PLACEHOLDER;
    mainImage.alt = service.title;
    mainImage.onerror = function () { this.onerror = null; this.src = SERVICE_PLACEHOLDER; };
  }

  const fullDesc = document.getElementById('serviceFullDescription');
  if (fullDesc) {
    fullDesc.innerHTML = service.fullDescription
      ? sanitizeHtml(service.fullDescription)
      : '<p>' + esc(service.shortDesc || '') + '</p>';
  }

  // ===== المميزات =====
  const featuresList = document.getElementById('serviceFeaturesList');
  if (featuresList) {
    const features = (service.features && service.features.length)
      ? service.features
      : ['جودة تنفيذ عالية', 'فنيون متخصصون', 'أسعار واضحة قبل التنفيذ'];
    featuresList.innerHTML = features
      .map(function (f) { return '<li><i class="fas fa-check"></i> ' + esc(f) + '</li>'; })
      .join('');
  }

  // ===== معرض صور الخدمة =====
  const gallerySection = document.getElementById('serviceGallerySection');
  const galleryGrid = document.getElementById('serviceGalleryGrid');
  if (gallerySection && galleryGrid && service.gallery && service.gallery.length) {
    galleryGrid.innerHTML = service.gallery
      .map(function (img) {
        return '<div class="gallery-item"><img src="' + esc(optimizedImageUrl(img, 500)) +
          '" alt="' + esc(service.title) + '" loading="lazy"></div>';
      })
      .join('');
    gallerySection.style.display = 'block';
  }

  // ===== زر الحجز مع تعبئة الخدمة تلقائياً =====
  const bookingBtn = document.getElementById('serviceBookingBtn');
  if (bookingBtn) {
    bookingBtn.href = 'booking.html?service=' + encodeURIComponent(service.slug || service.id || '');
  }

  // ===== الخدمات ذات الصلة =====
  const relatedGrid = document.getElementById('relatedServicesGrid');
  if (relatedGrid) {
    const all = await getServicesWithFallback();
    const related = all.filter(function (s) { return s.id !== service.id && s.slug !== service.slug; }).slice(0, 3);
    relatedGrid.innerHTML = related
      .map(function (s) {
        return (
          '<a href="service.html?slug=' + encodeURIComponent(s.slug || s.id) + '" class="service-card">' +
            '<div class="service-icon"><i class="' + esc(s.icon || 'fas fa-bolt') + '"></i></div>' +
            '<h3>' + esc(s.title) + '</h3>' +
            '<p>' + esc(s.shortDesc || s.description || '') + '</p>' +
            '<span class="service-card-link">اقرأ المزيد <i class="fas fa-arrow-left"></i></span>' +
          '</a>'
        );
      })
      .join('');
  }
}

function renderServiceError(message) {
  const main = document.getElementById('serviceDetail');
  if (main) {
    main.innerHTML =
      '<div class="empty-state">' +
        '<i class="fas fa-circle-exclamation"></i>' +
        '<h2>' + esc(message) + '</h2>' +
        '<p>يمكنك تصفح جميع خدماتنا المتاحة والاختيار منها.</p>' +
        '<a href="services.html" class="btn btn-primary">كل الخدمات</a>' +
      '</div>';
    return;
  }
  const titleEl = document.getElementById('serviceTitle');
  if (titleEl) titleEl.textContent = message;
}

document.addEventListener('DOMContentLoaded', async function () {
  await applySiteSettings();
  await initServicePage();
});
