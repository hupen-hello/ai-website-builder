"use client";

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import SidebarContent from './Sidebaritems'
import SimpleBar from 'simplebar-react'
import { Icon } from '@iconify/react'
import FullLogo from '../shared/logo/FullLogo'
import {
  AMLogo,
  AMMenu,
  AMMenuItem,
  AMSidebar,
  AMSubmenu,
} from 'tailwind-sidebar'
import 'tailwind-sidebar/styles.css'

interface SidebarProps {
  onClose?: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

const renderSidebarItems = (
  items: any[],
  currentPath: string,
  onClose?: () => void,
  isSubItem: boolean = false,
  isCollapsed: boolean = false 
) => {
  return items.map((item, index) => {
    const isSelected = currentPath === item?.url
    const IconComp = item.icon || null

    const iconElement = IconComp ? (
      <Icon 
        icon={IconComp} 
        height={isSubItem ? 16 : 22} 
        width={isSubItem ? 16 : 22} 
        className={`transition-colors duration-300 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
      />
    ) : (
      <Icon 
        icon={'ri:checkbox-blank-circle-line'} 
        height={8} 
        width={8} 
        className={`shrink-0 ${isSelected ? 'text-[#e53935] drop-shadow-[0_0_5px_rgba(229,57,53,0.8)]' : 'text-gray-600'}`}
      />
    )

    if (item.heading) {
      if (isCollapsed) return <div key={item.heading} className="my-5 border-b border-white/5 mx-4" />;
      return (
        <div className='mt-6 mb-2 px-2' key={item.heading}>
          <AMMenu
            subHeading={item.heading}
            ClassName='hide-menu text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500'
          />
        </div>
      )
    }

    if (item.children?.length) {
      return (
        <div title={isCollapsed ? item.name : undefined} key={item.id}>
          <AMSubmenu
            icon={iconElement}
            title={isCollapsed ? '' : item.name}
            ClassName={`mt-1 text-gray-400 hover:text-white hover:bg-white/5 !rounded-xl transition-all duration-300 font-medium ${isCollapsed ? 'justify-center !px-0' : ''}`}
          >
            {!isCollapsed && renderSidebarItems(item.children, currentPath, onClose, true, isCollapsed)}
          </AMSubmenu>
        </div>
      )
    }

    const linkTarget = item.url?.startsWith('https') ? '_blank' : '_self'

    const itemClassNames = isSubItem
      ? `mt-1 transition-all duration-300 !px-4 py-2 text-sm group [&::before]:!hidden [&::after]:!hidden [&>*::before]:!hidden [&>*::after]:!hidden ${
          isSelected
            ? '!bg-transparent text-[#e53935] font-semibold drop-shadow-[0_0_8px_rgba(229,57,53,0.5)]'
            : 'text-gray-500 hover:text-gray-300 hover:!bg-transparent'
        }`
      : `mt-1.5 transition-all duration-300 !rounded-[14px] ${
          isCollapsed 
            ? 'relative block !p-0 h-11 w-11 mx-auto [&>*:first-child]:!absolute [&>*:first-child]:!left-1/2 [&>*:first-child]:!top-1/2 [&>*:first-child]:!-translate-x-1/2 [&>*:first-child]:!-translate-y-1/2 [&>*:first-child]:!m-0' 
            : '!px-3 py-2.5 flex items-center gap-3'
        } text-[14px] font-medium group relative overflow-hidden [&::before]:!hidden [&::after]:!hidden [&>*::before]:!hidden [&>*::after]:!hidden ${
          isSelected
            ? '!bg-[#e53935]/15 backdrop-blur-md !border !border-[#e53935]/30 shadow-[0_0_20px_rgba(229,57,53,0.15)] !text-white'
            : 'text-gray-400 hover:!text-white hover:!bg-white/5 border border-transparent'
        }`

    return (
      <div onClick={onClose} key={index} title={isCollapsed ? (item.title || item.name) : undefined}>
        <AMMenuItem
          key={item.id}
          icon={iconElement}
          isSelected={isSelected}
          link={item.url || undefined}
          target={linkTarget}
          badge={isCollapsed ? false : !!item.isPro} 
          badgeColor='bg-[#e53935]/40 border border-[#e53935]/40 backdrop-blur-md shadow-[0_0_10px_rgba(229,57,53,0.3)]'
          badgeTextColor='text-white font-bold text-[10px] tracking-wider'
          disabled={item.disabled}
          badgeContent={item.isPro ? 'PRO' : undefined}
          component={Link}
          className={`${itemClassNames}`}
        >
          {!isCollapsed && <span className='truncate flex-1 tracking-wide'>{item.title || item.name}</span>}
        </AMMenuItem>
      </div>
    )
  })
}


const SidebarLayout = ({ onClose, isCollapsed, setIsCollapsed }: SidebarProps) => {
  const pathname = usePathname()
  const { theme } = useTheme()
  const sidebarMode = 'dark'

  return (
    <AMSidebar
      collapsible='none'
      animation={true}
      showProfile={false}
      width={isCollapsed ? '80px' : '230px'} 
      showTrigger={false}
      mode={sidebarMode}
      className='fixed left-0 top-0 border-r border-white/5 bg-[#0b0b0b]/80 backdrop-blur-2xl shadow-[15px_0_50px_rgba(0,0,0,0.5)] z-50 h-screen !overflow-visible transition-all duration-300 ease-in-out'
    >
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-9 w-7 h-7 bg-[#171717] border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#e53935] hover:border-[#e53935] transition-all z-50 cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <Icon icon={isCollapsed ? "solar:alt-arrow-right-line-duotone" : "solar:alt-arrow-left-line-duotone"} width={16} />
      </div>

      <div className={`h-[80px] flex items-center brand-logo border-b border-white/5 relative transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
        <div className="absolute top-1/2 left-4 w-12 h-12 bg-[#c22028] rounded-full blur-[40px] opacity-20 pointer-events-none"></div>
        
        {!isCollapsed ? (
          <Link href='/' className='relative z-10 flex items-center w-full'>
            <div className='w-[180px] sm:w-[180px] scale-[1.35] origin-left transition-all'>
              <FullLogo />
            </div>
          </Link>
        ) : (
          <Link href='/' className='relative z-10 flex items-center justify-center w-full' title="Dashboard">
            <div className="w-9 h-9 rounded-xl  from-[#e53935] to-[#c22028] flex items-center justify-center ">
              <FullLogo />
            </div>
          </Link>
        )}
      </div>

      <SimpleBar className='h-[calc(100vh-80px)]'>
        <div className={` transition-all duration-300 ${isCollapsed ? 'px-3' : 'px-4'}`}>
          {SidebarContent.map((section, index) => (
            <div key={index}>
              {renderSidebarItems(
                [
                  ...(section.heading ? [{ heading: section.heading }] : []),
                  ...(section.children || []),
                ],
                pathname,
                onClose,
                false,
                isCollapsed 
              )}
            </div>
          ))}
        </div>
      </SimpleBar>
    </AMSidebar>
  )
}

export default SidebarLayout