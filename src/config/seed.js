require('dotenv').config();
const pool = require('./database');

async function initDB() {
  const client = await pool.connect();
  try {
    console.log('Iniciando configuración de base de datos...');
    await client.query('BEGIN');

    // Tabla de sesiones (requerida por connect-pg-simple)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`);

    // Tabla de usuarios (schema público)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        foto TEXT,
        rol VARCHAR(20) DEFAULT 'estudiante' CHECK (rol IN ('estudiante','docente','admin')),
        fecha_registro TIMESTAMP DEFAULT NOW(),
        ultimo_acceso TIMESTAMP DEFAULT NOW(),
        activo BOOLEAN DEFAULT TRUE
      );
    `);

    // Schema plantilla con tablas de Inversiones Uniatlantico SAS
    await client.query(`CREATE SCHEMA IF NOT EXISTS plantilla`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plantilla.empresa (
        id SERIAL PRIMARY KEY,
        razon_social VARCHAR(255) DEFAULT 'Inversiones Uniatlantico S.A.S.',
        nit VARCHAR(20) DEFAULT '900.123.456-7',
        digito_verificacion INTEGER DEFAULT 7,
        tipo_sociedad VARCHAR(100) DEFAULT 'S.A.S.',
        fecha_constitucion DATE DEFAULT '2018-03-15',
        representante_legal VARCHAR(255) DEFAULT 'Camila Torres Herrera',
        domicilio VARCHAR(255) DEFAULT 'Calle 72 No. 54-30, Piso 3 - Barranquilla, Atlántico',
        email VARCHAR(255) DEFAULT 'contacto@inversionesunatlantico.com.co',
        telefono VARCHAR(50) DEFAULT '(605) 3401234',
        ciiu_principal VARCHAR(10) DEFAULT '4690',
        ciiu_secundario VARCHAR(10) DEFAULT '7020',
        regimen VARCHAR(100) DEFAULT 'Régimen ordinario',
        responsable_iva BOOLEAN DEFAULT TRUE,
        agente_retencion BOOLEAN DEFAULT TRUE,
        obligado_fe BOOLEAN DEFAULT TRUE,
        capital_social BIGINT DEFAULT 800000000,
        anno_gravable INTEGER DEFAULT 2025
      );
      INSERT INTO plantilla.empresa DEFAULT VALUES ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plantilla.clientes (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(10) UNIQUE NOT NULL,
        razon_social VARCHAR(255) NOT NULL,
        nit VARCHAR(30) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        actividad VARCHAR(255),
        regimen_iva VARCHAR(50),
        tarifa_retefuente DECIMAL(5,2),
        concepto_retefuente VARCHAR(100),
        email VARCHAR(255),
        ciudad VARCHAR(100) DEFAULT 'Barranquilla',
        activo BOOLEAN DEFAULT TRUE
      );
    `);

    // Insertar clientes de Inversiones Uniatlantico
    await client.query(`
      INSERT INTO plantilla.clientes (codigo,razon_social,nit,tipo,actividad,regimen_iva,tarifa_retefuente,concepto_retefuente,email) VALUES
      ('C-01','Tecno Norte S.A.S.','901.234.100-5','Jurídica','Tecnología','19%',3.50,'Compras','tecnorte@ejemplo.co'),
      ('C-02','Distribuidora del Caribe Ltda.','800.456.200-8','Jurídica','Comercio','19%',3.50,'Compras','distcaribe@ejemplo.co'),
      ('C-03','Constructora Palermo S.A.','830.789.300-2','Jurídica','Construcción','19%',3.50,'Compras','palermo@ejemplo.co'),
      ('C-04','Clínica Regional S.A.S.','900.321.400-1','Jurídica','Salud','Mixto',3.50,'Compras/Honorarios','clinica@ejemplo.co'),
      ('C-05','Alcaldía de Soledad','890.001.500-3','Entidad pública','Gobierno local','Exento',2.50,'Servicios','alcaldia@ejemplo.co'),
      ('C-06','Pedro Martínez','1.140.777.600-4','P. natural declarante','Independiente','19%',3.50,'Compras','pedro@ejemplo.co'),
      ('C-07','Agroindustrial Costa Ltda.','811.222.700-6','Jurídica','Agroindustria','Mixto',3.50,'Compras','agrocosta@ejemplo.co'),
      ('C-08','Universidad Simón Bolívar','891.333.800-9','Entidad educativa','Educación','Excluido',2.50,'Servicios','usb@ejemplo.co')
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plantilla.proveedores (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(10) UNIQUE NOT NULL,
        razon_social VARCHAR(255) NOT NULL,
        nit VARCHAR(30) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        bien_servicio VARCHAR(255),
        tarifa_iva DECIMAL(5,2),
        tarifa_retefuente DECIMAL(5,2),
        concepto_retefuente VARCHAR(100),
        email VARCHAR(255),
        activo BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      INSERT INTO plantilla.proveedores (codigo,razon_social,nit,tipo,bien_servicio,tarifa_iva,tarifa_retefuente,concepto_retefuente,email) VALUES
      ('P-01','Importech Colombia S.A.S.','900.888.111-3','Jurídica','Equipos tecnológicos',19,3.50,'Compras','importech@ejemplo.co'),
      ('P-02','Papelería Central Barranquilla S.A.S.','901.777.222-6','Jurídica','Insumos oficina',19,3.50,'Compras','papeleria@ejemplo.co'),
      ('P-03','Asesorías Jurídicas del Norte Ltda.','800.666.333-9','Jurídica','Honorarios legales',19,11,'Honorarios','asejuridica@ejemplo.co'),
      ('P-04','Arrendadora Inmobiliaria Caribe S.A.','830.555.444-2','Jurídica','Arrendamiento oficina',0,3.50,'Arrendamientos','arrendadora@ejemplo.co'),
      ('P-05','Seguros Atlántico S.A.','890.444.555-5','Jurídica','Pólizas seguro',0,0,'No aplica','seguros@ejemplo.co'),
      ('P-06','Publicidad Digital Norte S.A.S.','901.333.666-8','Jurídica','Servicios publicidad',19,4,'Servicios','pubdigital@ejemplo.co'),
      ('P-07','Servicios Generales Caribe S.A.S.','900.222.777-1','Jurídica','Aseo y mantenimiento',19,2,'Servicios','servgenerales@ejemplo.co'),
      ('P-08','Banco de Bogotá S.A.','890.111.888-4','Entidad financiera','Servicios bancarios',0,0,'No aplica','banco@ejemplo.co')
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plantilla.empleados (
        id SERIAL PRIMARY KEY,
        numero INTEGER UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        cargo VARCHAR(255) NOT NULL,
        area VARCHAR(100) NOT NULL,
        salario_basico BIGINT NOT NULL,
        auxilio_transporte BIGINT DEFAULT 0,
        tipo_contrato VARCHAR(50) DEFAULT 'Indefinido',
        clase_riesgo_arl VARCHAR(20) DEFAULT 'I',
        porcentaje_arl DECIMAL(5,3) DEFAULT 0.522,
        activo BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      INSERT INTO plantilla.empleados (numero,nombre,cargo,area,salario_basico,auxilio_transporte,clase_riesgo_arl,porcentaje_arl) VALUES
      (1,'Camila Torres Herrera','Gerente General / Rep. Legal','Dirección',6500000,0,'I',0.522),
      (2,'Ricardo Peña Orozco','Director Financiero','Finanzas',5200000,0,'I',0.522),
      (3,'Marcela Roa Quintero','Jefe de Consultoría','Consultoría',4800000,0,'I',0.522),
      (4,'Andrés Fuentes Díaz','Asesor Comercial Senior','Comercial',3500000,0,'I',0.522),
      (5,'Luisa Mendoza Soto','Contadora','Finanzas',3200000,0,'I',0.522),
      (6,'Jorge Caballero Pinto','Auxiliar Contable','Finanzas',1800000,200000,'I',0.522),
      (7,'Valentina Gómez Cruz','Asistente Administrativa','Administración',1600000,200000,'I',0.522),
      (8,'Carlos Álvarez Suárez','Auxiliar de Bodega','Comercial',1423500,200000,'II',1.044)
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plantilla.transacciones (
        id SERIAL PRIMARY KEY,
        documento VARCHAR(20) NOT NULL,
        fecha DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        contraparte_codigo VARCHAR(10),
        contraparte_nombre VARCHAR(255) NOT NULL,
        concepto TEXT NOT NULL,
        subtotal BIGINT NOT NULL DEFAULT 0,
        iva BIGINT NOT NULL DEFAULT 0,
        retencion BIGINT NOT NULL DEFAULT 0,
        total BIGINT NOT NULL DEFAULT 0,
        mes INTEGER NOT NULL,
        anno INTEGER NOT NULL DEFAULT 2025,
        estado VARCHAR(30) DEFAULT 'vigente',
        es_caso_atipico BOOLEAN DEFAULT FALSE,
        codigo_caso VARCHAR(10),
        notas_pedagogicas TEXT,
        tipo_iva VARCHAR(30) DEFAULT 'gravado',
        editable BOOLEAN DEFAULT TRUE
      );
    `);

    // Insertar transacciones enero 2025
    await client.query(`
      INSERT INTO plantilla.transacciones
      (documento,fecha,tipo,contraparte_codigo,contraparte_nombre,concepto,subtotal,iva,retencion,total,mes,tipo_iva) VALUES
      ('FV-001','2025-01-03','Factura venta','C-01','Tecno Norte S.A.S.','Venta 5 laptops Lenovo',12500000,2375000,-437500,14437500,1,'gravado'),
      ('FV-002','2025-01-08','Factura venta','C-02','Distribuidora del Caribe Ltda.','Venta insumos oficina lote',4200000,798000,-147000,4851000,1,'gravado'),
      ('FV-003','2025-01-15','Factura venta consultoría','C-03','Constructora Palermo S.A.','Honorarios asesoría estratégica enero',8000000,1520000,-880000,8640000,1,'gravado'),
      ('FC-001','2025-01-17','Factura compra','P-01','Importech Colombia S.A.S.','Compra 8 laptops para comercialización',16000000,3040000,-560000,18480000,1,'gravado'),
      ('FC-002','2025-01-20','Factura compra','P-02','Papelería Central Barranquilla S.A.S.','Insumos de oficina',1800000,342000,-63000,2079000,1,'gravado'),
      ('FC-003','2025-01-22','Factura compra','P-04','Arrendadora Inmobiliaria Caribe S.A.','Canon arrendamiento enero',3500000,0,-122500,3377500,1,'excluido'),
      ('NC-001','2025-01-28','Nota crédito','C-02','Distribuidora del Caribe Ltda.','Devolución parcial FV-002 (daño embalaje)',-800000,-152000,28000,-924000,1,'gravado')
      ON CONFLICT DO NOTHING;
    `);

    // Febrero
    await client.query(`
      INSERT INTO plantilla.transacciones
      (documento,fecha,tipo,contraparte_codigo,contraparte_nombre,concepto,subtotal,iva,retencion,total,mes,tipo_iva) VALUES
      ('FV-004','2025-02-05','Factura venta','C-04','Clínica Regional S.A.S.','Venta equipos médicos administración',22000000,4180000,-770000,25410000,2,'gravado'),
      ('FV-005','2025-02-10','Factura venta consultoría','C-01','Tecno Norte S.A.S.','Honorarios diagnóstico tecnológico',5500000,1045000,-605000,5940000,2,'gravado'),
      ('FV-006','2025-02-14','Factura venta','C-05','Alcaldía de Soledad','Suministro insumos entidad pública',9000000,0,-225000,8775000,2,'exento'),
      ('FC-004','2025-02-07','Factura compra','P-01','Importech Colombia S.A.S.','Compra switches y routers',8500000,1615000,-297500,9817500,2,'gravado'),
      ('FC-005','2025-02-12','Factura compra','P-03','Asesorías Jurídicas del Norte Ltda.','Honorarios legales febrero',2000000,380000,-220000,2160000,2,'gravado'),
      ('FC-006','2025-02-15','Factura compra','P-06','Publicidad Digital Norte S.A.S.','Campaña digital febrero',1500000,285000,-60000,1725000,2,'gravado'),
      ('ANT-001','2025-02-20','Anticipo recibido','C-03','Constructora Palermo S.A.','Anticipo contrato consultoría 6 meses',18000000,0,-630000,17370000,2,'gravado')
      ON CONFLICT DO NOTHING;
    `);

    // Marzo (incluye activo fijo)
    await client.query(`
      INSERT INTO plantilla.transacciones
      (documento,fecha,tipo,contraparte_codigo,contraparte_nombre,concepto,subtotal,iva,retencion,total,mes,tipo_iva,es_caso_atipico,codigo_caso,notas_pedagogicas) VALUES
      ('FV-007','2025-03-04','Factura venta consultoría','C-03','Constructora Palermo S.A.','Honorarios consultoría marzo (amortiza anticipo)',3000000,570000,-330000,3240000,3,'gravado',FALSE,NULL,NULL),
      ('FV-008','2025-03-10','Factura venta','C-07','Agroindustrial Costa Ltda.','Venta equipos agroindustriales',7500000,0,-262500,7237500,3,'exento',TRUE,'A-06','CASO A-06: Este bien debería clasificarse como EXCLUIDO, no exento. El estudiante debe detectar y corregir la clasificación.'),
      ('FV-009','2025-03-18','Factura venta','C-06','Pedro Martínez','Venta impresoras y accesorios',2800000,532000,-98000,3234000,3,'gravado',FALSE,NULL,NULL),
      ('FC-007','2025-03-05','Factura compra','P-01','Importech Colombia S.A.S.','Compra impresoras para comercialización',5200000,988000,-182000,6006000,3,'gravado',FALSE,NULL,NULL),
      ('FC-008','2025-03-08','Factura compra','P-07','Servicios Generales Caribe S.A.S.','Servicio aseo marzo',900000,171000,-18000,1053000,3,'gravado',FALSE,NULL,NULL),
      ('AF-001','2025-03-20','Activo fijo','P-01','Importech Colombia S.A.S.','Compra vehículo repartidor (nuevo)',85000000,16150000,-2975000,98175000,3,'gravado',FALSE,NULL,NULL),
      ('ND-001','2025-03-25','Nota débito','C-07','Agroindustrial Costa Ltda.','Ajuste precio por calidad entregada',500000,0,-17500,482500,3,'excluido',FALSE,NULL,NULL)
      ON CONFLICT DO NOTHING;
    `);

    // Transacciones resumidas 2T-3T (registros agregados por mes para los cálculos)
    await client.query(`
      INSERT INTO plantilla.transacciones
      (documento,fecha,tipo,contraparte_codigo,contraparte_nombre,concepto,subtotal,iva,retencion,total,mes,tipo_iva) VALUES
      ('RES-ABR','2025-04-30','Resumen mes','--','Varios','Resumen transacciones abril 2025',38500000,6270000,-1820000,42950000,4,'gravado'),
      ('RES-MAY','2025-05-31','Resumen mes','--','Varios','Resumen transacciones mayo 2025',42100000,7125000,-2050000,47175000,5,'gravado'),
      ('RES-JUN','2025-06-30','Resumen mes','--','Varios','Resumen transacciones junio 2025',55800000,8900000,-2750000,61950000,6,'gravado'),
      ('RES-JUL','2025-07-31','Resumen mes','--','Varios','Resumen transacciones julio 2025',44200000,7420000,-2100000,49520000,7,'gravado'),
      ('RES-AGO','2025-08-31','Resumen mes','--','Varios','Resumen transacciones agosto 2025',48900000,8100000,-2400000,54600000,8,'gravado')
      ON CONFLICT DO NOTHING;
    `);

    // Septiembre - incluye factura rechazada (caso A-01)
    await client.query(`
      INSERT INTO plantilla.transacciones
      (documento,fecha,tipo,contraparte_codigo,contraparte_nombre,concepto,subtotal,iva,retencion,total,mes,tipo_iva,es_caso_atipico,codigo_caso,notas_pedagogicas,estado) VALUES
      ('RES-SEP','2025-09-30','Resumen mes','--','Varios','Resumen transacciones septiembre 2025',51300000,8600000,-2550000,57350000,9,'gravado',FALSE,NULL,NULL,'vigente'),
      ('FV-REJ','2025-09-15','Factura venta','C-01','Tecno Norte S.A.S.','Venta equipos - CUFE inválido (rechazada)',8500000,1615000,-297500,9817500,9,'gravado',TRUE,'A-01','CASO A-01: Esta factura fue RECHAZADA por la autoridad tributaria por CUFE inválido. El estudiante debe emitir nota crédito y reexpedir la factura corregida.','rechazada')
      ON CONFLICT DO NOTHING;
    `);

    // Octubre 2025 detallado (incluye caso A-05: retención omitida en FC-019)
    await client.query(`
      INSERT INTO plantilla.transacciones
      (documento,fecha,tipo,contraparte_codigo,contraparte_nombre,concepto,subtotal,iva,retencion,total,mes,tipo_iva,es_caso_atipico,codigo_caso,notas_pedagogicas) VALUES
      ('FV-045','2025-10-03','Factura venta','C-01','Tecno Norte S.A.S.','Venta 10 servidores rack',28000000,5320000,-980000,32340000,10,'gravado',FALSE,NULL,NULL),
      ('FV-046','2025-10-07','Factura venta consultoría','C-04','Clínica Regional S.A.S.','Honorarios transformación digital octubre',12000000,2280000,-1320000,12960000,10,'gravado',FALSE,NULL,NULL),
      ('FV-047','2025-10-14','Factura venta','C-08','Universidad Simón Bolívar','Suministro equipos (excluido)',6500000,0,-162500,6337500,10,'excluido',FALSE,NULL,NULL),
      ('FV-048','2025-10-22','Factura venta','C-02','Distribuidora del Caribe Ltda.','Venta insumos lote 4T',9800000,1862000,-343000,11319000,10,'gravado',FALSE,NULL,NULL),
      ('FC-019','2025-10-06','Factura compra','P-01','Importech Colombia S.A.S.','Compra servidores para reventa',18500000,3515000,0,22015000,10,'gravado',TRUE,'A-05','CASO A-05: Esta factura de compra NO tiene retención practicada. Debería tener 3,5% = $647.500. El estudiante debe detectar y corregir el error.'),
      ('FC-020','2025-10-10','Factura compra','P-03','Asesorías Jurídicas del Norte Ltda.','Honorarios legales octubre',2500000,475000,-275000,2700000,10,'gravado',FALSE,NULL,NULL),
      ('FC-021','2025-10-15','Factura compra','P-04','Arrendadora Inmobiliaria Caribe S.A.','Canon arrendamiento octubre',3500000,0,-122500,3377500,10,'excluido',FALSE,NULL,NULL),
      ('FC-022','2025-10-20','Factura compra','P-06','Publicidad Digital Norte S.A.S.','Pauta digital 4T octubre',2200000,418000,-88000,2530000,10,'gravado',FALSE,NULL,NULL),
      ('DS-001','2025-10-25','Documento soporte','--','Persona natural no obligada a FE','Pago flete local (no obligado FE)',450000,0,-18000,432000,10,'excluido',FALSE,NULL,NULL)
      ON CONFLICT DO NOTHING;
    `);

    // Noviembre 2025 (incluye requerimiento REQ-001 y caso A-04)
    await client.query(`
      INSERT INTO plantilla.transacciones
      (documento,fecha,tipo,contraparte_codigo,contraparte_nombre,concepto,subtotal,iva,retencion,total,mes,tipo_iva,es_caso_atipico,codigo_caso,notas_pedagogicas) VALUES
      ('FV-049','2025-11-04','Factura venta','C-07','Agroindustrial Costa Ltda.','Venta equipos agroindustriales (excluidos)',14000000,0,-490000,13510000,11,'excluido',FALSE,NULL,NULL),
      ('FV-050','2025-11-10','Factura venta consultoría','C-01','Tecno Norte S.A.S.','Honorarios plan estratégico TI noviembre',10000000,1900000,-1100000,10800000,11,'gravado',FALSE,NULL,NULL),
      ('FV-051','2025-11-18','Factura venta','C-03','Constructora Palermo S.A.','Venta insumos construcción oficinas',8200000,1558000,-287000,9471000,11,'gravado',FALSE,NULL,NULL),
      ('FV-052','2025-11-25','Factura venta','C-06','Pedro Martínez','Venta computador más software',3800000,722000,-133000,4389000,11,'gravado',FALSE,NULL,NULL),
      ('FC-023','2025-11-05','Factura compra','P-01','Importech Colombia S.A.S.','Compra equipos agroindustriales',9500000,1805000,-332500,10972500,11,'gravado',FALSE,NULL,NULL),
      ('FC-024','2025-11-12','Factura compra','P-02','Papelería Central Barranquilla S.A.S.','Insumos noviembre',1100000,209000,-38500,1270500,11,'gravado',FALSE,NULL,NULL),
      ('FC-025','2025-11-16','Factura compra','P-07','Servicios Generales Caribe S.A.S.','Servicio aseo noviembre',950000,180500,-19000,1111500,11,'gravado',FALSE,NULL,NULL),
      ('GSS-001','2025-11-30','Gasto sin soporte','--','Proveedor no identificado','Pago sin factura ni documento soporte válido',3500000,0,0,3500000,11,'gravado',TRUE,'A-02','CASO A-02: Este gasto NO tiene soporte válido (sin FE ni documento equivalente). No es deducible en renta. El estudiante debe excluirlo del formulario 110.')
      ON CONFLICT DO NOTHING;
    `);

    // Diciembre 2025
    await client.query(`
      INSERT INTO plantilla.transacciones
      (documento,fecha,tipo,contraparte_codigo,contraparte_nombre,concepto,subtotal,iva,retencion,total,mes,tipo_iva,es_caso_atipico,codigo_caso,notas_pedagogicas) VALUES
      ('FV-053','2025-12-03','Factura venta consultoría','C-04','Clínica Regional S.A.S.','Honorarios cierre año',15000000,2850000,-1650000,16200000,12,'gravado',FALSE,NULL,NULL),
      ('FV-054','2025-12-08','Factura venta','C-01','Tecno Norte S.A.S.','Venta lote final equipos diciembre',35000000,6650000,-1225000,40425000,12,'gravado',FALSE,NULL,NULL),
      ('FV-055','2025-12-12','Factura venta','C-02','Distribuidora del Caribe Ltda.','Venta insumos diciembre',7200000,1368000,-252000,8316000,12,'gravado',FALSE,NULL,NULL),
      ('FV-056','2025-12-19','Factura venta consultoría','C-03','Constructora Palermo S.A.','Honorarios diciembre - último amortiza anticipo',3000000,570000,-330000,3240000,12,'gravado',FALSE,NULL,NULL),
      ('FV-057','2025-12-22','Factura venta','C-05','Alcaldía de Soledad','Suministro cierre contrato estatal',11000000,0,-275000,10725000,12,'exento',FALSE,NULL,NULL),
      ('FC-026','2025-12-05','Factura compra','P-01','Importech Colombia S.A.S.','Compra equipos cierre año',22000000,4180000,-770000,25410000,12,'gravado',FALSE,NULL,NULL),
      ('FC-027','2025-12-10','Factura compra','P-04','Arrendadora Inmobiliaria Caribe S.A.','Canon arrendamiento diciembre',3500000,0,-122500,3377500,12,'excluido',FALSE,NULL,NULL),
      ('FC-028','2025-12-15','Factura compra','P-03','Asesorías Jurídicas del Norte Ltda.','Honorarios legales diciembre',2800000,532000,-308000,3024000,12,'gravado',FALSE,NULL,NULL),
      ('AF-002','2025-12-18','Activo fijo','P-02','Papelería Central Barranquilla S.A.S.','Compra mobiliario oficina',8500000,1615000,-297500,9817500,12,'gravado',FALSE,NULL,NULL),
      ('NC-005','2025-12-20','Nota crédito','C-02','Distribuidora del Caribe Ltda.','Descuento por volumen anual',-1200000,-228000,42000,-1386000,12,'gravado',FALSE,NULL,NULL)
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plantilla.nomina (
        id SERIAL PRIMARY KEY,
        empleado_id INTEGER NOT NULL,
        mes INTEGER NOT NULL,
        anno INTEGER NOT NULL DEFAULT 2025,
        salario_basico BIGINT NOT NULL,
        auxilio_transporte BIGINT DEFAULT 0,
        total_devengado BIGINT NOT NULL,
        descuento_salud BIGINT DEFAULT 0,
        descuento_pension BIGINT DEFAULT 0,
        retencion_fuente BIGINT DEFAULT 0,
        total_deducciones BIGINT DEFAULT 0,
        neto_pagar BIGINT NOT NULL,
        aporte_salud_empleador BIGINT DEFAULT 0,
        aporte_pension_empleador BIGINT DEFAULT 0,
        aporte_arl BIGINT DEFAULT 0,
        costo_total_empleador BIGINT DEFAULT 0,
        documento_soporte_generado BOOLEAN DEFAULT FALSE,
        UNIQUE(empleado_id, mes, anno)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plantilla.activos_fijos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(20) UNIQUE NOT NULL,
        descripcion VARCHAR(255) NOT NULL,
        fecha_adquisicion DATE NOT NULL,
        costo_adquisicion BIGINT NOT NULL,
        vida_util_anos INTEGER NOT NULL,
        depreciacion_anual BIGINT NOT NULL,
        depreciacion_mensual BIGINT NOT NULL,
        depreciacion_acumulada BIGINT DEFAULT 0,
        valor_en_libros BIGINT NOT NULL,
        proveedor_codigo VARCHAR(10),
        activo BOOLEAN DEFAULT TRUE,
        observaciones TEXT
      );
    `);

    await client.query(`
      INSERT INTO plantilla.activos_fijos
      (codigo,descripcion,fecha_adquisicion,costo_adquisicion,vida_util_anos,depreciacion_anual,depreciacion_mensual,depreciacion_acumulada,valor_en_libros,proveedor_codigo,observaciones) VALUES
      ('AF-001','Vehículo repartidor (nuevo)','2025-03-20',85000000,5,17000000,1416667,12750003,72249997,'P-01','Adquirido mar.2025 - 9 meses depreciac. en 2025'),
      ('AF-002','Mobiliario de oficina','2025-12-18',8500000,10,850000,70833,35416,8464584,'P-02','Adquirido dic.2025 - 0.5 meses depreciac. en 2025'),
      ('AF-EXI','Equipos de cómputo propios','2022-01-15',18000000,3,6000000,500000,18000000,0,'P-01','Totalmente depreciados a dic.2025')
      ON CONFLICT DO NOTHING;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS plantilla.anticipos (
        id SERIAL PRIMARY KEY,
        documento VARCHAR(20) NOT NULL,
        fecha DATE NOT NULL,
        cliente_codigo VARCHAR(10),
        cliente_nombre VARCHAR(255) NOT NULL,
        concepto TEXT NOT NULL,
        valor_total BIGINT NOT NULL,
        valor_amortizado BIGINT DEFAULT 0,
        valor_pendiente BIGINT NOT NULL,
        es_caso_atipico BOOLEAN DEFAULT FALSE,
        codigo_caso VARCHAR(10),
        notas TEXT
      );
    `);

    await client.query(`
      INSERT INTO plantilla.anticipos
      (documento,fecha,cliente_codigo,cliente_nombre,concepto,valor_total,valor_amortizado,valor_pendiente,es_caso_atipico,codigo_caso,notas) VALUES
      ('ANT-001','2025-02-20','C-03','Constructora Palermo S.A.','Anticipo contrato consultoría 6 meses',18000000,12000000,6000000,TRUE,'A-03','CASO A-03: Este anticipo tiene $6.000.000 SIN amortizar. Las FV de consultoría solo amortizaron $12.000.000. El estudiante debe identificar el saldo pendiente y proponer ajuste o devolución.')
      ON CONFLICT DO NOTHING;
    `);

    // Tabla de progreso del estudiante
    await client.query(`
      CREATE TABLE IF NOT EXISTS progreso_estudiantes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        semana INTEGER NOT NULL,
        actividad VARCHAR(255) NOT NULL,
        completado BOOLEAN DEFAULT FALSE,
        fecha_completado TIMESTAMP,
        notas TEXT,
        UNIQUE(usuario_id, semana, actividad)
      );
    `);

    await client.query('COMMIT');
    console.log('Base de datos inicializada correctamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inicializando la base de datos:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initDB()
  .then(async () => {
    // Crear tablas del módulo de evaluaciones (pool ya cerrado arriba, usar uno nuevo)
    const { crearTablasEvaluaciones } = require('./evaluaciones');
    const pool2 = require('./database');
    try {
      await crearTablasEvaluaciones();
    } finally {
      await pool2.end();
    }
  })
  .catch(console.error);
