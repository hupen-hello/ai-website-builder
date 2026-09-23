'use client'

import { useState } from 'react'
import Header from './layout/header/Header'
import Sidebar from './layout/sidebar/Sidebar'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <>
      <div className='flex w-full min-h-screen bg-lightgray dark:bg-dark'>
        
        {/* ================= SIDEBAR ================= */}
        <div className='xl:block hidden z-[100] relative'>
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed} 
          />
        </div>

        {/* ================= MAIN DASHBOARD CONTENT ================= */}
        <div 
          className='body-wrapper w-full min-h-screen flex flex-col transition-all duration-300 ease-in-out'
          style={{ marginLeft: isSidebarCollapsed ? '80px' : '230px' }}
        >
          {/* Top Header */}
          <Header />
          <div className='container mx-auto px-6 py-8'>
            {children}
          </div>
        </div>

      </div>
    </>
  )
}