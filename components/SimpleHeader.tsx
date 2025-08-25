// components/SimpleHeader.tsx
import Link from 'next/link'
import Image from 'next/image'

export default function SimpleHeader() {
  return (
    <header className="header-zone text-center">
      {/* Logo */}
      <div className="mb-4">
        <Link href="/">
          <Image
            src="/images/logo-40.svg"
            alt="AIByte Logo"
            width={48}
            height={48}
            className="mx-auto cursor-pointer hover:opacity-80 transition-opacity"
            priority
          />
        </Link>
      </div>
      
      {/* Product name */}
      <Link href="/">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          AIByte
        </h1>
      </Link>
      
      {/* Tagline */}
      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
        Bite-sized AI insights, daily
      </p>
    </header>
  )
}
