require('dotenv').config();
const { sequelize, Category, Product } = require('./src/models');

const products = [
  { name: 'Microfiber Towels Pack (5pcs)', sku: 'DET-TWL-001', uom: 'Packs', costPrice: 12.00, salePrice: 22.00, minStockLevel: 15 },
  { name: 'Tire Shine Gel', sku: 'DET-TIR-001', uom: 'Liters', costPrice: 8.50, salePrice: 16.00, minStockLevel: 10 },
  { name: 'Glass Cleaner Spray', sku: 'DET-GLS-001', uom: 'Liters', costPrice: 5.00, salePrice: 10.00, minStockLevel: 20 },
  { name: 'Car Wax Polish', sku: 'DET-WAX-001', uom: 'Liters', costPrice: 15.00, salePrice: 28.00, minStockLevel: 8 },
  { name: 'Interior Dashboard Cleaner', sku: 'DET-DSH-001', uom: 'Liters', costPrice: 6.50, salePrice: 13.00, minStockLevel: 12 },
  { name: 'Foam Applicator Pads', sku: 'DET-PAD-001', uom: 'Pieces', costPrice: 1.50, salePrice: 3.50, minStockLevel: 30 },
  { name: 'Leather Conditioner', sku: 'DET-LTR-001', uom: 'Liters', costPrice: 12.00, salePrice: 24.00, minStockLevel: 10 }
];

async function seed() {
  try {
    await sequelize.authenticate();
    
    // Find or Create Category
    const [category] = await Category.findOrCreate({
      where: { name: 'AUTO DETAILING' },
      defaults: { description: 'Auto Detailing Products' }
    });
    
    let added = 0;
    for (const p of products) {
      const [product, created] = await Product.findOrCreate({
        where: { sku: p.sku },
        defaults: {
          name: p.name,
          uom: p.uom,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          minStockLevel: p.minStockLevel,
          categoryId: category.id
        }
      });
      if (!created) {
        // optionally update if already exists
        await product.update({
          name: p.name,
          uom: p.uom,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          minStockLevel: p.minStockLevel,
          categoryId: category.id
        });
      }
      added++;
    }
    console.log(`Successfully added/updated ${added} products in AUTO DETAILING category.`);
  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    process.exit();
  }
}

seed();
