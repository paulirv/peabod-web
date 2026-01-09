export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t mt-auto"
      style={{
        backgroundColor: "var(--muted)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p
          className="text-center text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          &copy; {currentYear} Peabod. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
