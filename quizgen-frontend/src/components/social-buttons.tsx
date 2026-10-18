"use client";

// Social login button SVG icons and component
// These are UI-only for now — actual OAuth can be wired up later

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const TwitterIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const MicrosoftIcon = () => (
    <svg viewBox="0 0 23 23" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M1 1h10v10H1z" />
        <path d="M12 1h10v10H12z" />
        <path d="M1 12h10v10H1z" />
        <path d="M12 12h10v10H12z" />
    </svg>
);

interface SocialButtonsProps {
    mode: "login" | "register";
}

export function SocialButtons({ mode }: SocialButtonsProps) {
    const label = mode === "login" ? "Sign in" : "Sign up";

    const providers = [
        { name: "Google", icon: <GoogleIcon /> },
        { name: "Facebook", icon: <FacebookIcon /> },
        { name: "Twitter", icon: <TwitterIcon /> },
        { name: "Microsoft", icon: <MicrosoftIcon /> },
    ];

    return (
        <div className="space-y-3">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground">or continue with</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                {providers.map((provider) => (
                    <button
                        key={provider.name}
                        type="button"
                        onClick={() => alert(`${provider.name} ${label} coming soon!`)}
                        className="flex items-center justify-center gap-2.5 h-11 rounded-xl border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors duration-200"
                    >
                        {provider.icon}
                        <span className="text-muted-foreground">{provider.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
