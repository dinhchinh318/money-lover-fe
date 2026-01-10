import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  reportByCategoryApi,
  reportByWalletApi,
  reportSummaryApi,
  listGroupCategoriesApi,
  listGroupWalletsApi,
} from "../../../services/api.group";
import { formatMoney } from "../../../utils/format";

function StatCard({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm font-medium text-slate-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {sub ? <div className="mt-1 text-sm text-slate-600">{sub}</div> : null}
    </div>
  );
}

function unwrapOkData(res) {
  if (res && typeof res === "object" && "data" in res) return res.data;
  if (res?.data && typeof res.data === "object" && "data" in res.data) return res.data.data;
  return undefined;
}

function toItems(x) {
  if (Array.isArray(x)) return x;
  if (Array.isArray(x?.items)) return x.items;
  if (Array.isArray(x?.data)) return x.data;
  if (Array.isArray(x?.data?.items)) return x.data.items;
  return [];
}

export default function GroupReportsPage() {
  const { groupId } = useParams();

  const today = useMemo(() => new Date(), []);
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const firstDay = `${yyyy}-${mm}-01`;

  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(
    `${yyyy}-${mm}-${String(today.getDate()).padStart(2, "0")}`
  );

  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [byCat, setByCat] = useState([]);
  const [byWallet, setByWallet] = useState([]);

  const [catMap, setCatMap] = useState({});
  const [walletMap, setWalletMap] = useState({});

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!groupId) return;

    setLoading(true);
    setErr("");

    try {
      const params = { from, to };

      const [sRes, cRes, wRes, catsRes, walletsRes] = await Promise.all([
        reportSummaryApi(groupId, params),
        reportByCategoryApi(groupId, params),
        reportByWalletApi(groupId, params),
        listGroupCategoriesApi(groupId),
        listGroupWalletsApi(groupId),
      ]);

      const s = unwrapOkData(sRes) || { income: 0, expense: 0, net: 0 };
      const c = unwrapOkData(cRes);
      const w = unwrapOkData(wRes);

      const catsRaw = unwrapOkData(catsRes);
      const walletsRaw = unwrapOkData(walletsRes);

      const cats = toItems(catsRaw);
      const wallets = toItems(walletsRaw);

      const cm = {};
      for (const item of cats) cm[String(item._id)] = item.name;

      const wm = {};
      for (const item of wallets) wm[String(item._id)] = item.name;

      setSummary(s);
      setByCat(Array.isArray(c) ? c : []);
      setByWallet(Array.isArray(w) ? w : []);
      setCatMap(cm);
      setWalletMap(wm);
    } catch (e) {
      console.error("GroupReportsPage load error:", e);
      setSummary({ income: 0, expense: 0, net: 0 });
      setByCat([]);
      setByWallet([]);
      setCatMap({});
      setWalletMap({});
      setErr(e?.message || "Load reports failed");
    } finally {
      setLoading(false);
    }
  }, [groupId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const currency = summary?.currency || "VND";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Từ ngày</div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Đến ngày</div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        {err ? (
          <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard title="Tổng thu nhập" value={`${formatMoney(summary.income || 0)} ${currency}`} />
        <StatCard title="Tổng chi tiêu" value={`${formatMoney(summary.expense || 0)} ${currency}`} />
        <StatCard title="Lời" value={`${formatMoney(summary.net || 0)} ${currency}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Theo danh mục</h3>

          {byCat.length === 0 ? (
            <div className="mt-2 text-sm text-slate-600">Không có dữ liệu.</div>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {byCat.map((r) => {
                const id = String(r._id);
                const name = catMap[id] || `Category (${id.slice(-6)})`;
                return (
                  <div key={id} className="flex items-center justify-between py-2">
                    <div className="text-sm font-medium text-slate-900">{name}</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatMoney(r.total || 0)} {currency}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Theo ví</h3>

          {byWallet.length === 0 ? (
            <div className="mt-2 text-sm text-slate-600">Không có dữ liệu.</div>
          ) : (
            <div className="mt-3 divide-y divide-slate-100">
              {byWallet.map((r) => {
                const id = String(r._id);
                const name = walletMap[id] || `Wallet (${id.slice(-6)})`;
                return (
                  <div key={id} className="flex items-center justify-between py-2">
                    <div className="text-sm font-medium text-slate-900">{name}</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatMoney(r.total || 0)} {currency}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
