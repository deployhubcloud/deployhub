import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { SidebarProvider } from '../components/SidebarContext'
import AgentChat from '../components/Agent/AgentChat'

export default function PrivateLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#0a0a0b] text-white">
        <Sidebar />
        <main className="min-h-screen md:ml-14 p-6 md:p-8">
          <Outlet />
        </main>
        <AgentChat />
      </div>
    </SidebarProvider>
  )
}
