const pool = require('./database');

// Datos incrustados directamente — no dependen de archivos externos
const PLAN_CUENTAS_PUC = [["1","Activo","D","clase",null],["11","Disponible","D","grupo","1"],["1105","Caja general","D","cuenta","11"],["110505","Caja principal","D","subcuenta","1105"],["1110","Bancos","D","cuenta","11"],["111005","Bancolombia cta cte 123-456","D","subcuenta","1110"],["111010","Banco Bogotá cta cte 789-012","D","subcuenta","1110"],["111015","Banco Davivienda","D","subcuenta","1110"],["11101505","Banco Davivienda cta cte 100-12345-6","D","auxiliar","111015"],["13","Deudores","D","grupo","1"],["1305","Clientes","D","cuenta","13"],["130505","Clientes nacionales","D","subcuenta","1305"],["13050505","Cartera clientes nacionales","D","auxiliar","130505"],["1330","Anticipos y avances","D","cuenta","13"],["133005","Anticipos a proveedores","D","subcuenta","1330"],["1355","Anticipo de impuestos y contribuciones","D","cuenta","13"],["135510","Anticipo impuesto de renta","D","subcuenta","1355"],["135515","Retención en la fuente — a favor","D","subcuenta","1355"],["13551505","Retención en la fuente — a favor","D","auxiliar","135515"],["135517","IVA retenido — a favor","D","subcuenta","1355"],["14","Inventarios","D","grupo","1"],["1430","Mercancías no fabricadas por la empresa","D","cuenta","14"],["143005","Mercancía disponible para venta","D","subcuenta","1430"],["14300505","Inventario — Laptops","D","auxiliar","143005"],["14300510","Inventario — Computadores all-in-one","D","auxiliar","143005"],["14300515","Inventario — Accesorios tecnológicos","D","auxiliar","143005"],["14300520","Inventario — Muebles de oficina","D","auxiliar","143005"],["15","Propiedades planta y equipo","D","grupo","1"],["1524","Equipo de oficina","D","cuenta","15"],["152405","Computadores y equipos","D","subcuenta","1524"],["152410","Muebles y enseres","D","subcuenta","1524"],["15241005","Escritorios ejecutivos (5 unidades)","D","auxiliar","152410"],["15241010","Sillas ergonómicas (8 unidades)","D","auxiliar","152410"],["15241015","Archivadores metálicos (4 unidades)","D","auxiliar","152410"],["15241020","Mesa de juntas y sillas de sala","D","auxiliar","152410"],["15241025","Estanterías y muebles de recepción","D","auxiliar","152410"],["1592","Depreciación acumulada","C","cuenta","15"],["159205","Dep. acumulada equipo de oficina","C","subcuenta","1592"],["15920505","Dep. acum. — Escritorios ejecutivos","C","auxiliar","159205"],["15920510","Dep. acum. — Sillas ergonómicas","C","auxiliar","159205"],["15920515","Dep. acum. — Archivadores metálicos","C","auxiliar","159205"],["15920520","Dep. acum. — Mesa de juntas","C","auxiliar","159205"],["15920525","Dep. acum. — Estanterías y muebles recepción","C","auxiliar","159205"],["17","Diferidos","D","grupo","1"],["1705","Gastos pagados por anticipado","D","cuenta","17"],["170510","Seguros pagados por anticipado","D","subcuenta","1705"],["2","Pasivo","C","clase",null],["21","Obligaciones financieras","C","grupo","2"],["2105","Bancos nacionales","C","cuenta","21"],["210505","Obligación bancaria","C","subcuenta","2105"],["22","Proveedores","C","grupo","2"],["2205","Proveedores nacionales","C","cuenta","22"],["220505","Proveedores bienes","C","subcuenta","2205"],["22050505","Proveedores nacionales — bienes","C","auxiliar","220505"],["220510","Proveedores servicios","C","subcuenta","2205"],["23","Cuentas por pagar","C","grupo","2"],["2335","Costos y gastos por pagar","C","cuenta","23"],["233505","Honorarios por pagar","C","subcuenta","2335"],["23350515","Honorarios por pagar — Asesorías Jurídicas del Norte","C","auxiliar","233505"],["233510","Arrendamientos por pagar","C","subcuenta","2335"],["23351005","Arrendamiento por pagar — Arrendadora Inmobiliaria Caribe","C","auxiliar","233510"],["233515","Servicios públicos por pagar","C","subcuenta","2335"],["23351505","Servicios públicos por pagar","C","auxiliar","233515"],["2365","Retención en la fuente","C","cuenta","23"],["236505","Retención sobre salarios","C","subcuenta","2365"],["236540","Retención compras","C","subcuenta","2365"],["23654005","Retención en la fuente por compras 2.5%","C","auxiliar","236540"],["236515","Retención honorarios","C","subcuenta","2365"],["23651505","Retención honorarios por pagar — 11%","C","auxiliar","236515"],["236520","Retención servicios","C","subcuenta","2365"],["23652005","Retención servicios por pagar — 4%","C","auxiliar","236520"],["236525","Retención arrendamientos","C","subcuenta","2365"],["23652505","Retención arrendamientos por pagar — 3.5%","C","auxiliar","236525"],["2368","Impuesto a las ventas retenido","C","cuenta","23"],["236805","IVA retenido — a cargo","C","subcuenta","2368"],["2370","Retenciones y aportes de nómina","C","cuenta","23"],["237005","Aportes a salud empleados","C","subcuenta","2370"],["23700505","Aportes salud por pagar (empleado + empleador)","C","auxiliar","237005"],["237010","Aportes a pensión empleados","C","subcuenta","2370"],["23701005","Aportes pensión por pagar (empleado + empleador)","C","auxiliar","237010"],["237015","ARL por pagar","C","subcuenta","2370"],["23701505","ARL por pagar","C","auxiliar","237015"],["237020","Caja de compensación por pagar","C","subcuenta","2370"],["23702005","Caja compensación por pagar","C","auxiliar","237020"],["24","Impuestos gravámenes y tasas","C","grupo","2"],["2404","Impuesto de renta y complementario","C","cuenta","24"],["240405","Impuesto de renta por pagar","C","subcuenta","2404"],["24040505","Impuesto de renta por pagar","C","auxiliar","240405"],["2408","Impuesto sobre las ventas","C","cuenta","24"],["240805","IVA generado","C","subcuenta","2408"],["24080505","IVA generado 19%","C","auxiliar","240805"],["240810","IVA descontable","D","subcuenta","2408"],["24081005","IVA descontable 19%","D","auxiliar","240810"],["25","Obligaciones laborales","C","grupo","2"],["2505","Salarios por pagar","C","cuenta","25"],["250505","Nómina por pagar","C","subcuenta","2505"],["25050505","Nómina por pagar — Carlos Mejía","C","auxiliar","250505"],["25050510","Nómina por pagar — Sandra Torres","C","auxiliar","250505"],["25050515","Nómina por pagar — Luis Herrera","C","auxiliar","250505"],["2510","Cesantías consolidadas","C","cuenta","25"],["251005","Cesantías por pagar","C","subcuenta","2510"],["25100505","Cesantías consolidadas","C","auxiliar","251005"],["2515","Intereses sobre cesantías","C","cuenta","25"],["251505","Intereses sobre cesantías por pagar","C","subcuenta","2515"],["25150505","Intereses sobre cesantías","C","auxiliar","251505"],["2520","Prima de servicios","C","cuenta","25"],["252005","Prima de servicios por pagar","C","subcuenta","2520"],["25200505","Prima de servicios","C","auxiliar","252005"],["2525","Vacaciones consolidadas","C","cuenta","25"],["252505","Vacaciones consolidadas por pagar","C","subcuenta","2525"],["25250505","Vacaciones consolidadas","C","auxiliar","252505"],["27","Diferidos","C","grupo","2"],["2705","Ingresos recibidos por anticipado","C","cuenta","27"],["270505","Anticipos de clientes","C","subcuenta","2705"],["3","Patrimonio","C","clase",null],["31","Capital social","C","grupo","3"],["3105","Capital suscrito y pagado","C","cuenta","31"],["310505","Capital autorizado","C","subcuenta","3105"],["31050505","Capital Autorizado","C","auxiliar","310505"],["310510","Capital por suscribir","D","subcuenta","3105"],["31051005","Capital por suscribir","D","auxiliar","310510"],["310515","Capital suscrito por cobrar","D","subcuenta","3105"],["31051505","Capital suscrito por cobrar — Camila Restrepo Vélez (40%)","D","auxiliar","310515"],["31051510","Capital suscrito por cobrar — Jorge Mendoza Castillo (35%)","D","auxiliar","310515"],["31051515","Capital suscrito por cobrar — Diana Pacheco Soto (25%)","D","auxiliar","310515"],["33","Reservas","C","grupo","3"],["3305","Reserva legal","C","cuenta","33"],["36","Resultados del ejercicio","C","grupo","3"],["3605","Utilidad del ejercicio","C","cuenta","36"],["360505","Utilidad del presente ejercicio","C","subcuenta","3605"],["37","Resultados de ejercicios anteriores","C","grupo","3"],["3705","Utilidades acumuladas","C","cuenta","37"],["4","Ingresos","C","clase",null],["41","Operacionales","C","grupo","4"],["4135","Comercio al por mayor","C","cuenta","41"],["413505","Ventas brutas mercancía","C","subcuenta","4135"],["41350505","Venta — Laptops","C","auxiliar","413505"],["41350510","Venta — Computadores all-in-one","C","auxiliar","413505"],["41350515","Venta — Accesorios tecnológicos","C","auxiliar","413505"],["41350520","Venta — Muebles de oficina","C","auxiliar","413505"],["4175","Servicios de consultoría y asesoría","C","cuenta","41"],["417505","Servicios de consultoría empresarial","C","subcuenta","4175"],["41750505","Servicio — Consultoría empresarial","C","auxiliar","417505"],["41750510","Servicio — Consultoría financiera/tributaria","C","auxiliar","417505"],["41750515","Servicio — Implementación y soporte tecnológico","C","auxiliar","417505"],["42","No operacionales","C","grupo","4"],["4210","Financieros","C","cuenta","42"],["421005","Intereses","C","subcuenta","4210"],["421010","Rendimientos","C","subcuenta","4210"],["4250","Recuperaciones","C","cuenta","42"],["425005","Recuperación de deducciones","C","subcuenta","4250"],["5","Gastos","D","clase",null],["51","Operacionales de administración","D","grupo","5"],["5105","Gastos de personal","D","cuenta","51"],["510506","Sueldos y salarios","D","subcuenta","5105"],["51050605","Sueldo — Carlos Mejía Rondón","D","auxiliar","510506"],["51050610","Sueldo — Sandra Torres Díaz","D","auxiliar","510506"],["51050615","Sueldo — Luis Herrera Camargo","D","auxiliar","510506"],["510527","Auxilio de transporte","D","subcuenta","5105"],["51052705","Auxilio de transporte — Luis Herrera","D","auxiliar","510527"],["510530","Cesantías","D","subcuenta","5105"],["51053005","Gasto cesantías","D","auxiliar","510530"],["510533","Intereses sobre cesantías","D","subcuenta","5105"],["51053305","Gasto intereses cesantías","D","auxiliar","510533"],["510536","Prima de servicios","D","subcuenta","5105"],["51053605","Gasto prima de servicios","D","auxiliar","510536"],["510539","Vacaciones","D","subcuenta","5105"],["51053905","Gasto vacaciones","D","auxiliar","510539"],["510545","Aportes a pensión — empleador","D","subcuenta","5105"],["51054505","Aportes pensión empleador","D","auxiliar","510545"],["510548","Aportes ARL","D","subcuenta","5105"],["51054805","Aportes ARL","D","auxiliar","510548"],["510551","Aportes a caja de compensación","D","subcuenta","5105"],["51055105","Aportes caja compensación","D","auxiliar","510551"],["510542","Aportes a salud — empleador","D","subcuenta","5105"],["51054205","Aportes salud empleador","D","auxiliar","510542"],["5110","Honorarios","D","cuenta","51"],["511005","Honorarios a terceros","D","subcuenta","5110"],["51100505","Honorarios — Asesorías Jurídicas del Norte Ltda.","D","auxiliar","511005"],["5115","Impuestos","D","cuenta","51"],["511505","Impuesto de industria y comercio","D","subcuenta","5115"],["5120","Arrendamientos","D","cuenta","51"],["512005","Arrendamiento oficina","D","subcuenta","5120"],["51200505","Arrendamiento oficina — Arrendadora Inmobiliaria Caribe","D","auxiliar","512005"],["5125","Contribuciones y afiliaciones","D","cuenta","51"],["5130","Seguros","D","cuenta","51"],["513005","Seguros póliza empresarial","D","subcuenta","5130"],["5135","Servicios","D","cuenta","51"],["513505","Aseo y vigilancia","D","subcuenta","5135"],["513510","Servicios públicos","D","subcuenta","5135"],["51351005","Servicios públicos — Gas (Gases del Caribe)","D","auxiliar","513510"],["51351010","Servicios públicos — Agua (Triple A)","D","auxiliar","513510"],["51351015","Servicios públicos — Energía eléctrica (Air-e)","D","auxiliar","513510"],["51351020","Servicios públicos — Teléfono/Internet (Claro)","D","auxiliar","513510"],["513515","Gastos bancarios","D","subcuenta","5135"],["5145","Mantenimiento y reparaciones","D","cuenta","51"],["5150","Adecuaciones e instalaciones","D","cuenta","51"],["5155","Gastos de viaje","D","cuenta","51"],["5160","Depreciaciones","D","cuenta","51"],["516005","Depreciación equipo de oficina","D","subcuenta","5160"],["51600505","Dep. muebles — Escritorios ejecutivos","D","auxiliar","516005"],["51600510","Dep. muebles — Sillas ergonómicas","D","auxiliar","516005"],["51600515","Dep. muebles — Archivadores metálicos","D","auxiliar","516005"],["51600520","Dep. muebles — Mesa de juntas","D","auxiliar","516005"],["51600525","Dep. muebles — Estanterías y muebles recepción","D","auxiliar","516005"],["5165","Amortizaciones","D","cuenta","51"],["5195","Diversos","D","cuenta","51"],["519595","Gastos no deducibles","D","subcuenta","5195"],["52","Operacionales de ventas","D","grupo","5"],["5205","Gastos de personal ventas","D","cuenta","52"],["520506","Sueldos fuerza de ventas","D","subcuenta","5205"],["5245","Publicidad y propaganda","D","cuenta","52"],["524505","Publicidad digital","D","subcuenta","5245"],["5250","Comisiones ventas","D","cuenta","52"],["525005","Comisiones fuerza de ventas","D","subcuenta","5250"],["52500505","Comisión ventas — Luis Herrera Camargo","D","auxiliar","525005"],["6","Costos de ventas","D","clase",null],["61","Costo de ventas","D","grupo","6"],["6135","Costo de ventas mercancía","D","cuenta","61"],["613505","Costo mercancía vendida","D","subcuenta","6135"],["61350505","Costo — Laptops","D","auxiliar","613505"],["61350510","Costo — Computadores all-in-one","D","auxiliar","613505"],["61350515","Costo — Accesorios tecnológicos","D","auxiliar","613505"],["61350520","Costo — Muebles de oficina","D","auxiliar","613505"],["8","Cuentas de orden deudoras","D","clase",null],["8305","Activos contingentes","D","grupo","8"],["9","Cuentas de orden acreedoras","C","clase",null]];
const ASIENTOS_2025 = [
  // ── Apertura ──────────────────────────────────────────────────────────────
  ["2026-01-02","AP-001-26","Nota de contabilidad","Asiento de apertura — Constitución de la sociedad","AP-001","Accionistas",[
    ["11101505","Constitución — aporte en efectivo",700000000,0],
    ["15241005","Aporte en especie — mobiliario",30000000,0],
    ["15241010","Aporte en especie — mobiliario",15000000,0],
    ["15241015","Aporte en especie — mobiliario",20000000,0],
    ["15241020","Aporte en especie — mobiliario",22500000,0],
    ["15241025","Aporte en especie — mobiliario",12500000,0],
    ["31051005","Capital por suscribir",100000000,0],
    ["31051505","Capital suscrito por cobrar — Camila Restrepo Vélez (40%)",40000000,0],
    ["31051510","Capital suscrito por cobrar — Jorge Mendoza Castillo (35%)",35000000,0],
    ["31051515","Capital suscrito por cobrar — Diana Pacheco Soto (25%)",25000000,0],
    ["31050505","Capital Autorizado",0,1000000000],
  ]],
  // ── Facturas de venta (enero 2026) ────────────────────────────────────────
  ["2026-01-05","FV-001-26","Factura de venta","Venta 8 laptops — Tecno Norte S.A.S.","FV-001","Tecno Norte S.A.S.",[
    ["13050505","Cartera FV-001-26 — Tecno Norte S.A.S.",23300000,0],
    ["13551505","Retención en la fuente a favor 2.5% — FV-001-26",500000,0],
    ["41350505","Venta — Laptops x8 — FV-001-26",0,20000000],
    ["24080505","IVA generado 19% — FV-001-26",0,3800000],
    ["61350505","Costo de venta — Laptops x8",14000000,0],
    ["14300505","Inventario — Laptops x8",0,14000000],
  ]],
  ["2026-01-08","FV-002-26","Factura de venta","Venta 5 computadores all-in-one — Distribuidora del Caribe","FV-002","Distribuidora del Caribe Ltda.",[
    ["13050505","Cartera FV-002-26 — Distribuidora del Caribe Ltda.",14562500,0],
    ["13551505","Retención en la fuente a favor 2.5% — FV-002-26",312500,0],
    ["41350510","Venta — Computadores all-in-one x5 — FV-002-26",0,12500000],
    ["24080505","IVA generado 19% — FV-002-26",0,2375000],
    ["61350510","Costo de venta — Computadores all-in-one x5",8750000,0],
    ["14300510","Inventario — Computadores all-in-one x5",0,8750000],
  ]],
  ["2026-01-10","FV-003-26","Factura de venta","Venta 10 muebles de oficina — Constructora Palermo S.A.","FV-003","Constructora Palermo S.A.",[
    ["13050505","Cartera FV-003-26 — Constructora Palermo S.A.",8737500,0],
    ["13551505","Retención en la fuente a favor 2.5% — FV-003-26",187500,0],
    ["41350520","Venta — Muebles de oficina x10 — FV-003-26",0,7500000],
    ["24080505","IVA generado 19% — FV-003-26",0,1425000],
    ["61350520","Costo de venta — Muebles de oficina x10",5000000,0],
    ["14300520","Inventario — Muebles de oficina x10",0,5000000],
  ]],
  ["2026-01-12","FV-004-26","Factura de venta","Venta 15 accesorios tecnológicos — Clínica Regional S.A.S.","FV-004","Clínica Regional S.A.S.",[
    ["13050505","Cartera FV-004-26 — Clínica Regional S.A.S.",17475000,0],
    ["13551505","Retención en la fuente a favor 2.5% — FV-004-26",375000,0],
    ["41350515","Venta — Accesorios tecnológicos x15 — FV-004-26",0,15000000],
    ["24080505","IVA generado 19% — FV-004-26",0,2850000],
    ["61350515","Costo de venta — Accesorios tecnológicos x15",10500000,0],
    ["14300515","Inventario — Accesorios tecnológicos x15",0,10500000],
  ]],
  ["2026-01-15","FV-005-26","Factura de venta","Consultoría empresarial — Alcaldía de Soledad","FV-005","Alcaldía de Soledad",[
    ["13050505","Cartera FV-005-26 — Alcaldía de Soledad",9200000,0],
    ["13551505","Retención en la fuente a favor 4% — FV-005-26",320000,0],
    ["41750505","Servicio — Consultoría empresarial — FV-005-26",0,8000000],
    ["24080505","IVA generado 19% — FV-005-26",0,1520000],
  ]],
  ["2026-01-18","FV-006-26","Factura de venta","Venta 2 laptops — Pedro Martínez","FV-006","Pedro Martínez",[
    ["13050505","Cartera FV-006-26 — Pedro Martínez",5825000,0],
    ["13551505","Retención en la fuente a favor 2.5% — FV-006-26",125000,0],
    ["41350505","Venta — Laptops x2 — FV-006-26",0,5000000],
    ["24080505","IVA generado 19% — FV-006-26",0,950000],
    ["61350505","Costo de venta — Laptops x2",3500000,0],
    ["14300505","Inventario — Laptops x2",0,3500000],
  ]],
  ["2026-01-22","FV-007-26","Factura de venta","Consultoría financiera/tributaria — Agroindustrial Costa Ltda.","FV-007","Agroindustrial Costa Ltda.",[
    ["13050505","Cartera FV-007-26 — Agroindustrial Costa Ltda.",6900000,0],
    ["13551505","Retención en la fuente a favor 4% — FV-007-26",240000,0],
    ["41750510","Servicio — Consultoría financiera/tributaria — FV-007-26",0,6000000],
    ["24080505","IVA generado 19% — FV-007-26",0,1140000],
  ]],
  ["2026-01-28","FV-008-26","Factura de venta","Implementación y soporte tecnológico — Universidad Simón Bolívar","FV-008","Universidad Simón Bolívar",[
    ["13050505","Cartera FV-008-26 — Universidad Simón Bolívar",11500000,0],
    ["13551505","Retención en la fuente a favor 4% — FV-008-26",400000,0],
    ["41750515","Servicio — Implementación y soporte tecnológico — FV-008-26",0,10000000],
    ["24080505","IVA generado 19% — FV-008-26",0,1900000],
  ]],
  // ── Facturas de compra (enero 2026) ───────────────────────────────────────
  ["2026-01-15","FC-001-26","Factura de compra","Compra 5 laptops — Importech Colombia S.A.S.","FC-001","Importech Colombia S.A.S.",[
    ["14300505","FC-001-26 — Inventario Laptops x5",8750000,0],
    ["24081005","IVA descontable 19% — FC-001-26",1662500,0],
    ["23654005","Retención compras 2.5% — Importech",0,218750],
    ["22050505","Proveedores — Importech Colombia S.A.S.",0,10193750],
  ]],
  ["2026-01-20","FC-002-26","Factura de compra","Compra accesorios tecnológicos — Papelería Central","FC-002","Papelería Central Barranquilla S.A.S.",[
    ["14300515","FC-002-26 — Inventario Accesorios tecnológicos x3",2100000,0],
    ["24081005","IVA descontable 19% — FC-002-26",399000,0],
    ["23654005","Retención compras 2.5% — Papelería Central",0,52500],
    ["22050505","Proveedores — Papelería Central Barranquilla S.A.S.",0,2446500],
  ]],
  // ── Causaciones (enero 2026) ───────────────────────────────────────────────
  ["2026-01-31","CA-001-26","Causación","Causación servicios públicos enero 2026","CA-001","Varios proveedores servicios públicos",[
    ["51351005","Gasto gas enero 2026 — Gases del Caribe",850000,0],
    ["51351010","Gasto agua enero 2026 — Triple A",620000,0],
    ["51351015","Gasto energía eléctrica enero 2026 — Air-e",1450000,0],
    ["51351020","Gasto teléfono/internet enero 2026 — Claro",980000,0],
    ["23351505","Servicios públicos por pagar — enero 2026",0,3900000],
  ]],
  ["2026-01-31","CA-002-26","Causación","Causación arrendamiento oficina enero 2026","CA-002","Arrendadora Inmobiliaria Caribe S.A.",[
    ["51200505","Arrendamiento oficina enero 2026 — Arrendadora Inmobiliaria Caribe",3500000,0],
    ["23652505","Retención arrendamiento por pagar 3.5% — enero 2026",0,122500],
    ["23351005","Arrendamiento por pagar neto — enero 2026",0,3377500],
  ]],
  ["2026-01-31","CA-003-26","Causación","Causación honorarios jurídicos enero 2026","CA-003","Asesorías Jurídicas del Norte Ltda.",[
    ["51100505","Honorarios jurídicos enero 2026 — Asesorías Jurídicas del Norte",2000000,0],
    ["23651505","Retención honorarios por pagar 11% — enero 2026",0,220000],
    ["23350515","Honorarios por pagar neto — enero 2026",0,1780000],
  ]],
  // ── Comprobantes de egreso (febrero 2026) ─────────────────────────────────
  ["2026-02-05","CE-001-26","Comprobante de egreso","Pago servicios públicos enero 2026","CE-001","Varios proveedores servicios públicos",[
    ["23351505","Cancelación servicios públicos por pagar enero 2026",3900000,0],
    ["11101505","Banco Davivienda — pago servicios públicos",0,3900000],
  ]],
  ["2026-02-10","CE-002-26","Comprobante de egreso","Pago neto arrendamiento enero 2026 — Arrendadora Inmobiliaria Caribe","CE-002","Arrendadora Inmobiliaria Caribe S.A.",[
    ["23351005","Cancelación arrendamiento por pagar neto enero 2026",3377500,0],
    ["11101505","Banco Davivienda — pago arrendamiento neto",0,3377500],
  ]],
  ["2026-02-10","CE-003-26","Comprobante de egreso","Pago neto honorarios enero 2026 — Asesorías Jurídicas del Norte","CE-003","Asesorías Jurídicas del Norte Ltda.",[
    ["23350515","Cancelación honorarios por pagar neto enero 2026",4450000,0],
    ["11101505","Banco Davivienda — pago honorarios neto",0,4450000],
  ]],
  ["2026-02-15","CE-004-26","Comprobante de egreso","Pago factura FC-001-26 — Importech Colombia S.A.S.","CE-004","Importech Colombia S.A.S.",[
    ["22050505","Cancelación proveedores — Importech Colombia S.A.S. FC-001",10193750,0],
    ["11101505","Banco Davivienda — pago Importech",0,10193750],
  ]],
  ["2026-02-15","CE-005-26","Comprobante de egreso","Pago factura FC-002-26 — Papelería Central Barranquilla","CE-005","Papelería Central Barranquilla S.A.S.",[
    ["22050505","Cancelación proveedores — Papelería Central FC-002",2446500,0],
    ["11101505","Banco Davivienda — pago Papelería Central",0,2446500],
  ]],
  ["2026-02-12","CE-006-26","Comprobante de egreso","Pago retención en la fuente enero 2026 — Form. 350","CE-006","DIAN",[
    ["23654005","Retención compras practicada enero 2026 — Importech + Papelería",271250,0],
    ["23651505","Retención honorarios practicada enero 2026 — Asesorías Jurídicas",220000,0],
    ["23652505","Retención arrendamiento practicada enero 2026 — Arrendadora",122500,0],
    ["11101505","Banco Davivienda — pago retención en la fuente Form. 350 enero",0,613750],
  ]],
  // ── Recibos de caja — cobro cartera (febrero 2026) ────────────────────────
  // FV-001 (Tecno Norte $23.3M), FV-004 (Clínica $17.475M), FV-008 (Univ. Simón $11.5M) quedan pendientes
  ["2026-02-06","RC-001-26","Recibo de caja","Cobro cartera FV-002-26 — Distribuidora del Caribe Ltda.","RC-001","Distribuidora del Caribe Ltda.",[
    ["11101505","Banco Davivienda — cobro FV-002-26 Distribuidora del Caribe",14562500,0],
    ["13050505","Cancelación cartera FV-002-26 — Distribuidora del Caribe Ltda.",0,14562500],
  ]],
  ["2026-02-08","RC-002-26","Recibo de caja","Cobro cartera FV-003-26 — Constructora Palermo S.A.","RC-002","Constructora Palermo S.A.",[
    ["11101505","Banco Davivienda — cobro FV-003-26 Constructora Palermo",8737500,0],
    ["13050505","Cancelación cartera FV-003-26 — Constructora Palermo S.A.",0,8737500],
  ]],
  ["2026-02-10","RC-003-26","Recibo de caja","Cobro cartera FV-005-26 — Alcaldía de Soledad","RC-003","Alcaldía de Soledad",[
    ["11101505","Banco Davivienda — cobro FV-005-26 Alcaldía de Soledad",9200000,0],
    ["13050505","Cancelación cartera FV-005-26 — Alcaldía de Soledad",0,9200000],
  ]],
  ["2026-02-14","RC-004-26","Recibo de caja","Cobro cartera FV-006-26 — Pedro Martínez","RC-004","Pedro Martínez",[
    ["11101505","Banco Davivienda — cobro FV-006-26 Pedro Martínez",5825000,0],
    ["13050505","Cancelación cartera FV-006-26 — Pedro Martínez",0,5825000],
  ]],
  ["2026-02-18","RC-005-26","Recibo de caja","Cobro cartera FV-007-26 — Agroindustrial Costa Ltda.","RC-005","Agroindustrial Costa Ltda.",[
    ["11101505","Banco Davivienda — cobro FV-007-26 Agroindustrial Costa",6900000,0],
    ["13050505","Cancelación cartera FV-007-26 — Agroindustrial Costa Ltda.",0,6900000],
  ]],
  ["2026-07-15", "FC-011-26", "Factura de compra", "Compra Importech Colombia S.A.S. — FC-011-26", "FC-011-26", "Importech Colombia S.A.S.", [["14300510", "FC-011-26 — Inventario PROD-02 x10", 17500000, 0], ["14300515", "FC-011-26 — Inventario PROD-03 x50", 35000000, 0], ["14300520", "FC-011-26 — Inventario PROD-04 x60", 30000000, 0], ["24081005", "IVA descontable 19% — FC-011-26", 15675000, 0], ["23654005", "Retención compras 2.5% — FC-011-26", 0, 2062500], ["22050505", "Proveedores — Importech Colombia S.A.S.", 0, 96112500]]],
  ["2026-07-08", "FV-039-26", "Factura de venta", "Venta Tecno Norte S.A.S. — FV-039-26", "FV-039-26", "Tecno Norte S.A.S.", [["13050505", "Cartera FV-039-26 — Tecno Norte S.A.S.", 26795000, 0], ["13551505", "Retención a favor 2.5% — FV-039-26", 575000, 0], ["41350505", "Venta — PROD-01 x6 — FV-039-26", 0, 15000000], ["41350515", "Venta — PROD-03 x8 — FV-039-26", 0, 8000000], ["24080505", "IVA generado 19% — FV-039-26", 0, 4370000], ["61350505", "Costo PROD-01 x6", 10500000, 0], ["14300505", "Costo PROD-01 x6", 0, 10500000], ["61350515", "Costo PROD-03 x8", 5600000, 0], ["14300515", "Costo PROD-03 x8", 0, 5600000]]],
  ["2026-07-25", "FV-040-26", "Factura de venta", "Venta Clínica Regional S.A.S. — FV-040-26", "FV-040-26", "Clínica Regional S.A.S.", [["13050505", "Cartera FV-040-26 — Clínica Regional S.A.S.", 13980000, 0], ["13551505", "Retención a favor 2.5% — FV-040-26", 300000, 0], ["41350515", "Venta — PROD-03 x12 — FV-040-26", 0, 12000000], ["24080505", "IVA generado 19% — FV-040-26", 0, 2280000], ["61350515", "Costo PROD-03 x12", 8400000, 0], ["14300515", "Costo PROD-03 x12", 0, 8400000]]],
  ["2026-07-28", "FV-041-26", "Factura de venta", "Venta Universidad Simón Bolívar — FV-041-26", "FV-041-26", "Universidad Simón Bolívar", [["13050505", "Cartera FV-041-26 — Universidad Simón Bolívar", 11500000, 0], ["13551505", "Retención a favor 4.0% — FV-041-26", 400000, 0], ["41750515", "Venta — SERV-03 x1 — FV-041-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-041-26", 0, 1900000]]],
  ["2026-08-05", "FV-042-26", "Factura de venta", "Venta Distribuidora del Caribe Ltda. — FV-042-26", "FV-042-26", "Distribuidora del Caribe Ltda.", [["13050505", "Cartera FV-042-26 — Distribuidora del Caribe Ltda.", 29125000, 0], ["13551505", "Retención a favor 2.5% — FV-042-26", 625000, 0], ["41350510", "Venta — PROD-02 x6 — FV-042-26", 0, 15000000], ["41350505", "Venta — PROD-01 x4 — FV-042-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-042-26", 0, 4750000], ["61350510", "Costo PROD-02 x6", 10500000, 0], ["14300510", "Costo PROD-02 x6", 0, 10500000], ["61350505", "Costo PROD-01 x4", 7000000, 0], ["14300505", "Costo PROD-01 x4", 0, 7000000]]],
  ["2026-08-18", "FV-043-26", "Factura de venta", "Venta Constructora Palermo S.A. — FV-043-26", "FV-043-26", "Constructora Palermo S.A.", [["13050505", "Cartera FV-043-26 — Constructora Palermo S.A.", 10485000, 0], ["13551505", "Retención a favor 2.5% — FV-043-26", 225000, 0], ["41350520", "Venta — PROD-04 x12 — FV-043-26", 0, 9000000], ["24080505", "IVA generado 19% — FV-043-26", 0, 1710000], ["61350520", "Costo PROD-04 x12", 6000000, 0], ["14300520", "Costo PROD-04 x12", 0, 6000000]]],
  ["2026-08-25", "FV-044-26", "Factura de venta", "Venta Agroindustrial Costa Ltda. — FV-044-26", "FV-044-26", "Agroindustrial Costa Ltda.", [["13050505", "Cartera FV-044-26 — Agroindustrial Costa Ltda.", 6900000, 0], ["13551505", "Retención a favor 4.0% — FV-044-26", 240000, 0], ["41750510", "Venta — SERV-02 x1 — FV-044-26", 0, 6000000], ["24080505", "IVA generado 19% — FV-044-26", 0, 1140000]]],
  ["2026-09-10", "FV-045-26", "Factura de venta", "Venta Tecno Norte S.A.S. — FV-045-26", "FV-045-26", "Tecno Norte S.A.S.", [["13050505", "Cartera FV-045-26 — Tecno Norte S.A.S.", 23300000, 0], ["13551505", "Retención a favor 2.5% — FV-045-26", 500000, 0], ["41350505", "Venta — PROD-01 x5 — FV-045-26", 0, 12500000], ["41350510", "Venta — PROD-02 x3 — FV-045-26", 0, 7500000], ["24080505", "IVA generado 19% — FV-045-26", 0, 3800000], ["61350505", "Costo PROD-01 x5", 8750000, 0], ["14300505", "Costo PROD-01 x5", 0, 8750000], ["61350510", "Costo PROD-02 x3", 5250000, 0], ["14300510", "Costo PROD-02 x3", 0, 5250000]]],
  ["2026-09-22", "FV-046-26", "Factura de venta", "Venta Clínica Regional S.A.S. — FV-046-26", "FV-046-26", "Clínica Regional S.A.S.", [["13050505", "Cartera FV-046-26 — Clínica Regional S.A.S.", 11650000, 0], ["13551505", "Retención a favor 2.5% — FV-046-26", 250000, 0], ["41350515", "Venta — PROD-03 x10 — FV-046-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-046-26", 0, 1900000], ["61350515", "Costo PROD-03 x10", 7000000, 0], ["14300515", "Costo PROD-03 x10", 0, 7000000]]],
  ["2026-09-26", "FV-047-26", "Factura de venta", "Venta Alcaldía de Soledad — FV-047-26", "FV-047-26", "Alcaldía de Soledad", [["13050505", "Cartera FV-047-26 — Alcaldía de Soledad", 9200000, 0], ["13551505", "Retención a favor 4.0% — FV-047-26", 320000, 0], ["41750505", "Venta — SERV-01 x1 — FV-047-26", 0, 8000000], ["24080505", "IVA generado 19% — FV-047-26", 0, 1520000]]],
  ["2026-10-20", "FV-048-26", "Factura de venta", "Venta Tecno Norte S.A.S. — FV-048-26", "FV-048-26", "Tecno Norte S.A.S.", [["13050505", "Cartera FV-048-26 — Tecno Norte S.A.S.", 20387500, 0], ["13551505", "Retención a favor — FV-048-26", 437500, 0], ["41350505", "Venta — PROD-01 x4 — FV-048-26", 0, 10000000], ["41350510", "Venta — PROD-02 x3 — FV-048-26", 0, 7500000], ["24080505", "IVA generado 19% — FV-048-26", 0, 3325000], ["61350505", "Costo PROD-01 x4", 7000000, 0], ["14300505", "Costo PROD-01 x4", 0, 7000000], ["61350510", "Costo PROD-02 x3", 5250000, 0], ["14300510", "Costo PROD-02 x3", 0, 5250000]]],
  ["2026-10-25", "FV-049-26", "Factura de venta", "Venta Constructora Palermo S.A. — FV-049-26", "FV-049-26", "Constructora Palermo S.A.", [["13050505", "Cartera FV-049-26 — Constructora Palermo S.A.", 8737500, 0], ["13551505", "Retención a favor — FV-049-26", 187500, 0], ["41350520", "Venta — PROD-04 x10 — FV-049-26", 0, 7500000], ["24080505", "IVA generado 19% — FV-049-26", 0, 1425000], ["61350520", "Costo PROD-04 x10", 5000000, 0], ["14300520", "Costo PROD-04 x10", 0, 5000000]]],
  ["2026-11-08", "FV-050-26", "Factura de venta", "Venta Tecno Norte S.A.S. — FV-050-26", "FV-050-26", "Tecno Norte S.A.S.", [["13050505", "Cartera FV-050-26 — Tecno Norte S.A.S.", 26212500, 0], ["13551505", "Retención a favor — FV-050-26", 562500, 0], ["41350505", "Venta — PROD-01 x5 — FV-050-26", 0, 12500000], ["41350510", "Venta — PROD-02 x4 — FV-050-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-050-26", 0, 4275000], ["61350505", "Costo PROD-01 x5", 8750000, 0], ["14300505", "Costo PROD-01 x5", 0, 8750000], ["61350510", "Costo PROD-02 x4", 7000000, 0], ["14300510", "Costo PROD-02 x4", 0, 7000000]]],
  ["2026-11-20", "FV-051-26", "Factura de venta", "Venta Universidad Simón Bolívar — FV-051-26", "FV-051-26", "Universidad Simón Bolívar", [["13050505", "Cartera FV-051-26 — Universidad Simón Bolívar", 11500000, 0], ["13551505", "Retención a favor — FV-051-26", 400000, 0], ["41750515", "Venta — SERV-03 x1 — FV-051-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-051-26", 0, 1900000]]],
  ["2026-12-10", "FV-052-26", "Factura de venta", "Venta Distribuidora del Caribe Ltda. — FV-052-26", "FV-052-26", "Distribuidora del Caribe Ltda.", [["13050505", "Cartera FV-052-26 — Distribuidora del Caribe Ltda.", 29125000, 0], ["13551505", "Retención a favor — FV-052-26", 625000, 0], ["41350510", "Venta — PROD-02 x6 — FV-052-26", 0, 15000000], ["41350505", "Venta — PROD-01 x4 — FV-052-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-052-26", 0, 4750000], ["61350510", "Costo PROD-02 x6", 10500000, 0], ["14300510", "Costo PROD-02 x6", 0, 10500000], ["61350505", "Costo PROD-01 x4", 7000000, 0], ["14300505", "Costo PROD-01 x4", 0, 7000000]]],
  ["2026-12-22", "FV-053-26", "Factura de venta", "Venta Pedro Martínez — FV-053-26", "FV-053-26", "Pedro Martínez", [["13050505", "Cartera FV-053-26 — Pedro Martínez", 17475000, 0], ["13551505", "Retención a favor — FV-053-26", 375000, 0], ["41350515", "Venta — PROD-03 x15 — FV-053-26", 0, 15000000], ["24080505", "IVA generado 19% — FV-053-26", 0, 2850000], ["61350515", "Costo PROD-03 x15", 10500000, 0], ["14300515", "Costo PROD-03 x15", 0, 10500000]]],
  ["2026-04-05", "FC-012-26", "Factura de compra", "Compra reposición inventario — Importech Colombia S.A.S.", "FC-012-26", "Importech Colombia S.A.S.", [["14300505", "FC-012-26 — Inventario PROD-01 x50", 87500000, 0], ["14300510", "FC-012-26 — Inventario PROD-02 x30", 52500000, 0], ["14300515", "FC-012-26 — Inventario PROD-03 x60", 42000000, 0], ["14300520", "FC-012-26 — Inventario PROD-04 x25", 12500000, 0], ["24081005", "IVA descontable 19% — FC-012-26", 36955000, 0], ["23654005", "Retención compras 2.5% — FC-012-26", 0, 4862500], ["22050505", "Proveedores — Importech Colombia S.A.S.", 0, 226592500]]],
  ["2026-05-20", "FV-054-26", "Factura de venta", "Venta Alcaldía de Soledad — FV-054-26", "FV-054-26", "Alcaldía de Soledad", [["13050505", "Cartera FV-054-26 — Alcaldía de Soledad", 13800000, 0], ["13551505", "Retención a favor 4.0% — FV-054-26", 480000, 0], ["41750505", "Venta — SERV-01 — FV-054-26", 0, 12000000], ["24080505", "IVA generado 19% — FV-054-26", 0, 2280000]]],
  ["2026-06-15", "FV-055-26", "Factura de venta", "Venta Universidad Simón Bolívar — FV-055-26", "FV-055-26", "Universidad Simón Bolívar", [["13050505", "Cartera FV-055-26 — Universidad Simón Bolívar", 17250000, 0], ["13551505", "Retención a favor 4.0% — FV-055-26", 600000, 0], ["41750515", "Venta — SERV-03 — FV-055-26", 0, 15000000], ["24080505", "IVA generado 19% — FV-055-26", 0, 2850000]]],
  ["2026-07-30", "FV-056-26", "Factura de venta", "Venta Agroindustrial Costa Ltda. — FV-056-26", "FV-056-26", "Agroindustrial Costa Ltda.", [["13050505", "Cartera FV-056-26 — Agroindustrial Costa Ltda.", 11500000, 0], ["13551505", "Retención a favor 4.0% — FV-056-26", 400000, 0], ["41750510", "Venta — SERV-02 — FV-056-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-056-26", 0, 1900000]]],
  ["2026-08-28", "FV-057-26", "Factura de venta", "Venta Alcaldía de Soledad — FV-057-26", "FV-057-26", "Alcaldía de Soledad", [["13050505", "Cartera FV-057-26 — Alcaldía de Soledad", 13800000, 0], ["13551505", "Retención a favor 4.0% — FV-057-26", 480000, 0], ["41750505", "Venta — SERV-01 — FV-057-26", 0, 12000000], ["24080505", "IVA generado 19% — FV-057-26", 0, 2280000]]],
  ["2026-09-25", "FV-058-26", "Factura de venta", "Venta Universidad Simón Bolívar — FV-058-26", "FV-058-26", "Universidad Simón Bolívar", [["13050505", "Cartera FV-058-26 — Universidad Simón Bolívar", 17250000, 0], ["13551505", "Retención a favor 4.0% — FV-058-26", 600000, 0], ["41750515", "Venta — SERV-03 — FV-058-26", 0, 15000000], ["24080505", "IVA generado 19% — FV-058-26", 0, 2850000]]],
  ["2026-10-28", "FV-059-26", "Factura de venta", "Venta Agroindustrial Costa Ltda. — FV-059-26", "FV-059-26", "Agroindustrial Costa Ltda.", [["13050505", "Cartera FV-059-26 — Agroindustrial Costa Ltda.", 11500000, 0], ["13551505", "Retención a favor 4.0% — FV-059-26", 400000, 0], ["41750510", "Venta — SERV-02 — FV-059-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-059-26", 0, 1900000]]],
  ["2026-11-25", "FV-060-26", "Factura de venta", "Venta Alcaldía de Soledad — FV-060-26", "FV-060-26", "Alcaldía de Soledad", [["13050505", "Cartera FV-060-26 — Alcaldía de Soledad", 17250000, 0], ["13551505", "Retención a favor 4.0% — FV-060-26", 600000, 0], ["41750505", "Venta — SERV-01 — FV-060-26", 0, 15000000], ["24080505", "IVA generado 19% — FV-060-26", 0, 2850000]]],
  ["2026-12-28", "FV-061-26", "Factura de venta", "Venta Universidad Simón Bolívar — FV-061-26", "FV-061-26", "Universidad Simón Bolívar", [["13050505", "Cartera FV-061-26 — Universidad Simón Bolívar", 23000000, 0], ["13551505", "Retención a favor 4.0% — FV-061-26", 800000, 0], ["41750515", "Venta — SERV-03 — FV-061-26", 0, 20000000], ["24080505", "IVA generado 19% — FV-061-26", 0, 3800000]]],
  // ── Nómina enero 2026 ─────────────────────────────────────────────────────
  // E-01 Carlos Mejía $4.5M | E-02 Sandra Torres $3.2M | E-03 Luis Herrera $2M+$249.095+$100.000
  ["2026-01-31","CA-004-26","Causación","Causación nómina enero 2026 — 3 empleados","CA-004","Empleados",[
    ["51050605","Sueldo enero — Carlos Mejía Rondón",4500000,0],
    ["51050610","Sueldo enero — Sandra Torres Díaz",3200000,0],
    ["51050615","Sueldo enero — Luis Herrera Camargo",2000000,0],
    ["51052705","Auxilio de transporte enero — Luis Herrera",249095,0],
    ["52500505","Comisión ventas enero — Luis Herrera Camargo",100000,0],
    ["51054205","Aportes salud empleador enero (8.5%)",824500,0],
    ["51054505","Aportes pensión empleador enero (12%)",1164000,0],
    ["51054805","Aportes ARL enero (0.522%)",50634,0],
    ["51055105","Aportes caja compensación enero (4%)",388000,0],
    ["25050505","Nómina por pagar enero — Carlos Mejía (neto)",0,4140000],
    ["25050510","Nómina por pagar enero — Sandra Torres (neto)",0,2944000],
    ["25050515","Nómina por pagar enero — Luis Herrera (neto)",0,2189095],
    ["23700505","SS salud por pagar enero (empl.$388.000+empr.$824.500)",0,1212500],
    ["23701005","SS pensión por pagar enero (empl.$388.000+empr.$1.164.000)",0,1552000],
    ["23701505","ARL por pagar enero",0,50634],
    ["23702005","Caja compensación por pagar enero",0,388000],
  ]],
  ["2026-01-31","CA-005-26","Causación","Causación prestaciones sociales enero 2026","CA-005","Empleados",[
    ["51053005","Gasto cesantías enero",836758,0],
    ["51053305","Gasto intereses cesantías enero",8375,0],
    ["51053605","Gasto prima de servicios enero",836758,0],
    ["51053905","Gasto vacaciones enero",404166,0],
    ["25100505","Cesantías consolidadas enero",0,836758],
    ["25150505","Intereses sobre cesantías enero",0,8375],
    ["25200505","Prima de servicios enero",0,836758],
    ["25250505","Vacaciones consolidadas enero",0,404166],
  ]],
  ["2026-02-28","CE-007-26","Comprobante de egreso","Pago nómina neta enero 2026 — 3 empleados","CE-007","Empleados",[
    ["25050505","Cancelación nómina por pagar — Carlos Mejía enero",4140000,0],
    ["25050510","Cancelación nómina por pagar — Sandra Torres enero",2944000,0],
    ["25050515","Cancelación nómina por pagar — Luis Herrera enero",2189095,0],
    ["11101505","Banco Davivienda — pago nómina neta enero",0,9273095],
  ]],
  ["2026-02-28","CE-008-26","Comprobante de egreso","Pago PILA seguridad social enero 2026","CE-008","PILA",[
    ["23700505","Cancelación SS salud enero (empl.+empr.)",1212500,0],
    ["23701005","Cancelación SS pensión enero (empl.+empr.)",1552000,0],
    ["23701505","Cancelación ARL enero",50634,0],
    ["23702005","Cancelación caja compensación enero",388000,0],
    ["11101505","Banco Davivienda — pago PILA enero",0,3203134],
  ]],
  // ── Nómina febrero 2026 ────────────────────────────────────────────────────
  ["2026-02-28","CA-006-26","Causación","Causación nómina febrero 2026 — 3 empleados","CA-006","Empleados",[
    ["51050605","Sueldo febrero — Carlos Mejía Rondón",4500000,0],
    ["51050610","Sueldo febrero — Sandra Torres Díaz",3200000,0],
    ["51050615","Sueldo febrero — Luis Herrera Camargo",2000000,0],
    ["51052705","Auxilio de transporte febrero — Luis Herrera",249095,0],
    ["52500505","Comisión ventas febrero — Luis Herrera Camargo",100000,0],
    ["51054205","Aportes salud empleador febrero (8.5%)",824500,0],
    ["51054505","Aportes pensión empleador febrero (12%)",1164000,0],
    ["51054805","Aportes ARL febrero (0.522%)",50634,0],
    ["51055105","Aportes caja compensación febrero (4%)",388000,0],
    ["25050505","Nómina por pagar febrero — Carlos Mejía (neto)",0,4140000],
    ["25050510","Nómina por pagar febrero — Sandra Torres (neto)",0,2944000],
    ["25050515","Nómina por pagar febrero — Luis Herrera (neto)",0,2189095],
    ["23700505","SS salud por pagar febrero (empl.$388.000+empr.$824.500)",0,1212500],
    ["23701005","SS pensión por pagar febrero (empl.$388.000+empr.$1.164.000)",0,1552000],
    ["23701505","ARL por pagar febrero",0,50634],
    ["23702005","Caja compensación por pagar febrero",0,388000],
  ]],
  ["2026-02-28","CA-007-26","Causación","Causación prestaciones sociales febrero 2026","CA-007","Empleados",[
    ["51053005","Gasto cesantías febrero",836758,0],
    ["51053305","Gasto intereses cesantías febrero",8375,0],
    ["51053605","Gasto prima de servicios febrero",836758,0],
    ["51053905","Gasto vacaciones febrero",404166,0],
    ["25100505","Cesantías consolidadas febrero",0,836758],
    ["25150505","Intereses sobre cesantías febrero",0,8375],
    ["25200505","Prima de servicios febrero",0,836758],
    ["25250505","Vacaciones consolidadas febrero",0,404166],
  ]],
  ["2026-03-05","CE-009-26","Comprobante de egreso","Pago nómina neta febrero 2026 — 3 empleados","CE-009","Empleados",[
    ["25050505","Cancelación nómina por pagar — Carlos Mejía febrero",4140000,0],
    ["25050510","Cancelación nómina por pagar — Sandra Torres febrero",2944000,0],
    ["25050515","Cancelación nómina por pagar — Luis Herrera febrero",2189095,0],
    ["11101505","Banco Davivienda — pago nómina neta febrero",0,9273095],
  ]],
  ["2026-03-05","CE-010-26","Comprobante de egreso","Pago PILA seguridad social febrero 2026","CE-010","PILA",[
    ["23700505","Cancelación SS salud febrero (empl.+empr.)",1212500,0],
    ["23701005","Cancelación SS pensión febrero (empl.+empr.)",1552000,0],
    ["23701505","Cancelación ARL febrero",50634,0],
    ["23702005","Cancelación caja compensación febrero",388000,0],
    ["11101505","Banco Davivienda — pago PILA febrero",0,3203134],
  ]],
  // ── Notas de contabilidad — Depreciación (enero y febrero 2026) ───────────
  // Línea recta, vida útil 10 años (120 meses)
  // Escritorios $30M→$250.000/mes | Sillas $15M→$125.000 | Archiv. $20M→$166.667
  // Mesa $22.5M→$187.500 | Estanterías $12.5M→$104.167 | Total $833.334/mes
  ["2026-01-31","NC-001-26","Nota de contabilidad","Depreciación muebles y enseres enero 2026 — línea recta 120 meses","NC-001","Activos fijos",[
    ["51600505","Dep. enero — Escritorios ejecutivos (5 und.)",250000,0],
    ["51600510","Dep. enero — Sillas ergonómicas (8 und.)",125000,0],
    ["51600515","Dep. enero — Archivadores metálicos (4 und.)",166667,0],
    ["51600520","Dep. enero — Mesa de juntas y sillas de sala",187500,0],
    ["51600525","Dep. enero — Estanterías y muebles de recepción",104167,0],
    ["15920505","Dep. acum. enero — Escritorios ejecutivos",0,250000],
    ["15920510","Dep. acum. enero — Sillas ergonómicas",0,125000],
    ["15920515","Dep. acum. enero — Archivadores metálicos",0,166667],
    ["15920520","Dep. acum. enero — Mesa de juntas",0,187500],
    ["15920525","Dep. acum. enero — Estanterías",0,104167],
  ]],
  ["2026-02-28","NC-002-26","Nota de contabilidad","Depreciación muebles y enseres febrero 2026 — línea recta 120 meses","NC-002","Activos fijos",[
    ["51600505","Dep. febrero — Escritorios ejecutivos (5 und.)",250000,0],
    ["51600510","Dep. febrero — Sillas ergonómicas (8 und.)",125000,0],
    ["51600515","Dep. febrero — Archivadores metálicos (4 und.)",166667,0],
    ["51600520","Dep. febrero — Mesa de juntas y sillas de sala",187500,0],
    ["51600525","Dep. febrero — Estanterías y muebles de recepción",104167,0],
    ["15920505","Dep. acum. febrero — Escritorios ejecutivos",0,250000],
    ["15920510","Dep. acum. febrero — Sillas ergonómicas",0,125000],
    ["15920515","Dep. acum. febrero — Archivadores metálicos",0,166667],
    ["15920520","Dep. acum. febrero — Mesa de juntas",0,187500],
    ["15920525","Dep. acum. febrero — Estanterías",0,104167],
  ]],

  ["2026-03-05", "FV-009-26", "Factura de venta", "Venta Tecno Norte S.A.S. — FV-009-26", "FV-009-26", "Tecno Norte S.A.S.", [["13050505", "Cartera FV-009-26 — Tecno Norte S.A.S.", 17475000, 0], ["13551505", "Retención a favor 2.5% — FV-009-26", 375000, 0], ["41350505", "Venta — PROD-01 x4 — FV-009-26", 0, 10000000], ["41350515", "Venta — PROD-03 x5 — FV-009-26", 0, 5000000], ["24080505", "IVA generado 19% — FV-009-26", 0, 2850000], ["61350505", "Costo PROD-01 x4", 7000000, 0], ["14300505", "Costo PROD-01 x4", 0, 7000000], ["61350515", "Costo PROD-03 x5", 3500000, 0], ["14300515", "Costo PROD-03 x5", 0, 3500000]]],
  ["2026-03-12", "FV-010-26", "Factura de venta", "Venta Constructora Palermo S.A. — FV-010-26", "FV-010-26", "Constructora Palermo S.A.", [["13050505", "Cartera FV-010-26 — Constructora Palermo S.A.", 6990000, 0], ["13551505", "Retención a favor 2.5% — FV-010-26", 150000, 0], ["41350520", "Venta — PROD-04 x8 — FV-010-26", 0, 6000000], ["24080505", "IVA generado 19% — FV-010-26", 0, 1140000], ["61350520", "Costo PROD-04 x8", 4000000, 0], ["14300520", "Costo PROD-04 x8", 0, 4000000]]],
  ["2026-03-20", "FV-011-26", "Factura de venta", "Venta Alcaldía de Soledad — FV-011-26", "FV-011-26", "Alcaldía de Soledad", [["13050505", "Cartera FV-011-26 — Alcaldía de Soledad", 9200000, 0], ["13551505", "Retención a favor 4.0% — FV-011-26", 320000, 0], ["41750505", "Venta — SERV-01 x1 — FV-011-26", 0, 8000000], ["24080505", "IVA generado 19% — FV-011-26", 0, 1520000]]],
  ["2026-03-10", "FC-003-26", "Factura de compra", "Compra Importech Colombia S.A.S. — FC-003-26", "FC-003-26", "Importech Colombia S.A.S.", [["14300505", "FC-003-26 — Inventario PROD-01 x10", 17500000, 0], ["14300510", "FC-003-26 — Inventario PROD-02 x5", 8750000, 0], ["24081005", "IVA descontable 19% — FC-003-26", 4987500, 0], ["23654005", "Retención compras 2.5% — FC-003-26", 0, 656250], ["22050505", "Proveedores — Importech Colombia S.A.S.", 0, 30581250]]],
  ["2026-03-31", "CA-008-26", "Causación", "Causación nómina Marzo 2026", "CA-008-26", "Empleados", [["51050605", "Sueldo Marzo — Carlos Mejía", 4500000, 0], ["51050610", "Sueldo Marzo — Sandra Torres", 3200000, 0], ["51050615", "Sueldo Marzo — Luis Herrera", 2000000, 0], ["51052705", "Auxilio transporte Marzo — Luis Herrera", 249095, 0], ["52500505", "Comisión ventas Marzo — Luis Herrera", 100000, 0], ["51054205", "Aportes salud empleador Marzo (8.5%)", 824500, 0], ["51054505", "Aportes pensión empleador Marzo (12%)", 1164000, 0], ["51054805", "Aportes ARL Marzo (0.522%)", 50634, 0], ["51055105", "Aportes caja compensación Marzo (4%)", 388000, 0], ["25050505", "Nómina por pagar Marzo — Carlos Mejía (neto)", 0, 4140000], ["25050510", "Nómina por pagar Marzo — Sandra Torres (neto)", 0, 2944000], ["25050515", "Nómina por pagar Marzo — Luis Herrera (neto)", 0, 2189095], ["23700505", "SS salud por pagar Marzo (empl.+empr.)", 0, 1212500], ["23701005", "SS pensión por pagar Marzo (empl.+empr.)", 0, 1552000], ["23701505", "ARL por pagar Marzo", 0, 50634], ["23702005", "Caja compensación por pagar Marzo", 0, 388000]]],
  ["2026-03-31", "CA-009-26", "Causación", "Causación prestaciones Marzo 2026", "CA-009-26", "Empleados", [["51053005", "Gasto cesantías Marzo", 837425, 0], ["51053305", "Gasto intereses cesantías Marzo", 8374, 0], ["51053605", "Gasto prima de servicios Marzo", 837425, 0], ["51053905", "Gasto vacaciones Marzo", 404167, 0], ["25100505", "Cesantías consolidadas Marzo", 0, 837425], ["25150505", "Intereses cesantías Marzo", 0, 8374], ["25200505", "Prima de servicios Marzo", 0, 837425], ["25250505", "Vacaciones consolidadas Marzo", 0, 404167]]],
  ["2026-03-31", "CA-010-26", "Causación", "Causación servicios públicos Marzo", "CA-010-26", "Varios", [["51351005", "Gasto gas Marzo — Gases del Caribe", 850000, 0], ["51351010", "Gasto agua Marzo — Triple A", 620000, 0], ["51351015", "Gasto energía Marzo — Air-e", 1450000, 0], ["51351020", "Gasto teléfono Marzo — Claro", 980000, 0], ["23351505", "Servicios públicos por pagar Marzo", 0, 3900000]]],
  ["2026-03-31", "CA-011-26", "Causación", "Causación arrendamiento Marzo", "CA-011-26", "Arrendadora Inmobiliaria Caribe", [["51200505", "Arrendamiento Marzo — Arrendadora Inmobiliaria Caribe", 3500000, 0], ["23652505", "Retención arrendamiento 3.5% Marzo", 0, 122500], ["23351005", "Arrendamiento por pagar neto Marzo", 0, 3377500]]],
  ["2026-03-31", "CA-012-26", "Causación", "Causación honorarios Marzo", "CA-012-26", "Asesorías Jurídicas del Norte", [["51100505", "Honorarios Marzo — Asesorías Jurídicas del Norte", 5000000, 0], ["23651505", "Retención honorarios 11% Marzo", 0, 550000], ["23350515", "Honorarios por pagar neto Marzo", 0, 4450000]]],
  ["2026-03-31", "NC-003-26", "Nota de contabilidad", "Depreciación muebles y enseres Marzo 2026 — línea recta 120 meses", "NC-003-26", "Activos fijos", [["51600505", "Dep. Marzo — Escritorios", 250000, 0], ["51600510", "Dep. Marzo — Sillas", 125000, 0], ["51600515", "Dep. Marzo — Archivadores", 166667, 0], ["51600520", "Dep. Marzo — Mesa juntas", 187500, 0], ["51600525", "Dep. Marzo — Estanterías", 104167, 0], ["15920505", "Dep. acum. Marzo — Escritorios", 0, 250000], ["15920510", "Dep. acum. Marzo — Sillas", 0, 125000], ["15920515", "Dep. acum. Marzo — Archivadores", 0, 166667], ["15920520", "Dep. acum. Marzo — Mesa juntas", 0, 187500], ["15920525", "Dep. acum. Marzo — Estanterías", 0, 104167]]],
  ["2026-03-05", "CE-011-26", "Comprobante de egreso", "Pago nómina Febrero 2026", "CE-011-26", "Empleados", [["25050505", "Cancelación nómina — Carlos Febrero", 4140000, 0], ["25050510", "Cancelación nómina — Sandra Febrero", 2944000, 0], ["25050515", "Cancelación nómina — Luis Febrero", 2189095, 0], ["11101505", "Banco — pago nómina neta Febrero", 0, 9273095]]],
  ["2026-03-05", "CE-012-26", "Comprobante de egreso", "Pago PILA Febrero 2026", "CE-012-26", "PILA", [["23700505", "Cancelación SS salud Febrero", 1212500, 0], ["23701005", "Cancelación SS pensión Febrero", 1552000, 0], ["23701505", "Cancelación ARL Febrero", 50634, 0], ["23702005", "Cancelación caja compensación Febrero", 388000, 0], ["11101505", "Banco — pago PILA Febrero", 0, 3203134]]],
  ["2026-03-10", "CE-013-26", "Comprobante de egreso", "Pago servicios públicos Febrero", "CE-013-26", "Varios", [["23351505", "Cancelación servicios públicos Febrero", 3900000, 0], ["11101505", "Banco — pago servicios públicos Febrero", 0, 3900000]]],
  ["2026-03-10", "CE-014-26", "Comprobante de egreso", "Pago arrendamiento Febrero", "CE-014-26", "Arrendadora Inmobiliaria Caribe", [["23351005", "Cancelación arrendamiento neto Febrero", 3377500, 0], ["11101505", "Banco — pago arrendamiento neto Febrero", 0, 3377500]]],
  ["2026-03-10", "CE-015-26", "Comprobante de egreso", "Pago honorarios Febrero", "CE-015-26", "Asesorías Jurídicas del Norte", [["23350515", "Cancelación honorarios neto Febrero", 4450000, 0], ["11101505", "Banco — pago honorarios neto Febrero", 0, 4450000]]],
  ["2026-03-10", "CE-016-26", "Comprobante de egreso", "Pago retención en la fuente Febrero — Form. 350", "CE-016-26", "DIAN", [["23651505", "Retención honorarios Febrero", 550000, 0], ["23652505", "Retención arrendamiento Febrero", 122500, 0], ["11101505", "Banco — pago retención fuente Form. 350 Febrero", 0, 672500]]],
  ["2026-04-05", "FV-012-26", "Factura de venta", "Venta Distribuidora del Caribe Ltda. — FV-012-26", "FV-012-26", "Distribuidora del Caribe Ltda.", [["13050505", "Cartera FV-012-26 — Distribuidora del Caribe Ltda.", 17475000, 0], ["13551505", "Retención a favor 2.5% — FV-012-26", 375000, 0], ["41350510", "Venta — PROD-02 x6 — FV-012-26", 0, 15000000], ["24080505", "IVA generado 19% — FV-012-26", 0, 2850000], ["61350510", "Costo PROD-02 x6", 10500000, 0], ["14300510", "Costo PROD-02 x6", 0, 10500000]]],
  ["2026-04-12", "FV-013-26", "Factura de venta", "Venta Clínica Regional S.A.S. — FV-013-26", "FV-013-26", "Clínica Regional S.A.S.", [["13050505", "Cartera FV-013-26 — Clínica Regional S.A.S.", 11650000, 0], ["13551505", "Retención a favor 2.5% — FV-013-26", 250000, 0], ["41350515", "Venta — PROD-03 x10 — FV-013-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-013-26", 0, 1900000], ["61350515", "Costo PROD-03 x10", 7000000, 0], ["14300515", "Costo PROD-03 x10", 0, 7000000]]],
  ["2026-04-20", "FV-014-26", "Factura de venta", "Venta Agroindustrial Costa Ltda. — FV-014-26", "FV-014-26", "Agroindustrial Costa Ltda.", [["13050505", "Cartera FV-014-26 — Agroindustrial Costa Ltda.", 6900000, 0], ["13551505", "Retención a favor 4.0% — FV-014-26", 240000, 0], ["41750510", "Venta — SERV-02 x1 — FV-014-26", 0, 6000000], ["24080505", "IVA generado 19% — FV-014-26", 0, 1140000]]],
  ["2026-04-30", "CA-013-26", "Causación", "Causación nómina Abril 2026", "CA-013-26", "Empleados", [["51050605", "Sueldo Abril — Carlos Mejía", 4500000, 0], ["51050610", "Sueldo Abril — Sandra Torres", 3200000, 0], ["51050615", "Sueldo Abril — Luis Herrera", 2000000, 0], ["51052705", "Auxilio transporte Abril — Luis Herrera", 249095, 0], ["52500505", "Comisión ventas Abril — Luis Herrera", 100000, 0], ["51054205", "Aportes salud empleador Abril (8.5%)", 824500, 0], ["51054505", "Aportes pensión empleador Abril (12%)", 1164000, 0], ["51054805", "Aportes ARL Abril (0.522%)", 50634, 0], ["51055105", "Aportes caja compensación Abril (4%)", 388000, 0], ["25050505", "Nómina por pagar Abril — Carlos Mejía (neto)", 0, 4140000], ["25050510", "Nómina por pagar Abril — Sandra Torres (neto)", 0, 2944000], ["25050515", "Nómina por pagar Abril — Luis Herrera (neto)", 0, 2189095], ["23700505", "SS salud por pagar Abril (empl.+empr.)", 0, 1212500], ["23701005", "SS pensión por pagar Abril (empl.+empr.)", 0, 1552000], ["23701505", "ARL por pagar Abril", 0, 50634], ["23702005", "Caja compensación por pagar Abril", 0, 388000]]],
  ["2026-04-30", "CA-014-26", "Causación", "Causación prestaciones Abril 2026", "CA-014-26", "Empleados", [["51053005", "Gasto cesantías Abril", 837425, 0], ["51053305", "Gasto intereses cesantías Abril", 8374, 0], ["51053605", "Gasto prima de servicios Abril", 837425, 0], ["51053905", "Gasto vacaciones Abril", 404167, 0], ["25100505", "Cesantías consolidadas Abril", 0, 837425], ["25150505", "Intereses cesantías Abril", 0, 8374], ["25200505", "Prima de servicios Abril", 0, 837425], ["25250505", "Vacaciones consolidadas Abril", 0, 404167]]],
  ["2026-04-30", "CA-015-26", "Causación", "Causación servicios públicos Abril", "CA-015-26", "Varios", [["51351005", "Gasto gas Abril — Gases del Caribe", 850000, 0], ["51351010", "Gasto agua Abril — Triple A", 620000, 0], ["51351015", "Gasto energía Abril — Air-e", 1450000, 0], ["51351020", "Gasto teléfono Abril — Claro", 980000, 0], ["23351505", "Servicios públicos por pagar Abril", 0, 3900000]]],
  ["2026-04-30", "CA-016-26", "Causación", "Causación arrendamiento Abril", "CA-016-26", "Arrendadora Inmobiliaria Caribe", [["51200505", "Arrendamiento Abril — Arrendadora Inmobiliaria Caribe", 3500000, 0], ["23652505", "Retención arrendamiento 3.5% Abril", 0, 122500], ["23351005", "Arrendamiento por pagar neto Abril", 0, 3377500]]],
  ["2026-04-30", "CA-017-26", "Causación", "Causación honorarios Abril", "CA-017-26", "Asesorías Jurídicas del Norte", [["51100505", "Honorarios Abril — Asesorías Jurídicas del Norte", 5000000, 0], ["23651505", "Retención honorarios 11% Abril", 0, 550000], ["23350515", "Honorarios por pagar neto Abril", 0, 4450000]]],
  ["2026-04-30", "NC-004-26", "Nota de contabilidad", "Depreciación muebles y enseres Abril 2026 — línea recta 120 meses", "NC-004-26", "Activos fijos", [["51600505", "Dep. Abril — Escritorios", 250000, 0], ["51600510", "Dep. Abril — Sillas", 125000, 0], ["51600515", "Dep. Abril — Archivadores", 166667, 0], ["51600520", "Dep. Abril — Mesa juntas", 187500, 0], ["51600525", "Dep. Abril — Estanterías", 104167, 0], ["15920505", "Dep. acum. Abril — Escritorios", 0, 250000], ["15920510", "Dep. acum. Abril — Sillas", 0, 125000], ["15920515", "Dep. acum. Abril — Archivadores", 0, 166667], ["15920520", "Dep. acum. Abril — Mesa juntas", 0, 187500], ["15920525", "Dep. acum. Abril — Estanterías", 0, 104167]]],
  ["2026-04-05", "CE-017-26", "Comprobante de egreso", "Pago nómina Marzo 2026", "CE-017-26", "Empleados", [["25050505", "Cancelación nómina — Carlos Marzo", 4140000, 0], ["25050510", "Cancelación nómina — Sandra Marzo", 2944000, 0], ["25050515", "Cancelación nómina — Luis Marzo", 2189095, 0], ["11101505", "Banco — pago nómina neta Marzo", 0, 9273095]]],
  ["2026-04-05", "CE-018-26", "Comprobante de egreso", "Pago PILA Marzo 2026", "CE-018-26", "PILA", [["23700505", "Cancelación SS salud Marzo", 1212500, 0], ["23701005", "Cancelación SS pensión Marzo", 1552000, 0], ["23701505", "Cancelación ARL Marzo", 50634, 0], ["23702005", "Cancelación caja compensación Marzo", 388000, 0], ["11101505", "Banco — pago PILA Marzo", 0, 3203134]]],
  ["2026-04-10", "CE-019-26", "Comprobante de egreso", "Pago servicios públicos Marzo", "CE-019-26", "Varios", [["23351505", "Cancelación servicios públicos Marzo", 3900000, 0], ["11101505", "Banco — pago servicios públicos Marzo", 0, 3900000]]],
  ["2026-04-10", "CE-020-26", "Comprobante de egreso", "Pago arrendamiento Marzo", "CE-020-26", "Arrendadora Inmobiliaria Caribe", [["23351005", "Cancelación arrendamiento neto Marzo", 3377500, 0], ["11101505", "Banco — pago arrendamiento neto Marzo", 0, 3377500]]],
  ["2026-04-10", "CE-021-26", "Comprobante de egreso", "Pago honorarios Marzo", "CE-021-26", "Asesorías Jurídicas del Norte", [["23350515", "Cancelación honorarios neto Marzo", 4450000, 0], ["11101505", "Banco — pago honorarios neto Marzo", 0, 4450000]]],
  ["2026-04-10", "CE-022-26", "Comprobante de egreso", "Pago retención en la fuente Marzo — Form. 350", "CE-022-26", "DIAN", [["23654005", "Retención compras Marzo", 656250, 0], ["23651505", "Retención honorarios Marzo", 550000, 0], ["23652505", "Retención arrendamiento Marzo", 122500, 0], ["11101505", "Banco — pago retención fuente Form. 350 Marzo", 0, 1328750]]],
  ["2026-04-15", "RC-006-26", "Recibo de caja", "Cobro cartera FV-009-26 — Tecno Norte S.A.S.", "RC-006-26", "Tecno Norte S.A.S.", [["11101505", "Banco — cobro FV-009-26 — Tecno Norte S.A.S.", 17475000, 0], ["13050505", "Cancelación cartera FV-009-26 — Tecno Norte S.A.S.", 0, 17475000]]],
  ["2026-04-15", "RC-007-26", "Recibo de caja", "Cobro cartera FV-010-26 — Constructora Palermo S.A.", "RC-007-26", "Constructora Palermo S.A.", [["11101505", "Banco — cobro FV-010-26 — Constructora Palermo S.A.", 6990000, 0], ["13050505", "Cancelación cartera FV-010-26 — Constructora Palermo S.A.", 0, 6990000]]],
  ["2026-04-15", "RC-008-26", "Recibo de caja", "Cobro cartera FV-011-26 — Alcaldía de Soledad", "RC-008-26", "Alcaldía de Soledad", [["11101505", "Banco — cobro FV-011-26 — Alcaldía de Soledad", 9200000, 0], ["13050505", "Cancelación cartera FV-011-26 — Alcaldía de Soledad", 0, 9200000]]],
  ["2026-04-28", "CE-023-26", "Comprobante de egreso", "Pago IVA Form. 300 — bimestre bimestre 2", "CE-023-26", "DIAN", [["24080505", "IVA generado bimestre bimestre 2", 11400000, 0], ["24081005", "IVA descontable bimestre bimestre 2", 0, 4987500], ["11101505", "Banco — pago IVA Form. 300 bimestre bimestre 2", 0, 6412500]]],
  ["2026-05-05", "FV-015-26", "Factura de venta", "Venta Tecno Norte S.A.S. — FV-015-26", "FV-015-26", "Tecno Norte S.A.S.", [["13050505", "Cartera FV-015-26 — Tecno Norte S.A.S.", 26212500, 0], ["13551505", "Retención a favor 2.5% — FV-015-26", 562500, 0], ["41350505", "Venta — PROD-01 x6 — FV-015-26", 0, 15000000], ["41350510", "Venta — PROD-02 x3 — FV-015-26", 0, 7500000], ["24080505", "IVA generado 19% — FV-015-26", 0, 4275000], ["61350505", "Costo PROD-01 x6", 10500000, 0], ["14300505", "Costo PROD-01 x6", 0, 10500000], ["61350510", "Costo PROD-02 x3", 5250000, 0], ["14300510", "Costo PROD-02 x3", 0, 5250000]]],
  ["2026-05-12", "FV-016-26", "Factura de venta", "Venta Pedro Martínez — FV-016-26", "FV-016-26", "Pedro Martínez", [["13050505", "Cartera FV-016-26 — Pedro Martínez", 9320000, 0], ["13551505", "Retención a favor 2.5% — FV-016-26", 200000, 0], ["41350515", "Venta — PROD-03 x8 — FV-016-26", 0, 8000000], ["24080505", "IVA generado 19% — FV-016-26", 0, 1520000], ["61350515", "Costo PROD-03 x8", 5600000, 0], ["14300515", "Costo PROD-03 x8", 0, 5600000]]],
  ["2026-05-20", "FV-017-26", "Factura de venta", "Venta Universidad Simón Bolívar — FV-017-26", "FV-017-26", "Universidad Simón Bolívar", [["13050505", "Cartera FV-017-26 — Universidad Simón Bolívar", 11500000, 0], ["13551505", "Retención a favor 4.0% — FV-017-26", 400000, 0], ["41750515", "Venta — SERV-03 x1 — FV-017-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-017-26", 0, 1900000]]],
  ["2026-05-10", "FC-004-26", "Factura de compra", "Compra Importech Colombia S.A.S. — FC-004-26", "FC-004-26", "Importech Colombia S.A.S.", [["14300505", "FC-004-26 — Inventario PROD-01 x12", 21000000, 0], ["14300510", "FC-004-26 — Inventario PROD-02 x8", 14000000, 0], ["24081005", "IVA descontable 19% — FC-004-26", 6650000, 0], ["23654005", "Retención compras 2.5% — FC-004-26", 0, 875000], ["22050505", "Proveedores — Importech Colombia S.A.S.", 0, 40775000]]],
  ["2026-05-31", "CA-018-26", "Causación", "Causación nómina Mayo 2026", "CA-018-26", "Empleados", [["51050605", "Sueldo Mayo — Carlos Mejía", 4500000, 0], ["51050610", "Sueldo Mayo — Sandra Torres", 3200000, 0], ["51050615", "Sueldo Mayo — Luis Herrera", 2000000, 0], ["51052705", "Auxilio transporte Mayo — Luis Herrera", 249095, 0], ["52500505", "Comisión ventas Mayo — Luis Herrera", 100000, 0], ["51054205", "Aportes salud empleador Mayo (8.5%)", 824500, 0], ["51054505", "Aportes pensión empleador Mayo (12%)", 1164000, 0], ["51054805", "Aportes ARL Mayo (0.522%)", 50634, 0], ["51055105", "Aportes caja compensación Mayo (4%)", 388000, 0], ["25050505", "Nómina por pagar Mayo — Carlos Mejía (neto)", 0, 4140000], ["25050510", "Nómina por pagar Mayo — Sandra Torres (neto)", 0, 2944000], ["25050515", "Nómina por pagar Mayo — Luis Herrera (neto)", 0, 2189095], ["23700505", "SS salud por pagar Mayo (empl.+empr.)", 0, 1212500], ["23701005", "SS pensión por pagar Mayo (empl.+empr.)", 0, 1552000], ["23701505", "ARL por pagar Mayo", 0, 50634], ["23702005", "Caja compensación por pagar Mayo", 0, 388000]]],
  ["2026-05-31", "CA-019-26", "Causación", "Causación prestaciones Mayo 2026", "CA-019-26", "Empleados", [["51053005", "Gasto cesantías Mayo", 837425, 0], ["51053305", "Gasto intereses cesantías Mayo", 8374, 0], ["51053605", "Gasto prima de servicios Mayo", 837425, 0], ["51053905", "Gasto vacaciones Mayo", 404167, 0], ["25100505", "Cesantías consolidadas Mayo", 0, 837425], ["25150505", "Intereses cesantías Mayo", 0, 8374], ["25200505", "Prima de servicios Mayo", 0, 837425], ["25250505", "Vacaciones consolidadas Mayo", 0, 404167]]],
  ["2026-05-31", "CA-020-26", "Causación", "Causación servicios públicos Mayo", "CA-020-26", "Varios", [["51351005", "Gasto gas Mayo — Gases del Caribe", 850000, 0], ["51351010", "Gasto agua Mayo — Triple A", 620000, 0], ["51351015", "Gasto energía Mayo — Air-e", 1450000, 0], ["51351020", "Gasto teléfono Mayo — Claro", 980000, 0], ["23351505", "Servicios públicos por pagar Mayo", 0, 3900000]]],
  ["2026-05-31", "CA-021-26", "Causación", "Causación arrendamiento Mayo", "CA-021-26", "Arrendadora Inmobiliaria Caribe", [["51200505", "Arrendamiento Mayo — Arrendadora Inmobiliaria Caribe", 3500000, 0], ["23652505", "Retención arrendamiento 3.5% Mayo", 0, 122500], ["23351005", "Arrendamiento por pagar neto Mayo", 0, 3377500]]],
  ["2026-05-31", "CA-022-26", "Causación", "Causación honorarios Mayo", "CA-022-26", "Asesorías Jurídicas del Norte", [["51100505", "Honorarios Mayo — Asesorías Jurídicas del Norte", 5000000, 0], ["23651505", "Retención honorarios 11% Mayo", 0, 550000], ["23350515", "Honorarios por pagar neto Mayo", 0, 4450000]]],
  ["2026-05-31", "NC-005-26", "Nota de contabilidad", "Depreciación muebles y enseres Mayo 2026 — línea recta 120 meses", "NC-005-26", "Activos fijos", [["51600505", "Dep. Mayo — Escritorios", 250000, 0], ["51600510", "Dep. Mayo — Sillas", 125000, 0], ["51600515", "Dep. Mayo — Archivadores", 166667, 0], ["51600520", "Dep. Mayo — Mesa juntas", 187500, 0], ["51600525", "Dep. Mayo — Estanterías", 104167, 0], ["15920505", "Dep. acum. Mayo — Escritorios", 0, 250000], ["15920510", "Dep. acum. Mayo — Sillas", 0, 125000], ["15920515", "Dep. acum. Mayo — Archivadores", 0, 166667], ["15920520", "Dep. acum. Mayo — Mesa juntas", 0, 187500], ["15920525", "Dep. acum. Mayo — Estanterías", 0, 104167]]],
  ["2026-05-05", "CE-024-26", "Comprobante de egreso", "Pago nómina Abril 2026", "CE-024-26", "Empleados", [["25050505", "Cancelación nómina — Carlos Abril", 4140000, 0], ["25050510", "Cancelación nómina — Sandra Abril", 2944000, 0], ["25050515", "Cancelación nómina — Luis Abril", 2189095, 0], ["11101505", "Banco — pago nómina neta Abril", 0, 9273095]]],
  ["2026-05-05", "CE-025-26", "Comprobante de egreso", "Pago PILA Abril 2026", "CE-025-26", "PILA", [["23700505", "Cancelación SS salud Abril", 1212500, 0], ["23701005", "Cancelación SS pensión Abril", 1552000, 0], ["23701505", "Cancelación ARL Abril", 50634, 0], ["23702005", "Cancelación caja compensación Abril", 388000, 0], ["11101505", "Banco — pago PILA Abril", 0, 3203134]]],
  ["2026-05-10", "CE-026-26", "Comprobante de egreso", "Pago servicios públicos Abril", "CE-026-26", "Varios", [["23351505", "Cancelación servicios públicos Abril", 3900000, 0], ["11101505", "Banco — pago servicios públicos Abril", 0, 3900000]]],
  ["2026-05-10", "CE-027-26", "Comprobante de egreso", "Pago arrendamiento Abril", "CE-027-26", "Arrendadora Inmobiliaria Caribe", [["23351005", "Cancelación arrendamiento neto Abril", 3377500, 0], ["11101505", "Banco — pago arrendamiento neto Abril", 0, 3377500]]],
  ["2026-05-10", "CE-028-26", "Comprobante de egreso", "Pago honorarios Abril", "CE-028-26", "Asesorías Jurídicas del Norte", [["23350515", "Cancelación honorarios neto Abril", 4450000, 0], ["11101505", "Banco — pago honorarios neto Abril", 0, 4450000]]],
  ["2026-05-10", "CE-029-26", "Comprobante de egreso", "Pago retención en la fuente Abril — Form. 350", "CE-029-26", "DIAN", [["23651505", "Retención honorarios Abril", 550000, 0], ["23652505", "Retención arrendamiento Abril", 122500, 0], ["11101505", "Banco — pago retención fuente Form. 350 Abril", 0, 672500]]],
  ["2026-05-15", "RC-009-26", "Recibo de caja", "Cobro cartera FV-012-26 — Distribuidora del Caribe Ltda.", "RC-009-26", "Distribuidora del Caribe Ltda.", [["11101505", "Banco — cobro FV-012-26 — Distribuidora del Caribe Ltda.", 17475000, 0], ["13050505", "Cancelación cartera FV-012-26 — Distribuidora del Caribe Ltda.", 0, 17475000]]],
  ["2026-05-15", "RC-010-26", "Recibo de caja", "Cobro cartera FV-013-26 — Clínica Regional S.A.S.", "RC-010-26", "Clínica Regional S.A.S.", [["11101505", "Banco — cobro FV-013-26 — Clínica Regional S.A.S.", 11650000, 0], ["13050505", "Cancelación cartera FV-013-26 — Clínica Regional S.A.S.", 0, 11650000]]],
  ["2026-05-15", "RC-011-26", "Recibo de caja", "Cobro cartera FV-014-26 — Agroindustrial Costa Ltda.", "RC-011-26", "Agroindustrial Costa Ltda.", [["11101505", "Banco — cobro FV-014-26 — Agroindustrial Costa Ltda.", 6900000, 0], ["13050505", "Cancelación cartera FV-014-26 — Agroindustrial Costa Ltda.", 0, 6900000]]],
  ["2026-06-05", "FV-018-26", "Factura de venta", "Venta Constructora Palermo S.A. — FV-018-26", "FV-018-26", "Constructora Palermo S.A.", [["13050505", "Cartera FV-018-26 — Constructora Palermo S.A.", 10485000, 0], ["13551505", "Retención a favor 2.5% — FV-018-26", 225000, 0], ["41350520", "Venta — PROD-04 x12 — FV-018-26", 0, 9000000], ["24080505", "IVA generado 19% — FV-018-26", 0, 1710000], ["61350520", "Costo PROD-04 x12", 6000000, 0], ["14300520", "Costo PROD-04 x12", 0, 6000000]]],
  ["2026-06-12", "FV-019-26", "Factura de venta", "Venta Clínica Regional S.A.S. — FV-019-26", "FV-019-26", "Clínica Regional S.A.S.", [["13050505", "Cartera FV-019-26 — Clínica Regional S.A.S.", 8737500, 0], ["13551505", "Retención a favor 2.5% — FV-019-26", 187500, 0], ["41350505", "Venta — PROD-01 x3 — FV-019-26", 0, 7500000], ["24080505", "IVA generado 19% — FV-019-26", 0, 1425000], ["61350505", "Costo PROD-01 x3", 5250000, 0], ["14300505", "Costo PROD-01 x3", 0, 5250000]]],
  ["2026-06-20", "FV-020-26", "Factura de venta", "Venta Alcaldía de Soledad — FV-020-26", "FV-020-26", "Alcaldía de Soledad", [["13050505", "Cartera FV-020-26 — Alcaldía de Soledad", 9200000, 0], ["13551505", "Retención a favor 4.0% — FV-020-26", 320000, 0], ["41750505", "Venta — SERV-01 x1 — FV-020-26", 0, 8000000], ["24080505", "IVA generado 19% — FV-020-26", 0, 1520000]]],
  ["2026-06-30", "CA-023-26", "Causación", "Causación nómina Junio 2026", "CA-023-26", "Empleados", [["51050605", "Sueldo Junio — Carlos Mejía", 4500000, 0], ["51050610", "Sueldo Junio — Sandra Torres", 3200000, 0], ["51050615", "Sueldo Junio — Luis Herrera", 2000000, 0], ["51052705", "Auxilio transporte Junio — Luis Herrera", 249095, 0], ["52500505", "Comisión ventas Junio — Luis Herrera", 100000, 0], ["51054205", "Aportes salud empleador Junio (8.5%)", 824500, 0], ["51054505", "Aportes pensión empleador Junio (12%)", 1164000, 0], ["51054805", "Aportes ARL Junio (0.522%)", 50634, 0], ["51055105", "Aportes caja compensación Junio (4%)", 388000, 0], ["25050505", "Nómina por pagar Junio — Carlos Mejía (neto)", 0, 4140000], ["25050510", "Nómina por pagar Junio — Sandra Torres (neto)", 0, 2944000], ["25050515", "Nómina por pagar Junio — Luis Herrera (neto)", 0, 2189095], ["23700505", "SS salud por pagar Junio (empl.+empr.)", 0, 1212500], ["23701005", "SS pensión por pagar Junio (empl.+empr.)", 0, 1552000], ["23701505", "ARL por pagar Junio", 0, 50634], ["23702005", "Caja compensación por pagar Junio", 0, 388000]]],
  ["2026-06-30", "CA-024-26", "Causación", "Causación prestaciones Junio 2026", "CA-024-26", "Empleados", [["51053005", "Gasto cesantías Junio", 837425, 0], ["51053305", "Gasto intereses cesantías Junio", 8374, 0], ["51053605", "Gasto prima de servicios Junio", 837425, 0], ["51053905", "Gasto vacaciones Junio", 404167, 0], ["25100505", "Cesantías consolidadas Junio", 0, 837425], ["25150505", "Intereses cesantías Junio", 0, 8374], ["25200505", "Prima de servicios Junio", 0, 837425], ["25250505", "Vacaciones consolidadas Junio", 0, 404167]]],
  ["2026-06-30", "CA-025-26", "Causación", "Causación servicios públicos Junio", "CA-025-26", "Varios", [["51351005", "Gasto gas Junio — Gases del Caribe", 850000, 0], ["51351010", "Gasto agua Junio — Triple A", 620000, 0], ["51351015", "Gasto energía Junio — Air-e", 1450000, 0], ["51351020", "Gasto teléfono Junio — Claro", 980000, 0], ["23351505", "Servicios públicos por pagar Junio", 0, 3900000]]],
  ["2026-06-30", "CA-026-26", "Causación", "Causación arrendamiento Junio", "CA-026-26", "Arrendadora Inmobiliaria Caribe", [["51200505", "Arrendamiento Junio — Arrendadora Inmobiliaria Caribe", 3500000, 0], ["23652505", "Retención arrendamiento 3.5% Junio", 0, 122500], ["23351005", "Arrendamiento por pagar neto Junio", 0, 3377500]]],
  ["2026-06-30", "CA-027-26", "Causación", "Causación honorarios Junio", "CA-027-26", "Asesorías Jurídicas del Norte", [["51100505", "Honorarios Junio — Asesorías Jurídicas del Norte", 5000000, 0], ["23651505", "Retención honorarios 11% Junio", 0, 550000], ["23350515", "Honorarios por pagar neto Junio", 0, 4450000]]],
  ["2026-06-30", "NC-006-26", "Nota de contabilidad", "Depreciación muebles y enseres Junio 2026 — línea recta 120 meses", "NC-006-26", "Activos fijos", [["51600505", "Dep. Junio — Escritorios", 250000, 0], ["51600510", "Dep. Junio — Sillas", 125000, 0], ["51600515", "Dep. Junio — Archivadores", 166667, 0], ["51600520", "Dep. Junio — Mesa juntas", 187500, 0], ["51600525", "Dep. Junio — Estanterías", 104167, 0], ["15920505", "Dep. acum. Junio — Escritorios", 0, 250000], ["15920510", "Dep. acum. Junio — Sillas", 0, 125000], ["15920515", "Dep. acum. Junio — Archivadores", 0, 166667], ["15920520", "Dep. acum. Junio — Mesa juntas", 0, 187500], ["15920525", "Dep. acum. Junio — Estanterías", 0, 104167]]],
  ["2026-06-05", "CE-030-26", "Comprobante de egreso", "Pago nómina Mayo 2026", "CE-030-26", "Empleados", [["25050505", "Cancelación nómina — Carlos Mayo", 4140000, 0], ["25050510", "Cancelación nómina — Sandra Mayo", 2944000, 0], ["25050515", "Cancelación nómina — Luis Mayo", 2189095, 0], ["11101505", "Banco — pago nómina neta Mayo", 0, 9273095]]],
  ["2026-06-05", "CE-031-26", "Comprobante de egreso", "Pago PILA Mayo 2026", "CE-031-26", "PILA", [["23700505", "Cancelación SS salud Mayo", 1212500, 0], ["23701005", "Cancelación SS pensión Mayo", 1552000, 0], ["23701505", "Cancelación ARL Mayo", 50634, 0], ["23702005", "Cancelación caja compensación Mayo", 388000, 0], ["11101505", "Banco — pago PILA Mayo", 0, 3203134]]],
  ["2026-06-10", "CE-032-26", "Comprobante de egreso", "Pago servicios públicos Mayo", "CE-032-26", "Varios", [["23351505", "Cancelación servicios públicos Mayo", 3900000, 0], ["11101505", "Banco — pago servicios públicos Mayo", 0, 3900000]]],
  ["2026-06-10", "CE-033-26", "Comprobante de egreso", "Pago arrendamiento Mayo", "CE-033-26", "Arrendadora Inmobiliaria Caribe", [["23351005", "Cancelación arrendamiento neto Mayo", 3377500, 0], ["11101505", "Banco — pago arrendamiento neto Mayo", 0, 3377500]]],
  ["2026-06-10", "CE-034-26", "Comprobante de egreso", "Pago honorarios Mayo", "CE-034-26", "Asesorías Jurídicas del Norte", [["23350515", "Cancelación honorarios neto Mayo", 4450000, 0], ["11101505", "Banco — pago honorarios neto Mayo", 0, 4450000]]],
  ["2026-06-10", "CE-035-26", "Comprobante de egreso", "Pago retención en la fuente Mayo — Form. 350", "CE-035-26", "DIAN", [["23654005", "Retención compras Mayo", 875000, 0], ["23651505", "Retención honorarios Mayo", 550000, 0], ["23652505", "Retención arrendamiento Mayo", 122500, 0], ["11101505", "Banco — pago retención fuente Form. 350 Mayo", 0, 1547500]]],
  ["2026-06-15", "RC-012-26", "Recibo de caja", "Cobro cartera FV-015-26 — Tecno Norte S.A.S.", "RC-012-26", "Tecno Norte S.A.S.", [["11101505", "Banco — cobro FV-015-26 — Tecno Norte S.A.S.", 26212500, 0], ["13050505", "Cancelación cartera FV-015-26 — Tecno Norte S.A.S.", 0, 26212500]]],
  ["2026-06-15", "RC-013-26", "Recibo de caja", "Cobro cartera FV-016-26 — Pedro Martínez", "RC-013-26", "Pedro Martínez", [["11101505", "Banco — cobro FV-016-26 — Pedro Martínez", 9320000, 0], ["13050505", "Cancelación cartera FV-016-26 — Pedro Martínez", 0, 9320000]]],
  ["2026-06-15", "RC-014-26", "Recibo de caja", "Cobro cartera FV-017-26 — Universidad Simón Bolívar", "RC-014-26", "Universidad Simón Bolívar", [["11101505", "Banco — cobro FV-017-26 — Universidad Simón Bolívar", 11500000, 0], ["13050505", "Cancelación cartera FV-017-26 — Universidad Simón Bolívar", 0, 11500000]]],
  ["2026-06-28", "CE-036-26", "Comprobante de egreso", "Pago IVA Form. 300 — bimestre bimestre 3", "CE-036-26", "DIAN", [["24080505", "IVA generado bimestre bimestre 3", 12350000, 0], ["24081005", "IVA descontable bimestre bimestre 3", 0, 6650000], ["11101505", "Banco — pago IVA Form. 300 bimestre bimestre 3", 0, 5700000]]],
  ["2026-07-05", "FV-021-26", "Factura de venta", "Venta Distribuidora del Caribe Ltda. — FV-021-26", "FV-021-26", "Distribuidora del Caribe Ltda.", [["13050505", "Cartera FV-021-26 — Distribuidora del Caribe Ltda.", 11650000, 0], ["13551505", "Retención a favor 2.5% — FV-021-26", 250000, 0], ["41350510", "Venta — PROD-02 x4 — FV-021-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-021-26", 0, 1900000], ["61350510", "Costo PROD-02 x4", 7000000, 0], ["14300510", "Costo PROD-02 x4", 0, 7000000]]],
  ["2026-07-12", "FV-022-26", "Factura de venta", "Venta Agroindustrial Costa Ltda. — FV-022-26", "FV-022-26", "Agroindustrial Costa Ltda.", [["13050505", "Cartera FV-022-26 — Agroindustrial Costa Ltda.", 6900000, 0], ["13551505", "Retención a favor 4.0% — FV-022-26", 240000, 0], ["41750510", "Venta — SERV-02 x1 — FV-022-26", 0, 6000000], ["24080505", "IVA generado 19% — FV-022-26", 0, 1140000]]],
  ["2026-07-10", "FC-005-26", "Factura de compra", "Compra Papelería Central Barranquilla S.A.S. — FC-005-26", "FC-005-26", "Papelería Central Barranquilla S.A.S.", [["14300515", "FC-005-26 — Inventario PROD-03 x20", 14000000, 0], ["14300520", "FC-005-26 — Inventario PROD-04 x10", 5000000, 0], ["24081005", "IVA descontable 19% — FC-005-26", 3610000, 0], ["23654005", "Retención compras 2.5% — FC-005-26", 0, 475000], ["22050505", "Proveedores — Papelería Central Barranquilla S.A.S.", 0, 22135000]]],
  ["2026-07-31", "CA-028-26", "Causación", "Causación nómina Julio 2026", "CA-028-26", "Empleados", [["51050605", "Sueldo Julio — Carlos Mejía", 4500000, 0], ["51050610", "Sueldo Julio — Sandra Torres", 3200000, 0], ["51050615", "Sueldo Julio — Luis Herrera", 2000000, 0], ["51052705", "Auxilio transporte Julio — Luis Herrera", 249095, 0], ["52500505", "Comisión ventas Julio — Luis Herrera", 100000, 0], ["51054205", "Aportes salud empleador Julio (8.5%)", 824500, 0], ["51054505", "Aportes pensión empleador Julio (12%)", 1164000, 0], ["51054805", "Aportes ARL Julio (0.522%)", 50634, 0], ["51055105", "Aportes caja compensación Julio (4%)", 388000, 0], ["25050505", "Nómina por pagar Julio — Carlos Mejía (neto)", 0, 4140000], ["25050510", "Nómina por pagar Julio — Sandra Torres (neto)", 0, 2944000], ["25050515", "Nómina por pagar Julio — Luis Herrera (neto)", 0, 2189095], ["23700505", "SS salud por pagar Julio (empl.+empr.)", 0, 1212500], ["23701005", "SS pensión por pagar Julio (empl.+empr.)", 0, 1552000], ["23701505", "ARL por pagar Julio", 0, 50634], ["23702005", "Caja compensación por pagar Julio", 0, 388000]]],
  ["2026-07-31", "CA-029-26", "Causación", "Causación prestaciones Julio 2026", "CA-029-26", "Empleados", [["51053005", "Gasto cesantías Julio", 837425, 0], ["51053305", "Gasto intereses cesantías Julio", 8374, 0], ["51053605", "Gasto prima de servicios Julio", 837425, 0], ["51053905", "Gasto vacaciones Julio", 404167, 0], ["25100505", "Cesantías consolidadas Julio", 0, 837425], ["25150505", "Intereses cesantías Julio", 0, 8374], ["25200505", "Prima de servicios Julio", 0, 837425], ["25250505", "Vacaciones consolidadas Julio", 0, 404167]]],
  ["2026-07-31", "CA-030-26", "Causación", "Causación servicios públicos Julio", "CA-030-26", "Varios", [["51351005", "Gasto gas Julio — Gases del Caribe", 850000, 0], ["51351010", "Gasto agua Julio — Triple A", 620000, 0], ["51351015", "Gasto energía Julio — Air-e", 1450000, 0], ["51351020", "Gasto teléfono Julio — Claro", 980000, 0], ["23351505", "Servicios públicos por pagar Julio", 0, 3900000]]],
  ["2026-07-31", "CA-031-26", "Causación", "Causación arrendamiento Julio", "CA-031-26", "Arrendadora Inmobiliaria Caribe", [["51200505", "Arrendamiento Julio — Arrendadora Inmobiliaria Caribe", 3500000, 0], ["23652505", "Retención arrendamiento 3.5% Julio", 0, 122500], ["23351005", "Arrendamiento por pagar neto Julio", 0, 3377500]]],
  ["2026-07-31", "CA-032-26", "Causación", "Causación honorarios Julio", "CA-032-26", "Asesorías Jurídicas del Norte", [["51100505", "Honorarios Julio — Asesorías Jurídicas del Norte", 5000000, 0], ["23651505", "Retención honorarios 11% Julio", 0, 550000], ["23350515", "Honorarios por pagar neto Julio", 0, 4450000]]],
  ["2026-07-31", "NC-007-26", "Nota de contabilidad", "Depreciación muebles y enseres Julio 2026 — línea recta 120 meses", "NC-007-26", "Activos fijos", [["51600505", "Dep. Julio — Escritorios", 250000, 0], ["51600510", "Dep. Julio — Sillas", 125000, 0], ["51600515", "Dep. Julio — Archivadores", 166667, 0], ["51600520", "Dep. Julio — Mesa juntas", 187500, 0], ["51600525", "Dep. Julio — Estanterías", 104167, 0], ["15920505", "Dep. acum. Julio — Escritorios", 0, 250000], ["15920510", "Dep. acum. Julio — Sillas", 0, 125000], ["15920515", "Dep. acum. Julio — Archivadores", 0, 166667], ["15920520", "Dep. acum. Julio — Mesa juntas", 0, 187500], ["15920525", "Dep. acum. Julio — Estanterías", 0, 104167]]],
  ["2026-07-05", "CE-037-26", "Comprobante de egreso", "Pago nómina Junio 2026", "CE-037-26", "Empleados", [["25050505", "Cancelación nómina — Carlos Junio", 4140000, 0], ["25050510", "Cancelación nómina — Sandra Junio", 2944000, 0], ["25050515", "Cancelación nómina — Luis Junio", 2189095, 0], ["11101505", "Banco — pago nómina neta Junio", 0, 9273095]]],
  ["2026-07-05", "CE-038-26", "Comprobante de egreso", "Pago PILA Junio 2026", "CE-038-26", "PILA", [["23700505", "Cancelación SS salud Junio", 1212500, 0], ["23701005", "Cancelación SS pensión Junio", 1552000, 0], ["23701505", "Cancelación ARL Junio", 50634, 0], ["23702005", "Cancelación caja compensación Junio", 388000, 0], ["11101505", "Banco — pago PILA Junio", 0, 3203134]]],
  ["2026-07-10", "CE-039-26", "Comprobante de egreso", "Pago servicios públicos Junio", "CE-039-26", "Varios", [["23351505", "Cancelación servicios públicos Junio", 3900000, 0], ["11101505", "Banco — pago servicios públicos Junio", 0, 3900000]]],
  ["2026-07-10", "CE-040-26", "Comprobante de egreso", "Pago arrendamiento Junio", "CE-040-26", "Arrendadora Inmobiliaria Caribe", [["23351005", "Cancelación arrendamiento neto Junio", 3377500, 0], ["11101505", "Banco — pago arrendamiento neto Junio", 0, 3377500]]],
  ["2026-07-10", "CE-041-26", "Comprobante de egreso", "Pago honorarios Junio", "CE-041-26", "Asesorías Jurídicas del Norte", [["23350515", "Cancelación honorarios neto Junio", 4450000, 0], ["11101505", "Banco — pago honorarios neto Junio", 0, 4450000]]],
  ["2026-07-10", "CE-042-26", "Comprobante de egreso", "Pago retención en la fuente Junio — Form. 350", "CE-042-26", "DIAN", [["23651505", "Retención honorarios Junio", 550000, 0], ["23652505", "Retención arrendamiento Junio", 122500, 0], ["11101505", "Banco — pago retención fuente Form. 350 Junio", 0, 672500]]],
  ["2026-07-15", "RC-015-26", "Recibo de caja", "Cobro cartera FV-018-26 — Constructora Palermo S.A.", "RC-015-26", "Constructora Palermo S.A.", [["11101505", "Banco — cobro FV-018-26 — Constructora Palermo S.A.", 10485000, 0], ["13050505", "Cancelación cartera FV-018-26 — Constructora Palermo S.A.", 0, 10485000]]],
  ["2026-07-15", "RC-016-26", "Recibo de caja", "Cobro cartera FV-019-26 — Clínica Regional S.A.S.", "RC-016-26", "Clínica Regional S.A.S.", [["11101505", "Banco — cobro FV-019-26 — Clínica Regional S.A.S.", 8737500, 0], ["13050505", "Cancelación cartera FV-019-26 — Clínica Regional S.A.S.", 0, 8737500]]],
  ["2026-07-15", "RC-017-26", "Recibo de caja", "Cobro cartera FV-020-26 — Alcaldía de Soledad", "RC-017-26", "Alcaldía de Soledad", [["11101505", "Banco — cobro FV-020-26 — Alcaldía de Soledad", 9200000, 0], ["13050505", "Cancelación cartera FV-020-26 — Alcaldía de Soledad", 0, 9200000]]],
  ["2026-08-05", "FV-023-26", "Factura de venta", "Venta Tecno Norte S.A.S. — FV-023-26", "FV-023-26", "Tecno Norte S.A.S.", [["13050505", "Cartera FV-023-26 — Tecno Norte S.A.S.", 8737500, 0], ["13551505", "Retención a favor 2.5% — FV-023-26", 187500, 0], ["41350505", "Venta — PROD-01 x3 — FV-023-26", 0, 7500000], ["24080505", "IVA generado 19% — FV-023-26", 0, 1425000], ["61350505", "Costo PROD-01 x3", 5250000, 0], ["14300505", "Costo PROD-01 x3", 0, 5250000]]],
  ["2026-08-12", "FV-024-26", "Factura de venta", "Venta Pedro Martínez — FV-024-26", "FV-024-26", "Pedro Martínez", [["13050505", "Cartera FV-024-26 — Pedro Martínez", 6990000, 0], ["13551505", "Retención a favor 2.5% — FV-024-26", 150000, 0], ["41350515", "Venta — PROD-03 x6 — FV-024-26", 0, 6000000], ["24080505", "IVA generado 19% — FV-024-26", 0, 1140000], ["61350515", "Costo PROD-03 x6", 4200000, 0], ["14300515", "Costo PROD-03 x6", 0, 4200000]]],
  ["2026-08-31", "CA-033-26", "Causación", "Causación nómina Agosto 2026", "CA-033-26", "Empleados", [["51050605", "Sueldo Agosto — Carlos Mejía", 4500000, 0], ["51050610", "Sueldo Agosto — Sandra Torres", 3200000, 0], ["51050615", "Sueldo Agosto — Luis Herrera", 2000000, 0], ["51052705", "Auxilio transporte Agosto — Luis Herrera", 249095, 0], ["52500505", "Comisión ventas Agosto — Luis Herrera", 100000, 0], ["51054205", "Aportes salud empleador Agosto (8.5%)", 824500, 0], ["51054505", "Aportes pensión empleador Agosto (12%)", 1164000, 0], ["51054805", "Aportes ARL Agosto (0.522%)", 50634, 0], ["51055105", "Aportes caja compensación Agosto (4%)", 388000, 0], ["25050505", "Nómina por pagar Agosto — Carlos Mejía (neto)", 0, 4140000], ["25050510", "Nómina por pagar Agosto — Sandra Torres (neto)", 0, 2944000], ["25050515", "Nómina por pagar Agosto — Luis Herrera (neto)", 0, 2189095], ["23700505", "SS salud por pagar Agosto (empl.+empr.)", 0, 1212500], ["23701005", "SS pensión por pagar Agosto (empl.+empr.)", 0, 1552000], ["23701505", "ARL por pagar Agosto", 0, 50634], ["23702005", "Caja compensación por pagar Agosto", 0, 388000]]],
  ["2026-08-31", "CA-034-26", "Causación", "Causación prestaciones Agosto 2026", "CA-034-26", "Empleados", [["51053005", "Gasto cesantías Agosto", 837425, 0], ["51053305", "Gasto intereses cesantías Agosto", 8374, 0], ["51053605", "Gasto prima de servicios Agosto", 837425, 0], ["51053905", "Gasto vacaciones Agosto", 404167, 0], ["25100505", "Cesantías consolidadas Agosto", 0, 837425], ["25150505", "Intereses cesantías Agosto", 0, 8374], ["25200505", "Prima de servicios Agosto", 0, 837425], ["25250505", "Vacaciones consolidadas Agosto", 0, 404167]]],
  ["2026-08-31", "CA-035-26", "Causación", "Causación servicios públicos Agosto", "CA-035-26", "Varios", [["51351005", "Gasto gas Agosto — Gases del Caribe", 850000, 0], ["51351010", "Gasto agua Agosto — Triple A", 620000, 0], ["51351015", "Gasto energía Agosto — Air-e", 1450000, 0], ["51351020", "Gasto teléfono Agosto — Claro", 980000, 0], ["23351505", "Servicios públicos por pagar Agosto", 0, 3900000]]],
  ["2026-08-31", "CA-036-26", "Causación", "Causación arrendamiento Agosto", "CA-036-26", "Arrendadora Inmobiliaria Caribe", [["51200505", "Arrendamiento Agosto — Arrendadora Inmobiliaria Caribe", 3500000, 0], ["23652505", "Retención arrendamiento 3.5% Agosto", 0, 122500], ["23351005", "Arrendamiento por pagar neto Agosto", 0, 3377500]]],
  ["2026-08-31", "CA-037-26", "Causación", "Causación honorarios Agosto", "CA-037-26", "Asesorías Jurídicas del Norte", [["51100505", "Honorarios Agosto — Asesorías Jurídicas del Norte", 5000000, 0], ["23651505", "Retención honorarios 11% Agosto", 0, 550000], ["23350515", "Honorarios por pagar neto Agosto", 0, 4450000]]],
  ["2026-08-31", "NC-008-26", "Nota de contabilidad", "Depreciación muebles y enseres Agosto 2026 — línea recta 120 meses", "NC-008-26", "Activos fijos", [["51600505", "Dep. Agosto — Escritorios", 250000, 0], ["51600510", "Dep. Agosto — Sillas", 125000, 0], ["51600515", "Dep. Agosto — Archivadores", 166667, 0], ["51600520", "Dep. Agosto — Mesa juntas", 187500, 0], ["51600525", "Dep. Agosto — Estanterías", 104167, 0], ["15920505", "Dep. acum. Agosto — Escritorios", 0, 250000], ["15920510", "Dep. acum. Agosto — Sillas", 0, 125000], ["15920515", "Dep. acum. Agosto — Archivadores", 0, 166667], ["15920520", "Dep. acum. Agosto — Mesa juntas", 0, 187500], ["15920525", "Dep. acum. Agosto — Estanterías", 0, 104167]]],
  ["2026-08-05", "CE-043-26", "Comprobante de egreso", "Pago nómina Julio 2026", "CE-043-26", "Empleados", [["25050505", "Cancelación nómina — Carlos Julio", 4140000, 0], ["25050510", "Cancelación nómina — Sandra Julio", 2944000, 0], ["25050515", "Cancelación nómina — Luis Julio", 2189095, 0], ["11101505", "Banco — pago nómina neta Julio", 0, 9273095]]],
  ["2026-08-05", "CE-044-26", "Comprobante de egreso", "Pago PILA Julio 2026", "CE-044-26", "PILA", [["23700505", "Cancelación SS salud Julio", 1212500, 0], ["23701005", "Cancelación SS pensión Julio", 1552000, 0], ["23701505", "Cancelación ARL Julio", 50634, 0], ["23702005", "Cancelación caja compensación Julio", 388000, 0], ["11101505", "Banco — pago PILA Julio", 0, 3203134]]],
  ["2026-08-10", "CE-045-26", "Comprobante de egreso", "Pago servicios públicos Julio", "CE-045-26", "Varios", [["23351505", "Cancelación servicios públicos Julio", 3900000, 0], ["11101505", "Banco — pago servicios públicos Julio", 0, 3900000]]],
  ["2026-08-10", "CE-046-26", "Comprobante de egreso", "Pago arrendamiento Julio", "CE-046-26", "Arrendadora Inmobiliaria Caribe", [["23351005", "Cancelación arrendamiento neto Julio", 3377500, 0], ["11101505", "Banco — pago arrendamiento neto Julio", 0, 3377500]]],
  ["2026-08-10", "CE-047-26", "Comprobante de egreso", "Pago honorarios Julio", "CE-047-26", "Asesorías Jurídicas del Norte", [["23350515", "Cancelación honorarios neto Julio", 4450000, 0], ["11101505", "Banco — pago honorarios neto Julio", 0, 4450000]]],
  ["2026-08-10", "CE-048-26", "Comprobante de egreso", "Pago retención en la fuente Julio — Form. 350", "CE-048-26", "DIAN", [["23654005", "Retención compras Julio", 475000, 0], ["23651505", "Retención honorarios Julio", 550000, 0], ["23652505", "Retención arrendamiento Julio", 122500, 0], ["11101505", "Banco — pago retención fuente Form. 350 Julio", 0, 1147500]]],
  ["2026-08-15", "RC-018-26", "Recibo de caja", "Cobro cartera FV-021-26 — Distribuidora del Caribe Ltda.", "RC-018-26", "Distribuidora del Caribe Ltda.", [["11101505", "Banco — cobro FV-021-26 — Distribuidora del Caribe Ltda.", 11650000, 0], ["13050505", "Cancelación cartera FV-021-26 — Distribuidora del Caribe Ltda.", 0, 11650000]]],
  ["2026-08-15", "RC-019-26", "Recibo de caja", "Cobro cartera FV-022-26 — Agroindustrial Costa Ltda.", "RC-019-26", "Agroindustrial Costa Ltda.", [["11101505", "Banco — cobro FV-022-26 — Agroindustrial Costa Ltda.", 6900000, 0], ["13050505", "Cancelación cartera FV-022-26 — Agroindustrial Costa Ltda.", 0, 6900000]]],
  ["2026-08-28", "CE-049-26", "Comprobante de egreso", "Pago IVA Form. 300 — bimestre bimestre 4", "CE-049-26", "DIAN", [["24080505", "IVA generado bimestre bimestre 4", 5605000, 0], ["24081005", "IVA descontable bimestre bimestre 4", 0, 3610000], ["11101505", "Banco — pago IVA Form. 300 bimestre bimestre 4", 0, 1995000]]],
  ["2026-09-05", "FV-025-26", "Factura de venta", "Venta Constructora Palermo S.A. — FV-025-26", "FV-025-26", "Constructora Palermo S.A.", [["13050505", "Cartera FV-025-26 — Constructora Palermo S.A.", 8737500, 0], ["13551505", "Retención a favor 2.5% — FV-025-26", 187500, 0], ["41350520", "Venta — PROD-04 x10 — FV-025-26", 0, 7500000], ["24080505", "IVA generado 19% — FV-025-26", 0, 1425000], ["61350520", "Costo PROD-04 x10", 5000000, 0], ["14300520", "Costo PROD-04 x10", 0, 5000000]]],
  ["2026-09-12", "FV-026-26", "Factura de venta", "Venta Clínica Regional S.A.S. — FV-026-26", "FV-026-26", "Clínica Regional S.A.S.", [["13050505", "Cartera FV-026-26 — Clínica Regional S.A.S.", 9320000, 0], ["13551505", "Retención a favor 2.5% — FV-026-26", 200000, 0], ["41350515", "Venta — PROD-03 x8 — FV-026-26", 0, 8000000], ["24080505", "IVA generado 19% — FV-026-26", 0, 1520000], ["61350515", "Costo PROD-03 x8", 5600000, 0], ["14300515", "Costo PROD-03 x8", 0, 5600000]]],
  ["2026-09-20", "FV-027-26", "Factura de venta", "Venta Universidad Simón Bolívar — FV-027-26", "FV-027-26", "Universidad Simón Bolívar", [["13050505", "Cartera FV-027-26 — Universidad Simón Bolívar", 11500000, 0], ["13551505", "Retención a favor 4.0% — FV-027-26", 400000, 0], ["41750515", "Venta — SERV-03 x1 — FV-027-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-027-26", 0, 1900000]]],
  ["2026-09-10", "FC-006-26", "Factura de compra", "Compra Importech Colombia S.A.S. — FC-006-26", "FC-006-26", "Importech Colombia S.A.S.", [["14300505", "FC-006-26 — Inventario PROD-01 x8", 14000000, 0], ["14300510", "FC-006-26 — Inventario PROD-02 x5", 8750000, 0], ["24081005", "IVA descontable 19% — FC-006-26", 4322500, 0], ["23654005", "Retención compras 2.5% — FC-006-26", 0, 568750], ["22050505", "Proveedores — Importech Colombia S.A.S.", 0, 26503750]]],
  ["2026-09-30", "CA-038-26", "Causación", "Causación nómina Septiembre 2026", "CA-038-26", "Empleados", [["51050605", "Sueldo Septiembre — Carlos Mejía", 4500000, 0], ["51050610", "Sueldo Septiembre — Sandra Torres", 3200000, 0], ["51050615", "Sueldo Septiembre — Luis Herrera", 2000000, 0], ["51052705", "Auxilio transporte Septiembre — Luis Herrera", 249095, 0], ["52500505", "Comisión ventas Septiembre — Luis Herrera", 100000, 0], ["51054205", "Aportes salud empleador Septiembre (8.5%)", 824500, 0], ["51054505", "Aportes pensión empleador Septiembre (12%)", 1164000, 0], ["51054805", "Aportes ARL Septiembre (0.522%)", 50634, 0], ["51055105", "Aportes caja compensación Septiembre (4%)", 388000, 0], ["25050505", "Nómina por pagar Septiembre — Carlos Mejía (neto)", 0, 4140000], ["25050510", "Nómina por pagar Septiembre — Sandra Torres (neto)", 0, 2944000], ["25050515", "Nómina por pagar Septiembre — Luis Herrera (neto)", 0, 2189095], ["23700505", "SS salud por pagar Septiembre (empl.+empr.)", 0, 1212500], ["23701005", "SS pensión por pagar Septiembre (empl.+empr.)", 0, 1552000], ["23701505", "ARL por pagar Septiembre", 0, 50634], ["23702005", "Caja compensación por pagar Septiembre", 0, 388000]]],
  ["2026-09-30", "CA-039-26", "Causación", "Causación prestaciones Septiembre 2026", "CA-039-26", "Empleados", [["51053005", "Gasto cesantías Septiembre", 837425, 0], ["51053305", "Gasto intereses cesantías Septiembre", 8374, 0], ["51053605", "Gasto prima de servicios Septiembre", 837425, 0], ["51053905", "Gasto vacaciones Septiembre", 404167, 0], ["25100505", "Cesantías consolidadas Septiembre", 0, 837425], ["25150505", "Intereses cesantías Septiembre", 0, 8374], ["25200505", "Prima de servicios Septiembre", 0, 837425], ["25250505", "Vacaciones consolidadas Septiembre", 0, 404167]]],
  ["2026-09-30", "CA-040-26", "Causación", "Causación servicios públicos Septiembre", "CA-040-26", "Varios", [["51351005", "Gasto gas Septiembre — Gases del Caribe", 850000, 0], ["51351010", "Gasto agua Septiembre — Triple A", 620000, 0], ["51351015", "Gasto energía Septiembre — Air-e", 1450000, 0], ["51351020", "Gasto teléfono Septiembre — Claro", 980000, 0], ["23351505", "Servicios públicos por pagar Septiembre", 0, 3900000]]],
  ["2026-09-30", "CA-041-26", "Causación", "Causación arrendamiento Septiembre", "CA-041-26", "Arrendadora Inmobiliaria Caribe", [["51200505", "Arrendamiento Septiembre — Arrendadora Inmobiliaria Caribe", 3500000, 0], ["23652505", "Retención arrendamiento 3.5% Septiembre", 0, 122500], ["23351005", "Arrendamiento por pagar neto Septiembre", 0, 3377500]]],
  ["2026-09-30", "CA-042-26", "Causación", "Causación honorarios Septiembre", "CA-042-26", "Asesorías Jurídicas del Norte", [["51100505", "Honorarios Septiembre — Asesorías Jurídicas del Norte", 5000000, 0], ["23651505", "Retención honorarios 11% Septiembre", 0, 550000], ["23350515", "Honorarios por pagar neto Septiembre", 0, 4450000]]],
  ["2026-09-30", "NC-009-26", "Nota de contabilidad", "Depreciación muebles y enseres Septiembre 2026 — línea recta 120 meses", "NC-009-26", "Activos fijos", [["51600505", "Dep. Septiembre — Escritorios", 250000, 0], ["51600510", "Dep. Septiembre — Sillas", 125000, 0], ["51600515", "Dep. Septiembre — Archivadores", 166667, 0], ["51600520", "Dep. Septiembre — Mesa juntas", 187500, 0], ["51600525", "Dep. Septiembre — Estanterías", 104167, 0], ["15920505", "Dep. acum. Septiembre — Escritorios", 0, 250000], ["15920510", "Dep. acum. Septiembre — Sillas", 0, 125000], ["15920515", "Dep. acum. Septiembre — Archivadores", 0, 166667], ["15920520", "Dep. acum. Septiembre — Mesa juntas", 0, 187500], ["15920525", "Dep. acum. Septiembre — Estanterías", 0, 104167]]],
  ["2026-09-05", "CE-050-26", "Comprobante de egreso", "Pago nómina Agosto 2026", "CE-050-26", "Empleados", [["25050505", "Cancelación nómina — Carlos Agosto", 4140000, 0], ["25050510", "Cancelación nómina — Sandra Agosto", 2944000, 0], ["25050515", "Cancelación nómina — Luis Agosto", 2189095, 0], ["11101505", "Banco — pago nómina neta Agosto", 0, 9273095]]],
  ["2026-09-05", "CE-051-26", "Comprobante de egreso", "Pago PILA Agosto 2026", "CE-051-26", "PILA", [["23700505", "Cancelación SS salud Agosto", 1212500, 0], ["23701005", "Cancelación SS pensión Agosto", 1552000, 0], ["23701505", "Cancelación ARL Agosto", 50634, 0], ["23702005", "Cancelación caja compensación Agosto", 388000, 0], ["11101505", "Banco — pago PILA Agosto", 0, 3203134]]],
  ["2026-09-10", "CE-052-26", "Comprobante de egreso", "Pago servicios públicos Agosto", "CE-052-26", "Varios", [["23351505", "Cancelación servicios públicos Agosto", 3900000, 0], ["11101505", "Banco — pago servicios públicos Agosto", 0, 3900000]]],
  ["2026-09-10", "CE-053-26", "Comprobante de egreso", "Pago arrendamiento Agosto", "CE-053-26", "Arrendadora Inmobiliaria Caribe", [["23351005", "Cancelación arrendamiento neto Agosto", 3377500, 0], ["11101505", "Banco — pago arrendamiento neto Agosto", 0, 3377500]]],
  ["2026-09-10", "CE-054-26", "Comprobante de egreso", "Pago honorarios Agosto", "CE-054-26", "Asesorías Jurídicas del Norte", [["23350515", "Cancelación honorarios neto Agosto", 4450000, 0], ["11101505", "Banco — pago honorarios neto Agosto", 0, 4450000]]],
  ["2026-09-10", "CE-055-26", "Comprobante de egreso", "Pago retención en la fuente Agosto — Form. 350", "CE-055-26", "DIAN", [["23651505", "Retención honorarios Agosto", 550000, 0], ["23652505", "Retención arrendamiento Agosto", 122500, 0], ["11101505", "Banco — pago retención fuente Form. 350 Agosto", 0, 672500]]],
  ["2026-09-15", "RC-020-26", "Recibo de caja", "Cobro cartera FV-023-26 — Tecno Norte S.A.S.", "RC-020-26", "Tecno Norte S.A.S.", [["11101505", "Banco — cobro FV-023-26 — Tecno Norte S.A.S.", 8737500, 0], ["13050505", "Cancelación cartera FV-023-26 — Tecno Norte S.A.S.", 0, 8737500]]],
  ["2026-09-15", "RC-021-26", "Recibo de caja", "Cobro cartera FV-024-26 — Pedro Martínez", "RC-021-26", "Pedro Martínez", [["11101505", "Banco — cobro FV-024-26 — Pedro Martínez", 6990000, 0], ["13050505", "Cancelación cartera FV-024-26 — Pedro Martínez", 0, 6990000]]],
  ["2026-10-05", "FV-028-26", "Factura de venta", "Venta Tecno Norte S.A.S. — FV-028-26", "FV-028-26", "Tecno Norte S.A.S.", [["13050505", "Cartera FV-028-26 — Tecno Norte S.A.S.", 26212500, 0], ["13551505", "Retención a favor 2.5% — FV-028-26", 562500, 0], ["41350505", "Venta — PROD-01 x5 — FV-028-26", 0, 12500000], ["41350510", "Venta — PROD-02 x4 — FV-028-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-028-26", 0, 4275000], ["61350505", "Costo PROD-01 x5", 8750000, 0], ["14300505", "Costo PROD-01 x5", 0, 8750000], ["61350510", "Costo PROD-02 x4", 7000000, 0], ["14300510", "Costo PROD-02 x4", 0, 7000000]]],
  ["2026-10-12", "FV-029-26", "Factura de venta", "Venta Distribuidora del Caribe Ltda. — FV-029-26", "FV-029-26", "Distribuidora del Caribe Ltda.", [["13050505", "Cartera FV-029-26 — Distribuidora del Caribe Ltda.", 13980000, 0], ["13551505", "Retención a favor 2.5% — FV-029-26", 300000, 0], ["41350515", "Venta — PROD-03 x12 — FV-029-26", 0, 12000000], ["24080505", "IVA generado 19% — FV-029-26", 0, 2280000], ["61350515", "Costo PROD-03 x12", 8400000, 0], ["14300515", "Costo PROD-03 x12", 0, 8400000]]],
  ["2026-10-20", "FV-030-26", "Factura de venta", "Venta Alcaldía de Soledad — FV-030-26", "FV-030-26", "Alcaldía de Soledad", [["13050505", "Cartera FV-030-26 — Alcaldía de Soledad", 9200000, 0], ["13551505", "Retención a favor 4.0% — FV-030-26", 320000, 0], ["41750505", "Venta — SERV-01 x1 — FV-030-26", 0, 8000000], ["24080505", "IVA generado 19% — FV-030-26", 0, 1520000]]],
  ["2026-10-31", "CA-043-26", "Causación", "Causación nómina Octubre 2026", "CA-043-26", "Empleados", [["51050605", "Sueldo Octubre — Carlos Mejía", 4500000, 0], ["51050610", "Sueldo Octubre — Sandra Torres", 3200000, 0], ["51050615", "Sueldo Octubre — Luis Herrera", 2000000, 0], ["51052705", "Auxilio transporte Octubre — Luis Herrera", 249095, 0], ["52500505", "Comisión ventas Octubre — Luis Herrera", 100000, 0], ["51054205", "Aportes salud empleador Octubre (8.5%)", 824500, 0], ["51054505", "Aportes pensión empleador Octubre (12%)", 1164000, 0], ["51054805", "Aportes ARL Octubre (0.522%)", 50634, 0], ["51055105", "Aportes caja compensación Octubre (4%)", 388000, 0], ["25050505", "Nómina por pagar Octubre — Carlos Mejía (neto)", 0, 4140000], ["25050510", "Nómina por pagar Octubre — Sandra Torres (neto)", 0, 2944000], ["25050515", "Nómina por pagar Octubre — Luis Herrera (neto)", 0, 2189095], ["23700505", "SS salud por pagar Octubre (empl.+empr.)", 0, 1212500], ["23701005", "SS pensión por pagar Octubre (empl.+empr.)", 0, 1552000], ["23701505", "ARL por pagar Octubre", 0, 50634], ["23702005", "Caja compensación por pagar Octubre", 0, 388000]]],
  ["2026-10-31", "CA-044-26", "Causación", "Causación prestaciones Octubre 2026", "CA-044-26", "Empleados", [["51053005", "Gasto cesantías Octubre", 837425, 0], ["51053305", "Gasto intereses cesantías Octubre", 8374, 0], ["51053605", "Gasto prima de servicios Octubre", 837425, 0], ["51053905", "Gasto vacaciones Octubre", 404167, 0], ["25100505", "Cesantías consolidadas Octubre", 0, 837425], ["25150505", "Intereses cesantías Octubre", 0, 8374], ["25200505", "Prima de servicios Octubre", 0, 837425], ["25250505", "Vacaciones consolidadas Octubre", 0, 404167]]],
  ["2026-10-31", "CA-045-26", "Causación", "Causación servicios públicos Octubre", "CA-045-26", "Varios", [["51351005", "Gasto gas Octubre — Gases del Caribe", 850000, 0], ["51351010", "Gasto agua Octubre — Triple A", 620000, 0], ["51351015", "Gasto energía Octubre — Air-e", 1450000, 0], ["51351020", "Gasto teléfono Octubre — Claro", 980000, 0], ["23351505", "Servicios públicos por pagar Octubre", 0, 3900000]]],
  ["2026-10-31", "CA-046-26", "Causación", "Causación arrendamiento Octubre", "CA-046-26", "Arrendadora Inmobiliaria Caribe", [["51200505", "Arrendamiento Octubre — Arrendadora Inmobiliaria Caribe", 3500000, 0], ["23652505", "Retención arrendamiento 3.5% Octubre", 0, 122500], ["23351005", "Arrendamiento por pagar neto Octubre", 0, 3377500]]],
  ["2026-10-31", "CA-047-26", "Causación", "Causación honorarios Octubre", "CA-047-26", "Asesorías Jurídicas del Norte", [["51100505", "Honorarios Octubre — Asesorías Jurídicas del Norte", 5000000, 0], ["23651505", "Retención honorarios 11% Octubre", 0, 550000], ["23350515", "Honorarios por pagar neto Octubre", 0, 4450000]]],
  ["2026-10-31", "NC-010-26", "Nota de contabilidad", "Depreciación muebles y enseres Octubre 2026 — línea recta 120 meses", "NC-010-26", "Activos fijos", [["51600505", "Dep. Octubre — Escritorios", 250000, 0], ["51600510", "Dep. Octubre — Sillas", 125000, 0], ["51600515", "Dep. Octubre — Archivadores", 166667, 0], ["51600520", "Dep. Octubre — Mesa juntas", 187500, 0], ["51600525", "Dep. Octubre — Estanterías", 104167, 0], ["15920505", "Dep. acum. Octubre — Escritorios", 0, 250000], ["15920510", "Dep. acum. Octubre — Sillas", 0, 125000], ["15920515", "Dep. acum. Octubre — Archivadores", 0, 166667], ["15920520", "Dep. acum. Octubre — Mesa juntas", 0, 187500], ["15920525", "Dep. acum. Octubre — Estanterías", 0, 104167]]],
  ["2026-10-05", "CE-056-26", "Comprobante de egreso", "Pago nómina Septiembre 2026", "CE-056-26", "Empleados", [["25050505", "Cancelación nómina — Carlos Septiembre", 4140000, 0], ["25050510", "Cancelación nómina — Sandra Septiembre", 2944000, 0], ["25050515", "Cancelación nómina — Luis Septiembre", 2189095, 0], ["11101505", "Banco — pago nómina neta Septiembre", 0, 9273095]]],
  ["2026-10-05", "CE-057-26", "Comprobante de egreso", "Pago PILA Septiembre 2026", "CE-057-26", "PILA", [["23700505", "Cancelación SS salud Septiembre", 1212500, 0], ["23701005", "Cancelación SS pensión Septiembre", 1552000, 0], ["23701505", "Cancelación ARL Septiembre", 50634, 0], ["23702005", "Cancelación caja compensación Septiembre", 388000, 0], ["11101505", "Banco — pago PILA Septiembre", 0, 3203134]]],
  ["2026-10-10", "CE-058-26", "Comprobante de egreso", "Pago servicios públicos Septiembre", "CE-058-26", "Varios", [["23351505", "Cancelación servicios públicos Septiembre", 3900000, 0], ["11101505", "Banco — pago servicios públicos Septiembre", 0, 3900000]]],
  ["2026-10-10", "CE-059-26", "Comprobante de egreso", "Pago arrendamiento Septiembre", "CE-059-26", "Arrendadora Inmobiliaria Caribe", [["23351005", "Cancelación arrendamiento neto Septiembre", 3377500, 0], ["11101505", "Banco — pago arrendamiento neto Septiembre", 0, 3377500]]],
  ["2026-10-10", "CE-060-26", "Comprobante de egreso", "Pago honorarios Septiembre", "CE-060-26", "Asesorías Jurídicas del Norte", [["23350515", "Cancelación honorarios neto Septiembre", 4450000, 0], ["11101505", "Banco — pago honorarios neto Septiembre", 0, 4450000]]],
  ["2026-10-10", "CE-061-26", "Comprobante de egreso", "Pago retención en la fuente Septiembre — Form. 350", "CE-061-26", "DIAN", [["23654005", "Retención compras Septiembre", 568750, 0], ["23651505", "Retención honorarios Septiembre", 550000, 0], ["23652505", "Retención arrendamiento Septiembre", 122500, 0], ["11101505", "Banco — pago retención fuente Form. 350 Septiembre", 0, 1241250]]],
  ["2026-10-15", "RC-022-26", "Recibo de caja", "Cobro cartera FV-025-26 — Constructora Palermo S.A.", "RC-022-26", "Constructora Palermo S.A.", [["11101505", "Banco — cobro FV-025-26 — Constructora Palermo S.A.", 8737500, 0], ["13050505", "Cancelación cartera FV-025-26 — Constructora Palermo S.A.", 0, 8737500]]],
  ["2026-10-15", "RC-023-26", "Recibo de caja", "Cobro cartera FV-026-26 — Clínica Regional S.A.S.", "RC-023-26", "Clínica Regional S.A.S.", [["11101505", "Banco — cobro FV-026-26 — Clínica Regional S.A.S.", 9320000, 0], ["13050505", "Cancelación cartera FV-026-26 — Clínica Regional S.A.S.", 0, 9320000]]],
  ["2026-10-15", "RC-024-26", "Recibo de caja", "Cobro cartera FV-027-26 — Universidad Simón Bolívar", "RC-024-26", "Universidad Simón Bolívar", [["11101505", "Banco — cobro FV-027-26 — Universidad Simón Bolívar", 11500000, 0], ["13050505", "Cancelación cartera FV-027-26 — Universidad Simón Bolívar", 0, 11500000]]],
  ["2026-10-28", "CE-062-26", "Comprobante de egreso", "Pago IVA Form. 300 — bimestre bimestre 5", "CE-062-26", "DIAN", [["24080505", "IVA generado bimestre bimestre 5", 12920000, 0], ["24081005", "IVA descontable bimestre bimestre 5", 0, 4322500], ["11101505", "Banco — pago IVA Form. 300 bimestre bimestre 5", 0, 8597500]]],
  ["2026-11-05", "FV-031-26", "Factura de venta", "Venta Constructora Palermo S.A. — FV-031-26", "FV-031-26", "Constructora Palermo S.A.", [["13050505", "Cartera FV-031-26 — Constructora Palermo S.A.", 13106250, 0], ["13551505", "Retención a favor 2.5% — FV-031-26", 281250, 0], ["41350520", "Venta — PROD-04 x15 — FV-031-26", 0, 11250000], ["24080505", "IVA generado 19% — FV-031-26", 0, 2137500], ["61350520", "Costo PROD-04 x15", 7500000, 0], ["14300520", "Costo PROD-04 x15", 0, 7500000]]],
  ["2026-11-12", "FV-032-26", "Factura de venta", "Venta Clínica Regional S.A.S. — FV-032-26", "FV-032-26", "Clínica Regional S.A.S.", [["13050505", "Cartera FV-032-26 — Clínica Regional S.A.S.", 17475000, 0], ["13551505", "Retención a favor 2.5% — FV-032-26", 375000, 0], ["41350505", "Venta — PROD-01 x6 — FV-032-26", 0, 15000000], ["24080505", "IVA generado 19% — FV-032-26", 0, 2850000], ["61350505", "Costo PROD-01 x6", 10500000, 0], ["14300505", "Costo PROD-01 x6", 0, 10500000]]],
  ["2026-11-20", "FV-033-26", "Factura de venta", "Venta Agroindustrial Costa Ltda. — FV-033-26", "FV-033-26", "Agroindustrial Costa Ltda.", [["13050505", "Cartera FV-033-26 — Agroindustrial Costa Ltda.", 6900000, 0], ["13551505", "Retención a favor 4.0% — FV-033-26", 240000, 0], ["41750510", "Venta — SERV-02 x1 — FV-033-26", 0, 6000000], ["24080505", "IVA generado 19% — FV-033-26", 0, 1140000]]],
  ["2026-11-28", "FV-034-26", "Factura de venta", "Venta Universidad Simón Bolívar — FV-034-26", "FV-034-26", "Universidad Simón Bolívar", [["13050505", "Cartera FV-034-26 — Universidad Simón Bolívar", 11500000, 0], ["13551505", "Retención a favor 4.0% — FV-034-26", 400000, 0], ["41750515", "Venta — SERV-03 x1 — FV-034-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-034-26", 0, 1900000]]],
  ["2026-11-10", "FC-007-26", "Factura de compra", "Compra Importech Colombia S.A.S. — FC-007-26", "FC-007-26", "Importech Colombia S.A.S.", [["14300505", "FC-007-26 — Inventario PROD-01 x12", 21000000, 0], ["14300510", "FC-007-26 — Inventario PROD-02 x8", 14000000, 0], ["24081005", "IVA descontable 19% — FC-007-26", 6650000, 0], ["23654005", "Retención compras 2.5% — FC-007-26", 0, 875000], ["22050505", "Proveedores — Importech Colombia S.A.S.", 0, 40775000]]],
  ["2026-11-10", "FC-008-26", "Factura de compra", "Compra Papelería Central Barranquilla S.A.S. — FC-008-26", "FC-008-26", "Papelería Central Barranquilla S.A.S.", [["14300515", "FC-008-26 — Inventario PROD-03 x15", 10500000, 0], ["14300520", "FC-008-26 — Inventario PROD-04 x10", 5000000, 0], ["24081005", "IVA descontable 19% — FC-008-26", 2945000, 0], ["23654005", "Retención compras 2.5% — FC-008-26", 0, 387500], ["22050505", "Proveedores — Papelería Central Barranquilla S.A.S.", 0, 18057500]]],
  ["2026-11-30", "CA-048-26", "Causación", "Causación nómina Noviembre 2026", "CA-048-26", "Empleados", [["51050605", "Sueldo Noviembre — Carlos Mejía", 4500000, 0], ["51050610", "Sueldo Noviembre — Sandra Torres", 3200000, 0], ["51050615", "Sueldo Noviembre — Luis Herrera", 2000000, 0], ["51052705", "Auxilio transporte Noviembre — Luis Herrera", 249095, 0], ["52500505", "Comisión ventas Noviembre — Luis Herrera", 100000, 0], ["51054205", "Aportes salud empleador Noviembre (8.5%)", 824500, 0], ["51054505", "Aportes pensión empleador Noviembre (12%)", 1164000, 0], ["51054805", "Aportes ARL Noviembre (0.522%)", 50634, 0], ["51055105", "Aportes caja compensación Noviembre (4%)", 388000, 0], ["25050505", "Nómina por pagar Noviembre — Carlos Mejía (neto)", 0, 4140000], ["25050510", "Nómina por pagar Noviembre — Sandra Torres (neto)", 0, 2944000], ["25050515", "Nómina por pagar Noviembre — Luis Herrera (neto)", 0, 2189095], ["23700505", "SS salud por pagar Noviembre (empl.+empr.)", 0, 1212500], ["23701005", "SS pensión por pagar Noviembre (empl.+empr.)", 0, 1552000], ["23701505", "ARL por pagar Noviembre", 0, 50634], ["23702005", "Caja compensación por pagar Noviembre", 0, 388000]]],
  ["2026-11-30", "CA-049-26", "Causación", "Causación prestaciones Noviembre 2026", "CA-049-26", "Empleados", [["51053005", "Gasto cesantías Noviembre", 837425, 0], ["51053305", "Gasto intereses cesantías Noviembre", 8374, 0], ["51053605", "Gasto prima de servicios Noviembre", 837425, 0], ["51053905", "Gasto vacaciones Noviembre", 404167, 0], ["25100505", "Cesantías consolidadas Noviembre", 0, 837425], ["25150505", "Intereses cesantías Noviembre", 0, 8374], ["25200505", "Prima de servicios Noviembre", 0, 837425], ["25250505", "Vacaciones consolidadas Noviembre", 0, 404167]]],
  ["2026-11-30", "CA-050-26", "Causación", "Causación servicios públicos Noviembre", "CA-050-26", "Varios", [["51351005", "Gasto gas Noviembre — Gases del Caribe", 850000, 0], ["51351010", "Gasto agua Noviembre — Triple A", 620000, 0], ["51351015", "Gasto energía Noviembre — Air-e", 1450000, 0], ["51351020", "Gasto teléfono Noviembre — Claro", 980000, 0], ["23351505", "Servicios públicos por pagar Noviembre", 0, 3900000]]],
  ["2026-11-30", "CA-051-26", "Causación", "Causación arrendamiento Noviembre", "CA-051-26", "Arrendadora Inmobiliaria Caribe", [["51200505", "Arrendamiento Noviembre — Arrendadora Inmobiliaria Caribe", 3500000, 0], ["23652505", "Retención arrendamiento 3.5% Noviembre", 0, 122500], ["23351005", "Arrendamiento por pagar neto Noviembre", 0, 3377500]]],
  ["2026-11-30", "CA-052-26", "Causación", "Causación honorarios Noviembre", "CA-052-26", "Asesorías Jurídicas del Norte", [["51100505", "Honorarios Noviembre — Asesorías Jurídicas del Norte", 5000000, 0], ["23651505", "Retención honorarios 11% Noviembre", 0, 550000], ["23350515", "Honorarios por pagar neto Noviembre", 0, 4450000]]],
  ["2026-11-30", "NC-011-26", "Nota de contabilidad", "Depreciación muebles y enseres Noviembre 2026 — línea recta 120 meses", "NC-011-26", "Activos fijos", [["51600505", "Dep. Noviembre — Escritorios", 250000, 0], ["51600510", "Dep. Noviembre — Sillas", 125000, 0], ["51600515", "Dep. Noviembre — Archivadores", 166667, 0], ["51600520", "Dep. Noviembre — Mesa juntas", 187500, 0], ["51600525", "Dep. Noviembre — Estanterías", 104167, 0], ["15920505", "Dep. acum. Noviembre — Escritorios", 0, 250000], ["15920510", "Dep. acum. Noviembre — Sillas", 0, 125000], ["15920515", "Dep. acum. Noviembre — Archivadores", 0, 166667], ["15920520", "Dep. acum. Noviembre — Mesa juntas", 0, 187500], ["15920525", "Dep. acum. Noviembre — Estanterías", 0, 104167]]],
  ["2026-11-05", "CE-063-26", "Comprobante de egreso", "Pago nómina Octubre 2026", "CE-063-26", "Empleados", [["25050505", "Cancelación nómina — Carlos Octubre", 4140000, 0], ["25050510", "Cancelación nómina — Sandra Octubre", 2944000, 0], ["25050515", "Cancelación nómina — Luis Octubre", 2189095, 0], ["11101505", "Banco — pago nómina neta Octubre", 0, 9273095]]],
  ["2026-11-05", "CE-064-26", "Comprobante de egreso", "Pago PILA Octubre 2026", "CE-064-26", "PILA", [["23700505", "Cancelación SS salud Octubre", 1212500, 0], ["23701005", "Cancelación SS pensión Octubre", 1552000, 0], ["23701505", "Cancelación ARL Octubre", 50634, 0], ["23702005", "Cancelación caja compensación Octubre", 388000, 0], ["11101505", "Banco — pago PILA Octubre", 0, 3203134]]],
  ["2026-11-10", "CE-065-26", "Comprobante de egreso", "Pago servicios públicos Octubre", "CE-065-26", "Varios", [["23351505", "Cancelación servicios públicos Octubre", 3900000, 0], ["11101505", "Banco — pago servicios públicos Octubre", 0, 3900000]]],
  ["2026-11-10", "CE-066-26", "Comprobante de egreso", "Pago arrendamiento Octubre", "CE-066-26", "Arrendadora Inmobiliaria Caribe", [["23351005", "Cancelación arrendamiento neto Octubre", 3377500, 0], ["11101505", "Banco — pago arrendamiento neto Octubre", 0, 3377500]]],
  ["2026-11-10", "CE-067-26", "Comprobante de egreso", "Pago honorarios Octubre", "CE-067-26", "Asesorías Jurídicas del Norte", [["23350515", "Cancelación honorarios neto Octubre", 4450000, 0], ["11101505", "Banco — pago honorarios neto Octubre", 0, 4450000]]],
  ["2026-11-10", "CE-068-26", "Comprobante de egreso", "Pago retención en la fuente Octubre — Form. 350", "CE-068-26", "DIAN", [["23651505", "Retención honorarios Octubre", 550000, 0], ["23652505", "Retención arrendamiento Octubre", 122500, 0], ["11101505", "Banco — pago retención fuente Form. 350 Octubre", 0, 672500]]],
  ["2026-12-05", "FV-035-26", "Factura de venta", "Venta Tecno Norte S.A.S. — FV-035-26", "FV-035-26", "Tecno Norte S.A.S.", [["13050505", "Cartera FV-035-26 — Tecno Norte S.A.S.", 37862500, 0], ["13551505", "Retención a favor 2.5% — FV-035-26", 812500, 0], ["41350505", "Venta — PROD-01 x8 — FV-035-26", 0, 20000000], ["41350510", "Venta — PROD-02 x5 — FV-035-26", 0, 12500000], ["24080505", "IVA generado 19% — FV-035-26", 0, 6175000], ["61350505", "Costo PROD-01 x8", 14000000, 0], ["14300505", "Costo PROD-01 x8", 0, 14000000], ["61350510", "Costo PROD-02 x5", 8750000, 0], ["14300510", "Costo PROD-02 x5", 0, 8750000]]],
  ["2026-12-12", "FV-036-26", "Factura de venta", "Venta Distribuidora del Caribe Ltda. — FV-036-26", "FV-036-26", "Distribuidora del Caribe Ltda.", [["13050505", "Cartera FV-036-26 — Distribuidora del Caribe Ltda.", 17475000, 0], ["13551505", "Retención a favor 2.5% — FV-036-26", 375000, 0], ["41350515", "Venta — PROD-03 x15 — FV-036-26", 0, 15000000], ["24080505", "IVA generado 19% — FV-036-26", 0, 2850000], ["61350515", "Costo PROD-03 x15", 10500000, 0], ["14300515", "Costo PROD-03 x15", 0, 10500000]]],
  ["2026-12-20", "FV-037-26", "Factura de venta", "Venta Pedro Martínez — FV-037-26", "FV-037-26", "Pedro Martínez", [["13050505", "Cartera FV-037-26 — Pedro Martínez", 8737500, 0], ["13551505", "Retención a favor 2.5% — FV-037-26", 187500, 0], ["41350520", "Venta — PROD-04 x10 — FV-037-26", 0, 7500000], ["24080505", "IVA generado 19% — FV-037-26", 0, 1425000], ["61350520", "Costo PROD-04 x10", 5000000, 0], ["14300520", "Costo PROD-04 x10", 0, 5000000]]],
  ["2026-12-28", "FV-038-26", "Factura de venta", "Venta Universidad Simón Bolívar — FV-038-26", "FV-038-26", "Universidad Simón Bolívar", [["13050505", "Cartera FV-038-26 — Universidad Simón Bolívar", 11500000, 0], ["13551505", "Retención a favor 4.0% — FV-038-26", 400000, 0], ["41750515", "Venta — SERV-03 x1 — FV-038-26", 0, 10000000], ["24080505", "IVA generado 19% — FV-038-26", 0, 1900000]]],
  ["2026-12-31", "CA-053-26", "Causación", "Causación nómina Diciembre 2026", "CA-053-26", "Empleados", [["51050605", "Sueldo Diciembre — Carlos Mejía", 4500000, 0], ["51050610", "Sueldo Diciembre — Sandra Torres", 3200000, 0], ["51050615", "Sueldo Diciembre — Luis Herrera", 2000000, 0], ["51052705", "Auxilio transporte Diciembre — Luis Herrera", 249095, 0], ["52500505", "Comisión ventas Diciembre — Luis Herrera", 100000, 0], ["51054205", "Aportes salud empleador Diciembre (8.5%)", 824500, 0], ["51054505", "Aportes pensión empleador Diciembre (12%)", 1164000, 0], ["51054805", "Aportes ARL Diciembre (0.522%)", 50634, 0], ["51055105", "Aportes caja compensación Diciembre (4%)", 388000, 0], ["25050505", "Nómina por pagar Diciembre — Carlos Mejía (neto)", 0, 4140000], ["25050510", "Nómina por pagar Diciembre — Sandra Torres (neto)", 0, 2944000], ["25050515", "Nómina por pagar Diciembre — Luis Herrera (neto)", 0, 2189095], ["23700505", "SS salud por pagar Diciembre (empl.+empr.)", 0, 1212500], ["23701005", "SS pensión por pagar Diciembre (empl.+empr.)", 0, 1552000], ["23701505", "ARL por pagar Diciembre", 0, 50634], ["23702005", "Caja compensación por pagar Diciembre", 0, 388000]]],
  ["2026-12-31", "CA-054-26", "Causación", "Causación prestaciones Diciembre 2026", "CA-054-26", "Empleados", [["51053005", "Gasto cesantías Diciembre", 837425, 0], ["51053305", "Gasto intereses cesantías Diciembre", 8374, 0], ["51053605", "Gasto prima de servicios Diciembre", 837425, 0], ["51053905", "Gasto vacaciones Diciembre", 404167, 0], ["25100505", "Cesantías consolidadas Diciembre", 0, 837425], ["25150505", "Intereses cesantías Diciembre", 0, 8374], ["25200505", "Prima de servicios Diciembre", 0, 837425], ["25250505", "Vacaciones consolidadas Diciembre", 0, 404167]]],
  ["2026-12-31", "CA-055-26", "Causación", "Causación servicios públicos Diciembre", "CA-055-26", "Varios", [["51351005", "Gasto gas Diciembre — Gases del Caribe", 850000, 0], ["51351010", "Gasto agua Diciembre — Triple A", 620000, 0], ["51351015", "Gasto energía Diciembre — Air-e", 1450000, 0], ["51351020", "Gasto teléfono Diciembre — Claro", 980000, 0], ["23351505", "Servicios públicos por pagar Diciembre", 0, 3900000]]],
  ["2026-12-31", "CA-056-26", "Causación", "Causación arrendamiento Diciembre", "CA-056-26", "Arrendadora Inmobiliaria Caribe", [["51200505", "Arrendamiento Diciembre — Arrendadora Inmobiliaria Caribe", 3500000, 0], ["23652505", "Retención arrendamiento 3.5% Diciembre", 0, 122500], ["23351005", "Arrendamiento por pagar neto Diciembre", 0, 3377500]]],
  ["2026-12-31", "CA-057-26", "Causación", "Causación honorarios Diciembre", "CA-057-26", "Asesorías Jurídicas del Norte", [["51100505", "Honorarios Diciembre — Asesorías Jurídicas del Norte", 5000000, 0], ["23651505", "Retención honorarios 11% Diciembre", 0, 550000], ["23350515", "Honorarios por pagar neto Diciembre", 0, 4450000]]],
  ["2026-12-31", "NC-012-26", "Nota de contabilidad", "Depreciación muebles y enseres Diciembre 2026 — línea recta 120 meses", "NC-012-26", "Activos fijos", [["51600505", "Dep. Diciembre — Escritorios", 250000, 0], ["51600510", "Dep. Diciembre — Sillas", 125000, 0], ["51600515", "Dep. Diciembre — Archivadores", 166667, 0], ["51600520", "Dep. Diciembre — Mesa juntas", 187500, 0], ["51600525", "Dep. Diciembre — Estanterías", 104167, 0], ["15920505", "Dep. acum. Diciembre — Escritorios", 0, 250000], ["15920510", "Dep. acum. Diciembre — Sillas", 0, 125000], ["15920515", "Dep. acum. Diciembre — Archivadores", 0, 166667], ["15920520", "Dep. acum. Diciembre — Mesa juntas", 0, 187500], ["15920525", "Dep. acum. Diciembre — Estanterías", 0, 104167]]],
  ["2026-12-05", "CE-069-26", "Comprobante de egreso", "Pago nómina Noviembre 2026", "CE-069-26", "Empleados", [["25050505", "Cancelación nómina — Carlos Noviembre", 4140000, 0], ["25050510", "Cancelación nómina — Sandra Noviembre", 2944000, 0], ["25050515", "Cancelación nómina — Luis Noviembre", 2189095, 0], ["11101505", "Banco — pago nómina neta Noviembre", 0, 9273095]]],
  ["2026-12-05", "CE-070-26", "Comprobante de egreso", "Pago PILA Noviembre 2026", "CE-070-26", "PILA", [["23700505", "Cancelación SS salud Noviembre", 1212500, 0], ["23701005", "Cancelación SS pensión Noviembre", 1552000, 0], ["23701505", "Cancelación ARL Noviembre", 50634, 0], ["23702005", "Cancelación caja compensación Noviembre", 388000, 0], ["11101505", "Banco — pago PILA Noviembre", 0, 3203134]]],
  ["2026-12-10", "CE-071-26", "Comprobante de egreso", "Pago servicios públicos Noviembre", "CE-071-26", "Varios", [["23351505", "Cancelación servicios públicos Noviembre", 3900000, 0], ["11101505", "Banco — pago servicios públicos Noviembre", 0, 3900000]]],
  ["2026-12-10", "CE-072-26", "Comprobante de egreso", "Pago arrendamiento Noviembre", "CE-072-26", "Arrendadora Inmobiliaria Caribe", [["23351005", "Cancelación arrendamiento neto Noviembre", 3377500, 0], ["11101505", "Banco — pago arrendamiento neto Noviembre", 0, 3377500]]],
  ["2026-12-10", "CE-073-26", "Comprobante de egreso", "Pago honorarios Noviembre", "CE-073-26", "Asesorías Jurídicas del Norte", [["23350515", "Cancelación honorarios neto Noviembre", 4450000, 0], ["11101505", "Banco — pago honorarios neto Noviembre", 0, 4450000]]],
  ["2026-12-10", "CE-074-26", "Comprobante de egreso", "Pago retención en la fuente Noviembre — Form. 350", "CE-074-26", "DIAN", [["23654005", "Retención compras Noviembre", 1262500, 0], ["23651505", "Retención honorarios Noviembre", 550000, 0], ["23652505", "Retención arrendamiento Noviembre", 122500, 0], ["11101505", "Banco — pago retención fuente Form. 350 Noviembre", 0, 1935000]]],
  ["2026-12-28", "CE-075-26", "Comprobante de egreso", "Pago IVA Form. 300 — bimestre bimestre 6", "CE-075-26", "DIAN", [["24080505", "IVA generado bimestre bimestre 6", 20377500, 0], ["24081005", "IVA descontable bimestre bimestre 6", 0, 9595000], ["11101505", "Banco — pago IVA Form. 300 bimestre bimestre 6", 0, 10782500]]],
];

