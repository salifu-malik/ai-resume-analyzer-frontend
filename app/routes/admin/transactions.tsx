import { useState, useEffect } from "react";
import { backend, type Transaction } from "~/lib/backend";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchTransactions = async (query?: string) => {
    try {
      setLoading(true);
      const res = await backend.adminGetTransactions(query);
      setTransactions(res.transactions);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(search);
  };

  return (
      <div className="space-y-6">
        {/* SEARCH BAR */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
                type="text"
                placeholder="Search by phone or receipt number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:border-cyan-500 transition-all"
            />
            <button
                type="submit"
                className="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-all shadow-md"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
              {error}
            </div>
        )}

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">Date</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">User</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">Description</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">Phone</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">Receipt</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">Channel</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase text-right">Amount</th>
              </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
              {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
              ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
              ) : (
                  transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold">{tx.user?.name || "Unknown"}</div>
                          <div className="text-xs text-gray-400">{tx.user?.email}</div>
                        </td>

                        <td className="px-6 py-4 text-sm">{tx.description}</td>

                        <td className="px-6 py-4 text-sm">
                          {tx.phone || "—"}
                        </td>

                        <td className="px-6 py-4 text-sm">
                          {tx.receipt_number || "—"}
                        </td>

                        <td className="px-6 py-4 text-sm capitalize">
                          {tx.channel || "—"}
                        </td>

                        <td className="px-6 py-4">
                      <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              tx.paystack_status === "success"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                          }`}
                      >
                        {tx.paystack_status || "unknown"}
                      </span>
                        </td>

                        <td className="px-6 py-4 text-right font-bold">
                          {tx.type === "credit" ? "+" : "-"}
                          {tx.amount}
                        </td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}