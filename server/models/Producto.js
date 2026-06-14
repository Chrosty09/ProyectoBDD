const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  sku:          { type: String, required: true, unique: true },
  nombre:       { type: String, required: true },
  categoria:    {
    type: String,
    enum: [
      'Bebidas',
      'Cerveza y Alcohol',
      'Snacks y Botanas',
      'Dulces y Chocolates',
      'Cafe y Bebidas Calientes',
      'Cigarros',
      'Lacteos',
      'Abarrotes',
      'Higiene Personal',
      'Servicios',
    ],
    required: true,
  },
  precio:       { type: Number, required: true },
  costo:        { type: Number, required: true },
  codigoBarras: { type: String },
  activo:       { type: Boolean, default: true },
}, { timestamps: true });

// El modelo se registra sobre una conexion especifica (HQ)
// Se usa como: getConn('hq').model('Producto', productoSchema)
module.exports = productoSchema;
