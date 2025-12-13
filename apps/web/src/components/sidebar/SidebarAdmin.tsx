// components/SidebarAdmin.tsx
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  BookOpenIcon,
  PhoneIcon 
} from "@heroicons/react/24/outline";
import {useAuth} from "../../contexts/AuthContext";


type Props = { collapsed?: boolean; onToggle?: () => void };

export default function SidebarAdmin({ collapsed = false, onToggle }: Props) {
  const { logout } = useAuth();

  const nav = [
    { key: "overview", label: "Overview", href: "/admin/dashboard", Icon: HomeIcon },
    { key: "students", label: "Students", href: "/admin/students", Icon: UsersIcon },
    { key: "classes", label: "Classes", href: "/admin/classes", Icon: AcademicCapIcon },
    { key: "batches", label: "Batches", href: "/admin/batches", Icon: ClipboardDocumentCheckIcon },
    { key: "sessions", label: "Sessions", href: "/admin/sessions", Icon: CurrencyDollarIcon },
    { key: "materials", label: "Materials", href: "/admin/materials", Icon: BookOpenIcon },
    { key: "reports", label: "Reports", href: "/admin/reports", Icon: ChartBarIcon },
    { key: "Support", label: "Support", href: "/admin/support", Icon: PhoneIcon },
    { key: "settings", label: "Settings", href: "/admin/settings", Icon: Cog6ToothIcon },
  ];

  return (
    // Added 'hidden lg:flex' to hide on mobile
    <aside className={`hidden lg:flex flex-col h-full bg-[#0b2540] text-white ${collapsed ? "w-20" : "w-64"} transition-all duration-300`}>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <button onClick={onToggle} className="p-1 rounded-md hover:bg-white/10"><Bars3Icon className="w-6 h-6" /></button>
        {!collapsed && <div><div className="font-semibold">Instructor</div><div className="text-xs text-white/80">Admin Panel</div></div>}
      </div>

      <nav className="flex-1 px-2 py-4 overflow-auto custom-scrollbar">
        {nav.map((n) => (
          <a key={n.key} href={n.href} className="flex items-center gap-3 p-3 rounded-md hover:bg-white/10 transition-colors mb-1">
            <n.Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{n.label}</span>}
          </a>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-medium">K</div>
            {!collapsed && <div><div className="text-sm font-medium">Kalum</div><div className="text-xs">Instructor</div></div>}
          </div>
          {!collapsed && <button aria-label="Logout" className="p-1 rounded-md hover:bg-white/10" onClick={logout}><ArrowRightOnRectangleIcon className="w-5 h-5" /></button>}
        </div>
      </div>
    </aside>
  );
}