import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#101022] text-slate-900 dark:text-white">
      <h2 className="text-4xl font-bold mb-4">Not Found</h2>
      <p className="mb-8 text-slate-600 dark:text-slate-400">Could not find requested resource</p>
      <Link href="/" className="px-6 py-3 bg-[#ea580c] text-white rounded-lg hover:bg-[#ea580c]/90 transition-colors">
        Return Home
      </Link>
    </div>
  )
}
