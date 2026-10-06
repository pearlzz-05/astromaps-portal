function calculateLST(date, longitude) {
  const time = date.getTime();
  const julianDate = (time / 86400000) + 2440587.5;
  const D = julianDate - 2451545.0;

  let gstDegrees = (280.46061837 + 360.98564736629 * D) % 360;
  if (gstDegrees < 0) gstDegrees += 360;

  let lstDegrees = (gstDegrees + longitude) % 360;
  if (lstDegrees < 0) lstDegrees += 360;

  return {
    gstHours: (gstDegrees / 15).toFixed(4),
    lstHours: (lstDegrees / 15).toFixed(4),
    zenithRA: (lstDegrees / 15).toFixed(4)
  };
}

module.exports = { calculateLST };