const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

const invPath = path.join(__dirname, 'inventory.json');
const ordersPath = path.join(__dirname, 'orders.json');

const loadJSON = file => JSON.parse(fs.readFileSync(file));
const saveJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

app.get('/api/inventory', (req, res) => res.json(loadJSON(invPath)));

app.post('/api/order', (req, res) => {
  const { cart } = req.body; // Array of { id, quantity }
  const inventory = loadJSON(invPath);
  let valid = true;
  let total = 0;

  cart.forEach(({ id, quantity }) => {
    const item = inventory.find(i => i.id === id);
    if (!item || item.stock < quantity) valid = false;
    else total += (item.price * quantity);
  });

  if (!valid) return res.status(400).json({ success: false, message: 'Insufficient stock' });

  // Deduct stock
  cart.forEach(({ id, quantity }) => {
    inventory.find(i => i.id === id).stock -= quantity;
  });
  saveJSON(invPath, inventory);

  // Save order
  const orders = loadJSON(ordersPath);
  const newOrder = { id: orders.length + 1, items: cart, total, date: new Date().toISOString() };
  orders.push(newOrder);
  saveJSON(ordersPath, orders);

  res.json({ success: true, order: newOrder });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
