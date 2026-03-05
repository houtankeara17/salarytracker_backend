// controllers/crudController.js - Generic CRUD with userId filtering
const createCrudController = (Model, name) => ({
  getAll: async (req, res) => {
    try {
      const filter = { userId: req.user.id };
      if (req.query.status) filter.status = req.query.status;
      const items = await Model.find(filter).sort({ createdAt: -1 });
      res.json({ success: true, count: items.length, data: items });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  getOne: async (req, res) => {
    try {
      const item = await Model.findOne({ _id: req.params.id, userId: req.user.id });
      if (!item) return res.status(404).json({ success: false, message: name + ' not found' });
      res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  },
  create: async (req, res) => {
    try {
      const item = await Model.create({ ...req.body, userId: req.user.id });
      res.status(201).json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
  },
  update: async (req, res) => {
    try {
      // Use findById + save so pre-save hooks (amountUSD, completedAt) run
      const item = await Model.findOne({ _id: req.params.id, userId: req.user.id });
      if (!item) return res.status(404).json({ success: false, message: name + ' not found' });
      Object.assign(item, req.body);
      await item.save();
      res.json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
  },
  delete: async (req, res) => {
    try {
      const item = await Model.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
      if (!item) return res.status(404).json({ success: false, message: name + ' not found' });
      res.json({ success: true, message: name + ' deleted successfully' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
  }
});
module.exports = createCrudController;
