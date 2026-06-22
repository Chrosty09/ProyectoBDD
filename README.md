# QuickMart - Sistema Web Distribuido para Bases de Datos Distribuidas

QuickMart es una aplicación web distribuida que simula el sistema de ventas de una cadena de tiendas de conveniencia. El proyecto está diseñado para demostrar, con código funcional, conceptos clave de Bases de Datos Distribuidas: fragmentación horizontal, fragmentación derivada, reconstrucción de información distribuida, replicación administrada por MongoDB Atlas, control de acceso por rol y reportes multi-nodo.

La aplicación está compuesta por un frontend React/Vite, un backend Node.js/Express y 11 conexiones MongoDB Atlas: un nodo central HQ y 10 nodos de sucursal.

## Objetivo del Sistema

El objetivo principal es tener un sistema demostrable y defendible técnicamente. QuickMart permite:

- Iniciar sesión por sucursal y rol.
- Registrar ventas desde un punto de venta funcional.
- Consultar catálogo global desde HQ.
- Descontar inventario real en la sucursal correspondiente.
- Guardar cada venta en el cluster de su sucursal.
- Consultar reportes globales reconstruidos desde varios nodos.
- Visualizar el estado técnico de HQ y sucursales.
- Explicar la arquitectura distribuida desde este README.

## Características Principales

- Login por nodo/sucursal.
- Roles `admin`, `gerente` y `cajero`.
- POS con búsqueda de productos desde inventario real.
- Carrito con cantidades, subtotales, piezas y total.
- Ticket básico al confirmar una venta.
- Historial reciente de ventas por sucursal.
- Consulta de inventario por sucursal.
- Reportes con KPIs, gráficas y filtros de fecha.
- Tabla de estado de consulta por sucursal.
- Exportación CSV del reporte por sucursal.
- Vista de nodos conectada a `/api/nodos/status`.
- Backend multi-cluster con Mongoose.
- Manejo de errores parciales por nodo.

## Tecnologías Usadas

Frontend:

- React 19.2.x
- Vite 8.0.x
- Tailwind CSS 4.3.x
- Axios 1.17.x
- Recharts 3.8.x

Backend:

- Node.js
- Express 5.2.x
- Mongoose 9.7.x
- JSON Web Tokens con `jsonwebtoken`
- `bcrypt` para hash de contraseñas
- `dotenv` para variables de entorno
- `cors` para comunicación frontend-backend
- `@faker-js/faker` para datos demo

Base de datos:

- MongoDB Atlas
- 11 clusters/conexiones independientes
- Replica Set administrado por Atlas en cada cluster

Herramientas recomendadas:

- Git
- npm
- MongoDB Compass
- Postman, Thunder Client o curl
- Render para backend
- Vercel para frontend

## Arquitectura del Sistema

QuickMart usa una arquitectura de tres capas:

1. Presentación: frontend React/Vite.
2. Aplicación: API REST Node.js/Express.
3. Datos: clusters MongoDB Atlas distribuidos.

```text
[Cliente Web React/Vite]
          |
          v
[API Backend Node/Express]
          |
          +---- [HQ  - Productos / Sucursales / Admin]
          |
          +---- [S01 - Ventas / Inventario / Usuarios]
          |
          +---- [S02 - Ventas / Inventario / Usuarios]
          |
          +---- [S03 - Ventas / Inventario / Usuarios]
          |
          +---- [...]
          |
          +---- [S10 - Ventas / Inventario / Usuarios]
```

Puntos importantes:

- El frontend nunca se conecta directamente a MongoDB.
- El backend actúa como API Gateway.
- `server/config/db.js` administra conexiones a `hq`, `s01`, `s02`, ..., `s10`.
- HQ concentra el catálogo y datos corporativos.
- Cada sucursal tiene su propio cluster lógico/físico.
- Las rutas deciden qué cluster consultar según el rol y el `sucursalId`.

## Distribución de Datos

Nodo HQ:

- `productos`
- `sucursales`
- usuario `admin`
- catálogo global

