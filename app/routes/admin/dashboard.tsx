import { useState, useEffect } from "react";
import { backend, type BackendUser } from "~/lib/backend";

export default function AdminUsers() {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (query?: string) => {
    try {
      setLoading(true);
      const res = await backend.adminGetUsers(query);
      setUsers(res.users);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const toggleBlock = async (userId: string, currentlyBlocked: boolean) => {
    try {
      await backend.adminBlockUser(userId, !currentlyBlocked);
      setUsers(users.map(u => u.id === userId ? { ...u, is_blocked: !currentlyBlocked } : u));
    } catch (err: any) {
      alert(err.message || "Action failed");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await backend.adminDeleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
                type="text"
                placeholder="Search by username or phone or email..."
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Coins</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center items-center gap-2">
                        <span className="animate-spin h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full"></span>
                        Loading users...
                      </div>
                    </td>
                  </tr>
              ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
              ) : (
                  users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{user.name || "N/A"}</div>
                          <div className="text-xs text-gray-400">{user.id}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                        {user.coins || 0} coins
                      </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                              onClick={() => toggleBlock(user.id, !!user.is_blocked)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium border transition-all ${
                                  user.is_blocked
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                      : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                              }`}
                          >
                            {user.is_blocked ? "Unblock" : "Block"}
                          </button>
                          <button
                              onClick={() => handleDelete(user.id)}
                              className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"
                          >
                            Delete
                          </button>
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