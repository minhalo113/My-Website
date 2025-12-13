// import mongoose from 'mongoose';
// import dbConnect from '../utils/db.js';
// import productModel from '../models/productModel.js';


// // Change productModel.js to     
// // colorPrices: {
// //      type: Object,
// //      default: {}
// //  }, 
// // to use

// (async () => {
//   try {
//     await dbConnect();
//     const products = await productModel.find({});

//     for (const product of products) {
//       const prices = product.colorPrices;
//       console.log(product.name)
//       console.log(prices)
//       if (prices && !Array.isArray(prices)) {
//         const colors = Array.isArray(product.colors) ? product.colors : [];
//         const arr = colors.length
//           ? colors.map(c => {
//               const val = prices[c];
//               return val !== undefined ? parseFloat(val) : 0;
//             })
//           : Object.values(prices).map(v => parseFloat(v));
//         product.colorPrices = arr;
//         await product.save();
//         console.log(`Updated product ${product._id}`);
//       }
//     }
//   } catch (err) {
//     console.error(err);
//   } finally {
//     mongoose.connection.close();
//   }
// })();