Nodos S01-S10:

- `ventas` de esa sucursal
- `inventario` de esa sucursal
- usuarios `gerente` y `cajero` de esa sucursal

Ejemplo:

```text
S01 guarda ventas e inventario de Aguascalientes Centro.
S02 guarda ventas e inventario de Aguascalientes Norte.
S10 guarda ventas e inventario de León.
HQ guarda productos y sucursales.
```

## Fragmentación Horizontal

La colección `ventas` se fragmenta horizontalmente por `sucursalId`.

Regla de fragmentación:

```text
venta.sucursalId = 1  -> cluster s01
venta.sucursalId = 2  -> cluster s02
venta.sucursalId = 3  -> cluster s03
...
venta.sucursalId = 10 -> cluster s10
```

Propiedades formales:

- Completitud: toda venta válida pertenece a alguna sucursal del 1 al 10.
- Disjunción: una venta de S01 no se guarda también como venta de S02.
- Reconstrucción: el reporte global se reconstruye consultando varias sucursales y agregando resultados en backend.

En código, esta lógica se apoya en `getConnBySucursal(sucursalId)` dentro de `server/config/db.js`.

## Fragmentación Derivada

El inventario se almacena en el mismo nodo donde ocurren las ventas de la sucursal. Esto es fragmentación derivada porque depende de la misma llave de distribución: `sucursalId`.

Ejemplo:

```text
Inventario S01 -> cluster s01
Inventario S02 -> cluster s02
Inventario S10 -> cluster s10
```

Cuando un cajero de S01 vende un producto, el sistema descuenta únicamente inventario de S01. No toca inventario de otras sucursales.

## Replicación

MongoDB Atlas administra internamente Replica Sets en sus clusters. En este proyecto no se configura manualmente un Replica Set desde código.

Diferencia importante:

- Fragmentación: divide datos entre clusters diferentes según sucursal.
- Replicación: copia datos dentro de un mismo cluster para disponibilidad y tolerancia a fallos.

La replicación de Atlas no sustituye la fragmentación. QuickMart usa fragmentación a nivel de aplicación y deja la replicación interna en manos de Atlas.

## Por Qué No Se Usa Sharding

No se usa sharding nativo de MongoDB porque:

- El proyecto busca demostrar distribución manual por nodos/sucursales.
- Atlas M0 gratuito no está pensado para sharding avanzado.
- La fragmentación se implementa desde la capa de aplicación usando múltiples conexiones Mongoose.
- Es más claro para una demo académica mostrar explícitamente HQ, S01, S02, ..., S10.

## Estructura del Proyecto

```text
ProyectoBDD/
  README.md
  client/
    .env.example
    package.json
    src/
      api/axios.js
      context/AuthContext.jsx
      pages/Login.jsx
      pages/PuntoDeVenta.jsx
      pages/Reportes.jsx
      pages/Nodos.jsx
  server/
    .env.example
    package.json
    index.js
    config/db.js
    middleware/auth.js
    models/
      Inventario.js
      Producto.js
      Sucursal.js
      Usuario.js
      Venta.js
    routes/
      auth.js
      productos.js
      inventario.js
      ventas.js
      reportes.js
      nodos.js
    seed/seed.js
```

## Variables de Entorno

Backend `server/.env`:

```env
PORT=4000
NODE_ENV=development
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173

MONGO_HQ=
MONGO_S01=
MONGO_S02=
MONGO_S03=
MONGO_S04=
MONGO_S05=
MONGO_S06=
MONGO_S07=
MONGO_S08=
MONGO_S09=
MONGO_S10=
```

Frontend `client/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

No subas `.env` reales a GitHub. Usa `.env.example` como plantilla.

## Instalación Local

Backend:

```bash
cd server
npm install
copy .env.example .env
npm run seed
npm run dev
```

Frontend:

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

URLs locales:

```text
Backend:  http://localhost:4000
Frontend: http://localhost:5173
```

## Scripts Disponibles

Backend:

```bash
npm run dev    # inicia con node --watch
npm start      # inicia en modo normal
npm run seed   # inserta datos demo
npm test       # placeholder sin pruebas automatizadas
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Usuarios Demo

