export interface STLResult {
  volumeCm3: number;
  bbox: { x: number; y: number; z: number }; // mm
  triangleCount: number;
}

export function parseSTL(buffer: ArrayBuffer): STLResult {
  const bytes = new Uint8Array(buffer);

  // Detect ASCII vs binary by checking if it starts with "solid"
  let header = '';
  for (let i = 0; i < 5; i++) header += String.fromCharCode(bytes[i]);
  return header === 'solid' && isASCII(bytes)
    ? parseASCII(buffer)
    : parseBinary(buffer);
}

function isASCII(bytes: Uint8Array): boolean {
  // Binary STL: bytes 80-83 encode triangle count; check it's consistent with file size
  const view = new DataView(bytes.buffer);
  if (bytes.length < 84) return true;
  const triangles = view.getUint32(80, true);
  const expectedSize = 84 + triangles * 50;
  return Math.abs(bytes.length - expectedSize) > 4;
}

function parseBinary(buffer: ArrayBuffer): STLResult {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);

  let volSum = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < triangleCount; i++) {
    const offset = 84 + i * 50;
    // Skip normal (12 bytes), read 3 vertices
    const v1x = view.getFloat32(offset + 12, true);
    const v1y = view.getFloat32(offset + 16, true);
    const v1z = view.getFloat32(offset + 20, true);
    const v2x = view.getFloat32(offset + 24, true);
    const v2y = view.getFloat32(offset + 28, true);
    const v2z = view.getFloat32(offset + 32, true);
    const v3x = view.getFloat32(offset + 36, true);
    const v3y = view.getFloat32(offset + 40, true);
    const v3z = view.getFloat32(offset + 44, true);

    // Signed volume contribution (divergence theorem)
    volSum += signedTriangleVolume(v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z);

    // Bounding box
    minX = Math.min(minX, v1x, v2x, v3x);
    minY = Math.min(minY, v1y, v2y, v3y);
    minZ = Math.min(minZ, v1z, v2z, v3z);
    maxX = Math.max(maxX, v1x, v2x, v3x);
    maxY = Math.max(maxY, v1y, v2y, v3y);
    maxZ = Math.max(maxZ, v1z, v2z, v3z);
  }

  const volumeMm3 = Math.abs(volSum);
  return {
    volumeCm3: volumeMm3 / 1000,
    bbox: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ },
    triangleCount,
  };
}

function parseASCII(buffer: ArrayBuffer): STLResult {
  const text = new TextDecoder().decode(buffer);
  const vertexRe = /vertex\s+([-\d.eE+]+)\s+([-\d.eE+]+)\s+([-\d.eE+]+)/g;

  const vertices: [number, number, number][] = [];
  let match: RegExpExecArray | null;

  while ((match = vertexRe.exec(text)) !== null) {
    vertices.push([parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])]);
  }

  const triangleCount = Math.floor(vertices.length / 3);
  let volSum = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < triangleCount; i++) {
    const [v1x, v1y, v1z] = vertices[i * 3];
    const [v2x, v2y, v2z] = vertices[i * 3 + 1];
    const [v3x, v3y, v3z] = vertices[i * 3 + 2];

    volSum += signedTriangleVolume(v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z);

    minX = Math.min(minX, v1x, v2x, v3x);
    minY = Math.min(minY, v1y, v2y, v3y);
    minZ = Math.min(minZ, v1z, v2z, v3z);
    maxX = Math.max(maxX, v1x, v2x, v3x);
    maxY = Math.max(maxY, v1y, v2y, v3y);
    maxZ = Math.max(maxZ, v1z, v2z, v3z);
  }

  return {
    volumeCm3: Math.abs(volSum) / 1000,
    bbox: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ },
    triangleCount,
  };
}

function signedTriangleVolume(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  x3: number, y3: number, z3: number,
): number {
  // Signed volume of the tetrahedron formed by the triangle and the origin
  return (x1 * (y2 * z3 - y3 * z2) + x2 * (y3 * z1 - y1 * z3) + x3 * (y1 * z2 - y2 * z1)) / 6;
}
