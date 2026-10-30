// ============================
// منطق صفحة الخدمة الواحدة (service.html)
// ============================

async function initServicePage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    document.getElementById("serviceTitle").textContent = "الخدمة غير موجودة";
    return;
  }

  const service = await getServiceBySlug(slug);

  if (!service) {
    document.getElementById("serviceTitle").textContent = "الخدمة غير موجودة";
    document.getElementById("serviceShortDesc").textContent = "عذراً، لم نعثر على هذه الخدمة";
    return;
  }

  // ===== تحديث عناصر السيو =====
  const pageTitle = service.metaTitle || service.title;
  document.title = pageTitle + " | شركة الممتاز للأعمال الكهربائية";
  document.getElementById("pageTitle").textContent = document.title;
  document.getElementById("metaDesc").setAttribute("content", service.metaDescription || service.shortDesc);
  document.getElementById("ogTitle").setAttribute("content", pageTitle);
  document.getElementById("ogDesc").setAttribute("content", service.metaDescription || service.shortDesc);
  document.getElementById("ogImage").setAttribute("content", service.image || "");
  document.getElementById("canonicalLink").setAttribute("href", window.location.href);
  document.getElementById("breadcrumbCurrent").textContent = service.title;

  // ===== Schema.org JSON-LD =====
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.title,
    "description": service.shortDesc,
    "provider": {
      "@type": "ElectricalContractor",
      "name": "شركة الممتاز للأعمال الكهربائية",
      "areaServed": "جازان، المملكة العربية السعودية",
      "telephone": "+966508980434"
    },
    "image": service.image || ""
  };
  document.getElementById("schemaService").textContent = JSON.stringify(schema);

  // ===== تعبئة المحتوى =====
  document.getElementById("serviceTitle").textContent = service.title;
  document.getElementById("serviceShortDesc").textContent = service.shortDesc;
  document.getElementById("serviceIcon").className = service.icon || "fas fa-bolt";
  document.getElementById("serviceMainImage").src = optimizedImageUrl(service.image, 700) || "assets/logo.svg";
  document.getElementById("serviceMainImage").alt = service.title;
  document.getElementById("serviceFullDescription").innerHTML = service.fullDescription || `<p>${service.shortDesc}</p>`;

  // المميزات
  const featuresList = document.getElementById("serviceFeaturesList");
  if (service.features && service.features.length > 0) {
    featuresList.innerHTML = service.features
      .map((f) => `<li><i class="fas fa-check"></i> ${f}</li>`)
      .join("");
  } else {
    featuresList.innerHTML = `<li><i class="fas fa-check"></i> جودة تنفيذ عالية</li>`;
  }

  // معرض الصور الخاص بالخدمة
  if (service.gallery && service.gallery.length > 0) {
    const galleryGrid = document.getElementById("serviceGalleryGrid");
    galleryGrid.innerHTML = service.gallery
      .map(
        (img) => `
      <div class="gallery-item">
        <img src="${optimizedImageUrl(img, 500)}" alt="${service.title}" loading="lazy">
      </div>`
      )
      .join("");
    document.getElementById("serviceGallerySection").style.display = "block";
  }

  // الخدمات ذات الصلة (استثناء الخدمة الحالية)
  const allServices = await getServices();
  const related = allServices.filter((s) => s.id !== service.id).slice(0, 3);
  const relatedGrid = document.getElementById("relatedServicesGrid");
  relatedGrid.innerHTML = related
    .map(
      (s) => `
    <a href="service.html?slug=${s.slug}" class="service-card">
      <div class="service-card-icon"><i class="${s.icon}"></i></div>
      <h3>${s.title}</h3>
      <p>${s.shortDesc}</p>
      <span class="service-card-link">اقرأ المزيد <i class="fas fa-arrow-left"></i></span>
    </a>`
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  await applySiteSettings();
  await initServicePage();
});