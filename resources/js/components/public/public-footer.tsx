export default function PublicFooter() {
    return (
        <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} GameCore Engine. All rights reserved.
        </footer>
    );
}
