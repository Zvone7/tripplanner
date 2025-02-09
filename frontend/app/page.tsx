import { TestApiButton } from './components/TestApiButton'
import { Toaster } from "./components/ui/toaster"
import { getServerStartTime } from './lib/serverTime'

export default function Home() {
  const serverStartTime = getServerStartTime();
  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_ROOT_URL;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_ROOT_URL || "https://dev-wapp-tripplanner-be-e9eyezate0caefes.northeurope-01.azurewebsites.net";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Trip Planner</h1>
      <p className="text-xl mb-8">Page used for trip planning.</p>
      <p className="mb-4 text-sm text-gray-600">This site is using cookies. Site in development. Use at own responsibility.</p>
      <a
        href="/api/Account/Login"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Login with Google
      </a>
      <a href="/trips" className="text-blue-500 hover:underline mt-4">
        View my trips
      </a>
      <TestApiButton />
      <p className="mt-4 text-sm text-gray-500">
        {serverStartTime} UTC
      </p>
      <p className="mt-4 text-sm text-gray-500">
        FrontedUrL {frontendUrl}
      </p>
      <p className="mt-4 text-sm text-gray-500">
        BackendUrL {backendUrl}
      </p>
      <Toaster />
    </div>
  );
}