export default function PerformanceSection() {
    return (
        <div className="relative">
            <div className="absolute inset-px rounded-lg bg-white" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                    <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 text-center">Performance</p>
                    <p className="mt-2 max-w-lg text-sm/6 text-gray-600 text-center">
                        Lorem ipsum, dolor sit amet consectetur adipisicing elit maiores impedit.
                    </p>
                </div>
                <div className="flex flex-1 items-center justify-center px-8 pb-12 pt-10 sm:px-10">
                    <img
                        alt=""
                        src="https://tailwindcss.com/plus-assets/img/component-images/bento-03-performance.png"
                        className="w-full max-w-xs"
                    />
                </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow outline outline-1 outline-black/5" />
        </div>
    );
}
