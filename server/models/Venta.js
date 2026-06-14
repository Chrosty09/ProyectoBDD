const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productoId:  { type: mongoose.Schema.Types.ObjectId, required: true },
  sku:         { type: String, required: true },
  nombre:      { type: String, required: true },
  cantidad:    { type: Number, required: true, min: 1 },
  precioUnit:  { type: Number, required: true },
  subtotal:    { type: Number, required: true },
}, { _id: false });

const ventaSchema = new mongoose.Schema({
  sucursalId:   { type: Number, required: true },
  cajeroId:     { type: mongoose.Schema.Types.ObjectId, required: true },
  cajeroNombre: { type: String },
  items:        { type: [itemSchema], required: true },
  total:        { type: Number, required: true },
  metodoPago:   {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia'],
    required: true,
  },
  timestamp:    { type: Date, default: Date.now },
}, { timestamps: true });

// Indice para acelerar reportes por fecha y sucursal
ventaSchema.index({ sucursalId: 1, timestamp: -1 });

module.exports = ventaSchema;
