import { Router } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../middleware/requireAuth';
import Transaction from '../models/Transaction';
import Budget from '../models/Budget';
import Goal from '../models/Goal';
import PaymentCard from '../models/PaymentCard';

const router = Router();
router.use(requireAuth);
const owner = (req: import('express').Request) => new Types.ObjectId(req.userId!);
const validId = (id: string) => Types.ObjectId.isValid(id);

router.get('/transactions', async (req, res) => {
  const query: Record<string, unknown> = { userId: owner(req) };
  if (req.query.kind === 'income' || req.query.kind === 'expense') query.kind = req.query.kind;
  if (typeof req.query.category === 'string' && req.query.category) query.category = req.query.category;
  if (typeof req.query.from === 'string' || typeof req.query.to === 'string') {
    const date: Record<string, Date> = {};
    if (typeof req.query.from === 'string') date.$gte = new Date(req.query.from);
    if (typeof req.query.to === 'string') date.$lte = new Date(req.query.to);
    query.date = date;
  }
  const rows = await Transaction.find(query).sort({ date: -1, createdAt: -1 }).limit(500).lean();
  res.json({ transactions: rows });
});

router.post('/transactions', async (req, res) => {
  const { description, category, kind } = req.body || {};
  const amount = Number(req.body?.amount);
  const date = req.body?.date ? new Date(req.body.date) : new Date();
  if (typeof description !== 'string' || !description.trim() || description.length > 100) return res.status(400).json({ error: 'Enter a description up to 100 characters.' });
  if (typeof category !== 'string' || !category.trim() || category.length > 40) return res.status(400).json({ error: 'Choose a valid category.' });
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero.' });
  if (kind !== 'income' && kind !== 'expense') return res.status(400).json({ error: 'Choose income or expense.' });
  if (Number.isNaN(date.getTime())) return res.status(400).json({ error: 'Enter a valid date.' });
  const transaction = await Transaction.create({ userId: owner(req), description:description.trim(), category:category.trim(), amount, kind, date });
  res.status(201).json({ transaction });
});

router.patch('/transactions/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid transaction id.' });
  const updates: Record<string, unknown> = {};
  const { description, category, kind } = req.body || {};
  if (typeof description === 'string' && description.trim() && description.length <= 100) updates.description = description.trim();
  if (typeof category === 'string' && category.trim() && category.length <= 40) updates.category = category.trim();
  if (kind === 'income' || kind === 'expense') updates.kind = kind;
  if (req.body?.amount !== undefined) { const amount = Number(req.body.amount); if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Amount must be greater than zero.' }); updates.amount = amount; }
  if (req.body?.date !== undefined) { const date = new Date(req.body.date); if (Number.isNaN(date.getTime())) return res.status(400).json({ error: 'Enter a valid date.' }); updates.date = date; }
  const transaction = await Transaction.findOneAndUpdate({ _id:req.params.id, userId:owner(req) }, { $set:updates }, { new:true, runValidators:true });
  if (!transaction) return res.status(404).json({ error: 'Transaction not found.' });
  res.json({ transaction });
});

router.delete('/transactions/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid transaction id.' });
  const deleted = await Transaction.findOneAndDelete({ _id:req.params.id, userId:owner(req) });
  if (!deleted) return res.status(404).json({ error: 'Transaction not found.' });
  res.status(204).end();
});

router.get('/budgets', async (req, res) => {
  const query:Record<string,unknown>={userId:owner(req)};
  if(typeof req.query.month==='string')query.month=req.query.month;
  const budgets = await Budget.find(query).sort({ month:-1, category:1 }).lean();
  res.json({ budgets });
});

router.put('/budgets', async (req, res) => {
  const { category, month } = req.body || {};
  const limit = Number(req.body?.limit);
  if (typeof category !== 'string' || !category.trim() || category.length > 40) return res.status(400).json({ error: 'Enter a valid budget category.' });
  if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'Choose a valid month.' });
  if (!Number.isFinite(limit) || limit <= 0) return res.status(400).json({ error: 'Budget limit must be greater than zero.' });
  const budget = await Budget.findOneAndUpdate({ userId:owner(req), month, category:category.trim() }, { $set:{ limit } }, { new:true, upsert:true, runValidators:true, setDefaultsOnInsert:true });
  res.json({ budget });
});

