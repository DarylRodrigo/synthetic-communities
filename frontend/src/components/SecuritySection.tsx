export default function SecuritySection() {
    return (
        <div className="relative col-span-2">
            <div className="absolute inset-px rounded-lg bg-white" />
            <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                    <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 text-center">Security</p>
                    <p className="mt-2 max-w-lg text-sm/6 text-gray-600 text-center">
                        Morbi viverra dui mi arcu sed. Tellus semper adipiscing suspendisse semper morbi.
                    </p>
                </div>
                <div className="flex flex-1 items-center [container-type:inline-size] py-6">
                    <img
                        alt=""
                        src="https://tailwindcss.com/plus-assets/img/component-images/bento-03-security.png"
                        className="h-[min(152px,40cqw)] object-cover"
                    />
                </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-lg shadow outline outline-1 outline-black/5" />
        </div>
    );
}
