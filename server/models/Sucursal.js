const mongoose = require('mongoose');

const sucursalSchema = new mongoose.Schema({
  sucursalId: { type: Number, required: true, unique: true }, // 1-10
  nombre:     { type: String, required: true },
  ciudad:     { type: String, required: true },
  region:     { type: String },
  direccion:  { type: String },
  clusterKey: { type: String, required: true }, // 's01', 's02', etc.
  activa:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = sucursalSchema;