router.delete('/budgets/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid budget id.' });
  const deleted = await Budget.findOneAndDelete({ _id:req.params.id, userId:owner(req) });
  if (!deleted) return res.status(404).json({ error: 'Budget not found.' });
  res.status(204).end();
});

router.get('/goals', async (req, res) => {
  const goals = await Goal.find({ userId:owner(req) }).sort({ createdAt:-1 }).lean();
  res.json({ goals });
});

router.post('/goals', async (req, res) => {
  const { name, emoji, color } = req.body || {};
  const target = Number(req.body?.target);
  const saved = req.body?.saved === undefined ? 0 : Number(req.body.saved);
  const targetDate = req.body?.targetDate ? new Date(req.body.targetDate) : undefined;
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 60) return res.status(400).json({ error: 'Goal name must be between 2 and 60 characters.' });
  if (!Number.isFinite(target) || target <= 0 || !Number.isFinite(saved) || saved < 0 || saved > target) return res.status(400).json({ error: 'Enter valid goal and saved amounts.' });
  if (targetDate && Number.isNaN(targetDate.getTime())) return res.status(400).json({ error: 'Enter a valid target date.' });
  const goal = await Goal.create({ userId:owner(req), name:name.trim(), emoji:typeof emoji === 'string' ? emoji.slice(0, 8) : '🎯', target, saved, color:typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : '#05d6a3', targetDate });
  res.status(201).json({ goal });
});

router.patch('/goals/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid goal id.' });
  const updates: Record<string, unknown> = {};
  if (typeof req.body?.name === 'string' && req.body.name.trim().length >= 2 && req.body.name.length <= 60) updates.name = req.body.name.trim();
  if (req.body?.target !== undefined) { const target = Number(req.body.target); if (!Number.isFinite(target) || target <= 0) return res.status(400).json({ error: 'Target must be greater than zero.' }); updates.target = target; }
  if (req.body?.targetDate !== undefined) { const date = req.body.targetDate ? new Date(req.body.targetDate) : null; if (date && Number.isNaN(date.getTime())) return res.status(400).json({ error: 'Enter a valid target date.' }); updates.targetDate = date; }
  const goal = await Goal.findOneAndUpdate({ _id:req.params.id, userId:owner(req) }, { $set:updates }, { new:true, runValidators:true });
  if (!goal) return res.status(404).json({ error: 'Goal not found.' });
  res.json({ goal });
});

router.post('/goals/:id/contributions', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid goal id.' });
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'Contribution must be greater than zero.' });
  const goal = await Goal.findOne({ _id:req.params.id, userId:owner(req) });
  if (!goal) return res.status(404).json({ error: 'Goal not found.' });
  goal.saved = Math.min(goal.target, goal.saved + amount);
  await goal.save();
  res.json({ goal });
});

router.delete('/goals/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid goal id.' });
  const deleted = await Goal.findOneAndDelete({ _id:req.params.id, userId:owner(req) });
  if (!deleted) return res.status(404).json({ error: 'Goal not found.' });
  res.status(204).end();
});

router.get('/cards', async (req, res) => {
  const cards = await PaymentCard.find({ userId:owner(req) }).sort({ createdAt:-1 }).lean();
  res.json({ cards });
});

router.post('/cards', async (req, res) => {
  const { label, issuer, kind, last4, color } = req.body || {};
  if (typeof label !== 'string' || !label.trim() || label.length > 40) return res.status(400).json({ error: 'Enter a card nickname.' });
  if (typeof issuer !== 'string' || !issuer.trim() || issuer.length > 30) return res.status(400).json({ error: 'Enter a bank or card issuer.' });
  if (kind !== 'debit' && kind !== 'credit') return res.status(400).json({ error: 'Choose debit or credit.' });
  if (typeof last4 !== 'string' || !/^\d{4}$/.test(last4)) return res.status(400).json({ error: 'Enter the last 4 digits only.' });
  const card = await PaymentCard.create({ userId:owner(req), label:label.trim(), issuer:issuer.trim(), kind, last4, color:typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : '#05d6a3' });
  res.status(201).json({ card });
});

