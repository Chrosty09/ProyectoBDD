const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  username:     { type: String, required: true },
  email:        { type: String, required: true },
  passwordHash: { type: String, required: true },
  rol:          {
    type: String,
    enum: ['admin', 'gerente', 'cajero'],
    required: true,
  },
  sucursalId:   { type: Number, required: true }, // 0 = admin global (HQ), 1-10 = sucursal
  activo:       { type: Boolean, default: true },
}, { timestamps: true });

module.exports = usuarioSchema;
