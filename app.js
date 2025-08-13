let inventory = [];
const cart = {};

const fetchInventory = () =>
  fetch('/api/inventory')
    .then(res => res.json())
    .then(data => {
      inventory = data;
      renderProducts();
      renderCart();
    });

const renderProducts = () => {
  const container = document.getElementById('products');
  container.innerHTML = ''; // Clear previous
  inventory.forEach(({ id, name, stock, price }) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <strong>${name}</strong><br>
      Price: \$${price.toFixed(2)}<br>
      Stock: ${stock}<br>
      <button ${stock <= 0 ? 'disabled' : ''} onclick="addToCart(${id})">
        Add to Cart
      </button>`;
    container.appendChild(div);
  });
};

const renderCart = () => {
  const container = document.getElementById('cart');
  if (!Object.keys(cart).length) {
    container.innerHTML = 'Cart is empty';
    return;
  }

  container.innerHTML = '';
  Object.entries(cart).forEach(([id, qty]) => {
    const item = inventory.find(i => i.id == id);
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerText = `${item.name} × ${qty}`;
    container.appendChild(div);
  });
};

window.addToCart = id => {
  cart[id] = (cart[id] || 0) + 1;
  renderCart();
};

document.getElementById('orderBtn').onclick = () => {
  if (!Object.keys(cart).length) return alert('Cart is empty');
  const cartArr = Object.entries(cart).map(([id, quantity]) => ({ id: +id, quantity }));
  fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cart: cartArr })
  })
    .then(res => res.json().then(json => ({ status: res.status, body: json })))
    .then(({ status, body }) => {
      if (status === 200 && body.success) {
        alert(`Order ${body.order.id} placed! Total: \$${body.order.total.toFixed(2)}`);
        Object.keys(cart).forEach(key => delete cart[key]);
        fetchInventory();
      } else {
        alert(body.message || 'Order failed');
      }
    })
    .catch(err => console.error(err));
};

fetchInventory();
