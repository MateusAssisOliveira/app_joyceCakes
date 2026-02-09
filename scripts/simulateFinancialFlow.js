// Simulação do fluxo financeiro do app JoyceCakes
// Executa: abrir caixa, compra (insumo), cadastro de produto, venda, e validação de saldos.

function nowIso() { return new Date().toISOString(); }

// In-memory stores
const cashRegisters = new Map();
const supplies = new Map();
const products = new Map();
const movements = [];
const orders = [];

// Helpers
function createId(prefix){ return `${prefix}_${Math.random().toString(36).slice(2,9)}` }

// 1) Abrir caixa
function openCashRegister(userId, initialBalance=0){
  const id = createId('cash');
  const reg = { id, userId, openingDate: nowIso(), initialBalance, finalBalance: initialBalance, totalSales:0, totalExpenses:0, status:'open' };
  cashRegisters.set(id, reg);
  console.log(`Caixa aberto: ${id}, saldo inicial ${initialBalance.toFixed(2)}`);
  return reg;
}

// 2) Registrar movimentação (adiciona ao array e atualiza caixa)
function addFinancialMovement(cashRegister, { type, amount, category, description, paymentMethod }){
  const id = createId('mov');
  const mv = { id, cashRegisterId: cashRegister.id, type, amount, category, description, paymentMethod, date: nowIso() };
  movements.push(mv);
  // Atualiza caixa
  if(type === 'income'){
    cashRegister.finalBalance += amount;
    cashRegister.totalSales += amount;
  } else {
    cashRegister.finalBalance += amount; // amount should be negative for expense
    cashRegister.totalExpenses += Math.abs(amount);
  }
  return mv;
}

// 3) Adicionar insumo (compra) — diminui caixa (expense)
function addSupply(cashRegister, { name, sku, unit, stock, costPerUnit, supplier }){
  const id = createId('sup');
  const supply = { id, name, sku, unit, stock, costPerUnit, supplier, createdAt: nowIso() };
  supplies.set(id, supply);
  const total = costPerUnit * stock;
  addFinancialMovement(cashRegister, { type:'expense', amount: -total, category: 'Compra de Insumos', description: `Compra ${name}`, paymentMethod: 'PIX' });
  console.log(`Insumo adicionado: ${name} (qtd ${stock} ${unit}) - custo total ${total.toFixed(2)}`);
  return supply;
}

// 4) Cadastrar produto com ficha técnica (consome insumo para formação do estoque)
function addProduct({ name, price, components, initialStock=0 }){
  const id = createId('prd');
  // calcula custo a partir dos componentes
  let totalCost = 0;
  components.forEach(c => {
    const s = supplies.get(c.supplyId);
    if(!s) throw new Error(`Supply ${c.supplyId} não encontrado`);
    totalCost += (s.costPerUnit * (c.quantity / (c.unit === s.unit ? 1 : 1)) );
  });
  const product = { id, name, price, costPrice: totalCost, components, stock: initialStock, createdAt: nowIso() };
  products.set(id, product);
  console.log(`Produto cadastrado: ${name} - preço ${price.toFixed(2)} - custo estimado ${totalCost.toFixed(2)}`);
  return product;
}

// 5) Registrar venda (gera ordem, debita estoque, registra movimentos: income e expense (CMV))
function createOrder(cashRegister, { customerName, items, paymentMethod }){
  // items: [{ productId, qty }]
  // valida estoque
  for(const it of items){
    const p = products.get(it.productId);
    if(!p) throw new Error(`Produto ${it.productId} não encontrado`);
    if(p.stock < it.qty) throw new Error(`Estoque insuficiente para ${p.name}`);
  }
  // calcula total e cmv
  let total=0; let totalCost=0;
  items.forEach(it => {
    const p = products.get(it.productId);
    total += p.price * it.qty;
    totalCost += p.costPrice * it.qty;
  });
  // cria order
  const id = createId('ord');
  const order = { id, customerName, items, total, totalCost, createdAt: nowIso() };
  orders.push(order);
  // atualiza estoque
  items.forEach(it => { const p = products.get(it.productId); p.stock -= it.qty; });
  // registra movimentos
  addFinancialMovement(cashRegister, { type:'income', amount: total, category:'Venda de Produto', description:`Venda ${id}`, paymentMethod });
  addFinancialMovement(cashRegister, { type:'expense', amount: -totalCost, category:'Custo de Produto Vendido', description:`CMV ${id}`, paymentMethod });
  console.log(`Pedido ${id} registrado: total ${total.toFixed(2)}, custo ${totalCost.toFixed(2)}`);
  return order;
}

// Runner
function runSimulation(){
  console.log('--- Iniciando simulação financeira ---');
  const userId = 'user_1';
  const cash = openCashRegister(userId, 1000.00);

  // Compra insumos
  const s1 = addSupply(cash, { name:'Farinha de Trigo', sku:'FAR-1', unit:'kg', stock: 10, costPerUnit: 15.0, supplier: 'Fornecedor A' }); // R$150
  const s2 = addSupply(cash, { name:'Açúcar', sku:'ACU-1', unit:'kg', stock: 5, costPerUnit: 8.0, supplier: 'Fornecedor B' }); // R$40

  // Cadastro de produto que usa insumos
  const prod = addProduct({ name:'Bolo de Chocolate', price: 120.00, components: [ { supplyId: s1.id, quantity: 1, unit:'kg' }, { supplyId: s2.id, quantity: 0.5, unit:'kg' } ], initialStock: 5 });

  // Venda
  const order = createOrder(cash, { customerName: 'Cliente A', items: [ { productId: prod.id, qty: 2 } ], paymentMethod: 'PIX' });

  // Resultado
  console.log('\n--- Resultado da Simulação ---');
  console.log('Caixa final:', cash.finalBalance.toFixed(2));
  console.log('Total Vendas:', cash.totalSales.toFixed(2));
  console.log('Total Despesas:', cash.totalExpenses.toFixed(2));
  console.log('Movimentações:');
  movements.forEach(m => console.log(` - [${m.type}] ${m.category} ${m.amount.toFixed(2)} (${m.description})`));
  console.log('Produtos estoque atual:');
  for(const p of products.values()) console.log(` - ${p.name}: ${p.stock}`);
  console.log('--- Simulação concluída ---');
}

if(require.main === module) runSimulation();
