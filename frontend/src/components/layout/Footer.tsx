const Footer = () => {
  return (
    <footer className="border-t border-border py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          © 2026 Gravon.ai — AI for Growth-Driven Businesses. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </a>
          <a href="mailto:support@gravon.ai" className="hover:text-foreground transition-colors">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
