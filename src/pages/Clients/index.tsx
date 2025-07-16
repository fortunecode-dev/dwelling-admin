import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "../../components/ui/table";
import { EllipsisVerticalIcon,PlusIcon } from "@heroicons/react/24/outline";
import { deleteProspect, getActiveProspects } from "../../services/prospects.service";
import Button from "../../components/ui/button/Button";
import { useNavigate } from "react-router";
import { exportProspectPDF } from "../../libs/exportProspectToPdf";

export default function Clients() {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [prospects, setProspects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate=useNavigate()
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const prospects = await getActiveProspects();
    setProspects(prospects);
  };

  const toggleDropdown = (id: string) => {
    setOpenDropdownId(prev => (prev === id ? null : id));
  };

  const closeDropdown = () => setOpenDropdownId(null);

  const handleSearch = (value: string) => setSearchTerm(value.toLowerCase());

  const filteredData = useMemo(() => {
    return prospects?.filter((item) => {
      const values = Object.values(item)
        .concat(Object.values(item.metadata || {}))
        .join(" ")
        .toLowerCase();
      return values?.includes(searchTerm);
    });
  }, [searchTerm, prospects]);


 
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => handleSearch(e.target.value)}
          className="border px-3 py-2 rounded w-1/2"
        />
        <Button
              size="sm"
              variant="outline"
              onClick={()=>navigate("/manage/client")}
              startIcon={< PlusIcon className="size-5" />}
            >
              New Prospect
            </Button>
      </div>
       <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 bg-blue-light-50 dark:border-white/[0.05] ">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400 font-bold"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-bold text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Email
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-bold text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Phone
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-bold text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Address
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-bold text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-bold text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                {""}
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {filteredData?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {!order.name && !order.lastName ?  "Not set" :`${order.name} ${order.lastName??""}`}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.email || "Not set"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.phone || "Not set"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {order.address || "Not set"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {order.status || "Not set"}
                </TableCell>
                <TableCell className="px-4 py-3 text-end relative">
                  <button
                    onClick={() => toggleDropdown(order.id)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <EllipsisVerticalIcon className="h-5 w-5" />
                  </button>

                  {openDropdownId === order.id && (
                    <Dropdown
                      isOpen={true}
                      onClose={closeDropdown}
                      className="fixed right-0 z-10 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-gray-900"
                    >
                      <ul className="flex flex-col gap-1">
                        <li>
                          <DropdownItem
                            onItemClick={() => {
                              console.log("Marcar como atendido", order.id);
                              closeDropdown();
                            }}
                            tag="button"
                            className="w-full text-left px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                          >
                          Marcar como atendido
                          </DropdownItem>
                        </li>
                         <li>
                          <DropdownItem
                            onItemClick={() => {
                              console.log("Marcar como atendido", order.id);
                              closeDropdown();
                            }}
                            tag="button"
                            className="w-full text-left px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                          >
                         Verificar cliente
                          </DropdownItem>
                        </li>
                         <li>
                          <DropdownItem
                            onItemClick={() => {
                              navigate(`/mail-to?mail=${order.email}`)
                              closeDropdown();
                            }}
                            disabled={!order.email}
                            
                            
                            tag="button"
                            className="w-full flex text-left px-4 py-2 rounded-lg text-sm dark:text-gray-300 dark:hover:bg-white/10"
                          >
                            Send a E-Mail
                          </DropdownItem>
                        </li>
                        <li>
                          <DropdownItem
                            onItemClick={() => {
                              console.log("Marcar como atendido", order.id);
                              exportProspectPDF(order)
                              closeDropdown();
                            }}
                            tag="button"
                            className="w-full flex text-left px-4 py-2 rounded-lg text-sm dark:text-gray-300 dark:hover:bg-white/10"
                          >
                             Download Client Summary
                          </DropdownItem>
                        </li>
                         <li>
                          <DropdownItem
                            onItemClick={() => {
                              navigate(`/manage/client?id=${order.id}`)
                              closeDropdown();
                            }}
                            
                            
                            tag="button"
                            className="w-full flex text-left px-4 py-2 rounded-lg text-sm dark:text-gray-300 dark:hover:bg-white/10"
                          >
                            Editar
                          </DropdownItem>
                        </li>

                        
                        <li>
                          <DropdownItem
                            onItemClick={() => {
                              deleteProspect(order.id).then(()=>loadClients())
                              console.log("Eliminar", order.id);
                              closeDropdown();
                            }}
                            tag="button"
                            className="w-full text-left px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                           Archivar
                          </DropdownItem>
                        </li>
                      </ul>
                    </Dropdown>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </div>
   
  );
}
