import "./TakatakMigrationNotice.css";

/** Optional legacy migration notice, matching the approved Miel Aissa design. */
export function TakatakMigrationNotice() {
  return (
    <main className="takatak-moved">
      <section aria-labelledby="migration-notice-title" className="takatak-moved__card">
        <div className="takatak-moved__symbol" aria-hidden="true">T</div>
        <div className="takatak-moved__brand">GROUPE TAKATAK · OCARINA SPA</div>
        <h1 id="migration-notice-title">Bonjour, notre serveur a déménagé&nbsp;!</h1>
        <p>
          Nos services et nos abonnements se poursuivent sur <strong>TAKATAK.CA</strong>.
          Si votre site ou votre domaine se trouve encore sur l&apos;ancienne plateforme,
          cliquez ci-dessous pour demander son transfert.
        </p>
        <a className="takatak-moved__primary" href="https://takatak.ca/transfert">
          Demander mon transfert →
        </a>
        <a className="takatak-moved__secondary" href="https://takatak.ca/login">
          J&apos;ai déjà un compte TAKATAK
        </a>
        <p className="takatak-moved__note">
          Votre site, vos courriels et votre domaine ne sont pas transférés par ce simple clic.
          Notre équipe confirmera les étapes avec vous avant tout changement.
        </p>
        <div className="takatak-moved__support">
          <a href="/services">Consulter les services Ocarina Spa</a>
          <p>
            Vous avez besoin d&apos;une réparation urgente de spa ? Appelez Ocarina Spa au{' '}
            <a href="tel:+18199137727">819-913-7727</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
