/** Optional legacy migration notice. Build-time opt-in keeps the current homepage unchanged by default. */
export function TakatakMigrationNotice() {
  return (
    <main className="min-h-screen bg-[#060D1F] px-4 py-12 text-[#F5F8FC] flex items-center justify-center">
      <section aria-labelledby="migration-notice-title" className="w-full max-w-2xl rounded-3xl border border-[#37537b] bg-[#0B1B3D] px-6 py-12 text-center shadow-2xl sm:px-12">
        <div aria-hidden="true" className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full border-2 border-[#1F8BFF] text-3xl font-black">T</div>
        <p className="text-xs font-extrabold uppercase tracking-[.2em] text-[#29C3FF]">GROUPE TAKATAK · Ocarina Spa</p>
        <h1 id="migration-notice-title" className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Bonjour, notre serveur a déménagé !
        </h1>
        <p className="mt-6 text-base leading-8 text-[#B8C4D3] sm:text-lg">
          Pour demander le transfert de votre site Web, de votre domaine ou des deux vers TAKATAK.CA,
          utilisez notre formulaire public. Aucun compte MochaHost ni paiement n'est nécessaire pour envoyer la demande.
        </p>
        <a
          href="https://takatak.ca/transfert"
          className="mx-auto mt-8 block w-full max-w-sm rounded-xl bg-[#1565D8] px-6 py-4 text-center font-bold text-white transition-colors hover:bg-[#1F8BFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#29C3FF]"
        >
          Demander mon transfert →
        </a>
        <a href="/services" className="mt-7 inline-block font-medium text-[#29C3FF] underline underline-offset-4">
          Consulter les services Ocarina Spa
        </a>
        <p className="mt-7 text-sm leading-6 text-[#B8C4D3]">
          Vous avez besoin d'une réparation urgente de spa ? Appelez Ocarina Spa au{' '}
          <a className="text-[#29C3FF] underline" href="tel:+18199137727">819-913-7727</a>.
        </p>
        <p className="mt-6 text-xs leading-5 text-[#B8C4D3]">
          Une demande n'entraîne aucun transfert automatique, aucune modification DNS et aucun prélèvement.
          Notre équipe vous contactera avant toute opération.
        </p>
      </section>
    </main>
  );
}
