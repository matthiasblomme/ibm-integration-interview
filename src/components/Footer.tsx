export function Footer() {
  return (
    <footer className="footer">
      <img
        src={`${import.meta.env.BASE_URL}logo.jpg`}
        alt="Embee IT"
        className="footer-logo"
      />
      <span>
        Built by{' '}
        <a
          href="https://be.linkedin.com/in/matthiasblomme"
          target="_blank"
          rel="noopener noreferrer"
        >
          Matthias Blomme
        </a>
      </span>
    </footer>
  );
}
