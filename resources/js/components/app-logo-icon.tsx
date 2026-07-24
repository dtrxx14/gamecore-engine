import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/application-logo/gamecore-icon-logo.png"
            alt="GameCore Logo"
            {...props}
        />
    );
}
