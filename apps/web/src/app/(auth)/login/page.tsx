import AuthForm from '../../../components/auth/AuthForm';

export default function LoginPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#FDFBF7]">
            <div className="w-full max-w-md">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C85A32] mb-4 shadow-elevated">
                        <span className="text-white font-bold text-2xl font-display">K</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1E1B18] font-display">
                        Welcome to Karigar Kart
                    </h1>
                    <p className="text-sm text-[#6B635B] mt-2 max-w-sm mx-auto">
                        Discover verified artisan goods, commission bespoke handcrafted items, and support Indian makers.
                    </p>
                </div>

                {/* Auth Card */}
                <div className="p-8 bg-white rounded-xl border border-[#E8E2D9] shadow-card">
                    <AuthForm />
                </div>

                {/* Trust Footer */}
                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-[#6B635B]">
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                        AI-Verified Makers
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32]" />
                        Escrow Protection
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2C4A3E]" />
                        TDS Compliant
                    </span>
                </div>
            </div>
        </main>
    );
}