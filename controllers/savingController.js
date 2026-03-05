const Saving = require('../models/Saving');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

exports.getAllSavings = async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.year) filter.year = Number(req.query.year);
    const data = await Saving.find(filter).sort({ year: -1, monthNumber: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getSaving = async (req, res) => {
  try {
    const item = await Saving.findOne({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createSaving = async (req, res) => {
  try {
    const { month } = req.body;
    const monthNumber = MONTHS.indexOf(month) + 1;
    const item = await Saving.create({ ...req.body, userId: req.user.id, monthNumber });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updateSaving = async (req, res) => {
  try {
    if (req.body.month) req.body.monthNumber = MONTHS.indexOf(req.body.month) + 1;
    const item = await Saving.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deleteSaving = async (req, res) => {
  try {
    const item = await Saving.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
