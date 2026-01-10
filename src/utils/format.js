export function formatMoney(n) {
  const x = Number(n || 0);
  return x.toLocaleString("vi-VN");
}

export function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN");
}