| Rol | Usuario | Contraseña | Sucursal |
| --- | --- | --- | --- |
| Admin | `admin` | `admin1234` | `0` |
| Gerente S01 | `gerente_s01` | `gerente1234` | `1` |
| Gerente S02 | `gerente_s02` | `gerente1234` | `2` |
| Cajero S01 | `cajero1_s01` | `cajero1234` | `1` |
| Cajero S02 | `cajero1_s02` | `cajero1234` | `2` |
| Cajero S10 | `cajero1_s10` | `cajero1234` | `10` |

El seed crea gerentes y varios cajeros por sucursal.

## Roles y RBAC

Admin:

- Inicia sesión en sucursal `0`.
- Consulta reportes globales.
- Consulta estado de nodos.
- Consulta inventario de cualquier sucursal.
- No registra ventas directas porque no pertenece a una sucursal operativa.

Gerente:

- Inicia sesión en su sucursal.
- Consulta reportes de su sucursal.
- Consulta inventario de su sucursal.
- Puede usar el POS de su sucursal.

Cajero:

- Inicia sesión en su sucursal.
- Usa el POS.
- Consulta historial operativo de su sucursal.
- No tiene acceso a reportes globales.

## Endpoints Principales

Todas las rutas `/api/*` protegidas requieren:

```http
Authorization: Bearer TOKEN
```

### Health

`GET /health`

Descripción: verifica que la API responde sin consultar todos los clusters.

Respuesta:

```json
{
  "ok": true,
  "service": "QuickMart API",
  "timestamp": "2026-06-15T00:00:00.000Z",
  "uptime": 120,
  "environment": "development"
}
```

### Auth

`POST /api/auth/login`

Roles: público.

Body:

```json
{
  "username": "cajero1_s01",
  "password": "cajero1234",
  "sucursalId": 1
}
```

Respuesta:

```json
{
  "token": "jwt...",
  "usuario": {
    "id": "...",
    "username": "cajero1_s01",
    "rol": "cajero",
    "sucursalId": 1
  }
}
```

### Productos

`GET /api/productos`

Roles: usuario autenticado.

Query params:

- `q`
- `sku`
- `categoria`
- `activo`
- `page`
- `limite`

Respuesta:

```json
{
  "productos": [],
  "total": 200,
  "page": 1,
  "limite": 20,
  "totalPages": 10
}
```

`GET /api/productos/:sku`

Busca un producto activo por SKU en HQ.

### Inventario

`GET /api/inventario/sucursal/:sucursalId`

Roles:

- Admin: cualquier sucursal.
- Gerente/cajero: solo su sucursal.

Query params:

- `q`
- `bajoStock`
- `categoria`
- `page`
- `limite`

Respuesta:

```json
{
  "inventario": [],
  "total": 200,
  "page": 1,
  "limite": 20,
  "totalPages": 10,
  "sucursalId": 1
}
```

### Ventas

`POST /api/ventas`

Roles: usuarios de sucursal operativa.

Body:

```json
{
  "items": [
    { "sku": "SKU-1000", "cantidad": 2 }
  ],
  "metodoPago": "efectivo"
}
```

Métodos permitidos:

- `efectivo`
- `tarjeta`
- `transferencia`
- `vales`

Errores esperados:

- `400` datos inválidos.
- `403` usuario sin sucursal operativa.
- `404` producto inexistente/inactivo.
- `409` stock insuficiente.

`GET /api/ventas/:id?sucursalId=1`

Consulta detalle de venta.

`GET /api/ventas/sucursal/:sucursalId`

Query params:

- `desde`
- `hasta`
- `page`
- `limite`
- `metodoPago`
- `cajero`

### Reportes

`GET /api/reportes/ventas-por-sucursal`

Roles: admin/gerente.

Query params:

- `desde`
- `hasta`
- `sucursales=1,2,3`

