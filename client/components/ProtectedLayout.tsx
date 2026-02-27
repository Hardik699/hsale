import Sidebar from "./Sidebar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 transition-colors duration-300">
        {children}
      </main>
    </div>
  );
}
