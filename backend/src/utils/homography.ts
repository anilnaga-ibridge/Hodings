/**
 * Solves a system of linear equations using Gauss-Jordan elimination.
 * Ax = B
 */
function solveGauss(A: number[][], B: number[]): number[] {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    // Search for maximum in this column
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) {
        maxEl = Math.abs(A[k][i]);
        maxRow = k;
      }
    }

    // Swap maximum row with current row
    const tempA = A[maxRow];
    A[maxRow] = A[i];
    A[i] = tempA;

    const tempB = B[maxRow];
    B[maxRow] = B[i];
    B[i] = tempB;

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) {
          A[k][j] = 0;
        } else {
          A[k][j] += c * A[i][j];
        }
      }
      B[k] += c * B[i];
    }
  }

  // Solve equation Ax=B for an upper triangular matrix A
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = B[i] / A[i][i];
    for (let k = i - 1; k >= 0; k--) {
      B[k] -= A[k][i] * x[i];
    }
  }
  return x;
}

/**
 * Computes the 3D projection matrix (matrix3d) mapping a source rectangle
 * of size (w, h) to a destination quadrilateral with vertices:
 * p0 (top-left), p1 (top-right), p2 (bottom-right), p3 (bottom-left).
 */
export function getHomographyMatrix3d(
  w: number,
  h: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): string {
  // Source points (top-left, top-right, bottom-right, bottom-left)
  const src = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];

  const dst = [p0, p1, p2, p3];

  // We set up system of 8 linear equations
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    B.push(dx);
    B.push(dy);
  }

  const hCoeff = solveGauss(A, B);

  // Homography matrix is:
  // [h0, h1, h2]   [hCoeff[0], hCoeff[1], hCoeff[2]]
  // [h3, h4, h5] = [hCoeff[3], hCoeff[4], hCoeff[5]]
  // [h6, h7, 1 ]   [hCoeff[6], hCoeff[7],     1    ]

  // CSS transform matrix3d format is column-major:
  // [ m00, m10, m20, m30 ]   [ h0,  h3,  0,  h6 ]
  // [ m01, m11, m21, m31 ] = [ h1,  h4,  0,  h7 ]
  // [ m02, m12, m22, m32 ]   [  0,   0,  1,   0 ]
  // [ m03, m13, m23, m33 ]   [ h2,  h5,  0,   1 ]

  const m00 = hCoeff[0];
  const m10 = hCoeff[3];
  const m20 = 0;
  const m30 = hCoeff[6];

  const m01 = hCoeff[1];
  const m11 = hCoeff[4];
  const m21 = 0;
  const m31 = hCoeff[7];

  const m02 = 0;
  const m12 = 0;
  const m22 = 1;
  const m32 = 0;

  const m03 = hCoeff[2];
  const m13 = hCoeff[5];
  const m23 = 0;
  const m33 = 1;

  return `matrix3d(
    ${m00.toFixed(6)}, ${m10.toFixed(6)}, ${m20}, ${m30.toFixed(6)},
    ${m01.toFixed(6)}, ${m11.toFixed(6)}, ${m21}, ${m31.toFixed(6)},
    ${m02}, ${m12}, ${m22}, ${m32},
    ${m03.toFixed(6)}, ${m13.toFixed(6)}, ${m23}, ${m33.toFixed(6)}
  )`;
}
