const mongoose = require('mongoose');

const inventarioSchema = new mongoose.Schema({
  sucursalId:    { type: Number, required: true },
  productoId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  sku:           { type: String, required: true },
  nombreProducto:{ type: String },
  stock:         { type: Number, required: true, min: 0 },
  nivelReorden:  { type: Number, default: 10 },
  ultimoSurtido: { type: Date, default: Date.now },
}, { timestamps: true });

inventarioSchema.index({ sucursalId: 1, sku: 1 }, { unique: true });

module.exports = inventarioSchema;
