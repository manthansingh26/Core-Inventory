const express = require('express');
const router = express.Router();
const { Warehouse, WarehouseLocation } = require('../models');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll({ 
      where: { isActive: true }, 
      order: [['name', 'ASC']],
      include: [{ model: WarehouseLocation, as: 'locations' }]
    });
    res.json({ success: true, data: warehouses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id, {
      include: [{ model: WarehouseLocation, as: 'locations' }]
    });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found.' });
    res.json({ success: true, data: warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    // Optionally create a default location
    await WarehouseLocation.create({
      name: 'Main Stock',
      code: 'MAIN',
      type: 'stock',
      WarehouseId: warehouse.id
    });
    res.status(201).json({ success: true, data: warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found.' });
    await warehouse.update(req.body);
    res.json({ success: true, data: warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found.' });
    await warehouse.update({ isActive: false });
    res.json({ success: true, message: 'Warehouse deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
