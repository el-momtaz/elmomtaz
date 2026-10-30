// ============================================================
// booking.js — صفحة حجز المواعيد
// ============================================================

const bookingForm = document.getElementById('bookingForm');
const bookingMessage = document.getElementById('bookingMessage');
const bookingSubmit = document.getElementById('bookingSubmit');
const bookingSuccess = document.getElementById('bookingSuccess');
const bookingSummary = document.getElementById('bookingSummary');
const slotGrid = document.getElementById('slotGrid');
const dateInput = document.getElementById('bkDate');

let selectedSlot = '';

// ---------- أدوات التاريخ ----------
function localISO(date) {
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 10);
}
function todayISO() { return localISO(new Date()); }
function maxDateISO() { return localISO(new Date(Date.now() + 60 * 86400000)); }

function formatDateArabic(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  return days[d.getDay()] + ' ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function formatSlot(slot) {
  const parts = String(slot).split(':');
  const h = parseInt(parts[0], 10);
  const period = h < 12 ? 'ص' : 'م';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':00 ' + period;
}

// ---------- الأوقات ----------
function renderSlots() {
  const slots = (typeof BOOKING_SLOTS !== 'undefined' && BOOKING_SLOTS.length)
    ? BOOKING_SLOTS
    : ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];

  const now = new Date();
  const isToday = dateInput.value === todayISO();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  slotGrid.innerHTML = slots.map(function (slot) {
    const parts = slot.split(':');
    const minutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    const passed = isToday && minutes <= currentMinutes + 30; // إتاحة مهلة 30 دقيقة
    return '<button type="button" class="slot' + (passed ? ' is-passed' : '') + (selectedSlot === slot ? ' is-selected' : '') + '"' +
      ' data-slot="' + slot + '"' + (passed ? ' disabled aria-disabled="true"' : '') + '>' +
      formatSlot(slot) + '</button>';
  }).join('');

  slotGrid.querySelectorAll('.slot:not(.is-passed)').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedSlot = this.dataset.slot;
      slotGrid.querySelectorAll('.slot').forEach(function (b) { b.classList.remove('is-selected'); });
      this.classList.add('is-selected');
      clearMessage();
    });
  });
}

// ---------- الخدمات ----------
async function fillServices() {
  const select = document.getElementById('bkService');
  if (!select) return;

  let services = [];
  try {
    services = await getServicesWithFallback();
  } catch (err) {
    console.error(err);
  }

  const preselected = new URLSearchParams(window.location.search).get('service');

  services.forEach(function (s) {
    const opt = document.createElement('option');
    opt.value = s.title;
    opt.textContent = s.title;
    if (preselected && (s.slug === preselected || s.id === preselected || s.title === preselected)) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  const other = document.createElement('option');
  other.value = 'استشارة / أخرى';
  other.textContent = 'استشارة / أخرى';
  select.appendChild(other);
}

// ---------- رسائل ----------
function showMessage(text, type) {
  bookingMessage.className = 'form-message ' + (type || 'error');
  bookingMessage.textContent = text;
}
function clearMessage() {
  bookingMessage.className = 'form-message';
  bookingMessage.textContent = '';
}

// ---------- الإرسال ----------
async function submitBooking(e) {
  e.preventDefault();
  clearMessage();

  const name = document.getElementById('bkName').value.trim();
  const phone = document.getElementById('bkPhone').value.trim();
  const service = document.getElementById('bkService').value;
  const date = dateInput.value;
  const notes = document.getElementById('bkNotes').value.trim();

  if (name.length < 3) return showMessage('الرجاء إدخال الاسم الكامل (3 أحرف على الأقل).');
  if (phone.replace(/[^0-9]/g, '').length < 9) return showMessage('الرجاء إدخال رقم جوال صحيح.');
  if (!service) return showMessage('الرجاء اختيار نوع الخدمة.');
  if (!date) return showMessage('الرجاء اختيار التاريخ المطلوب.');
  if (date < todayISO()) return showMessage('لا يمكن اختيار تاريخ سابق. الرجاء اختيار تاريخ اليوم أو بعده.');
  if (date > maxDateISO()) return showMessage('الحجز متاح حتى 60 يوماً قادمة فقط.');
  if (!selectedSlot) return showMessage('الرجاء اختيار وقت مناسب من الأوقات المتاحة.');

  bookingSubmit.disabled = true;
  const original = bookingSubmit.innerHTML;
  bookingSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إرسال الطلب...';

  let saved = true;
  try {
    await addAppointment({ name: name, phone: phone, service: service, date: date, time: selectedSlot, notes: notes });
  } catch (err) {
    saved = false;
    console.error(err);
  }

  bookingSubmit.disabled = false;
  bookingSubmit.innerHTML = original;

  if (!saved) {
    showMessage('تعذر حفظ الحجز في النظام. يمكنك التواصل عبر واتساب أو الاتصال المباشر وسنحجز لك فوراً.');
    return;
  }

  showSuccess(name, phone, service, date, notes);
}

function showSuccess(name, phone, service, date, notes) {
  bookingForm.hidden = true;

  bookingSummary.innerHTML =
    '<li><i class="fas fa-user"></i> <span>الاسم</span><strong>' + esc(name) + '</strong></li>' +
    '<li><i class="fas fa-tools"></i> <span>الخدمة</span><strong>' + esc(service) + '</strong></li>' +
    '<li><i class="fas fa-calendar"></i> <span>التاريخ</span><strong>' + esc(formatDateArabic(date)) + '</strong></li>' +
    '<li><i class="fas fa-clock"></i> <span>الوقت</span><strong>' + esc(formatSlot(selectedSlot)) + '</strong></li>' +
    '<li><i class="fas fa-phone"></i> <span>الجوال</span><strong dir="ltr">' + esc(phone) + '</strong></li>';

  const text = 'طلب حجز موعد\n' +
    'الاسم: ' + name + '\n' +
    'الجوال: ' + phone + '\n' +
    'الخدمة: ' + service + '\n' +
    'التاريخ: ' + formatDateArabic(date) + '\n' +
    'الوقت: ' + formatSlot(selectedSlot) +
    (notes ? '\nملاحظات: ' + notes : '');

  getSettings().then(function (s) {
    const num = String((s && s.whatsapp) || '+966508980434').replace(/[^0-9]/g, '');
    document.getElementById('waConfirm').href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(text);
  }).catch(function () {
    document.getElementById('waConfirm').href = 'https://wa.me/966508980434?text=' + encodeURIComponent(text);
  });

  bookingSuccess.hidden = false;
  if (typeof bookingSuccess.scrollIntoView === 'function') {
    bookingSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ---------- تهيئة ----------
document.addEventListener('DOMContentLoaded', async function () {
  await applySiteSettings();

  if (dateInput) {
    dateInput.min = todayISO();
    dateInput.max = maxDateISO();
    dateInput.value = todayISO();
    dateInput.addEventListener('change', function () {
      selectedSlot = '';
      renderSlots();
      clearMessage();
    });
  }

  renderSlots();
  await fillServices();

  if (bookingForm) bookingForm.addEventListener('submit', submitBooking);

  const another = document.getElementById('bookAnother');
  if (another) {
    another.addEventListener('click', function () {
      bookingSuccess.hidden = true;
      bookingForm.hidden = false;
      bookingForm.reset();
      dateInput.value = todayISO();
      selectedSlot = '';
      renderSlots();
      clearMessage();
      document.getElementById('bkName').focus();
    });
  }
});
