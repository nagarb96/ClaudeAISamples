// Calculator logic is kept separate from the DOM so it can be tested in Node.
const SYMBOLS = { "+": "+", "-": "−", "*": "×", "/": "÷" };

function compute(a, op, b) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
  }
  return b;
}

function format(n) {
  if (!Number.isFinite(n)) return "Error";
  // Round away floating point noise such as 0.1 + 0.2.
  return String(parseFloat(n.toPrecision(12)));
}

class Calculator {
  constructor() { this.clear(); }

  clear() {
    this.current = "0";   // string being typed / shown
    this.acc = null;      // left operand
    this.op = null;       // pending operator
    this.fresh = true;    // next digit starts a new number
    this.expr = "";
  }

  get error() { return this.current === "Error"; }

  digit(d) {
    if (this.error) this.clear();
    if (this.fresh) { this.current = d; this.fresh = false; }
    else if (this.current === "0") this.current = d;
    else if (this.current.replace(/[-.]/g, "").length < 15) this.current += d;
  }

  dot() {
    if (this.error) this.clear();
    if (this.fresh) { this.current = "0."; this.fresh = false; }
    else if (!this.current.includes(".")) this.current += ".";
  }

  operator(op) {
    if (this.error) return;
    // Chain: 2 + 3 + ... evaluates 2 + 3 first. Changing operator before
    // typing a second number just swaps the operator.
    if (this.op && !this.fresh) this.#evaluate();
    else this.acc = parseFloat(this.current);
    this.op = op;
    this.fresh = true;
    this.expr = `${format(this.acc)} ${SYMBOLS[op]}`;
  }

  equals() {
    if (this.error || !this.op) return;
    const left = format(this.acc);
    const right = this.current;
    const sym = SYMBOLS[this.op];
    this.#evaluate();
    this.expr = `${left} ${sym} ${right} =`;
    this.op = null;
    this.acc = null;
  }

  sign() {
    if (this.error || this.current === "0") return;
    this.current = this.current.startsWith("-") ? this.current.slice(1) : "-" + this.current;
  }

  percent() {
    if (this.error) return;
    this.current = format(parseFloat(this.current) / 100);
    this.fresh = true;
  }

  #evaluate() {
    const result = compute(this.acc, this.op, parseFloat(this.current));
    this.current = format(result);
    this.acc = result;
    this.fresh = true;
  }
}

if (typeof module !== "undefined") module.exports = { Calculator, compute, format };

if (typeof document !== "undefined") {
  const calc = new Calculator();
  const valueEl = document.getElementById("value");
  const exprEl = document.getElementById("expr");

  const render = () => {
    valueEl.textContent = calc.current;
    exprEl.textContent = calc.expr;
    valueEl.style.fontSize = calc.current.length > 9 ? "32px" : "";
  };

  const actions = {
    clear: () => calc.clear(),
    sign: () => calc.sign(),
    percent: () => calc.percent(),
    dot: () => calc.dot(),
    equals: () => calc.equals(),
  };

  document.querySelector(".keys").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const { digit, op, action } = btn.dataset;
    if (digit !== undefined) calc.digit(digit);
    else if (op) calc.operator(op);
    else if (action) actions[action]();
    render();
  });

  document.addEventListener("keydown", (e) => {
    const k = e.key;
    if (/^[0-9]$/.test(k)) calc.digit(k);
    else if ("+-*/".includes(k)) calc.operator(k);
    else if (k === "." ) calc.dot();
    else if (k === "Enter" || k === "=") { e.preventDefault(); calc.equals(); }
    else if (k === "Escape" || k === "c" || k === "C") calc.clear();
    else if (k === "%") calc.percent();
    else return;
    render();
  });

  render();
}