// Terceros — clientes, proveedores y accionistas, con campos para reporte de exógena
// [codigo, tipo_documento, identificacion, primer_apellido, segundo_apellido, primer_nombre, segundo_nombre, razon_social, direccion, cod_departamento, cod_municipio, pais, es_cliente, es_proveedor, es_accionista, es_empleado]
const TERCEROS_SEED = [
  ["C-01","NIT","901234100","","","","","Tecno Norte S.A.S.","Cra 50 #80-10, Barranquilla","08","08001","169",true,false,false,false],
  ["C-02","NIT","800456200","","","","","Distribuidora del Caribe Ltda.","Calle 30 #45-20, Barranquilla","08","08001","169",true,false,false,false],
  ["C-03","NIT","830789300","","","","","Constructora Palermo S.A.","Cra 65 #34-12, Barranquilla","08","08001","169",true,false,false,false],
  ["C-04","NIT","900321400","","","","","Clínica Regional S.A.S.","Calle 76 #50-30, Barranquilla","08","08001","169",true,false,false,false],
  ["C-05","NIT","890001500","","","","","Alcaldía de Soledad","Cra 16 #20-15, Soledad","08","08758","169",true,false,false,false],
  ["C-06","CC","1140777600","Martínez","","Pedro","","","Calle 45 #20-08, Barranquilla","08","08001","169",true,false,false,false],
  ["C-07","NIT","811222700","","","","","Agroindustrial Costa Ltda.","Cra 38 #70-22, Barranquilla","08","08001","169",true,false,false,false],
  ["C-08","NIT","891333800","","","","","Universidad Simón Bolívar","Cra 59 #59-65, Barranquilla","08","08001","169",true,false,false,false],
  ["P-01","NIT","900888111","","","","","Importech Colombia S.A.S.","Cra 43 #75-18, Barranquilla","08","08001","169",false,true,false,false],
  ["P-02","NIT","901777222","","","","","Papelería Central Barranquilla S.A.S.","Calle 53 #41-09, Barranquilla","08","08001","169",false,true,false,false],
  ["P-03","NIT","800666333","","","","","Asesorías Jurídicas del Norte Ltda.","Cra 54 #72-30, Barranquilla","08","08001","169",false,true,false,false],
  ["P-04","NIT","830555444","","","","","Arrendadora Inmobiliaria Caribe S.A.","Calle 84 #50-15, Barranquilla","08","08001","169",false,true,false,false],
  ["P-05","NIT","890444555","","","","","Seguros Atlántico S.A.","Cra 51B #79-150, Barranquilla","08","08001","169",false,true,false,false],
  ["P-06","NIT","901333666","","","","","Publicidad Digital Norte S.A.S.","Calle 70 #45-12, Barranquilla","08","08001","169",false,true,false,false],
  ["P-07","NIT","900222777","","","","","Servicios Generales Caribe S.A.S.","Cra 38 #45-67, Barranquilla","08","08001","169",false,true,false,false],
  ["P-08","NIT","890111888","","","","","Banco de Bogotá S.A.","Calle 72 #57-41, Barranquilla","08","08001","169",false,true,false,false],
  ["A-01","CC","1045123456","Restrepo","Vélez","Camila","Andrea","","Calle 84 #45-12, Barranquilla","08","08001","169",false,false,true,false],
  ["A-02","CC","8765432100","Mendoza","Castillo","Jorge","Eliécer","","Cra 53 #76-30, Barranquilla","08","08001","169",false,false,true,false],
  ["A-03","CC","1123456789","Pacheco","Soto","Diana","Carolina","","Calle 70 #50-18, Barranquilla","08","08001","169",false,false,true,false],
  ["P-09","NIT","890103127","","","","","Gases del Caribe S.A. E.S.P.","Cra 52 #72-50, Barranquilla","08","08001","169",false,true,false,false],
  ["P-10","NIT","800153993","","","","","Triple A S.A. E.S.P.","Calle 35 #43-31, Barranquilla","08","08001","169",false,true,false,false],
  ["P-11","NIT","900375860","","","","","Air-e S.A. E.S.P.","Cra 54 #68-196, Barranquilla","08","08001","169",false,true,false,false],
  ["P-12","NIT","800153080","","","","","Claro Colombia S.A.","Calle 90 #19C-74, Barranquilla","08","08001","169",false,true,false,false],
  ["E-01","CC","1045678901","Mejía","Rondón","Carlos","Andrés","","Cra 46 #80-23, Barranquilla","08","08001","169",false,false,false,true],
  ["E-02","CC","1090123456","Torres","Díaz","Sandra","Milena","","Calle 72 #41-15, Barranquilla","08","08001","169",false,false,false,true],
  ["E-03","CC","1143456789","Herrera","Camargo","Luis","Felipe","","Cra 38 #68-40, Barranquilla","08","08001","169",false,false,false,true],
];

