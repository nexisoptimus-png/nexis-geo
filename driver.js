const $ = (id) => document.getElementById(id);
let timer = null;

function show(el, text) { el.textContent = text; el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function creds() {
  try { return JSON.parse(localStorage.getItem('ng_driver')); } catch (e) { return null; }
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function loadOrders() {
  const c = creds();
  if (!c) return;
  hide($('dMsg'));
  try {
    const d = await api({ action: 'driverOrders', phone: c.phone, pin: c.pin });
    if (!d.ok) {
      if (/PIN|අංකය/.test(d.error || '')) return logout();
      return show($('dMsg'), d.error);
    }
    $('who').textContent = 'ආයුබෝවන්, ' + d.driver;
    $('loginCard').classList.add('hidden');
    $('ordersWrap').classList.remove('hidden');
    render(d.orders);
  } catch (e) {
    show($('dMsg'), 'ජාලයේ දෝෂයක්. නැවත උත්සාහ කරන්න.');
  }
}

function render(orders) {
  const box = $('ordersList');
  if (!orders.length) {
    box.innerHTML = '<div class="card">දැනට අලුත් ඕඩර් නැහැ.</div>';
    return;
  }
  box.innerHTML = '';
  orders.forEach((o) => {
    const s = SERVICES[o.service] || { icon: '', label: o.service };
    const card = document.createElement('div');
    card.className = 'card order';
    card.innerHTML =
      '<div class="row"><b>' + s.icon + ' ' + esc(s.label) + '</b> <span class="tag">(' + esc(o.id) + ' • ' + esc(o.time) + ')</span></div>' +
      '<div class="row">📍 ' + esc(o.pickup) + '</div>' +
      '<div class="row">🏁 ' + esc(o.drop) + '</div>' +
      (o.details ? '<div class="row">📝 ' + esc(o.details) + '</div>' : '') +
      '<div class="row">👤 ' + esc(o.name) + '</div>' +
      '<div class="row"><span class="status-badge ' + o.status + '">' + esc(STATUS_TEXT[o.status] || o.status) + '</span></div>';

    if (o.mine) {
      card.innerHTML += '<a class="btn small" href="tel:' + esc(o.phone) + '">📞 ' + esc(o.phone) + '</a>';
      const done = document.createElement('button');
      done.className = 'btn small secondary';
      done.textContent = '✔ සම්පූර්ණයි';
      done.onclick = () => act('done', o.id);
      card.appendChild(done);
    } else {
      const acc = document.createElement('button');
      acc.className = 'btn';
      acc.textContent = 'භාර ගන්න';
      acc.onclick = () => act('accept', o.id);
      card.appendChild(acc);
    }
    box.appendChild(card);
  });
}

async function act(action, id) {
  const c = creds();
  try {
    const d = await api({ action: action, id: id, phone: c.phone, pin: c.pin });
    if (!d.ok) show($('dMsg'), d.error || 'දෝෂයක්');
  } catch (e) {
    show($('dMsg'), 'ජාලයේ දෝෂයක්');
  }
  loadOrders();
}

function logout() {
  localStorage.removeItem('ng_driver');
  clearInterval(timer);
  $('ordersWrap').classList.add('hidden');
  $('loginCard').classList.remove('hidden');
  $('who').textContent = 'ඇතුල් වෙන්න';
}

$('loginBtn').onclick = async () => {
  hide($('loginMsg'));
  const phone = $('dPhone').value.trim();
  const pin = $('dPin').value.trim();
  if (!phone || !pin) return show($('loginMsg'), 'දුරකථන අංකය සහ PIN ඇතුළත් කරන්න');
  $('loginBtn').disabled = true;
  try {
    const d = await api({ action: 'driverOrders', phone: phone, pin: pin });
    if (!d.ok) return show($('loginMsg'), d.error);
    localStorage.setItem('ng_driver', JSON.stringify({ phone: phone, pin: pin }));
    start();
  } catch (e) {
    show($('loginMsg'), 'ජාලයේ දෝෂයක්');
  } finally {
    $('loginBtn').disabled = false;
  }
};

$('refreshBtn').onclick = loadOrders;
$('logoutBtn').onclick = logout;

function start() {
  loadOrders();
  clearInterval(timer);
  timer = setInterval(loadOrders, 15000);
}

if (creds()) start();
