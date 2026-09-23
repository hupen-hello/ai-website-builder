import Image from 'next/image'
import { Button } from "@/components/ui/button";
import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@iconify/react'

export const metadata: Metadata = {
  title: 'Error 404 - Page Not Found',
  description: 'The page you are looking for could not be found.',
}

const Error = () => {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-[#0b0b0b] px-4 sm:px-6 py-10 transition-colors duration-300">
      <div className="text-center flex flex-col items-center w-full max-w-xl">
        
        <div className="relative mb-4 sm:mb-6 w-full max-w-[250px] sm:max-w-[320px] drop-shadow-xl animate-in zoom-in duration-500">
          <Image
            src={'/images/backgrounds/errorimg.svg'}
            alt='404 error graphic'
            className='w-full h-auto mx-auto animate-bounce'
            style={{ animationDuration: '4s' }}
            width={400}
            height={300}
            priority
          />
        </div>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Oops!!!
          </h1>
          <h6 className="text-base sm:text-lg text-gray-500 dark:text-gray-400 font-medium px-4">
            This page you are looking for could not be found or has been moved.
          </h6>
        </div>

        <Button
          asChild
          className="h-auto flex items-center gap-2 bg-[#e53935] hover:bg-[#c22028] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-[14px] sm:text-[15px] font-bold transition-all shadow-lg shadow-red-500/20"
        >
          <Link href="/">
            <Icon icon="solar:home-2-bold" width={20} />
            Go Back to Home
          </Link>
        </Button>

      </div>
    </div>
  )
}

export default Error;