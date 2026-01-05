import { useState, useEffect } from "react";
import { backend, type BackendUser } from "~/lib/backend";

type ModalAction = "block" | "delete" | null;

export default function AdminUsers() {
  const [allUsers, setAllUsers] = useState<BackendUser[]>([]);
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [modalUser, setModalUser] = useState<BackendUser | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction>(null);

      //Load users ONCE
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const res = await backend.adminGetUsers();
        setAllUsers(res.users);
        setUsers(res.users);
      } catch (err: any) {
        setError(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

    //Frontend search
  useEffect(() => {
    const q = search.toLowerCase().trim();

    if (!q) {
      setUsers(allUsers);
      return;
    }

    setUsers(
        allUsers.filter(u =>
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        )
    );
  }, [search, allUsers]);

   //Confirmed actions
  const confirmAction = async () => {
    if (!modalUser || !modalAction) return;

    try {
      if (modalAction === "block") {
        await backend.adminBlockUser(
            modalUser.id,
            !modalUser.is_blocked
        );

        setAllUsers(users =>
            users.map(u =>
                u.id === modalUser.id
                    ? { ...u, is_blocked: !u.is_blocked }
                    : u
            )
        );
      }

      if (modalAction === "delete") {
        await backend.adminDeleteUser(modalUser.id);

        setAllUsers(users =>
            users.filter(u => u.id !== modalUser.id)
        );
      }
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setModalUser(null);
      setModalAction(null);
    }
  };

  return (
      <div className="space-y-6">
        {/* Search */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
              {error}
            </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">User</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">Email</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">Verified</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase">Coins</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase text-right">Actions</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Loading users...
                    </td>
                  </tr>
              ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
              ) : (
                  users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-semibold">{user.name || "N/A"}</div>
                          <div className="text-xs text-gray-400">{user.id}</div>
                        </td>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">
        <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                user.is_verify
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-100 text-gray-500"
            }`}
        >
          {user.is_verify ? "Yes" : "No"}
        </span>
                        </td>
                        <td className="px-6 py-4">{user.coins || 0} coins</td>

                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                              onClick={() => {
                                setModalUser(user);
                                setModalAction("block");
                              }}
                              className={`px-3 py-1 rounded-lg text-sm border ${
                                  user.is_blocked
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-amber-50 text-amber-600"
                              }`}
                          >
                            {user.is_blocked ? "Unblock" : "Block"}
                          </button>

                          <button
                              onClick={() => {
                                setModalUser(user);
                                setModalAction("delete");
                              }}
                              className="px-3 py-1 bg-red-50 text-red-600 border rounded-lg text-sm"
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

        {/* Lazy Modal */}
        {modalUser && modalAction && (
            <ConfirmModal
                user={modalUser}
                action={modalAction}
                onCancel={() => {
                  setModalUser(null);
                  setModalAction(null);
                }}
                onConfirm={confirmAction}
            />
        )}
      </div>
  );
}

 //Confirmation Modal (single, lazy)
function ConfirmModal({
                        user,
                        action,
                        onCancel,
                        onConfirm
                      }: {
  user: BackendUser;
  action: "block" | "delete";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-lg font-bold mb-3">
            {action === "delete" ? "Delete User" : "Block User"}
          </h2>

          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to {action} <strong>{user.email}</strong>?
          </p>

          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 border rounded-lg">
              Cancel
            </button>
            <button
                onClick={onConfirm}
                className={`px-4 py-2 rounded-lg text-white ${
                    action === "delete" ? "bg-red-600" : "bg-amber-600"
                }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
  );
}
