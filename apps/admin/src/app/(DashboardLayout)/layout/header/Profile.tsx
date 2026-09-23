'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import * as profileData from './Data'
import SimpleBar from 'simplebar-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  clearCachedAdmin,
  getCachedAdminMeta,
  getCachedAvatar,
  resolveAvatarUrl,
  setCachedAdminMeta,
  setCachedAvatar,
} from '@/lib/admin-avatar'

const Profile = () => {
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const cachedAvatar = getCachedAvatar()
    const cachedMeta = getCachedAdminMeta()
    if (cachedAvatar) setAvatarUrl(cachedAvatar)
    if (cachedMeta.name) setName(cachedMeta.name)
    if (cachedMeta.email) setEmail(cachedMeta.email)
    if (cachedAvatar) setReady(true)

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (!res.ok || cancelled) return
        const nextAvatar = resolveAvatarUrl(data.avatarUrl)
        const nextName = data.name || 'Admin User'
        const nextEmail = data.email || ''
        setAvatarUrl(nextAvatar)
        setName(nextName)
        setEmail(nextEmail)
        setCachedAvatar(nextAvatar)
        setCachedAdminMeta(nextName, nextEmail)
      } catch {
        if (!cancelled && !getCachedAvatar()) {
          setAvatarUrl(resolveAvatarUrl(null))
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleLogout() {
    clearCachedAdmin()
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/auth/login')
    router.refresh()
  }

  return (
    <div className='relative shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className='outline-none focus:outline-none'>
            <div className='relative p-[2px] rounded-full bg-gradient-to-r from-transparent to-transparent hover:from-[#c22028] hover:to-[#e53935] transition-all duration-300 shadow-sm'>
              {ready && avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt='Profile'
                  height={38}
                  width={38}
                  className='rounded-full border-2 border-white dark:border-[#171717] object-cover h-[38px] w-[38px]'
                  unoptimized
                />
              ) : (
                <div className='h-[38px] w-[38px] rounded-full border-2 border-white dark:border-[#171717] bg-gray-200 dark:bg-white/10 animate-pulse' />
              )}
              <span className='absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#171717] rounded-full'></span>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          sideOffset={8}
          className='w-[260px] p-2 rounded-2xl bg-white/80 dark:bg-[#0b0b0b]/80 backdrop-blur-2xl border border-gray-100 dark:border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)]'
        >
          <div className='px-4 py-3 mb-1 border-b border-gray-100 dark:border-white/5'>
            <h4 className='text-[15px] font-bold text-gray-900 dark:text-white'>
              {name || '…'}
            </h4>
            <p className='text-[12.5px] font-medium text-gray-500 dark:text-gray-400 truncate'>
              {email || '…'}
            </p>
          </div>

          <SimpleBar className='max-h-[250px]'>
            <div className='flex flex-col gap-1 p-1'>
              {profileData.profileDD.map((item, index) => (
                <DropdownMenuItem key={index} asChild className='cursor-pointer outline-none'>
                  <Link
                    href={item.url}
                    className='px-3 py-2.5 flex items-center gap-3 w-full rounded-xl transition-all duration-300 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-[#e53935]/15 hover:text-[#e53935] dark:hover:text-[#e53935] focus:bg-red-50 dark:focus:bg-[#e53935]/15 focus:text-[#e53935] dark:focus:text-[#e53935] group'
                  >
                    <div className='w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-[#e53935]/20 flex items-center justify-center transition-colors'>
                      <Icon
                        icon={item.icon}
                        className='text-[18px] transition-transform duration-300 group-hover:scale-110'
                      />
                    </div>
                    <h5 className='text-[13.5px] font-semibold m-0'>
                      {item.title}
                    </h5>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          </SimpleBar>

          <DropdownMenuSeparator className='bg-gray-100 dark:bg-white/10 my-2' />

          <div className='px-2 pb-1'>
            <Button
              type='button'
              onClick={handleLogout}
              className='w-full rounded-xl bg-transparent border border-red-100 dark:border-[#e53935]/30 text-red-600 dark:text-[#e53935] hover:bg-red-500 dark:hover:bg-[#e53935] hover:text-white transition-all duration-300 shadow-none h-[42px]'
            >
              <span className='flex items-center justify-center gap-2'>
                <Icon icon='solar:logout-2-bold-duotone' className='text-[18px]' />
                <span className='text-[13.5px] font-bold'>Logout</span>
              </span>
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Profile
