const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'portfolio', 'vendor', 'mx-geo', 'veracruz-municipios.json');
const outputPath = path.join(root, 'portfolio', 'vendor', 'mx-geo', 'veracruz-municipios.js');
const topology = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const object = topology.objects.muni;
const [sx, sy] = topology.transform.scale;
const [tx, ty] = topology.transform.translate;

const decodedArcs = topology.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * sx + tx, y * sy + ty];
  });
});

const getArc = (index) => {
  const points = decodedArcs[index >= 0 ? index : ~index];
  return index >= 0 ? points : [...points].reverse();
};

const stitchRing = (indexes) => {
  const ring = [];
  indexes.forEach((index, position) => {
    const arc = getArc(index);
    ring.push(...(position ? arc.slice(1) : arc));
  });
  return ring;
};

const ringsForGeometry = (geometry) => {
  if (geometry.type === 'Polygon') return geometry.arcs.map(stitchRing);
  if (geometry.type === 'MultiPolygon') return geometry.arcs.flatMap((polygon) => polygon.map(stitchRing));
  return [];
};

const raw = object.geometries.map((geometry) => ({
  cvegeo: geometry.properties.cvegeo,
  name: geometry.properties.nombre,
  rings: ringsForGeometry(geometry),
}));

const allPoints = raw.flatMap((municipality) => municipality.rings.flat());
const minLon = Math.min(...allPoints.map(([lon]) => lon));
const maxLon = Math.max(...allPoints.map(([lon]) => lon));
const minLat = Math.min(...allPoints.map(([, lat]) => lat));
const maxLat = Math.max(...allPoints.map(([, lat]) => lat));
const width = 1000;
const padding = 24;
const scale = (width - padding * 2) / (maxLon - minLon);
const height = Math.round((maxLat - minLat) * scale + padding * 2);

const project = ([lon, lat]) => [
  (lon - minLon) * scale + padding,
  (maxLat - lat) * scale + padding,
];

const rounded = (value) => Number(value.toFixed(1));

const municipalities = raw.map((municipality) => {
  const projectedRings = municipality.rings.map((ring) => ring.map(project));
  const points = projectedRings.flat();
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const d = projectedRings.map((ring) => (
    `${ring.map(([x, y], index) => `${index ? 'L' : 'M'}${rounded(x)} ${rounded(y)}`).join('')}Z`
  )).join('');

  return {
    id: municipality.cvegeo,
    name: municipality.name,
    d,
    bbox: [rounded(minX), rounded(minY), rounded(maxX - minX), rounded(maxY - minY)],
    center: [rounded((minX + maxX) / 2), rounded((minY + maxY) / 2)],
  };
});

const banner = [
  '// Generated from webrek/mx-geo Veracruz municipal geometry.',
  '// Source geometry: INEGI Marco Geoestadístico; mx-geo is MIT licensed.',
  '// Rebuild with: node scripts/build-veracruz-map.js',
].join('\n');

fs.writeFileSync(
  outputPath,
  `${banner}\nwindow.VERACRUZ_MUNICIPIOS = ${JSON.stringify({ width, height, municipalities })};\n`,
  'utf8',
);

console.log(`Generated ${municipalities.length} municipalities at ${width}x${height}.`);
