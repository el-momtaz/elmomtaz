// ============================
// نظام رفع الصور عبر Cloudinary
// ============================

const CLOUDINARY_CLOUD_NAME = "mlu0knuc";
const CLOUDINARY_UPLOAD_PRESET = "elmomtaz_uploads";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * رفع صورة واحدة إلى Cloudinary
 * @param {File} file - ملف الصورة
 * @param {Function} onProgress - دالة اختيارية لتتبع نسبة الرفع (0-100)
 * @returns {Promise<string>} رابط الصورة النهائي (secure_url)
 */
function uploadImageToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("لم يتم اختيار ملف"));
      return;
    }

    // التحقق من نوع الملف
    if (!file.type.startsWith("image/")) {
      reject(new Error("الملف المختار ليس صورة"));
      return;
    }

    // التحقق من الحجم (حد أقصى 8 ميجا)
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      reject(new Error("حجم الصورة كبير جداً (الحد الأقصى 8 ميجابايت)"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", CLOUDINARY_UPLOAD_URL, true);

    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable && typeof onProgress === "function") {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = function () {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        reject(new Error("فشل رفع الصورة، حاول مرة أخرى"));
      }
    };

    xhr.onerror = function () {
      reject(new Error("خطأ في الاتصال أثناء رفع الصورة"));
    };

    xhr.send(formData);
  });
}

/**
 * توليد رابط صورة محسّن الحجم من رابط Cloudinary أصلي
 * (لتحسين السرعة في أماكن العرض المختلفة)
 * @param {string} url - رابط الصورة الأصلي من Cloudinary
 * @param {number} width - العرض المطلوب
 * @returns {string} رابط محسّن
 */
function optimizedImageUrl(url, width = 800) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}

/**
 * إنشاء عنصر رفع صورة جاهز (Widget) يُدرج داخل أي حاوية في لوحة التحكم
 * @param {string} containerId - معرف العنصر الحاوي الفارغ في HTML
 * @param {string} currentImageUrl - رابط الصورة الحالية (إن وجدت) للمعاينة
 * @param {Function} onUploaded - دالة تُستدعى بعد نجاح الرفع، تستقبل الرابط الجديد
 */
function createImageUploadWidget(containerId, currentImageUrl, onUploaded) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="image-upload-widget">
      <div class="image-preview-box" id="${containerId}_preview">
        ${
          currentImageUrl
            ? `<img src="${optimizedImageUrl(currentImageUrl, 400)}" alt="معاينة الصورة">`
            : `<div class="no-image-placeholder"><i class="fas fa-image"></i><span>لا توجد صورة</span></div>`
        }
      </div>
      <div class="image-upload-controls">
        <input type="file" accept="image/*" id="${containerId}_input" style="display:none">
        <button type="button" class="btn-upload-img" id="${containerId}_btn">
          <i class="fas fa-upload"></i> ${currentImageUrl ? "تغيير الصورة" : "رفع صورة"}
        </button>
        <div class="upload-progress-bar" id="${containerId}_progress" style="display:none">
          <div class="upload-progress-fill" id="${containerId}_progressFill"></div>
        </div>
        <span class="upload-status" id="${containerId}_status"></span>
      </div>
      <input type="hidden" id="${containerId}_url" value="${currentImageUrl || ""}">
    </div>
  `;

  const input = document.getElementById(`${containerId}_input`);
  const btn = document.getElementById(`${containerId}_btn`);
  const preview = document.getElementById(`${containerId}_preview`);
  const progressWrap = document.getElementById(`${containerId}_progress`);
  const progressFill = document.getElementById(`${containerId}_progressFill`);
  const status = document.getElementById(`${containerId}_status`);
  const hiddenUrl = document.getElementById(`${containerId}_url`);

  btn.addEventListener("click", () => input.click());

  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    // معاينة فورية محلية قبل اكتمال الرفع
    const localPreview = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${localPreview}" alt="معاينة">`;

    progressWrap.style.display = "block";
    progressFill.style.width = "0%";
    status.textContent = "جاري الرفع...";
    status.className = "upload-status uploading";
    btn.disabled = true;

    try {
      const url = await uploadImageToCloudinary(file, (percent) => {
        progressFill.style.width = percent + "%";
      });
      hiddenUrl.value = url;
      status.textContent = "تم الرفع بنجاح ✓";
      status.className = "upload-status success";
      preview.innerHTML = `<img src="${optimizedImageUrl(url, 400)}" alt="معاينة الصورة">`;
      btn.innerHTML = `<i class="fas fa-upload"></i> تغيير الصورة`;
      if (typeof onUploaded === "function") onUploaded(url);
    } catch (err) {
      status.textContent = "خطأ: " + err.message;
      status.className = "upload-status error";
    } finally {
      btn.disabled = false;
      setTimeout(() => {
        progressWrap.style.display = "none";
      }, 1500);
    }
  });
}

/**
 * استرجاع رابط الصورة الحالية من الـ widget
 */
function getImageWidgetValue(containerId) {
  const el = document.getElementById(`${containerId}_url`);
  return el ? el.value : "";
}