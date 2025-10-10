import dynamic from 'next/dynamic';

const ThreeScene = dynamic(() => import('@/components/ThreeScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-white text-xl">Loading 3D Scene...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <ThreeScene className="w-full h-full" />
    </div>
  );
}
