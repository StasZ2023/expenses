import React, { useEffect, useState } from "react";


export default function FinanceNotebook() {
  const STORAGE_KEY = "finance_notebook_entries_v1";

  const [entries, setEntries] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const [form, setForm] = useState({
    type: "income", 
    amount: "",
    description: "",
    date: new Date().toISOString().slice(0, 10), 
  });

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error("Failed to save entries", e);
    }
  }, [entries]);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function addEntry(e) {
    e.preventDefault();
    const rawAmount = form.amount.toString().trim();
    if (!rawAmount) return alert("Введите сумму");

    
    const normalized = rawAmount.replace(/\s+/g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isNaN(parsed) || !isFinite(parsed)) return alert("Неверная сумма");

    const entry = {
      id: Date.now() + Math.random().toString(36).slice(2, 8),
      type: form.type,
      amount: Number(parsed),
      description: form.description.trim(),
      date: form.date,
    };

    setEntries((prev) => [entry, ...prev]);
    setForm((f) => ({ ...f, amount: "", description: "" }));
  }


  function exportCSV() {
    const header = ["id", "date", "type", "amount", "description"];
    const rows = entries.map((r) => [r.id, r.date, r.type, r.amount, `"${(r.description||"").replace(/"/g, '""')}"`]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-notebook-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleType(id) {
    setEntries((prev) => prev.map((p) => (p.id === id ? { ...p, type: p.type === "income" ? "expense" : "income" } : p)));
  }

  const filtered = entries.filter((e) => {
    if (filter === "income" && e.type !== "income") return false;
    if (filter === "expense" && e.type !== "expense") return false;
    if (query && !(`${e.description} ${e.amount} ${e.date}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  const totalIncome = entries.reduce((s, e) => s + (e.type === "income" ? e.amount : 0), 0);
  const totalExpense = entries.reduce((s, e) => s + (e.type === "expense" ? e.amount : 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="container">
  <header className="header">
    <h1>Блокнот финсов</h1>
    <p className="subtitle">Добавляйте заработок и расходы — всё сохраняется в localStorage.</p>
  </header>

  <section className="layout">
    <form onSubmit={addEntry} className="card form">
      <div className="row">
        <select name="type" value={form.type} onChange={handleFormChange} className="input">
          <option value="income">Заработал</option>
          <option value="expense">Потратил</option>
        </select>

        <input
          name="amount"
          value={form.amount}
          onChange={handleFormChange}
          placeholder="Сумма (например 1234.56)"
          className="input flex"
          inputMode="decimal"
        />

        <input name="date" type="date" value={form.date} onChange={handleFormChange} className="input w-40" />
      </div>

      <input
        name="description"
        value={form.description}
        onChange={handleFormChange}
        placeholder="Описание (пример: зарплата, продукты)"
        className="input full"
      />

      <div className="row buttons">
        <button type="submit" className="btn btn-green">Добавить</button>
        <button type="button" onClick={() => setForm((f) => ({ ...f, amount: "", description: "" }))} className="btn">
          Очистить
        </button>
        <button type="button" onClick={exportCSV} className="btn right">
          Экспорт CSV
        </button>
      </div>
    </form>

    <aside className="card sidebar">
      <div className="box">
        <h3>Итоги</h3>

        <div className="stats">
          <div className="stat"><span>Заработал</span> <b>{totalIncome.toLocaleString()}</b></div>
          <div className="stat"><span>Потратил</span> <b>{totalExpense.toLocaleString()}</b></div>
          <div className="stat top-border">
            <span>Баланс</span>
            <b className={balance < 0 ? "red" : "green"}>
              {balance.toLocaleString()}
            </b>
          </div>
        </div>
      </div>

      <div>
        <h4>Фильтр</h4>
        <div className="row">
          <button onClick={() => setFilter("all")} className={`btn small ${filter === "all" ? "active" : ""}`}>Все</button>
          <button onClick={() => setFilter("income")} className={`btn small ${filter === "income" ? "active" : ""}`}>Заработал</button>
          <button onClick={() => setFilter("expense")} className={`btn small ${filter === "expense" ? "active" : ""}`}>Потратил</button>
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск..." className="input full" />
      </div>
    </aside>
  </section>

  <section className="card">
    <h3>Записи ({filtered.length})</h3>

    {filtered.length === 0 ? (
      <p className="muted">Нет записей, добавьте первую сверху.</p>
    ) : (
      <ul className="list">
        {filtered.map((e) => (
          <li key={e.id} className="item">
            <div>
              <div className="row small">
                <span className={`amount ${e.type === "income" ? "green" : "red"}`}>
                  {e.type === "income" ? "+" : "-"}
                  {Math.abs(e.amount).toLocaleString()}
                </span>
                <span className="date">{e.date}</span>
              </div>
              <div className="desc">{e.description || <span className="muted">— без описания —</span>}</div>
            </div>

            <button onClick={() => toggleType(e.id)} className="btn small">Перекл.</button>
          </li>
        ))}
      </ul>
    )}
  </section>

  <footer className="footer">Сохранение: localStorage — данные остаются в вашем браузере.</footer>
</div>

  );
}
