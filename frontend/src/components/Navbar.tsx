'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="flex space-x-8">
                            <Link
                                href="/"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${pathname === '/'
                                    ? 'border-indigo-500 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                Main
                            </Link>
                            <Link
                                href="/debug"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${pathname === '/debug'
                                    ? 'border-indigo-500 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                Debug
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