// Catálogo de productos y servicios — vincula cada ítem con sus cuentas contables
// [codigo, nombre, tipo ('producto'|'servicio'), cuenta_ingreso, cuenta_costo, cuenta_inventario,
//  costo_unitario, precio_venta, tarifa_iva (%), tarifa_retencion (%), concepto_retencion]
const PRODUCTOS_SERVICIOS_SEED = [
  ["PROD-01","Laptops","producto","41350505","61350505","14300505",1750000,2500000,19,2.5,"Compras"],
  ["PROD-02","Computadores all-in-one","producto","41350510","61350510","14300510",1750000,2500000,19,2.5,"Compras"],
  ["PROD-03","Accesorios tecnológicos (monitores, impresoras, periféricos)","producto","41350515","61350515","14300515",700000,1000000,19,2.5,"Compras"],
  ["PROD-04","Muebles de oficina","producto","41350520","61350520","14300520",500000,750000,19,2.5,"Compras"],
  ["SERV-01","Consultoría empresarial","servicio","41750505",null,null,0,1500000,19,4,"Servicios"],
  ["SERV-02","Consultoría financiera / tributaria","servicio","41750510",null,null,0,1500000,19,4,"Servicios"],
  ["SERV-03","Implementación y soporte tecnológico","servicio","41750515",null,null,0,2000000,19,4,"Servicios"],
];

