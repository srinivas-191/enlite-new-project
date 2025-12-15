// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import AOS from "aos";
import { clearAuthToken } from "../lib/api";

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [logged, setLogged] = useState(!!localStorage.getItem("token"));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  useEffect(() => {
    AOS.init({ duration: 800, once: true });

    const onAuthChange = () => {
      setLogged(!!localStorage.getItem("token"));
      setIsAdmin(localStorage.getItem("isAdmin") === "true");
      setUsername(localStorage.getItem("username") || "");
    };

    window.addEventListener("authChange", onAuthChange);
    window.addEventListener("storage", onAuthChange);

    return () => {
      window.removeEventListener("authChange", onAuthChange);
      window.removeEventListener("storage", onAuthChange);
    };
  }, []);

  function logout() {
    clearAuthToken();
    sessionStorage.clear();
    window.dispatchEvent(new Event("authChange"));
    navigate("/login");
  }

  return (
    <nav className="bg-white text-black shadow-sm border-b border-gray-300 fixed w-full top-0 z-50" data-aos="fade-down">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* LOGO */}
        <NavLink to="/" className="flex items-center space-x-2 text-2xl no-underline font-extrabold tracking-wider">
          <img src="/assets/ELogo.png" alt="logo" className="w-9 h-9 rounded-full border border-gray-300 shadow-sm" />
          Enlite
        </NavLink>

        {/* DESKTOP MENU */}
        <ul className="hidden lg:flex space-x-5 text-lg font-medium mx-auto">
          <NavItem to="/home" label="Home" />
          <NavItem to="/about" label="About" />
          <NavItem to="/solutions" label="Our AI" />
          <NavItem to="/contact" label="Contact" />

          {logged && !isAdmin && <NavItem to="/pricing" label="Pricing" />}

          {logged && !isAdmin && (
            <div className="relative group">
              <button className="p-2 px-3 rounded inline-flex items-center gap-2">
                {username || "Account"} ▾
              </button>

              <div className="absolute bg-white border rounded shadow-lg hidden group-hover:block z-40 min-w-[150px]">
                <button onClick={() => navigate("/profile")} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Profile</button>
                <button onClick={() => navigate("/history")} className="block w-full text-left px-4 py-2 hover:bg-gray-100">History</button>
              </div>
            </div>
          )}

          {logged && isAdmin && <NavItem to="/admin-dashboard" label="Admin" />}
        </ul>

        {/* DESKTOP AUTH */}
        <div className="hidden lg:flex gap-4">
          {!logged ? (
            <>
              <button onClick={() => navigate("/login")} className="text-sia-blue">Login</button>
              <button onClick={() => navigate("/register")} className="bg-sia-blue text-white px-4 py-2 rounded">Sign Up</button>
            </>
          ) : (
            <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">Logout</button>
          )}
        </div>

        {/* MOBILE MENU ICON */}
        <button className="lg:hidden text-black focus:outline-none" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <ul className="flex flex-col space-y-4 py-4 px-6 text-lg font-medium">
            <NavItem to="/home" label="Home" setOpen={setOpen} />
            <NavItem to="/about" label="About" setOpen={setOpen} />
            <NavItem to="/solutions" label="Our AI" setOpen={setOpen} />
            <NavItem to="/contact" label="Contact" setOpen={setOpen} />

            {logged && !isAdmin && <NavItem to="/pricing" label="Pricing" setOpen={setOpen} />}
            {logged && isAdmin && <NavItem to="/admin-dashboard" label="Admin" setOpen={setOpen} />}

            {!logged ? (
              <>
                <button onClick={() => { setOpen(false); navigate("/login"); }} className="w-full p-3 text-left">Login</button>
                <button onClick={() => { setOpen(false); navigate("/register"); }} className="w-full p-3 text-left">Sign Up</button>
              </>
            ) : (
              <>
                {!isAdmin && (
                  <>
                    <button onClick={() => { setOpen(false); navigate("/profile"); }} className="w-full p-3 text-left">Profile</button>
                    <button onClick={() => { setOpen(false); navigate("/history"); }} className="w-full p-3 text-left">History</button>
                  </>
                )}

                <button onClick={() => { setOpen(false); logout(); }} className="px-3 py-2 text-left bg-red-600 text-white rounded">Logout</button>
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

// MOBILE HELPER
function NavItem({ to, label, setOpen }) {
  return (
    <li>
      <NavLink
        to={to}
        onClick={() => setOpen && setOpen(false)}
        className={({ isActive }) =>
          `inline-block p-2 px-3 transition no-underline 
          ${isActive ? "bg-sia-blue text-white rounded-md" : "text-black"}`
        }
      >
        {label}
      </NavLink>
    </li>
  );
}
