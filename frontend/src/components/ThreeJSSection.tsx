import dynamic from 'next/dynamic';

const ThreeScene = dynamic(() => import('@/components/ThreeScene'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-lg">
            <div className="text-white text-xl">Loading 3D Scene...</div>
        </div>
    ),
});

export default function ThreeJSSection() {
    return (
        <div className="relative col-span-2">
            <div className="absolute inset-px rounded-lg bg-white shadow outline outline-1 outline-black/5" />
            <div className="relative h-full w-full overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <ThreeScene className="w-full h-full" />
            </div>
        </div>
    );
}
