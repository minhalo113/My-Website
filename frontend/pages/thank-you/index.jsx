import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import process from 'process'

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-3xl font-semibold text-gray-800 mb-2">Thank you!</h1>
      <p className="text-gray-600 text-center max-w-md mb-6">
        We have received your message and will get back to you as soon as possible.
      </p>

      <p className="text-gray-600 text-center max-w-md mb-6">
        {process.env.NEXT_PUBLIC_USERNAME}
      </p>
      <div className="flex gap-4">
        <Link
            href="/"
            className="w-48 px-6 py-3 bg-[#D09A40] text-white text-lg font-semibold rounded-xl shadow hover:bg-[#b98532] transition text-center"
        >
            Back to Home
        </Link>
        <Link
            href="/contact"
            className="w-48 px-6 py-3 border border-[#D09A40] text-[#D09A40] text-lg font-semibold rounded-xl hover:bg-[#fdf5e7] transition text-center"
        >
            Contact Again
        </Link>
    </div>
    </div>
  );
}