Respuesta:

```json
{
  "sucursales": [
    {
      "sucursalId": 1,
      "totalVentas": 12345.67,
      "numVentas": 200,
      "ticketPromedio": 61.72,
      "error": null
    }
  ]
}
```

`GET /api/reportes/ventas-por-dia/:sucursalId`

`GET /api/reportes/productos-top/:sucursalId?limite=10`

`GET /api/reportes/metodos-pago/:sucursalId`

### Nodos

`GET /api/nodos/status`

Roles:

- Admin: todos los nodos.
- Gerente: HQ y su sucursal.
- Cajero: su sucursal.

Respuesta:

```json
{
  "nodos": [
    {
      "key": "s01",
      "nombre": "Sucursal 01",
      "sucursalId": 1,
      "tipo": "sucursal",
      "connected": true,
      "readyState": 1,
      "latenciaMs": 12,
      "colecciones": ["ventas", "inventarios", "usuarios"],
      "conteos": {
        "ventas": 200,
        "inventario": 200,
        "usuarios": 4
      },
      "error": null
    }
  ]
}
```

Si un nodo falla, el endpoint no rompe toda la respuesta; marca error solo en ese nodo.

## Flujo de una Venta

1. Cajero inicia sesión en una sucursal.
2. Frontend guarda el token JWT.
3. POS consulta inventario de la sucursal.
4. El producto se muestra con datos enriquecidos desde HQ.
5. Cajero agrega productos al carrito.
6. Cajero confirma venta.
7. Backend valida usuario, sucursal, items, método de pago, productos y stock.
8. Backend descuenta inventario en el cluster de la sucursal.
9. Backend guarda venta en el cluster de la sucursal.
10. POS muestra ticket.
11. POS refresca inventario e historial.
12. Reportes reconstruyen datos consultando nodos.

## Reportes Distribuidos

El admin puede consultar múltiples sucursales. El backend ejecuta agregaciones por sucursal y combina los resultados.

La ruta `ventas-por-sucursal` usa consultas paralelas y tolera fallos parciales. Si un cluster falla, las demás sucursales siguen respondiendo y el frontend muestra `Error parcial` en la tabla de estado.

## Pantallas Implementadas

Login:

- Selección de sucursal.
- Usuario y contraseña.
- Carga JWT y perfil de usuario.

Punto de Venta:

- Búsqueda de productos por nombre/SKU.
- Consulta de inventario real.
- Stock visible.
- Carrito con cantidades.
- Total y piezas.
- Métodos de pago.
- Ticket básico.
- Historial reciente.

Reportes:

- KPIs.
- Filtros rápidos de fecha.
- Rango personalizado.
- Gráficas con Recharts.
- Tabla por sucursal.
- Exportación CSV.
- Errores parciales por nodo.

Nodos:

- HQ y sucursales visibles por rol.
- Estado de conexión.
- Latencia.
- Colecciones.
- Conteos.

## Pruebas Manuales

Checklist backend:

- [ ] `npm run dev` inicia sin errores.
- [ ] `GET /health` responde.
- [ ] Login admin funciona.
- [ ] Login cajero funciona.
- [ ] `GET /api/productos` devuelve productos.
- [ ] `GET /api/inventario/sucursal/1` devuelve inventario.
- [ ] `POST /api/ventas` registra venta válida.
- [ ] Venta válida descuenta inventario.
- [ ] Venta con stock insuficiente responde `409`.
- [ ] `GET /api/ventas/sucursal/1` muestra historial.
- [ ] `GET /api/reportes/ventas-por-sucursal` responde.
- [ ] `GET /api/nodos/status` responde.

Checklist frontend:

- [ ] `npm run dev` inicia.
- [ ] Login renderiza.
- [ ] Admin entra a reportes, no a POS.
- [ ] Cajero entra a POS.
- [ ] POS carga productos.
- [ ] Carrito calcula total.
- [ ] Venta genera ticket.
- [ ] Historial se actualiza.
- [ ] Reportes muestran gráficas.
- [ ] Filtros cambian resultados.
- [ ] CSV se descarga.
- [ ] Nodos muestran estado.
- [ ] `npm run build` compila.

