require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker/locale/es_MX");
const bcrypt = require("bcrypt");

const productoSchema = require("../models/Producto");
const sucursalSchema = require("../models/Sucursal");
const usuarioSchema = require("../models/Usuario");
const ventaSchema = require("../models/Venta");
const inventarioSchema = require("../models/Inventario");

// ─── Datos de sucursales ────────────────────────────────────────────────────
const SUCURSALES = [
  {
    sucursalId: 1,
    nombre: "QuickMart Aguascalientes Centro",
    ciudad: "Aguascalientes",
    region: "Centro",
    direccion: "Av. Lopez Mateos 100, Centro",
    clusterKey: "s01",
  },
  {
    sucursalId: 2,
    nombre: "QuickMart Aguascalientes Norte",
    ciudad: "Aguascalientes",
    region: "Norte",
    direccion: "Blvd. Luis Donaldo Colosio 45, Norte",
    clusterKey: "s02",
  },
  {
    sucursalId: 3,
    nombre: "QuickMart Guadalajara Centro",
    ciudad: "Guadalajara",
    region: "Centro",
    direccion: "Av. Juarez 300, Centro Historico",
    clusterKey: "s03",
  },
  {
    sucursalId: 4,
    nombre: "QuickMart Zapopan",
    ciudad: "Guadalajara",
    region: "Zapopan",
    direccion: "Av. Vallarta 1200, Zapopan",
    clusterKey: "s04",
  },
  {
    sucursalId: 5,
    nombre: "QuickMart CDMX Condesa",
    ciudad: "CDMX",
    region: "Condesa",
    direccion: "Av. Amsterdam 55, Condesa",
    clusterKey: "s05",
  },
  {
    sucursalId: 6,
    nombre: "QuickMart CDMX Polanco",
    ciudad: "CDMX",
    region: "Polanco",
    direccion: "Presidente Masaryk 400, Polanco",
    clusterKey: "s06",
  },
  {
    sucursalId: 7,
    nombre: "QuickMart Monterrey Centro",
    ciudad: "Monterrey",
    region: "Centro",
    direccion: "Av. Constitucion 10, Centro",
    clusterKey: "s07",
  },
  {
    sucursalId: 8,
    nombre: "QuickMart Monterrey San Pedro",
    ciudad: "Monterrey",
    region: "San Pedro",
    direccion: "Av. Vasconcelos 210, San Pedro",
    clusterKey: "s08",
  },
  {
    sucursalId: 9,
    nombre: "QuickMart Puebla Centro",
    ciudad: "Puebla",
    region: "Centro",
    direccion: "4 Sur 100, Centro Historico",
    clusterKey: "s09",
  },
  {
    sucursalId: 10,
    nombre: "QuickMart Leon",
    ciudad: "Leon",
    region: "Guanajuato",
    direccion: "Blvd. Lopez Mateos 800, Leon",
    clusterKey: "s10",
  },
];

