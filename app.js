let selectedService = 'taxi';
let prices = [];
let pollTimer = null;

const $ = (id) => document.getElementById(id);

function show(el, text) { el.textContent = text; el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

// ---------- සේවා බොත්තම් ----------
function renderServices() {
  $('services').innerHTML = '';
  Object.keys(SERVICES).forEach((key) => {
    const s = SERVICES[key];
    const p = prices.find((x) => x.service === key);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'service-btn' + (key === selectedService ? ' active' : '');
    btn.innerHTML = '<span class="icon">' + s.icon + '</span>' + s.label +
      (p ? '<small>රු. ' + p.base + ' සිට</small>' : '');
    btn.onclick = () => { selectedService = key; renderServices(); updateTexts(); };
    $('services').appendChild(btn);
  });
  updateTexts();
}

function updateTexts() {
  const p = prices.find((x) => x.service === selectedService);
  $('priceNote').textContent = p
    ? 'මූලික ගාස්තුව රු. ' + p.base + ' + කිලෝමීටරයකට රු. ' + p.perKm + (p.note ? ' (' + p.note + ')' : '')
    : '';
  $('detailsLabel').textContent = selectedService === 'courier'
    ? 'පාර්සලයේ විස්තර (උදා: බර, ප්‍රමාණය)'
    : 'මගීන් ගණන / අමතර විස්තර (අවශ්‍ය නම්)';
}

async function loadPrices() {
  try {
    const r = await fetch(API_URL + '?action=prices');
    const d = await r.json();
    if (d.ok) prices = d.prices;
  } catch (e) { /* මිල නොපෙනුනත් ඕඩර් කරන්න පුළුවන් */ }
  renderServices();
}

// ---------- ඕඩර් යවන්න ----------
$('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hide($('formMsg'));
  const body = {
    action: 'order',
    service: selectedService,
    name: $('name').value.trim(),
    phone: $('phone').value.trim(),
    pickup: $('pickup').value.trim(),
    drop: $('drop').value.trim(),
    details: $('details').value.trim()
  };
  if (!body.name) return show($('formMsg'), 'ඔබේ නම ඇතුළත් කරන්න');
  if (!/^0\d{9}$/.test(body.phone)) return show($('formMsg'), 'දුරකථන අංකය නිවැරදි නැහැ (උදා: 0771234567)');
  if (!body.pickup || !body.drop) return show($('formMsg'), 'ගන්න සහ දාන තැන් දෙකම ඇතුළත් කරන්න');

  $('submitBtn').disabled = true;
  $('submitBtn').textContent = 'යවමින්...';
  try {
    const d = await api(body);
    if (!d.ok) throw new Error(d.error || 'දෝෂයක් ඇති වුණා');
    localStorage.setItem('ng_order', JSON.stringify({ id: d.id, phone: body.phone }));
    $('orderForm').reset();
    startTracking();
  } catch (err) {
    show($('formMsg'), err.message || 'ජාලයේ දෝෂයක්. නැවත උත්සාහ කරන්න.');
  } finally {
    $('submitBtn').disabled = false;
    $('submitBtn').textContent = 'ඕඩර් කරන්න';
  }
});

// ---------- ඕඩර් තත්ත්වය බලන්න ----------
function getSaved() {
  try { return JSON.parse(localStorage.getItem('ng_order')); } catch (e) { return null; }
}

async function refreshStatus() {
  const saved = getSaved();
  if (!saved) return;
  try {
    const r = await fetch(API_URL + '?action=status&id=' + encodeURIComponent(saved.id) + '&phone=' + encodeURIComponent(saved.phone));
    const d = await r.json();
    if (!d.ok) return;
    $('aId').textContent = saved.id;
    $('aStatus').textContent = STATUS_TEXT[d.status] || d.status;
    $('aStatus').className = 'status-badge ' + d.status;

    if (d.status === 'ACCEPTED') {
      $('aDriver').textContent = d.driver + ' (' + d.driverPhone + ')';
      $('aDriverRow').classList.remove('hidden');
      $('aCall').href = 'tel:' + d.driverPhone;
      $('aCall').classList.remove('hidden');
    } else {
      hide($('aDriverRow')); hide($('aCall'));
    }
    $('aCancel').classList.toggle('hidden', d.status !== 'NEW');
    const finished = d.status === 'DONE' || d.status === 'CANCELLED';
    $('aNew').classList.toggle('hidden', !finished);
    if (finished) clearInterval(pollTimer);
  } catch (e) { /* ඊළඟ වතාවේ නැවත බලනවා */ }
}

function startTracking() {
  if (!getSaved()) return;
  $('activeCard').classList.remove('hidden');
  hide($('aMsg'));
  $('formCard').classList.add('hidden');
  refreshStatus();
  clearInterval(pollTimer);
  pollTimer = setInterval(refreshStatus, 15000);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('aCancel').onclick = async () => {
  if (!confirm('ඕඩර් එක අවලංගු කරන්නද?')) return;
  const saved = getSaved();
  const d = await api({ action: 'cancel', id: saved.id, phone: saved.phone });
  if (!d.ok) return show($('aMsg'), d.error || 'අවලංගු කළ නොහැක');
  refreshStatus();
};

$('aNew').onclick = () => {
  localStorage.removeItem('ng_order');
  hide($('activeCard'));
  $('formCard').classList.remove('hidden');
};

// ---------- ආරම්භය ----------
loadPrices();
startTracking();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
