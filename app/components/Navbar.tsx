import { Link, useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "~/lib/backend";

const Navbar = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target) && btnRef.current && !btnRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setOpen(false);
      navigate("/auth");
    }
  };

  const initial = (user?.name || user?.email || "").trim().charAt(0).toUpperCase() || "";

  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient">RESUCHECK</p>
      </Link>

      <div className="flex items-center gap-3">
        <Link to="/upload" className="primary-button w-fit">
          Upload Resume
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            ref={btnRef}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            title={user?.name || user?.email || "Account"}
          >
            {initial ? (
              <span className="text-sm font-semibold">{initial}</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" />
                <path d="M3 22c0-3.866 5.373-7 9-7s9 3.134 9 7" />
              </svg>
            )}
          </button>

          {open && (
            <div
              ref={menuRef}
              role="menu"
              aria-label="Account menu"
              className="absolute right-0 mt-2 min-w-[180px] rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50"
            >
              {user?.role !== "admin" && (
                  <Link
                      to="/"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-800"
                  >
                    Home
                  </Link>
              )}

              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm font-semibold text-cyan-600"
                >
                  Admin Portal
                </Link>
              )}

              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-800"
              >
                Profile
              </Link>
              <button
                role="menuitem"
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-800"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;