router.delete('/cards/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid card id.' });
  const deleted = await PaymentCard.findOneAndDelete({ _id:req.params.id, userId:owner(req) });
  if (!deleted) return res.status(404).json({ error: 'Card not found.' });
  res.status(204).end();
});

router.post('/assistant', async (req, res) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim().slice(0, 500) : '';
  if (!question) return res.status(400).json({ error: 'Ask a question about your finances.' });
  const userId = owner(req);
  const month = new Date().toISOString().slice(0, 7);
  const monthStart = new Date(`${month}-01T00:00:00.000Z`);
  const monthEnd = new Date(monthStart); monthEnd.setUTCMonth(monthEnd.getUTCMonth()+1);
  const [incomeRows, expenseRows, categoryRows, goals, budgets, monthCategories] = await Promise.all([
    Transaction.aggregate([{ $match:{ userId, kind:'income' } }, { $group:{ _id:null, total:{ $sum:'$amount' } } }]),
    Transaction.aggregate([{ $match:{ userId, kind:'expense' } }, { $group:{ _id:null, total:{ $sum:'$amount' } } }]),
    Transaction.aggregate([{ $match:{ userId, kind:'expense' } }, { $group:{ _id:'$category', total:{ $sum:'$amount' } } }, { $sort:{ total:-1 } }, { $limit:5 }]),
    Goal.find({ userId }).select('name target saved').lean(),
    Budget.find({ userId, month }).select('category limit').lean(),
    Transaction.aggregate([{ $match:{ userId, kind:'expense', date:{ $gte:monthStart, $lt:monthEnd } } }, { $group:{ _id:'$category', total:{ $sum:'$amount' } } }]),
  ]);
  const income = incomeRows[0]?.total || 0;
  const expenses = expenseRows[0]?.total || 0;
  const lower = question.toLowerCase();
  let answer: string;
  if (lower.includes('goal') || lower.includes('sav')) {
    const saved = goals.reduce((sum, goal) => sum + goal.saved, 0);
    const target = goals.reduce((sum, goal) => sum + goal.target, 0);
    answer = goals.length ? `You have ${goals.length} active savings goals. Together, you’ve saved ${saved.toFixed(2)} of ${target.toFixed(2)} (${target ? Math.round(saved / target * 100) : 0}% complete).` : 'You haven’t created a savings goal yet. Open Savings Goals to add your first one.';
  } else if (lower.includes('budget')) {
    answer = budgets.length ? budgets.map(b=>{const spent=monthCategories.find(row=>row._id===b.category)?.total||0;return `${b.category}: ${Number(spent).toFixed(2)} of ${b.limit.toFixed(2)} used`;}).join('. ')+'.' : 'There are no budgets for this month yet. Open Budgets to set category limits.';
  } else if (lower.includes('income') || lower.includes('earn')) {
    answer = `Your recorded income totals ${income.toFixed(2)}. Your recorded expenses total ${expenses.toFixed(2)}, leaving ${ (income - expenses).toFixed(2)} before budgets and goals.`;
  } else if (lower.includes('spend') || lower.includes('expense') || lower.includes('where')) {
    const top = categoryRows.map(row => `${row._id}: ${Number(row.total).toFixed(2)}`).join(', ');
    answer = top ? `Your recorded spending totals ${expenses.toFixed(2)}. Highest categories: ${top}.` : 'There are no expenses recorded yet. Add transactions to see a spending breakdown.';
  } else {
    answer = `Your recorded income is ${income.toFixed(2)} and spending is ${expenses.toFixed(2)}. You have ${goals.length} savings goals. Ask about spending, income, budgets, or savings for a focused breakdown.`;
  }
  res.json({ answer });
});

export default router;
