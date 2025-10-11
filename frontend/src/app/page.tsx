import ThreeJSSection from '@/components/ThreeJSSection';
import ControlsSection from '@/components/ControlsSection';
import DetailsSection from '@/components/DetailsSection';
import FeedSection from '@/components/FeedSection';

export default function Home() {
  return (
    <div className="bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        {/* <h2 className="text-center text-base/7 font-semibold text-indigo-600">Deploy faster</h2>
        <p className="mx-auto mt-2 max-w-lg text-balance text-center text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
          Everything you need to deploy your app
        </p> */}
        <div className="mt-4 grid gap-4 sm:gap-6 sm:mt-6 grid-cols-3 grid-rows-2 h-[1000px] sm:h-[1000px]">
          {/* Three.js Canvas - Top Left (spans 2 columns) */}
          <ThreeJSSection />

          {/* Controls - Top Right (spans 1 column) */}
          <ControlsSection />

          {/* Details - Bottom Left (spans 2 columns) */}
          <DetailsSection />

          {/* Feed - Bottom Right (spans 1 column) */}
          <FeedSection />
        </div>
      </div>
    </div>
  );
}