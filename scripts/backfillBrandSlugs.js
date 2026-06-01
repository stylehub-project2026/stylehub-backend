// backend/scripts/backfillBrandSlugs.js
// Run ONCE to generate brandSlug for sellers that registered before this feature.
// Usage: node scripts/backfillBrandSlugs.js

require('dotenv').config();
const mongoose = require('mongoose');
const Seller = require('../models/Seller');

(async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGO_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB\n');

    const sellers = await Seller.find({
      $or: [
        { brandSlug: { $exists: false } },
        { brandSlug: null },
        { brandSlug: '' }
      ]
    });

    if (sellers.length === 0) {
      console.log('All sellers already have a brandSlug. Nothing to do.');
      process.exit(0);
    }

    console.log('Found ' + sellers.length + ' seller(s) needing a slug:\n');

    let successCount = 0;
    let failCount = 0;

    for (const seller of sellers) {
      try {
        await seller.save();
        console.log('  OK  ' + seller.brandName.padEnd(30) + ' -> ' + seller.brandSlug);
        successCount++;
      } catch (err) {
        console.error('  FAIL ' + seller.brandName.padEnd(30) + ' -> ERROR: ' + err.message);
        failCount++;
      }
    }

    console.log('\nDone! ' + successCount + ' updated, ' + failCount + ' failed.');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
})();
