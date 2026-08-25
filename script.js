/* ============================================================
   آکادمی — لایه‌ی داده و رندر
   همه‌چیز در localStorage مرورگر ذخیره می‌شود (نسخه‌ی بدون بک‌اند).
   کلیدها: edu_courses, edu_reviews, edu_activities, edu_claims
   ============================================================ */

const LS = {
  courses:   'edu_courses',
  reviews:   'edu_reviews',
  activities:'edu_activities',
  claims:    'edu_claims',
  admin:     'edu_admin_pass'
};

function load(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function formatPrice(n){
  if(n === 0) return 'رایگان';
  return Number(n).toLocaleString('fa-IR') + ' تومان';
}
function starString(rating){
  const r = Math.round(rating || 0);
  return '★★★★★☆☆☆☆☆'.slice(5-r, 10-r);
}
function toast(msg){
  let t = document.querySelector('.toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=> t.classList.remove('show'), 2600);
}

/* ---------------- default (empty) data ---------------- */
function ensureData(){
  if(load(LS.courses, null) === null) save(LS.courses, []);
  if(load(LS.reviews, null) === null) save(LS.reviews, {});
  if(load(LS.claims, null) === null) save(LS.claims, []);
  if(load(LS.activities, null) === null){
    save(LS.activities, [
      { id: uid(), text: 'یک استوری از صفحه ما را در اینستاگرام بازنشر (ری‌شیر) کنید و منشن بزنید.' }
    ]);
  }
}
ensureData();

/* ---------------- channels (ثابت، طبق اطلاعات کاربر) ---------------- */
const CHANNELS = {
  instagram: [
    { name: 'jellyfish.30583061', url: 'https://instagram.com/jellyfish.30583061' },
    { name: 'jellyfish.8538507',  url: 'https://instagram.com/jellyfish.8538507' },
    { name: 'platypus.3131197',   url: 'https://instagram.com/platypus.3131197' }
  ],
  youtube: [
    { name: 'CampaignMastery', url: 'https://www.youtube.com/@CampaignMastery' },
    { name: 'kampaynn',        url: 'https://www.youtube.com/@kampaynn' }
  ],
  telegram: [
    { name: 'barnamhnavsi', url: 'https://t.me/barnamhnavsi' },
    { name: 'Kampaynn',     url: 'https://t.me/Kampaynn' },
    { name: 'Loogom',       url: 'https://t.me/Loogom' }
  ],
  rubika: [
    { name: '@barnamhnavisi', url: 'https://rubika.ir/barnamhnavisi' },
    { name: '@kampayna',      url: 'https://rubika.ir/kampayna' },
    { name: '@tarahyloogo',   url: 'https://rubika.ir/tarahyloogo' }
  ]
};
const CONTACT_PHONE = '09229131635';

/* ============================================================
   رندر هدر مشترک (تلفن ثابت در همه صفحات از طریق HTML درج شده)
   ============================================================ */

/* ============================================================
   صفحه اصلی: گرید دوره‌ها
   ============================================================ */
function renderCatalog(){
  const grid = document.getElementById('courseGrid');
  if(!grid) return;

  const courses = load(LS.courses, []);
  const reviews = load(LS.reviews, {});
  const search = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const activeCat = grid.dataset.activeCat || 'all';

  let list = courses.slice();
  if(activeCat !== 'all') list = list.filter(c => c.category === activeCat);
  if(search) list = list.filter(c => (c.title+c.instructor+c.category).toLowerCase().includes(search));

  if(list.length === 0){
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="ico">🗂️</div>
        <p><b>هنوز دوره‌ای ثبت نشده.</b><br>از پنل مدیریت (admin.html) دوره‌های خودتان را اضافه کنید؛ همین که اضافه کنید، اینجا نمایش داده می‌شود.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(c => {
    const rv = reviews[c.id] || [];
    const avg = rv.length ? rv.reduce((s,r)=>s+r.rating,0)/rv.length : 0;
    return `
    <a class="card" href="course.html?id=${c.id}">
      <div class="thumb" style="${c.image ? `background:url('${escapeHtml(c.image)}') center/cover;` : ''}">
        ${c.image ? '' : '🎓'}
        ${c.freeEligible ? '<span class="badge-free">قابل دریافت رایگان</span>' : ''}
        <span class="badge-cat">${escapeHtml(c.category || 'عمومی')}</span>
      </div>
      <div class="body">
        <h3>${escapeHtml(c.title)}</h3>
        <div class="instructor">مدرس: ${escapeHtml(c.instructor || 'آکادمی')}</div>
        <div class="rating"><span class="stars">${starString(avg)}</span> ${avg ? avg.toFixed(1) : 'بدون امتیاز'} (${rv.length})</div>
        <div class="price-row">
          <div>
            <span class="price">${formatPrice(c.price)}</span>
            ${c.oldPrice && c.oldPrice > c.price ? `<span class="old-price">${formatPrice(c.oldPrice)}</span>` : ''}
          </div>
          <span class="buy">مشاهده</span>
        </div>
      </div>
    </a>`;
  }).join('');
}

function renderCategoryChips(){
  const wrap = document.getElementById('chipRow');
  const grid = document.getElementById('courseGrid');
  if(!wrap || !grid) return;
  const courses = load(LS.courses, []);
  const cats = Array.from(new Set(courses.map(c => c.category).filter(Boolean)));
  wrap.innerHTML = `<button class="chip active" data-cat="all">همه دوره‌ها</button>` +
    cats.map(c => `<button class="chip" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');

  wrap.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      wrap.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      chip.classList.add('active');
      grid.dataset.activeCat = chip.dataset.cat;
      renderCatalog();
    });
  });
}

/* ============================================================
   باشگاه دوره‌ی رایگان: کانال‌ها + فعالیت‌های روزانه
   ============================================================ */
function renderChannels(){
  const map = { instagram: 'اینستاگرام', youtube: 'یوتیوب', telegram: 'تلگرام', rubika: 'روبیکا' };
  Object.keys(map).forEach(key => {
    const el = document.querySelector(`[data-platform="${key}"] .chan-list`);
    if(!el) return;
    el.innerHTML = CHANNELS[key].map(ch => `<a href="${ch.url}" target="_blank" rel="noopener">${escapeHtml(ch.name)} ↗</a>`).join('');
  });
}

function renderActivities(){
  const box = document.getElementById('activityList');
  if(!box) return;
  const acts = load(LS.activities, []);
  if(acts.length === 0){
    box.innerHTML = `<p class="claim-note">فعلاً فعالیتی ثبت نشده — از پنل مدیریت اضافه کنید.</p>`;
  } else {
    box.innerHTML = acts.map(a => `
      <label class="activity-item">
        <input type="checkbox" class="act-check" data-id="${a.id}">
        <span>${escapeHtml(a.text)}</span>
      </label>`).join('');
  }
  updateProgress();
  box.querySelectorAll('.act-check').forEach(cb => cb.addEventListener('change', updateProgress));
}

function updateProgress(){
  const boxes = document.querySelectorAll('#activityList .act-check, .platform-follow-check');
  const total = boxes.length;
  const done = Array.from(boxes).filter(b => b.checked).length;
  const pct = total ? Math.round((done/total)*100) : 0;
  const fill = document.getElementById('progressFill');
  const label = document.getElementById('progressLabel');
  if(fill) fill.style.width = pct + '%';
  if(label) label.textContent = `${done} از ${total} مرحله انجام شد`;
  const claimBtn = document.getElementById('openClaimForm');
  if(claimBtn) claimBtn.disabled = pct < 100;
}

function initClaimForm(){
  const openBtn = document.getElementById('openClaimForm');
  const form = document.getElementById('claimForm');
  if(!openBtn || !form) return;
  openBtn.addEventListener('click', () => form.classList.toggle('show'));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('claimName').value.trim();
    const phone = document.getElementById('claimPhone').value.trim();
    const course = document.getElementById('claimCourse').value.trim();
    if(!name || !phone || !course){ toast('لطفاً همه فیلدها را پر کنید'); return; }

    const claims = load(LS.claims, []);
    claims.push({ id: uid(), name, phone, course, date: new Date().toLocaleString('fa-IR') });
    save(LS.claims, claims);

    toast('درخواست شما ثبت شد. با شماره ' + CONTACT_PHONE + ' هماهنگ می‌شویم.');
    form.reset();
    form.classList.remove('show');
  });
}

/* ============================================================
   صفحه‌ی دوره: جزئیات + نظرات
   ============================================================ */
function renderCourseDetail(){
  const wrap = document.getElementById('courseDetail');
  if(!wrap) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const courses = load(LS.courses, []);
  const course = courses.find(c => c.id === id);

  if(!course){
    wrap.innerHTML = `<div class="empty-state"><div class="ico">❓</div><p><b>این دوره پیدا نشد.</b><br>ممکن است حذف شده باشد.</p></div>`;
    return;
  }

  document.title = course.title + ' | آکادمی';
  wrap.innerHTML = `
    <div class="detail-wrap">
      <div>
        <div class="thumb" style="border-radius:var(--radius);margin-bottom:16px;${course.image ? `background:url('${escapeHtml(course.image)}') center/cover;` : ''}">
          ${course.image ? '' : '🎓'}
        </div>
        <h1 style="font-size:24px;">${escapeHtml(course.title)}</h1>
        <div class="instructor" style="margin-bottom:10px;">مدرس: ${escapeHtml(course.instructor || 'آکادمی')} · دسته: ${escapeHtml(course.category || 'عمومی')}</div>
        <p>${escapeHtml(course.description || 'توضیحاتی برای این دوره ثبت نشده است.')}</p>
        <div id="reviewSection"></div>
      </div>
      <div class="buy-box">
        <div class="price">${formatPrice(course.price)}</div>
        ${course.oldPrice && course.oldPrice > course.price ? `<div class="old-price">${formatPrice(course.oldPrice)}</div>` : ''}
        <button class="btn btn-primary" style="width:100%;margin-top:14px;" id="buyBtn">پرداخت و ثبت‌نام</button>
        <button class="btn btn-ghost" style="width:100%;margin-top:8px;" onclick="location.href='index.html#club'">دریافت رایگان با انجام فعالیت</button>
        <div class="gateway-note">
          💳 پرداخت از طریق درگاه بانکی معتبر (نمونه: زرین‌پال) انجام می‌شود. برای فعال‌سازی نهایی، کد مرچنت درگاه باید در فایل <code>script.js</code> جای‌گذاری شود — این بخش نیاز به یک بک‌اند ساده دارد چون درگاه‌های بانکی از سمت مرورگر به‌تنهایی قابل اتصال امن نیستند.
        </div>
      </div>
    </div>`;

  document.getElementById('buyBtn').addEventListener('click', () => {
    toast('برای تکمیل خرید، درگاه بانکی باید متصل شود (راهنما در فایل README).');
  });

  renderReviews(course.id);
  initReviewForm(course.id);
}

function renderReviews(courseId){
  const el = document.getElementById('reviewSection');
  if(!el) return;
  const all = load(LS.reviews, {});
  const list = all[courseId] || [];
  const avg = list.length ? list.reduce((s,r)=>s+r.rating,0)/list.length : 0;

  el.innerHTML = `
    <h2 style="margin-top:28px;">نظرات و امتیاز کاربران</h2>
    <div class="review-summary">
      <div class="avg">${avg ? avg.toFixed(1) : '—'}</div>
      <div>
        <div class="stars">${starString(avg)}</div>
        <div style="font-size:12.5px;color:var(--ink-soft)">${list.length} نظر ثبت شده</div>
      </div>
    </div>
    <div id="reviewList">
      ${list.length === 0 ? '<p style="color:var(--ink-soft);font-size:13.5px;">هنوز نظری ثبت نشده — اولین نفر باشید.</p>' :
        list.slice().reverse().map(r => `
        <div class="review-item">
          <div class="top"><span class="name">${escapeHtml(r.name)}</span><span>${r.date}</span></div>
          <div class="stars">${starString(r.rating)}</div>
          <p style="margin:6px 0 0;font-size:13.5px;">${escapeHtml(r.text)}</p>
        </div>`).join('')}
    </div>
    <form class="review-form" id="reviewForm">
      <h4 style="margin:0 0 10px;">ثبت نظر و امتیاز</h4>
      <div class="star-pick" id="starPick">
        ${[1,2,3,4,5].map(i => `<span data-val="${i}">★</span>`).join('')}
      </div>
      <input type="hidden" id="ratingValue" value="5">
      <input type="text" id="reviewName" placeholder="نام شما" required>
      <textarea id="reviewText" rows="3" placeholder="نظر شما درباره این دوره..." required></textarea>
      <button type="submit" class="btn btn-primary btn-sm">ثبت نظر</button>
    </form>`;

  const starPick = document.getElementById('starPick');
  const ratingInput = document.getElementById('ratingValue');
  function paint(v){
    starPick.querySelectorAll('span').forEach(s => s.classList.toggle('on', +s.dataset.val <= v));
  }
  paint(5);
  starPick.querySelectorAll('span').forEach(s => s.addEventListener('click', () => {
    ratingInput.value = s.dataset.val;
    paint(+s.dataset.val);
  }));
}

function initReviewForm(courseId){
  document.addEventListener('submit', function handler(e){
    if(e.target.id !== 'reviewForm') return;
    e.preventDefault();
    const name = document.getElementById('reviewName').value.trim();
    const text = document.getElementById('reviewText').value.trim();
    const rating = +document.getElementById('ratingValue').value;
    if(!name || !text) return;

    const all = load(LS.reviews, {});
    if(!all[courseId]) all[courseId] = [];
    all[courseId].push({ name, text, rating, date: new Date().toLocaleDateString('fa-IR') });
    save(LS.reviews, all);
    toast('نظر شما ثبت شد. سپاس! 🌟');
    renderReviews(courseId);
  }, { once:false });
}

/* ============================================================
   صفحه ادمین
   ============================================================ */
const ADMIN_DEFAULT_PASS = '1234'; // در README توضیح داده شده که تغییرش دهید

function initAdmin(){
  const lock = document.getElementById('adminLock');
  const wrap = document.getElementById('adminWrap');
  if(!lock || !wrap) return;

  const savedPass = load(LS.admin, ADMIN_DEFAULT_PASS);
  document.getElementById('adminLoginBtn').addEventListener('click', () => {
    const val = document.getElementById('adminPassInput').value;
    if(val === savedPass){
      lock.classList.add('hide');
      wrap.classList.add('show');
      renderAdminCourses();
      renderAdminActivities();
      renderAdminClaims();
    } else {
      toast('رمز اشتباه است');
    }
  });

  document.getElementById('changePassBtn')?.addEventListener('click', () => {
    const np = prompt('رمز جدید پنل مدیریت را وارد کنید:');
    if(np && np.trim()){ save(LS.admin, np.trim()); toast('رمز تغییر کرد'); }
  });

  /* --- افزودن دوره --- */
  document.getElementById('courseForm').addEventListener('submit', e => {
    e.preventDefault();
    const courses = load(LS.courses, []);
    courses.push({
      id: uid(),
      title: document.getElementById('cTitle').value.trim(),
      category: document.getElementById('cCategory').value.trim(),
      instructor: document.getElementById('cInstructor').value.trim(),
      price: +document.getElementById('cPrice').value || 0,
      oldPrice: +document.getElementById('cOldPrice').value || 0,
      image: document.getElementById('cImage').value.trim(),
      freeEligible: document.getElementById('cFree').checked,
      description: document.getElementById('cDesc').value.trim()
    });
    save(LS.courses, courses);
    e.target.reset();
    toast('دوره اضافه شد');
    renderAdminCourses();
  });

  /* --- افزودن فعالیت روزانه --- */
  document.getElementById('activityForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('actText');
    if(!input.value.trim()) return;
    const acts = load(LS.activities, []);
    acts.push({ id: uid(), text: input.value.trim() });
    save(LS.activities, acts);
    input.value = '';
    toast('فعالیت اضافه شد');
    renderAdminActivities();
  });
}

function renderAdminCourses(){
  const tbody = document.getElementById('courseTableBody');
  if(!tbody) return;
  const courses = load(LS.courses, []);
  tbody.innerHTML = courses.length === 0
    ? `<tr><td colspan="5" style="text-align:center;color:var(--ink-soft)">هنوز دوره‌ای اضافه نشده</td></tr>`
    : courses.map(c => `
      <tr>
        <td>${escapeHtml(c.title)}</td>
        <td>${escapeHtml(c.category)}</td>
        <td>${formatPrice(c.price)}</td>
        <td>${c.freeEligible ? '✅' : '—'}</td>
        <td class="row-actions"><button class="del" data-id="${c.id}" title="حذف">🗑️</button></td>
      </tr>`).join('');

  tbody.querySelectorAll('.del').forEach(btn => btn.addEventListener('click', () => {
    if(!confirm('این دوره حذف شود؟')) return;
    let courses = load(LS.courses, []);
    courses = courses.filter(c => c.id !== btn.dataset.id);
    save(LS.courses, courses);
    renderAdminCourses();
  }));
}

function renderAdminActivities(){
  const tbody = document.getElementById('activityTableBody');
  if(!tbody) return;
  const acts = load(LS.activities, []);
  tbody.innerHTML = acts.length === 0
    ? `<tr><td colspan="2" style="text-align:center;color:var(--ink-soft)">فعالیتی ثبت نشده</td></tr>`
    : acts.map(a => `
      <tr>
        <td>${escapeHtml(a.text)}</td>
        <td class="row-actions"><button class="del" data-id="${a.id}" title="حذف">🗑️</button></td>
      </tr>`).join('');

  tbody.querySelectorAll('.del').forEach(btn => btn.addEventListener('click', () => {
    let acts = load(LS.activities, []);
    acts = acts.filter(a => a.id !== btn.dataset.id);
    save(LS.activities, acts);
    renderAdminActivities();
  }));
}

function renderAdminClaims(){
  const tbody = document.getElementById('claimTableBody');
  if(!tbody) return;
  const claims = load(LS.claims, []);
  tbody.innerHTML = claims.length === 0
    ? `<tr><td colspan="4" style="text-align:center;color:var(--ink-soft)">درخواستی ثبت نشده</td></tr>`
    : claims.slice().reverse().map(c => `
      <tr>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.phone)}</td>
        <td>${escapeHtml(c.course)}</td>
        <td>${c.date}</td>
      </tr>`).join('');
}

/* ============================================================
   init
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderCategoryChips();
  renderCatalog();
  renderChannels();
  renderActivities();
  initClaimForm();
  renderCourseDetail();
  initAdmin();

  const searchInput = document.getElementById('searchInput');
  if(searchInput){
    searchInput.addEventListener('input', renderCatalog);
  }
  const searchForm = document.getElementById('searchForm');
  if(searchForm){
    searchForm.addEventListener('submit', e => { e.preventDefault(); renderCatalog(); });
  }
});
