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
    ["51100505","Honorarios jurídicos enero 2026 — Asesorías Jurídicas del Norte",5000000,0],
    ["23651505","Retención honorarios por pagar 11% — enero 2026",0,550000],
    ["23350515","Honorarios por pagar neto — enero 2026",0,4450000],
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
    ["23651505","Retención honorarios practicada enero 2026 — Asesorías Jurídicas",550000,0],
    ["23652505","Retención arrendamiento practicada enero 2026 — Arrendadora",122500,0],
    ["11101505","Banco Davivienda — pago retención en la fuente Form. 350 enero",0,943750],
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
