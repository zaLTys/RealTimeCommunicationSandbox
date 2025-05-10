const apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'        // dev on host
  : 'http://backend:8080';         // inside compose

let products = [];
let username = '';

// —— simple login ——
document.getElementById('setUser').addEventListener('click', () => {
  username = document.getElementById('username').value.trim();
  if (!username) return alert('Enter a username');
  document.getElementById('login').style.display = 'none';
  initialise();
});

async function initialise() {
  await loadProducts();
  startSignalR();
  setInterval(updateCountdowns, 1000);
}

async function loadProducts() {
  const res = await fetch(`${apiBase}/api/products`);
  products = await res.json();
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('products');
  tbody.innerHTML = '';
  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td id="bid-${p.id}">${p.currentBid.toFixed(2)}</td>
      <td id="rem-${p.id}">${remaining(p.endsAt)}</td>
      <td><input id="amt-${p.id}" type="number" min="0" step="1"></td>
      <td><button onclick="makeBid('${p.id}')">Bid</button></td>`;
    tbody.appendChild(tr);
  });
}

function remaining(endIso) {
  const diff = new Date(endIso) - Date.now();
  return diff > 0 ? Math.floor(diff / 1000) + ' s' : 'Ended';
}

function updateCountdowns() {
  products.forEach(p => {
    const cell = document.getElementById(`rem-${p.id}`);
    if (cell) cell.textContent = remaining(p.endsAt);
  });
}

async function makeBid(id) {
  const input = document.getElementById(`amt-${id}`);
  const amount = parseFloat(input.value);
  if (!amount) return alert('Enter a number');

  const res = await fetch(`${apiBase}/api/bid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: id, amount, bidder: username })
  });

  if (!res.ok) return alert(await res.text());
  input.value = '';
}

function startSignalR() {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${apiBase}/hubs/auction`)
    .withAutomaticReconnect()
    .build();

  connection.on('ReceiveBid', p => {
    // update local cache & DOM
    const idx = products.findIndex(x => x.id === p.id);
    if (idx !== -1) products[idx] = p; else products.push(p);
    document.getElementById(`bid-${p.id}`).textContent = p.currentBid.toFixed(2);
    document.getElementById(`rem-${p.id}`).textContent = remaining(p.endsAt);
  });

  connection.start();
}