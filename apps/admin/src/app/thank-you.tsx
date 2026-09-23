import Image from 'next/image'
import { Button } from "@/components/ui/button";
import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@iconify/react'

export const metadata: Metadata = {
  title: 'Thank You',
  description: 'Your action has been successfully completed.',
}

const ThankYou = () => {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-[#0b0b0b] px-4 sm:px-6 py-10 transition-colors duration-300">
      <div className="text-center flex flex-col items-center w-full max-w-xl">
        
        <div className="relative mb-6 w-full flex justify-center drop-shadow-xl animate-in zoom-in duration-500">
          <div className="w-20 h-20 sm:w-24 h-24 bg-red-50 dark:bg-[#e53935]/10 rounded-full flex items-center justify-center relative animate-pulse" style={{ animationDuration: '3s' }}>
            <Icon 
              icon="solar:check-circle-bold-duotone" 
              className="text-[#e53935] text-5xl sm:text-6xl"
            />
            <Icon icon="solar:stars-bold" className="absolute -top-1 -right-1 text-amber-400 text-lg" />
          </div>
        </div>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Thank You!
          </h1>
          <h4 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200 px-2">
            Aapka action successfully complete ho gaya hai.
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto px-4 leading-relaxed">
            Humein aapki details mil gayi hain. Aage ka process start ho chuka hai, hum aapko jald hi notify karenge.
          </p>
        </div>

        <div className="mb-8 bg-white dark:bg-[#171717] border border-gray-200 dark:border-white/5 rounded-2xl p-4 w-full max-w-[320px] shadow-sm flex items-center gap-3 text-left transition-colors">
          <div className="w-9 h-9 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0">
            <Icon icon="solar:shield-check-bold" width={20} className="text-[#e53935]" />
          </div>
          <div>
            <h5 className="text-[13px] font-bold text-gray-800 dark:text-white">Safe & Secure</h5>
            <p className="text-[11px] text-gray-400 mt-0.5">Aapka data humare paas safe hai.</p>
          </div>
        </div>

        <Button
          asChild
          className="h-auto flex items-center gap-2 bg-[#e53935] hover:bg-[#c22028] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-[14px] sm:text-[15px] font-bold transition-all shadow-lg shadow-red-500/20"
        >
          <Link href="/dashboard">
            <Icon icon="solar:widget-2-bold" width={18} />
            Go to Dashboard
          </Link>
        </Button>

      </div>
    </div>
  )
}

export default ThankYou;