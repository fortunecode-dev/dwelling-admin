import { useAuth } from "../../hooks/useAuth";

export default function UserDropdown({ showName }: { showName: boolean }) {
  const { user,  } = useAuth();

  return (
    <div className="relative w-full flex justify-start">
      <button
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

       
      </button>

    
    </div>
  );
}
