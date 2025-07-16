import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAuth } from "../../hooks/useAuth";

export default function UserDropdown({ showName }: { showName: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loginWithGoogle } = useAuth();

  const toggleDropdown = () =>
    !user ? loginWithGoogle() : setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="relative w-full flex justify-start">
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-3 text-left text-gray-700 dark:text-gray-200 focus:outline-none"
      >
        <div className="h-11 w-11 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
          {user ? (
            <img
              src={user?.picture ?? "/default-user.png"}
              alt="User"
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500">
              LOGIN
            </div>
          )}
        </div>

        {showName && user && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold truncate max-w-[140px]">
              {user.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
              {user.email}
            </span>
          </div>
        )}

        {user && showName && (
          <svg
            className={`ml-1 stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            width="18"
            height="20"
            viewBox="0 0 18 20"
            fill="none"
          >
            <path
              d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {user && (
        <Dropdown
          isOpen={isOpen}
          onClose={closeDropdown}
          className="right-0 mt-13 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
        >
          <div className="pb-3 mb-2 border-b border-gray-200 dark:border-gray-800">
            <span className="block font-medium text-gray-700 text-sm dark:text-gray-300">
              {user?.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </span>
          </div>

          <ul className="flex flex-col gap-1">
            <li>
              <DropdownItem
                onItemClick={closeDropdown}
                tag="a"
                to="/profile"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
              >
                👤 Editar perfil
              </DropdownItem>
            </li>
            <li>
              <DropdownItem
                onItemClick={closeDropdown}
                tag="a"
                to="/settings"
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
              >
                ⚙️ Configuración
              </DropdownItem>
            </li>
          </ul>

          <button
            onClick={() => {
              // logout(); // activa si tienes lógica de cierre de sesión
              closeDropdown();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 mt-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            🚪 Cerrar sesión
          </button>
        </Dropdown>
      )}
    </div>
  );
}