async function crearSchemaContable(userId) {
  const s = `u${userId}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${s}.plan_cuentas (
        codigo      VARCHAR(10) PRIMARY KEY,
        nombre      VARCHAR(255) NOT NULL,
        naturaleza  CHAR(1) NOT NULL CHECK (naturaleza IN ('D','C')),
        tipo        VARCHAR(20) NOT NULL,
        padre       VARCHAR(10),
        activa      BOOLEAN DEFAULT TRUE
      )
    `);

    // ── Limpieza de cuentas obsoletas de versiones anteriores del plan de cuentas ──
    // 2367* fue renombrado a 2365* (Retención en la fuente — compras ahora es 236540)
    // 240801 fue renombrado/reubicado a 240405 (Impuesto de renta por pagar, bajo 2404)
    const CODIGOS_OBSOLETOS = ['2367', '236705', '236710', '236715', '236720', '236725', '240801'];
    await client.query(
      `DELETE FROM ${s}.plan_cuentas WHERE codigo = ANY($1)`,
      [CODIGOS_OBSOLETOS]
    );

    for (const [codigo, nombre, naturaleza, tipo, padre] of PLAN_CUENTAS_PUC) {
      await client.query(
        `INSERT INTO ${s}.plan_cuentas (codigo, nombre, naturaleza, tipo, padre)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, naturaleza = EXCLUDED.naturaleza, tipo = EXCLUDED.tipo, padre = EXCLUDED.padre`,
        [codigo, nombre, naturaleza, tipo, padre]
      );
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${s}.asientos (
        id                  SERIAL PRIMARY KEY,
        fecha               DATE NOT NULL,
        numero_comprobante  VARCHAR(30) NOT NULL,
        tipo_comprobante    VARCHAR(50) NOT NULL,
        concepto            TEXT NOT NULL,
        documento_soporte   VARCHAR(50),
        contraparte         VARCHAR(255),
        estado              VARCHAR(20) DEFAULT 'aprobado',
        es_caso_atipico     BOOLEAN DEFAULT FALSE,
        codigo_caso         VARCHAR(10),
        nota_pedagogica     TEXT,
        creado_en           TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ${s}.asientos_detalle (
        id            SERIAL PRIMARY KEY,
        asiento_id    INTEGER NOT NULL REFERENCES ${s}.asientos(id) ON DELETE CASCADE,
        cuenta_codigo VARCHAR(10) NOT NULL,
        descripcion   TEXT,
        debito        BIGINT NOT NULL DEFAULT 0,
        credito       BIGINT NOT NULL DEFAULT 0
      )
    `);

    // ── Terceros (clientes, proveedores, accionistas) — reemplaza clientes/proveedores ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${s}.terceros (
        id                SERIAL PRIMARY KEY,
        codigo            VARCHAR(10) UNIQUE NOT NULL,
        tipo_documento    VARCHAR(10) NOT NULL,
        identificacion    VARCHAR(30) NOT NULL,
        primer_apellido   VARCHAR(100) DEFAULT '',
        segundo_apellido  VARCHAR(100) DEFAULT '',
        primer_nombre     VARCHAR(100) DEFAULT '',
        segundo_nombre    VARCHAR(100) DEFAULT '',
        razon_social      VARCHAR(255) DEFAULT '',
        direccion         VARCHAR(255),
        cod_departamento  VARCHAR(5),
        cod_municipio     VARCHAR(10),
        pais              VARCHAR(5) DEFAULT '169',
        es_cliente        BOOLEAN DEFAULT FALSE,
        es_proveedor      BOOLEAN DEFAULT FALSE,
        es_accionista     BOOLEAN DEFAULT FALSE,
        es_empleado       BOOLEAN DEFAULT FALSE,
        activo            BOOLEAN DEFAULT TRUE
      )
    `);

    for (const t of TERCEROS_SEED) {
      const [codigo, tipo_documento, identificacion, primer_apellido, segundo_apellido,
             primer_nombre, segundo_nombre, razon_social, direccion, cod_departamento,
             cod_municipio, pais, es_cliente, es_proveedor, es_accionista, es_empleado] = t;
      await client.query(
        `INSERT INTO ${s}.terceros
          (codigo, tipo_documento, identificacion, primer_apellido, segundo_apellido,
           primer_nombre, segundo_nombre, razon_social, direccion, cod_departamento,
           cod_municipio, pais, es_cliente, es_proveedor, es_accionista, es_empleado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (codigo) DO NOTHING`,
        [codigo, tipo_documento, identificacion, primer_apellido, segundo_apellido,
         primer_nombre, segundo_nombre, razon_social, direccion, cod_departamento,
         cod_municipio, pais, es_cliente, es_proveedor, es_accionista, es_empleado]
      );
    }

    // ── Catálogo de productos y servicios (vincula ítems con cuentas contables) ──
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${s}.productos_servicios (
        id                SERIAL PRIMARY KEY,
        codigo            VARCHAR(15) UNIQUE NOT NULL,
        nombre            VARCHAR(255) NOT NULL,
        tipo              VARCHAR(10) NOT NULL CHECK (tipo IN ('producto','servicio')),
        cuenta_ingreso    VARCHAR(10) NOT NULL,
        cuenta_costo      VARCHAR(10),
        cuenta_inventario VARCHAR(10),
        costo_unitario    BIGINT DEFAULT 0,
        precio_venta      BIGINT DEFAULT 0,
        tarifa_iva        DECIMAL(5,2) DEFAULT 19,
        tarifa_retencion  DECIMAL(5,2) DEFAULT 0,
        concepto_retencion VARCHAR(100),
        activo            BOOLEAN DEFAULT TRUE
      )
    `);

    for (const p of PRODUCTOS_SERVICIOS_SEED) {
      const [codigo, nombre, tipo, cuenta_ingreso, cuenta_costo, cuenta_inventario,
             costo_unitario, precio_venta, tarifa_iva, tarifa_retencion, concepto_retencion] = p;
      await client.query(
        `INSERT INTO ${s}.productos_servicios
          (codigo, nombre, tipo, cuenta_ingreso, cuenta_costo, cuenta_inventario,
           costo_unitario, precio_venta, tarifa_iva, tarifa_retencion, concepto_retencion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (codigo) DO NOTHING`,
        [codigo, nombre, tipo, cuenta_ingreso, cuenta_costo, cuenta_inventario,
         costo_unitario, precio_venta, tarifa_iva, tarifa_retencion, concepto_retencion]
      );
    }

    // ── Reinicio del ejercicio: dejar únicamente el asiento de apertura AP-001-26 ──
    await client.query(`DELETE FROM ${s}.asientos_detalle`);
    await client.query(`DELETE FROM ${s}.asientos`);

    for (const asiento of ASIENTOS_2025) {
      const [fecha, comprobante, tipo, concepto, docSoporte, contraparte, detalles] = asiento;

      const { rows: [cab] } = await client.query(
        `INSERT INTO ${s}.asientos
          (fecha, numero_comprobante, tipo_comprobante, concepto, documento_soporte, contraparte)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [fecha, comprobante, tipo, concepto, docSoporte, contraparte]
      );

      for (const [cuenta, desc, debito, credito] of detalles) {
        await client.query(
          `INSERT INTO ${s}.asientos_detalle
            (asiento_id, cuenta_codigo, descripcion, debito, credito)
           VALUES ($1,$2,$3,$4,$5)`,
          [cab.id, cuenta, desc, debito, credito]
        );
      }
    }
    console.log(`Schema contable reiniciado para usuario ${userId}: ${ASIENTOS_2025.length} asiento(s) (AP-001-26)`);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando schema contable:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { crearSchemaContable };