// ─── Catalogo de productos tipo QuickMart ───────────────────────────────────────
const CATEGORIAS = [
  {
    cat: "Bebidas",
    productos: [
      "Coca-Cola 600ml",
      "Pepsi 600ml",
      "agua Ciel 1L",
      "Gatorade 500ml",
      "Jumex Mango 330ml",
      "Squirt 600ml",
      "Jarritos Mandarina",
      "Red Bull 355ml",
      "Monster Energy",
      "Boing Guayaba",
    ],
  },
  {
    cat: "Cerveza y Alcohol",
    productos: [
      "Corona 355ml",
      "Modelo Especial 355ml",
      "Victoria 355ml",
      "Tecate 355ml",
      "XX Lager 355ml",
      "Indio 355ml",
      "Heineken 355ml",
      "Bohemia 355ml",
      "Michelob Ultra",
      "Pacifico 355ml",
    ],
  },
  {
    cat: "Snacks y Botanas",
    productos: [
      "Sabritas Original 45g",
      "Cheetos Flamin Hot",
      "Ruffles Queso",
      "Doritos Nacho",
      "Takis Fuego 62g",
      "Tostitos con Queso",
      "Fritos 45g",
      "Palomitas Act II",
      "Chicharrones Barcel",
      "Pringles Original",
    ],
  },
  {
    cat: "Dulces y Chocolates",
    productos: [
      "Snickers 52g",
      "Kit Kat 42g",
      "Milky Way",
      "Twix",
      "M&Ms Cacahuate",
      "Trident Sandia",
      "Halls Mentol",
      "Paleta Payaso",
      "Mazapan De La Rosa",
      "Glorias Cajeta",
    ],
  },
  {
    cat: "Cafe y Bebidas Calientes",
    productos: [
      "Cafe Americano Andatti",
      "Capuchino Andatti",
      "Cafe Latte Andatti",
      "Chocolate Caliente",
      "Te Lipton Manzanilla",
      "Nescafe 3en1 Clasico",
      "Cafe con Leche",
      "Mokaccino Andatti",
      "Expresso Doble",
      "Chai Latte",
    ],
  },
  {
    cat: "Cigarros",
    productos: [
      "Marlboro Rojo c/20",
      "Marlboro Gold c/20",
      "Camel Azul c/20",
      "Lucky Strike c/20",
      "Delicados c/20",
      "Montana c/20",
      "Boots c/20",
      "Winston c/20",
      "Philip Morris c/20",
      "Pall Mall c/20",
    ],
  },
  {
    cat: "Lacteos",
    productos: [
      "Leche Lala 1L",
      "Leche Alpura 1L",
      "Yogurt Yoplait Fresa",
      "Danonino Fresa",
      "Queso Oaxaca 400g",
      "Crema Lala 200g",
      "Mantequilla Gloria",
      "Leche Evaporada Carnation",
      "Yogurt Activia",
      "Danone Batido",
    ],
  },
  {
    cat: "Abarrotes",
    productos: [
      "Pan Bimbo Grande",
      "Tortillinas Tia Rosa",
      "Maruchan Camaron",
      "Maruchan Res",
      "Atun Dolores 140g",
      "Sardinas Calmex",
      "Frijoles La Sierra",
      "Arroz Morelos 1kg",
      "Aceite 1-2-3 1L",
      "Sal La Fina",
    ],
  },
  {
    cat: "Higiene Personal",
    productos: [
      "Shampoo Head Shoulders",
      "Colgate Triple Accion",
      "Gillette Sensor",
      "Desodorante Dove Men",
      "Jabon Dove 90g",
      "Kleenex 40 hojas",
      "Toallas Kotex",
      "Condones Trojan",
      "Crema Nivea 200ml",
      "Aspirina 500mg",
    ],
  },
  {
    cat: "Servicios",
    productos: [
      "Recarga Telcel 50",
      "Recarga Telcel 100",
      "Recarga AT&T 50",
      "Recarga Movistar 50",
      "Pago CFE",
      "Pago TELMEX",
      "Pago Izzi",
      "Recarga QuickMart Pay 100",
      "Bono Xbox 200",
      "Tarjeta Google Play 100",
    ],
  },
];

const METODOS_PAGO = ["efectivo", "tarjeta", "transferencia"];

// ─── Helpers ────────────────────────────────────────────────────────────────
function precioBase(categoria) {
  const precios = {
    Bebidas: [12, 35],
    "Cerveza y Alcohol": [22, 55],
    "Snacks y Botanas": [10, 30],
    "Dulces y Chocolates": [8, 25],
    "Cafe y Bebidas Calientes": [18, 45],
    Cigarros: [55, 90],
    Lacteos: [15, 65],
    Abarrotes: [12, 60],
    "Higiene Personal": [20, 120],
    Servicios: [50, 200],
  };
  const [min, max] = precios[categoria] || [10, 100];
  return parseFloat(faker.number.float({ min, max, fractionDigits: 2 }));
}

function generarProductos() {
  const productos = [];
  let skuCounter = 1000;
  for (const { cat, productos: names } of CATEGORIAS) {
    for (const nombre of names) {
      const precio = precioBase(cat);
      productos.push({
        sku: `SKU-${skuCounter++}`,
        nombre,
        categoria: cat,
        precio,
        costo: parseFloat((precio * 0.65).toFixed(2)),
        codigoBarras: faker.string.numeric(13),
        activo: true,
      });
    }
  }
  // Completar hasta 200 con productos adicionales aleatorios
  while (productos.length < 200) {
    const catObj = faker.helpers.arrayElement(CATEGORIAS);
    const precio = precioBase(catObj.cat);
    productos.push({
      sku: `SKU-${skuCounter++}`,
      nombre:
        faker.helpers.arrayElement(catObj.productos) +
        " " +
        faker.string.alphanumeric(3).toUpperCase(),
      categoria: catObj.cat,
      precio,
      costo: parseFloat((precio * 0.65).toFixed(2)),
      codigoBarras: faker.string.numeric(13),
      activo: true,
    });
  }
  return productos;
}

async function seedHQ(conn, productos) {
  console.log("\n[HQ] Sembrando cluster central...");

  const Producto = conn.model("Producto", productoSchema);
  const Sucursal = conn.model("Sucursal", sucursalSchema);
  const Usuario = conn.model("Usuario", usuarioSchema);

  await Producto.deleteMany({});
  await Sucursal.deleteMany({});
  await Usuario.deleteMany({});

  const productosInsertados = await Producto.insertMany(productos);
  console.log(`[HQ] ${productosInsertados.length} productos insertados`);

  await Sucursal.insertMany(SUCURSALES);
  console.log(`[HQ] ${SUCURSALES.length} sucursales insertadas`);

  const adminHash = await bcrypt.hash("admin1234", 10);
  await Usuario.create({
    username: "admin",
    email: "admin@quickmart.com",
    passwordHash: adminHash,
    rol: "admin",
    sucursalId: 0,
  });
  console.log("[HQ] Usuario admin creado (password: admin1234)");
  // Retornamos los documentos con sus _id generados por MongoDB
  return productosInsertados;
}

