import Link from 'next/link';

export default function Intro() {
    return (
        <div className="relative h-screen w-full overflow-hidden bg-black text-white">
            {/* Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover opacity-70"
            >
                <source src="/Hero_video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Content Overlay */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
                <h1 className="mb-6 text-6xl font-bold tracking-tight md:text-8xl fade-in">
                    NOVA WEAR
                </h1>
                <p className="mb-10 text-xl font-light tracking-wide md:text-2xl fade-in delay-1">
                    CONTEMPORARY STYLE FOR MODERN LIFE
                </p>

                <Link
                    href="/shop"
                    className="group relative overflow-hidden rounded-full bg-white px-8 py-4 text-black transition-all duration-300 hover:bg-gray-200 hover:scale-105 fade-in delay-2"
                >
                    <span className="relative z-10 font-bold uppercase tracking-wider">Shop Now</span>
                </Link>
            </div>

            <div className="absolute bottom-10 left-0 right-0 text-center text-white/50 text-sm fade-in delay-3">
                &copy; 2025 Nova Wear
            </div>
        </div>
    );
}
