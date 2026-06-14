// Códigos DANE de departamentos y municipios (subconjunto relevante para Quipusoft)
// País: 169 = Colombia (código DIAN exógena habitual)
module.exports = {
  departamentos: [
    { codigo: '08', nombre: 'Atlántico' },
    { codigo: '11', nombre: 'Bogotá, D.C.' },
    { codigo: '76', nombre: 'Valle del Cauca' },
    { codigo: '05', nombre: 'Antioquia' },
    { codigo: '13', nombre: 'Bolívar' },
    { codigo: '20', nombre: 'Cesar' },
    { codigo: '23', nombre: 'Córdoba' },
    { codigo: '40', nombre: 'La Guajira' },
    { codigo: '47', nombre: 'Magdalena' },
    { codigo: '70', nombre: 'Sucre' },
  ],
  municipios: [
    { codigo: '08001', departamento: '08', nombre: 'Barranquilla' },
    { codigo: '08758', departamento: '08', nombre: 'Soledad' },
    { codigo: '08433', departamento: '08', nombre: 'Malambo' },
    { codigo: '08573', departamento: '08', nombre: 'Puerto Colombia' },
    { codigo: '08520', departamento: '08', nombre: 'Galapa' },
    { codigo: '11001', departamento: '11', nombre: 'Bogotá, D.C.' },
    { codigo: '76001', departamento: '76', nombre: 'Cali' },
    { codigo: '05001', departamento: '05', nombre: 'Medellín' },
    { codigo: '13001', departamento: '13', nombre: 'Cartagena' },
  ],
  paises: [
    { codigo: '169', nombre: 'Colombia' },
    { codigo: '249', nombre: 'Estados Unidos' },
    { codigo: '215', nombre: 'España' },
  ],
};
