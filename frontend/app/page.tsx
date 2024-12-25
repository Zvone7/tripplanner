import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function Home() {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Trip Planner</h1>
      <p className="text-xl mb-8">Page used for trip planning</p>
      <a
        href="/api/Account/Login"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Login with Google
      </a>
      {/* view my trips at /trips */}
      <a href="/trips" className="text-blue-500 hover:underline mt-4">
        View my trips
      </a>
    </div>
  );
}