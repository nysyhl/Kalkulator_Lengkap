// ── State ──
let expression = '';
let result     = '';
let isResult   = false;
let isDeg      = true;
let history    = [];

// ── Update Layar ──
function updateDisplay() {
  const exprEl    = document.getElementById('expr');
  const displayEl = document.getElementById('display');
  if (isResult) {
    exprEl.textContent    = expression + ' =';
    displayEl.textContent = result;
  } else {
    exprEl.textContent    = '';
    displayEl.textContent = expression || '0';
  }
}

// ── Tambah karakter ──
function appendExpr(ch) {
  if (isResult) {
    const ops = ['+', '−', '×', '÷', '^', '%'];
    expression = ops.includes(ch) ? result + ch : ch;
    isResult = false;
  } else {
    expression += ch;
  }
  updateDisplay();
}

// ── Tombol fungsi sains → tulis "sin(" ──
function insertFunc(fn) {
  if (isResult) { expression = ''; isResult = false; }
  const map = {
    sin:'sin(', cos:'cos(', tan:'tan(',
    asin:'asin(', acos:'acos(', atan:'atan(',
    sinh:'sinh(', cosh:'cosh(', tanh:'tanh(',
    deg2rad:'deg2rad(',
    log:'log(', log2:'log2(', ln:'ln(',
    exp10:'10^(', expe:'e^(',
    sq:'sq(', cube:'cube(',
    sqrt:'sqrt(', cbrt:'cbrt(',
    inv:'inv(', abs:'abs(', fact:'fact(',
  };
  expression += (map[fn] || fn + '(');
  updateDisplay();
}

// ── Hapus karakter terakhir ──
function delLast() {
  if (isResult) { expression = result; isResult = false; }
  expression = expression.slice(0, -1);
  updateDisplay();
}

// ── Clear ──
function clearAll() {
  expression = ''; result = ''; isResult = false;
  updateDisplay();
}

// ── Konversi sudut ──
function toRad(v)   { return isDeg ? v * Math.PI / 180 : v; }
function fromRad(v) { return isDeg ? v * 180 / Math.PI : v; }

// ── Hitung ──
function calculate() {
  if (!expression) return;
  const orig = expression;

  try {
    let safe = expression
      .replace(/π/g,      '(Math.PI)')
      .replace(/\be\b/g,  '(Math.E)')
      .replace(/÷/g,      '/')
      .replace(/×/g,      '*')
      .replace(/−/g,      '-')
      .replace(/\^/g,     '**')
      .replace(/%/g,      '/100')
      // trig (DEG mode pakai helper, RAD langsung Math)
      .replace(/sin\(/g,    isDeg ? '__sin(' : 'Math.sin(')
      .replace(/cos\(/g,    isDeg ? '__cos(' : 'Math.cos(')
      .replace(/tan\(/g,    isDeg ? '__tan(' : 'Math.tan(')
      .replace(/asin\(/g,   isDeg ? '__asin(' : 'Math.asin(')
      .replace(/acos\(/g,   isDeg ? '__acos(' : 'Math.acos(')
      .replace(/atan\(/g,   isDeg ? '__atan(' : 'Math.atan(')
      .replace(/sinh\(/g,   'Math.sinh(')
      .replace(/cosh\(/g,   'Math.cosh(')
      .replace(/tanh\(/g,   'Math.tanh(')
      .replace(/deg2rad\(/g,'((Math.PI/180)*(')
      // log
      .replace(/log2\(/g,   'Math.log2(')
      .replace(/log\(/g,    'Math.log10(')
      .replace(/ln\(/g,     'Math.log(')
      .replace(/10\*\*\(/g, 'Math.pow(10,')
      .replace(/e\*\*\(/g,  'Math.exp(')
      // pangkat & akar
      .replace(/sq\(/g,     '__sq(')
      .replace(/cube\(/g,   '__cube(')
      .replace(/sqrt\(/g,   'Math.sqrt(')
      .replace(/cbrt\(/g,   'Math.cbrt(')
      // lain
      .replace(/inv\(/g,    '__inv(')
      .replace(/abs\(/g,    'Math.abs(')
      .replace(/fact\(/g,   '__fact(');

    const helpers = `
      function __sin(x)  { return Math.sin(x * Math.PI / 180); }
      function __cos(x)  { return Math.cos(x * Math.PI / 180); }
      function __tan(x)  { return Math.tan(x * Math.PI / 180); }
      function __asin(x) { return Math.asin(x) * 180 / Math.PI; }
      function __acos(x) { return Math.acos(x) * 180 / Math.PI; }
      function __atan(x) { return Math.atan(x) * 180 / Math.PI; }
      function __sq(x)   { return x * x; }
      function __cube(x) { return x * x * x; }
      function __inv(x)  { return 1 / x; }
      function __fact(n) {
        if (n < 0 || !Number.isInteger(n)) return NaN;
        let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
      }
    `;

    let r = Function('"use strict";' + helpers + ' return (' + safe + ')')();

    if (isNaN(r) || !isFinite(r)) {
      expression = 'Error'; isResult = false;
    } else {
      result     = fmtNum(r);
      isResult   = true;
      addHistory(orig + ' = ' + result);
    }
  } catch(e) {
    expression = 'Error'; isResult = false;
  }

  updateDisplay();
}

// ── Format angka ──
function fmtNum(n) {
  if (Math.abs(n) > 1e12 || (Math.abs(n) < 1e-8 && n !== 0))
    return n.toExponential(6);
  return parseFloat(n.toPrecision(12)).toString();
}

// ── Mode ──
function setMode(m) {
  document.getElementById('btn-std').classList.toggle('active', m === 'std');
  document.getElementById('btn-sci').classList.toggle('active', m === 'sci');
  document.getElementById('sci-panel').style.display = m === 'sci' ? 'block' : 'none';
}

// ── DEG / RAD ──
function toggleDeg() {
  isDeg = !isDeg;
  const label = isDeg ? 'DEG' : 'RAD';
  document.getElementById('degMode').textContent = label;
  document.getElementById('btn-deg').textContent = label;
}

// ── Riwayat ──
function addHistory(s) {
  history.unshift(s);
  if (history.length > 30) history.pop();
  renderHistory();
}
function clearHistory() { history = []; renderHistory(); }
function renderHistory() {
  const w = document.getElementById('hist-wrap');
  if (!history.length) {
    w.innerHTML = '<div class="history-empty">Riwayat perhitungan akan muncul di sini</div>';
    return;
  }
  w.innerHTML = history.map(h => `<div class="history-item">${h}</div>`).join('');
}

// ── Keyboard ──
document.addEventListener('keydown', function(e) {
  const k = e.key;
  if (k >= '0' && k <= '9')          appendExpr(k);
  else if (k === '.')                 appendExpr('.');
  else if (k === '+')                 appendExpr('+');
  else if (k === '-')                 appendExpr('−');
  else if (k === '*')                 appendExpr('×');
  else if (k === '/') { e.preventDefault(); appendExpr('÷'); }
  else if (k === '%')                 appendExpr('%');
  else if (k === '^')                 appendExpr('^');
  else if (k === '(')                 appendExpr('(');
  else if (k === ')')                 appendExpr(')');
  else if (k === 'Enter' || k === '=') calculate();
  else if (k === 'Backspace')         delLast();
  else if (k === 'Escape')            clearAll();
});

updateDisplay();
