/* =========================================================================
   app.js – works with GUID product Ids
   ========================================================================= */

/* ------------ 1.  API base --------------------------------------------- */
const local   = location.hostname === '' || location.hostname === 'localhost';
const apiBase = local ? 'http://localhost:5000' : 'http://backend:5000';
console.log('[auction] API →', apiBase);

/* ------------ 2.  Username helper -------------------------------------- */
const usernameBox = document.getElementById('username');
const currentUser = () => usernameBox.value.trim();

/* ------------ 3.  SignalR connection ----------------------------------- */
const hub = new signalR.HubConnectionBuilder()
  .withUrl(`${apiBase}/hubs/auction`)
  .configureLogging(signalR.LogLevel.Information)
  .build();

hub.on('InitialProducts', list => renderProducts(list, 'hub'));
hub.on('ReceiveBid',      p    => upsertRow(p,        'hub'));

hub.start()
    .then(() => console.log('%cSignalR ✓', 'color:lime'))
    .catch(console.error);

/* ------------ 4.  Initial REST seed ------------------------------------ */
fetch(`${apiBase}/api/products`)
  .then(r => r.json())
  .then(list => renderProducts(list, 'rest'))
  .catch(console.error);

/* ------------ 5.  DOM helpers ------------------------------------------ */
const tbody = document.querySelector('#products tbody');
const getId = p => p.id ?? p.Id;   // handle either JSON casing
const timers = new Map(); 

function renderProducts(list, src) {
  console.log(`[${src}] render ${list.length} products`);
  tbody.innerHTML = '';
  list.forEach(upsertRow);
}

function upsertRow(p, src = 'ui') {
  const id = getId(p);                 // ← GUID string
  if (!id) { console.warn('Product without Id', p); return; }

  let tr = tbody.querySelector(`tr[data-id="${id}"]`);
  if (!tr) {
    tr = document.createElement('tr');
    tr.dataset.id = id;                // store GUID right on the row
    tr.innerHTML = `
      <td>${p.name}</td>
      <td class="price"></td>
      <td class="bidder"></td>
      <td class="timer"></td>
      <td>
        <input class="amt" data-id="${id}" type="number" min="0" step="1">
        <button class="bid-btn" data-id="${id}">Bid</button>
      </td>`;
    tbody.appendChild(tr);
    refreshTimer(id, p.endsAt, tr.querySelector('.timer'));
  }

  tr.querySelector('.price').textContent  = `$${p.currentBid}`;
  tr.querySelector('.bidder').textContent = p.lastBidder || '—';
  refreshTimer(id, p.endsAt, tr.querySelector('.timer'));
  flash(tr);
}

function refreshTimer(pid, endsAtIso, cell) {
 // clear old interval if any
 const prev = timers.get(pid);
 if (prev) clearInterval(prev.tickId);

 const ends = new Date(endsAtIso);
 const tickId = setInterval(() => {
   const ms = ends - Date.now();
   if (ms <= 0) { clearInterval(tickId); cell.textContent = 'Ended'; return; }
   const s = Math.floor(ms / 1000);
   cell.textContent = `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2,'0')}s`;
 }, 1000);
 
 timers.set(pid, { ends, tickId });
}

function flash(tr) {
  tr.classList.add('flash');
  setTimeout(() => tr.classList.remove('flash'), 400);
}

/* ------------ 6.  Delegated click handler ------------------------------ */
document.addEventListener('click', async e => {
  if (!e.target.matches('.bid-btn')) return;

  const id    = e.target.dataset.id;                      // GUID string
  const tr    = e.target.closest('tr');
  const amtEl = tr.querySelector('.amt');
  const amt   = Number(amtEl.value);
  const user  = currentUser();

  if (!user) { alert('Enter a username'); return; }
  if (!amt)  { alert('Enter a bid amount'); return; }

  flash(tr);                                              // optimistic flash

  try {
    const res = await fetch(`${apiBase}/api/bid`, {
      method : 'POST',
      mode   : 'cors',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ productId: id, amount: amt, bidder: user })
    });

    if (!res.ok) throw new Error(await res.text() || res.status);

    amtEl.value = '';                                     // clear input
    console.log(`Bid OK → ${id} : $${amt}`);
    /* actual row update arrives via Hub */
  }
  catch (err) {
    alert(err.message);
    console.error(err);
  }
});

/* ------------ 7.  Quick flash style ------------------------------------ */
const style = document.createElement('style');
style.textContent = '.flash{animation:flash .4s}@keyframes flash{from{background:#ffd}to{background:transparent}}';
document.head.appendChild(style);