async function seedSucursal(conn, sucursal, productos) {
  const { sucursalId, nombre } = sucursal;
  console.log(
    `\n[S${String(sucursalId).padStart(2, "0")}] Sembrando ${nombre}...`,
  );

  const Usuario = conn.model("Usuario", usuarioSchema);
  const Venta = conn.model("Venta", ventaSchema);
  const Inventario = conn.model("Inventario", inventarioSchema);

  await Usuario.deleteMany({});
  await Venta.deleteMany({});
  await Inventario.deleteMany({});

  // Usuarios de la sucursal
  const gerenteHash = await bcrypt.hash("gerente1234", 10);
  const cajeroHash = await bcrypt.hash("cajero1234", 10);

  const gerente = await Usuario.create({
    username: `gerente_s${String(sucursalId).padStart(2, "0")}`,
    email: `gerente.s${sucursalId}@quickmart.com`,
    passwordHash: gerenteHash,
    rol: "gerente",
    sucursalId,
  });

  const cajeros = await Usuario.insertMany(
    Array.from({ length: 3 }, (_, i) => ({
      username: `cajero${i + 1}_s${String(sucursalId).padStart(2, "0")}`,
      email: `cajero${i + 1}.s${sucursalId}@quickmart.com`,
      passwordHash: cajeroHash,
      rol: "cajero",
      sucursalId,
    })),
  );
  console.log(`[S${String(sucursalId).padStart(2, "0")}] 4 usuarios creados`);

  // Inventario (1 registro por producto)
  const inventarioItems = productos.map((p) => ({
    sucursalId,
    productoId: p._id,
    sku: p.sku,
    nombreProducto: p.nombre,
    stock: faker.number.int({ min: 5, max: 200 }),
    nivelReorden: 10,
    ultimoSurtido: faker.date.recent({ days: 30 }),
  }));
  await Inventario.insertMany(inventarioItems);
  console.log(
    `[S${String(sucursalId).padStart(2, "0")}] ${inventarioItems.length} registros de inventario`,
  );

  // Ventas (200+ documentos con fechas distribuidas en los ultimos 6 meses)
  const usuarios = [gerente, ...cajeros];
  const ventas = [];

  for (let i = 0; i < 220; i++) {
    const numItems = faker.number.int({ min: 1, max: 5 });
    const items = [];
    let total = 0;

    for (let j = 0; j < numItems; j++) {
      const prod = faker.helpers.arrayElement(productos);
      const cantidad = faker.number.int({ min: 1, max: 4 });
      const subtotal = parseFloat((prod.precio * cantidad).toFixed(2));
      items.push({
        productoId: prod._id,
        sku: prod.sku,
        nombre: prod.nombre,
        cantidad,
        precioUnit: prod.precio,
        subtotal,
      });
      total += subtotal;
    }

    const cajero = faker.helpers.arrayElement(usuarios);
    ventas.push({
      sucursalId,
      cajeroId: cajero._id,
      cajeroNombre: cajero.username,
      items,
      total: parseFloat(total.toFixed(2)),
      metodoPago: faker.helpers.arrayElement(METODOS_PAGO),
      timestamp: faker.date.between({
        from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 meses atras
        to: new Date(),
      }),
    });
  }

  await Venta.insertMany(ventas);
  console.log(
    `[S${String(sucursalId).padStart(2, "0")}] ${ventas.length} ventas insertadas`,
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  // Clusters disponibles segun el .env
  const clusterMap = {
    hq: process.env.MONGO_HQ,
    s01: process.env.MONGO_S01,
    s02: process.env.MONGO_S02,
    s03: process.env.MONGO_S03,
    s04: process.env.MONGO_S04,
    s05: process.env.MONGO_S05,
    s06: process.env.MONGO_S06,
    s07: process.env.MONGO_S07,
    s08: process.env.MONGO_S08,
    s09: process.env.MONGO_S09,
    s10: process.env.MONGO_S10,
  };

  // Conectar solo a los clusters con URI definida
  console.log("Conectando a clusters...");
  const conns = {};
  for (const [key, uri] of Object.entries(clusterMap)) {
    if (!uri) continue;
    try {
      conns[key] = await mongoose.createConnection(uri).asPromise();
      console.log(`Conectado: ${key}`);
    } catch (e) {
      console.error(`Error en ${key}:`, e.message);
    }
  }

  // Generar productos una sola vez
  const productosGenerados = generarProductos();

  // Seed HQ — retorna los documentos con _id asignados por MongoDB
  let productos = productosGenerados;
  if (conns.hq) {
    productos = await seedHQ(conns.hq, productosGenerados);
  }

  // Seed cada sucursal disponible
  for (const suc of SUCURSALES) {
    const key = suc.clusterKey;
    if (!conns[key]) continue;
    await seedSucursal(conns[key], suc, productos);
  }

  console.log("\nSeed completado.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
