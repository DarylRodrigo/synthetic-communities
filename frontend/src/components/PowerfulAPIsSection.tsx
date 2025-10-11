export default function PowerfulAPIsSection() {
    return (
        <div className="relative">
            <div className="absolute inset-px rounded-lg bg-white" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
                    <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 text-center">
                        Powerful APIs
                    </p>
                    <p className="mt-2 max-w-lg text-sm/6 text-gray-600 text-center">
                        Sit quis amet rutrum tellus ullamcorper ultricies libero dolor eget sem sodales gravida.
                    </p>
                </div>
                <div className="relative min-h-[20rem] w-full grow">
                    <div className="absolute bottom-0 left-10 right-0 top-10 overflow-hidden rounded-tl-xl bg-gray-900 shadow-2xl outline outline-1 outline-white/10">
                        <div className="flex bg-gray-900 outline outline-1 outline-white/5">
                            <div className="-mb-px flex text-sm/6 font-medium text-gray-400">
                                <div className="border-b border-r border-b-white/20 border-r-white/10 bg-white/5 px-4 py-2 text-white">
                                    NotificationSetting.jsx
                                </div>
                                <div className="border-r border-gray-600/10 px-4 py-2">App.jsx</div>
                            </div>
                        </div>
                        <div className="px-6 pb-14 pt-6">{/* Your code example */}</div>
                    </div>
                </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow outline outline-1 outline-black/5" />
        </div>
    );
}
