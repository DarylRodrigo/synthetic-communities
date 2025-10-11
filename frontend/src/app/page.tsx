import ThreeJSSection from '@/components/ThreeJSSection';
import PerformanceSection from '@/components/PerformanceSection';
import SecuritySection from '@/components/SecuritySection';
import PowerfulAPIsSection from '@/components/PowerfulAPIsSection';

export default function Home() {
  return (
    <div className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        {/* <h2 className="text-center text-base/7 font-semibold text-indigo-600">Deploy faster</h2>
        <p className="mx-auto mt-2 max-w-lg text-balance text-center text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
          Everything you need to deploy your app
        </p> */}
        <div className="mt-10 grid gap-6 sm:mt-16 grid-cols-3 grid-rows-2">
          {/* Three.js Canvas - Top Left (spans 2 columns) */}
          <ThreeJSSection />

          {/* Performance - Top Right (spans 1 column) */}
          <PerformanceSection />

          {/* Security - Bottom Left (spans 2 columns) */}
          <SecuritySection />

          {/* Powerful APIs - Bottom Right (spans 1 column) */}
          <PowerfulAPIsSection />
        </div>
      </div>
    </div>
  );
}