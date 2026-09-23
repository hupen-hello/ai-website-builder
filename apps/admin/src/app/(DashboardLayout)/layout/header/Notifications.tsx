'use client'

import { useCallback, useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

type AppNotification = {
  id: string
  title: string
  body: string
  type: string
  href: string | null
  readAt: string | null
  createdAt: string
}

const typeStyle = (type: string) => {
  if (type === 'billing_support') {
    return {
      icon: 'solar:inbox-line-bold-duotone',
      iconColor: 'text-blue-500',
      bgLight: 'bg-blue-50',
      bgDark: 'dark:bg-blue-500/15',
    }
  }
  if (type === 'ticket_status') {
    return {
      icon: 'solar:check-circle-bold-duotone',
      iconColor: 'text-emerald-500',
      bgLight: 'bg-emerald-50',
      bgDark: 'dark:bg-emerald-500/15',
    }
  }
  if (type === 'user_reply') {
    return {
      icon: 'solar:chat-round-dots-bold-duotone',
      iconColor: 'text-violet-500',
      bgLight: 'bg-violet-50',
      bgDark: 'dark:bg-violet-500/15',
    }
  }
  return {
    icon: 'solar:bell-bing-bold-duotone',
    iconColor: 'text-amber-500',
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-500/15',
  }
}

const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const Notifications = () => {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=20', {
        cache: 'no-store',
      })
      const data = (await response.json().catch(() => ({}))) as {
        items?: AppNotification[]
        unreadCount?: number
      }
      if (!response.ok) return
      setItems(Array.isArray(data.items) ? data.items : [])
      setUnreadCount(
        typeof data.unreadCount === 'number' ? data.unreadCount : 0,
      )
    } catch {
      // keep previous list
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()
    const timer = window.setInterval(() => {
      void loadNotifications()
    }, 10000)
    return () => window.clearInterval(timer)
  }, [loadNotifications])

  const markAllRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (!response.ok) return
      setItems((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt || new Date().toISOString(),
        })),
      )
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }

  const markOneRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, readAt: item.readAt || new Date().toISOString() }
            : item,
        ),
      )
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch {
      // ignore
    }
  }

  return (
    <div className='relative shrink-0 w-full h-full'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className='outline-none focus:outline-none flex justify-center items-center w-full h-full'>
            <div className="relative flex items-center justify-center">
              <Icon 
                icon="solar:bell-bing-bold-duotone" 
                className='text-[22px] text-gray-600 dark:text-gray-400 hover:text-[#e53935] dark:hover:text-[#e53935] transition-colors' 
              />
              {unreadCount > 0 ? (
                <span className="absolute -top-[1px] -right-[1px] flex h-[9px] w-[9px]">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e53935] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-full w-full bg-[#e53935] border-[1.5px] border-white dark:border-gray-100 transition-colors"></span>
                </span>
              ) : null}
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          sideOffset={14}
          className='w-[340px] p-0 rounded-2xl bg-white/80 dark:bg-[#0b0b0b]/80 backdrop-blur-2xl border border-gray-100 dark:border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden'
        >
          <div className='flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-transparent'>
            <h3 className='text-[15px] font-bold text-gray-900 dark:text-white'>Notifications</h3>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={unreadCount === 0}
              className='text-[11.5px] font-semibold text-[#e53935] hover:text-[#c22028] cursor-pointer transition-colors bg-[#e53935]/10 px-2.5 py-1 rounded-full disabled:opacity-40 disabled:cursor-default'
            >
              Mark all as read
            </button>
          </div>

          <SimpleBar className='max-h-[320px]'>
            <div className='flex flex-col'>
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  Loading…
                </div>
              ) : items.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  No notifications yet.
                </div>
              ) : (
                items.map((item) => {
                  const style = typeStyle(item.type)
                  return (
                    <DropdownMenuItem key={item.id} asChild className='cursor-pointer outline-none p-0 rounded-none border-b border-gray-50 dark:border-white/5 last:border-0'>
                      <Link
                        href={item.href || '/notifications'}
                        onClick={() => {
                          if (!item.readAt) void markOneRead(item.id)
                        }}
                        className={`px-5 py-3.5 flex items-start gap-3.5 w-full transition-all duration-300 hover:bg-gray-50 dark:hover:bg-white/5 focus:bg-gray-50 dark:focus:bg-white/5 group ${
                          item.readAt ? 'opacity-75' : ''
                        }`}
                      >
                        <div className={`w-[38px] h-[38px] shrink-0 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${style.bgLight} ${style.bgDark}`}>
                          <Icon
                            icon={style.icon}
                            className={`text-[20px] ${style.iconColor}`}
                          />
                        </div>
                        
                        <div className='flex-1 min-w-0'>
                          <div className='flex justify-between items-start mb-0.5'>
                            <h5 className='text-[13.5px] font-semibold text-gray-900 dark:text-white truncate pr-2 group-hover:text-[#e53935] transition-colors'>
                              {item.title}
                            </h5>
                            <span className='text-[11px] font-medium text-gray-400 shrink-0 mt-0.5'>
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>
                          <p className='text-[12.5px] text-gray-500 dark:text-gray-400 line-clamp-1'>
                            {item.body}
                          </p>
                        </div>
                        {!item.readAt ? (
                          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#e53935]" />
                        ) : null}
                      </Link>
                    </DropdownMenuItem>
                  )
                })
              )}
            </div>
          </SimpleBar>

          <DropdownMenuSeparator className='bg-gray-100 dark:bg-white/5 m-0' />

          <div className='p-2 bg-white/50 dark:bg-transparent'>
            <Link 
              href='/notifications' 
              className='w-full flex items-center justify-center py-2.5 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:text-[#e53935] dark:hover:text-[#e53935] rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all'
            >
              View All Notifications
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Notifications
