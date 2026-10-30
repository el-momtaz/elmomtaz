/* ============================================================
   offline-store.js
   بديل محلي (Demo Mode) يعمل عندما لا يستطيع متصفح الزائر
   تحميل Firebase SDK (انقطاع الإنترنت، معاينة محلية، فتح الملفات
   مباشرة عبر file://). يقلّد واجهة Firebase Compat التي يستخدمها
   الموقع، ويحفظ البيانات في localStorage.

   عند توفر Firebase الحقيقي (شبكة متصلة + SDK محمّل) لا يُفعَّل
   هذا الملف إطلاقًا وتعمل الموقع بشكل طبيعي عبر Firestore.
   ============================================================ */
(function () {
  'use strict';

  // إذا كان Firebase الحقيقي محمّلًا، لا نفعل شيئًا
  if (window.firebase && typeof window.firebase.initializeApp === 'function') return;

  var STORE_KEY = 'alemtiaz_offline_db_v1';
  var AUTH_KEY = 'alemtiaz_offline_auth_v1';
  var DEMO_EMAIL = 'admin@alemtiaz.com';
  var DEMO_PASSWORD = '123456';

  window.SITE_OFFLINE = true;
  window.DEMO_CREDENTIALS = { email: DEMO_EMAIL, password: DEMO_PASSWORD };

  /* ---------- بيانات تجريبية أولية ---------- */
  function seedData() {
    var t = Date.now();
    var day = 86400000;
    return {
      collections: {
        settings: [
          {
            id: 'general',
            phone: '+966508980434',
            whatsapp: '+966508980434',
            email: 'info@alemtiaz-electric.com',
            address: 'جازان، المملكة العربية السعودية',
            workHours: 'يومياً من 8 صباحاً حتى 10 مساءً',
            facebook: '#',
            twitter: '#',
            instagram: '#',
            heroBadge: 'خبرة تتجاوز 10 سنوات',
            heroTitlePart1: 'خدمات ',
            heroHighlight: 'كهربائية احترافية',
            heroTitlePart2: ' تأسيساً وتشطيباً في جازان',
            heroDescription:
              'شركة الممتاز تقدم جميع الأعمال الكهربائية بأعلى معايير الجودة والسلامة، فريق فني متخصص وأسعار تنافسية لكافة المناطق المجاورة لجازان.',
            stat1Number: '+500',
            stat1Label: 'مشروع منجز',
            stat2Number: '+10',
            stat2Label: 'سنوات خبرة',
            stat3Number: '24/7',
            stat3Label: 'دعم فني',
            stat4Number: '100%',
            stat4Label: 'رضا العملاء',
            aboutText1:
              'تأسست شركة الممتاز للأعمال الكهربائية لتكون الخيار الأول في مدينة جازان والمناطق المجاورة.',
            aboutText2:
              'يضم فريقنا نخبة من الفنيين المدربين والمعتمدين، ملتزمون بتقديم أعلى معايير الجودة والسلامة.',
            mapEmbedUrl: 'https://maps.google.com/maps?q=Jazan&t=&z=11&ie=UTF8&iwloc=&output=embed',
          },
        ],
        services: [
          {
            id: 'srv_taasis',
            title: 'تأسيس كهرباء',
            slug: 'تأسيس-كهرباء',
            icon: 'fas fa-plug',
            shortDesc: 'تأسيس الشبكات الكهربائية للمنازل والفلل والمنشآت وفق المخططات ومعايير السلامة.',
            fullDescription:
              '<p>نقوم بتأسيس الكهرباء من الصفر وفق المخططات الهندسية المعتمدة، بدءاً من تمديد المواسير والخراطيم داخل الجدران والأسقف، وصولاً إلى توزيع الدوائر على لوحة التوزيع الرئيسية.</p><p>نستخدم كابلات نحاسية مطابقة للمواصفات السعودية، ونوضّح كل دائرة بلوحة مرقّمة لتسهيل الصيانة مستقبلاً.</p>',
            image: 'assets/photo-1.jpg',
            gallery: ['assets/photo-1.jpg', 'assets/photo-2.jpg'],
            features: ['مطابقة كود البناء السعودي', 'كابلات نحاسية أصلية', 'ترقيم وتوثيق كل دائرة', 'ضمان على التنفيذ'],
            metaTitle: 'تأسيس كهرباء في جازان',
            metaDescription: 'تأسيس كهرباء احترافي للمنازل والفلل والمنشآت في جازان وفق معايير السلامة.',
            order: 1,
            createdAt: t - 10 * day,
          },
          {
            id: 'srv_tashreeb',
            title: 'تشطيب وتمديدات',
            slug: 'تشطيب-وتمديدات',
            icon: 'fas fa-tools',
            shortDesc: 'تركيب الإضاءة والمفاتيح والأفياش ولوحات التوزيع بتشطيب احترافي.',
            fullDescription:
              '<p>تشطيب كهرباء كامل: تركيب نقاط الإنارة، المفاتيح والأفياش، المراوح، والثريات، إضافة إلى تنظيم لوحة التوزيع وتركيب القواطع التفاضلية.</p>',
            image: 'assets/photo-3.svg',
            gallery: [],
            features: ['تركيب إضاءة LED', 'قواطع تفاضلية', 'تنظيم أسلاك اللوحة', 'تنظيف موقع العمل بعد الانتهاء'],
            metaTitle: 'تشطيب كهرباء في جازان',
            metaDescription: 'تشطيب كهرباء المنازل والفلل بجازان: إضاءة، مفاتيح، أفياش ولوحات توزيع.',
            order: 2,
            createdAt: t - 9 * day,
          },
          {
            id: 'srv_maintenance',
            title: 'صيانة وإصلاح الأعطال',
            slug: 'صيانة-وإصلاح',
            icon: 'fas fa-screwdriver-wrench',
            shortDesc: 'تشخيص الأعطال الكهربائية وإصلاحها مع الاهتمام بالسلامة وجودة التنفيذ.',
            fullDescription:
              '<p>زيارة فني مختص لتشخيص العطل بالأجهزة المناسبة، مع تقرير واضح بالسبب والتكلفة قبل البدء في الإصلاح.</p>',
            image: 'assets/photo-2.jpg',
            gallery: [],
            features: ['تحديد العطل بدقة', 'أسعار واضحة قبل التنفيذ', 'خدمة طوارئ', 'قطع غيار أصلية'],
            metaTitle: 'صيانة كهرباء جازان',
            metaDescription: 'فني كهربائي للصيانة وإصلاح الأعطال في جازان على مدار الأسبوع.',
            order: 3,
            createdAt: t - 8 * day,
          },
          {
            id: 'srv_panels',
            title: 'لوحات التوزيع',
            slug: 'لوحات-التوزيع',
            icon: 'fas fa-table-cells-large',
            shortDesc: 'تصميم وتنفيذ لوحات توزيع رئيسية وفرعية بتوزيع أحمال متوازن.',
            fullDescription:
              '<p>حساب الأحمال وتوزيعها على الأطوار، واختيار مساحات القواطع المناسبة، مع تنظيم وترقيم الأسلاك وطبع مخطط اللوحة داخلها.</p>',
            image: 'assets/photo-2.jpg',
            gallery: [],
            features: ['حساب أحمال دقيق', 'ترتيب وترقيم الأسلاك', 'حماية من التماس', 'مخطط معتمد داخل اللوحة'],
            metaTitle: 'لوحات توزيع كهرباء جازان',
            metaDescription: 'تصميم وتنفيذ لوحات التوزيع الرئيسية والفرعية في جازان.',
            order: 4,
            createdAt: t - 7 * day,
          },
          {
            id: 'srv_lighting',
            title: 'إضاءة LED وحدائق',
            slug: 'إضاءة-ليد',
            icon: 'fas fa-lightbulb',
            shortDesc: 'تركيب إضاءة داخلية وخارجية وكشافات حدائق وواجهات بتوفير في الطاقة.',
            fullDescription:
              '<p>اختيار وحدات إضاءة موفرة ومناسبة لكل مساحة، مع تركيب كشافات الواجهات والحدائق بعزل جيد ضد الرطوبة.</p>',
            image: 'assets/photo-3.svg',
            gallery: [],
            features: ['توفير يصل إلى 80% من الطاقة', 'كشافات مقاومة للماء', 'توزيع إضاءة مدروس', 'ضمان على القطع'],
            metaTitle: 'إضاءة LED في جازان',
            metaDescription: 'تركيب إضاءة LED داخلية وخارجية بجازان مع ضمان.',
            order: 5,
            createdAt: t - 6 * day,
          },
          {
            id: 'srv_safety',
            title: 'فحص السلامة الكهربائية',
            slug: 'فحص-السلامة',
            icon: 'fas fa-shield-halved',
            shortDesc: 'فحص التوصيلات واللوحات الكهربائية للمساعدة في رفع مستوى السلامة.',
            fullDescription:
              '<p>فحص شامل للوحة الرئيسية ونقاط الأرضي والتوصيلات، وقياس مقاومة العزل، مع تقرير بالملاحظات والمخاطر وترتيب أولويات المعالجة.</p>',
            image: 'assets/photo-1.jpg',
            gallery: [],
            features: ['فحص نقطة الأرضي', 'قياس مقاومة العزل', 'تقرير مكتوب', 'توصيات مرتبة بالأولوية'],
            metaTitle: 'فحص السلامة الكهربائية جازان',
            metaDescription: 'فحص واختبار السلامة الكهربائية للمنازل والمنشآت في جازان.',
            order: 6,
            createdAt: t - 5 * day,
          },
        ],
        articles: [
          {
            id: 'art_taasis',
            title: 'دليلك لتأسيس كهرباء الفيلا من الصفر',
            slug: 'دليل-تأسيس-كهرباء-الفيلا',
            image: 'assets/photo-1.jpg',
            category: 'تأسيس',
            status: 'published',
            author: 'فريق الممتاز',
            date: '2026-09-12',
            createdAt: t - 20 * day,
            excerpt: 'خطوات التأسيس الصحيحة تساوي نصف نجاح المشروع: من قراءة المخطط إلى ترقيم الدوائر وأخذ قياسات الأرضي.',
            content:
              '<p>تأسيس الكهرباء مرحلة لا تتكرر بسهولة، لذلك أي خطأ فيها يتحول إلى تكسير وترميم لاحق. في هذا الدليل نشرح الترتيب الصحيح للخطوات.</p><h3>1. اقرأ المخطط قبل أول ماسورة</h3><p>حدّد مواقع الأفياش والمفاتيح ومكيفات السبليت وأحمال المطبخ من المخطط، لأن زيادة نقطة لاحقًا أغلى بكثير من تخطيطها الآن.</p><h3>2. وزّع الأحمال على دائرتين أو أكثر</h3><p>لا تضع أجهزة المطبخ الثقيلة مع إضاءة المجلس على نفس القاطع. تقسيم الدوائر يقلل الأعطال وسهّل الصيانة.</p><h3>3. ترقيم ووثائق</h3><p>اطلب من المقاول ترقيم كل دائرة على لوحة التوزيع، وتصوير مسارات المواسير قبل اللياسة.</p><h3>4. اختبار قبل التشطيب</h3><p>قياس مقاومة العزل ونقطة الأرضي قبل الإغلاق يكشف أي تلف لا يظهر إلا بعد تركيب الأثاث.</p>',
          },
          {
            id: 'art_tafasol',
            title: 'القاطع التفاضلي: لماذا لا يعمل المفتاح المضاد للصعق؟',
            slug: 'القاطع-التفاضلي',
            image: 'assets/photo-2.jpg',
            category: 'صيانة',
            status: 'published',
            author: 'فريق الممتاز',
            date: '2026-10-02',
            createdAt: t - 12 * day,
            excerpt: 'أسئلة متكررة عن تشغيل القاطع التفاضلي، وأسباب الفصل المفاجئ، وطريقة الفحص الصحيحة.',
            content:
              '<p>القاطع التفاضلي (ELCB/RCCB) يحمي الإنسان من تسرب التيار، لكن كثيراً ما يشتكي العملاء من فصله المتكرر.</p><h3>الأسباب الشائعة</h3><ul><li>ربط الأرضي مع الحيادي في نفس النقطة.</li><li>رطوبة أو تلف في عزل أحد الدوائر الخارجية.</li><li>خطأ في ربط القاطع التفاضلي على الثلاثة أطوار.</li></ul><p>الفحص الصحيح يكون بفصل الدوائر واحدة تلو الأخرى حتى يظهر القاطع الذي تسبب في الفصل.</p>',
          },
          {
            id: 'art_tawfir',
            title: '10 نصائح لتوفير فاتورة الكهرباء في الصيف',
            slug: 'نصائح-توفير-الكهرباء',
            image: 'assets/photo-3.svg',
            category: 'نصائح',
            status: 'published',
            author: 'فريق الممتاز',
            date: '2026-10-20',
            createdAt: t - 5 * day,
            excerpt: 'إضاءة LED، عزل الفتحات، وضبط المكيف درجة واحدة قد تكفي لتخفيض الفاتورة بشكل واضح.',
            content:
              '<p>توفير الكهرباء لا يحتاج تكلفة كبيرة، بل تنظيمًا لخطوات صغيرة:</p><ul><li>افحص السخانات وحرارتها.</li><li>رتب الأجهزة على مكيفات وأحمال موزعة.</li><li>استبدل الهالوجين بـ LED.</li><li>اطلب فحصًا دوريًا للتماسات والوصولات غير المحكمة.</li></ul>',
          },
        ],
        testimonials: [
          { id: 'tst_1', name: 'أبو محمد الجابري', role: 'صاحب فيلا - صبيا', rating: 5, text: 'أسلموا المشروع في الوقت هم وفوق المقاول اللي قبله بفرق كبير في الترتيب والنظافة.', createdAt: t - 3 * day },
          { id: 'tst_2', name: 'منى الشريف', role: 'عميلة - جازان', rating: 5, text: 'تواصلت معهم لحل التماس كهربائي، تحديد العطل كان سريع والسعر واضح قبل البدء.', createdAt: t - 4 * day },
          { id: 'tst_3', name: 'خالد عسيري', role: 'مدير منشأة - أبو عريش', rating: 4, text: 'خبرة ملحوظة في لوحات التوزيع، ووعدونا بتقرير مكتوب وقدموه فعلًا.', createdAt: t - 5 * day },
        ],
        gallery: [
          { id: 'gal_1', title: 'لوحة توزيع موقع بصبيا', image: 'assets/photo-2.jpg', createdAt: t - 2 * day },
          { id: 'gal_2', title: 'تأسيس فيلا بجازان', image: 'assets/photo-1.jpg', createdAt: t - 3 * day },
          { id: 'gal_3', title: 'تشطيب إضاءة مجلس', image: 'assets/photo-3.svg', createdAt: t - 4 * day },
        ],
        appointments: [
          {
            id: 'apt_1',
            name: 'فهد القحطاني',
            phone: '0553334444',
            service: 'تأسيس كهرباء',
            date: new Date(t + 1 * day).toISOString().slice(0, 10),
            time: '10:00',
            notes: 'معاينة فيلا تحت الإنشاء - حي الشاطئ',
            status: 'pending',
            createdAt: t - 1 * day,
          },
          {
            id: 'apt_2',
            name: 'أمل العمري',
            phone: '0567778888',
            service: 'صيانة وإصلاح الأعطال',
            date: new Date(t + 2 * day).toISOString().slice(0, 10),
            time: '17:00',
            notes: 'قاطع يفصل عند تشغيل المكيف',
            status: 'confirmed',
            createdAt: t - 2 * day,
          },
          {
            id: 'apt_3',
            name: 'مؤسسة البناء الحديث',
            phone: '0501112233',
            service: 'لوحات التوزيع',
            date: new Date(t - 3 * day).toISOString().slice(0, 10),
            time: '12:00',
            notes: 'لوحة رئيسية لمبنى تجاري',
            status: 'done',
            createdAt: t - 5 * day,
          },
        ],
        messages: [
          {
            id: 'msg_1',
            name: 'عبدالله ح.',
            phone: '0551234567',
            service: 'تأسيس كهرباء',
            message: 'أحتاج عرض سعر لتأسيس شقة مساحتها 150 متر.',
            read: false,
            date: '2026-10-28',
            createdAt: t - 2 * day,
          },
          {
            id: 'msg_2',
            name: 'سارة م.',
            phone: '0539876543',
            service: 'صيانة وإصلاح',
            message: 'القطاع يفصل باستمرار عند تشغيل المكيف.',
            read: true,
            date: '2026-10-26',
            createdAt: t - 4 * day,
          },
        ],
      },
    };
  }

  /* ---------- التخزين ---------- */
  var cache = null;

  function loadDB() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.collections) return parsed;
      }
    } catch (e) {
      console.warn('[offline-store] تعذر قراءة البيانات المحلية:', e);
    }
    var fresh = seedData();
    persist(fresh);
    return fresh;
  }

  function persist(target) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(target || cache));
    } catch (e) {
      console.warn('[offline-store] تعذر حفظ البيانات المحلية:', e);
    }
  }

  function data() {
    if (!cache) cache = loadDB();
    return cache;
  }

  function col(name) {
    var d = data();
    if (!d.collections[name]) d.collections[name] = [];
    return d.collections[name];
  }

  function clone(v) {
    return v == null ? v : JSON.parse(JSON.stringify(v));
  }

  function id(prefix) {
    return (prefix || 'doc') + '_' + Math.random().toString(36).slice(2, 10);
  }

  var SERVER_TS = '__serverTimestamp__';

  function resolveValues(obj) {
    var out = {};
    Object.keys(obj || {}).forEach(function (k) {
      var v = obj[k];
      out[k] = v && v[SERVER_TS] ? Date.now() : v;
    });
    return out;
  }

  function cmpValue(value, op, target) {
    switch (op) {
      case '==': return value === target;
      case '!=': return value !== target;
      case 'in': return Array.isArray(target) && target.indexOf(value) !== -1;
      case '>': return value > target;
      case '>=': return value >= target;
      case '<': return value < target;
      case '<=': return value <= target;
      case 'array-contains': return Array.isArray(value) && value.indexOf(target) !== -1;
      default: return false;
    }
  }

  function sortCompare(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a == null ? '' : a).localeCompare(String(b == null ? '' : b), 'ar');
  }

  /* ---------- مراجع المستندات ---------- */
  function docRef(name, docId) {
    return {
      id: docId,
      get: function () {
        var found = col(name).filter(function (d) { return d.id === docId; })[0];
        return Promise.resolve({
          exists: !!found,
          id: docId,
          data: function () { return found ? clone(found) : undefined; },
        });
      },
      set: function (obj, options) {
        var list = col(name);
        var values = resolveValues(obj);
        var index = list.findIndex(function (d) { return d.id === docId; });
        if (index >= 0) {
          list[index] = options && options.merge
            ? Object.assign({}, list[index], values, { id: docId })
            : Object.assign({ id: docId }, values);
        } else {
          list.push(Object.assign({ id: docId }, values));
        }
        persist();
        return Promise.resolve(true);
      },
      update: function (obj) {
        var list = col(name);
        var index = list.findIndex(function (d) { return d.id === docId; });
        if (index < 0) return Promise.reject(new Error('المستند غير موجود: ' + docId));
        list[index] = Object.assign({}, list[index], resolveValues(obj), { id: docId });
        persist();
        return Promise.resolve(true);
      },
      delete: function () {
        var list = col(name);
        var index = list.findIndex(function (d) { return d.id === docId; });
        if (index >= 0) list.splice(index, 1);
        persist();
        return Promise.resolve(true);
      },
    };
  }

  /* ---------- الاستعلامات ---------- */
  function query(name, state) {
    var q = {
      where: function (field, op, value) {
        return query(name, Object.assign({}, state, { filters: state.filters.concat([[field, op, value]]) }));
      },
      orderBy: function (field, dir) {
        return query(name, Object.assign({}, state, { orders: state.orders.concat([[field, dir || 'asc']]) }));
      },
      limit: function (n) {
        return query(name, Object.assign({}, state, { limit: n }));
      },
      get: function () {
        var rows = col(name).map(clone);
        state.filters.forEach(function (f) {
          rows = rows.filter(function (r) { return cmpValue(r[f[0]], f[1], f[2]); });
        });
        state.orders
          .slice()
          .reverse()
          .forEach(function (o) {
            rows.sort(function (a, b) { return sortCompare(a[o[0]], b[o[0]]) * (o[1] === 'desc' ? -1 : 1); });
          });
        if (state.limit != null) rows = rows.slice(0, state.limit);
        return Promise.resolve({
          empty: rows.length === 0,
          size: rows.length,
          docs: rows.map(function (r) { return { id: r.id, data: function () { return clone(r); } }; }),
        });
      },
      doc: function (docId) { return docRef(name, docId); },
      add: function (obj) {
        var newId = id(name.slice(0, 3));
        col(name).push(Object.assign({ id: newId }, resolveValues(obj)));
        persist();
        return Promise.resolve({ id: newId });
      },
    };
    return q;
  }

  function collection(name) {
    return query(name, { filters: [], orders: [], limit: null });
  }

  /* ---------- المصادقة ---------- */
  var listeners = [];

  function readSession() {
    try {
      var raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  var currentUser = readSession();

  function notify() {
    listeners.forEach(function (cb) {
      setTimeout(function () { cb(currentUser); }, 0);
    });
  }

  var authApi = {
    onAuthStateChanged: function (cb) {
      listeners.push(cb);
      setTimeout(function () { cb(currentUser); }, 0);
      return function () {
        listeners = listeners.filter(function (l) { return l !== cb; });
      };
    },
    signInWithEmailAndPassword: function (email, password) {
      if (String(email).trim().toLowerCase() === DEMO_EMAIL && String(password) === DEMO_PASSWORD) {
        currentUser = { uid: 'demo-admin', email: DEMO_EMAIL, isDemo: true };
        try { localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser)); } catch (e) {}
        notify();
        return Promise.resolve({ user: currentUser });
      }
      var err = new Error('البريد أو كلمة المرور غير صحيحة (وضع تجريبي)');
      err.code = 'auth/invalid-credential';
      return Promise.reject(err);
    },
    signOut: function () {
      currentUser = null;
      try { localStorage.removeItem(AUTH_KEY); } catch (e) {}
      notify();
      return Promise.resolve(true);
    },
  };
  Object.defineProperty(authApi, 'currentUser', { get: function () { return currentUser; } });

  /* ---------- الواجهة المتوافقة ---------- */
  window.firebase = {
    initializeApp: function () { return { options: {} }; },
    firestore: function () {
      var api = { collection: collection, useEmulator: function () {} };
      api.FieldValue = undefined;
      return api;
    },
    auth: function () { return authApi; },
  };
  window.firebase.firestore.FieldValue = {
    serverTimestamp: function () {
      var marker = {};
      marker[SERVER_TS] = true;
      return marker;
    },
    delete: function () { return null; },
  };

  console.info(
    '%c[وضع تجريبي] تعذر تحميل Firebase — يتم استخدام بيانات محلية مؤقتة.',
    'color:#b45309;font-weight:700'
  );

  /* ---------- شارة توضيحية صغيرة ---------- */
  window.addEventListener('DOMContentLoaded', function () {
    if (sessionStorage.getItem('alemtiaz_badge_hidden') === '1') return;
    var badge = document.createElement('div');
    badge.className = 'offline-badge';
    badge.innerHTML =
      '<i class="fas fa-flask"></i> <span>وضع تجريبي — بيانات محلية</span>' +
      '<button type="button" aria-label="إخفاء">&times;</button>';
    badge.querySelector('button').addEventListener('click', function () {
      sessionStorage.setItem('alemtiaz_badge_hidden', '1');
      badge.remove();
    });
    document.body.appendChild(badge);
  });
})();