Comandos útiles:

```bash
curl http://localhost:4000/health
```

```bash
curl -X POST http://localhost:4000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin1234\",\"sucursalId\":0}"
```

Con token:

```bash
curl http://localhost:4000/api/productos?limite=5 ^
  -H "Authorization: Bearer TOKEN"

curl http://localhost:4000/api/nodos/status ^
  -H "Authorization: Bearer TOKEN"
```

## Despliegue

Backend en Render:

- Root: `server`
- Build command: `npm install`
- Start command: `npm start`
- Variables: todas las de `server/.env.example`
- Verificar: `https://TU_BACKEND/health`

Frontend en Vercel:

- Root: `client`
- Build command: `npm run build`
- Output: `dist`
- Variable: `VITE_API_URL=https://TU_BACKEND/api`

MongoDB Atlas:

- Crear/usar clusters HQ y S01-S10.
- Configurar usuario de base de datos.
- Configurar IP allowlist para local y Render.
- Ejecutar `npm run seed` antes de la demo.

## Problemas Comunes

`querySrv ECONNREFUSED` o errores DNS:

- Revisa conexión a internet.
- Revisa URI `mongodb+srv`.
- Revisa DNS o red local.

Error de CORS:

- Revisa `CLIENT_URL` en backend.
- Revisa `VITE_API_URL` en frontend.

Token inválido:

- Cierra sesión y vuelve a entrar.
- Revisa `JWT_SECRET`.

No hay productos:

- Ejecuta `npm run seed`.
- Verifica conexión HQ.

No hay stock:

- Ejecuta seed.
- Prueba otra sucursal o producto.

Render cold start:

- El primer request puede tardar.
- Usa `/health` antes de la demo.

MongoDB Atlas IP bloqueada:

- Agrega tu IP actual.
- Agrega salida de Render si aplica.

`VITE_API_URL` mal configurado:

- Debe terminar en `/api`.
- Ejemplo: `https://quickmart-api.onrender.com/api`

## Limitaciones Técnicas

- No hay transacciones distribuidas globales entre clusters.
- La consistencia entre HQ y sucursales es controlada por la aplicación.
- No se usa sharding nativo.
- Replica Set es administrado por MongoDB Atlas.
- El proyecto tiene fines académicos.
- La exportación CSV es del resumen actualmente cargado en pantalla.
- El bundle frontend puede mostrar warning por Recharts mayor a 500 kB; no es fatal.

## Guion Rápido de Demo

1. Abrir frontend.
2. Iniciar como `admin` en sucursal `0`.
3. Mostrar reportes globales.
4. Exportar CSV.
5. Abrir vista de nodos.
6. Explicar HQ y sucursales.
7. Cerrar sesión.
8. Iniciar como `cajero1_s01` en sucursal `1`.
9. Buscar producto.
10. Agregar productos al carrito.
11. Confirmar venta.
12. Mostrar ticket.
13. Mostrar historial.
14. Volver como admin o gerente.
15. Mostrar reporte actualizado.
16. Explicar que la venta se guardó en cluster `s01`.

## Puntos Clave

- La venta se fragmenta por `sucursalId`.
- Inventario está fragmentado de forma derivada.
- HQ no guarda ventas de sucursal.
- Los reportes reconstruyen información distribuida.
- Atlas administra replicación interna.
- No se usa sharding porque la fragmentación se controla desde la aplicación.
- RBAC limita el acceso según rol y sucursal.
- Un nodo caído no debe romper todo el reporte global.

## Estado Final Esperado

El proyecto queda listo para una demo local o desplegada:

- Backend con endpoints funcionales.
- Frontend con login, POS, reportes y nodos.
- README como documento central.
- Variables de entorno sin secretos.
- Build de frontend validable con `npm run build`.
- Flujo de venta defendible técnicamente.
