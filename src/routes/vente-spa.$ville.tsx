import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/vente-spa/$ville")({
  head: ({ params }) => cityServiceHead("vente-spa", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="vente-spa" villeSlug={ville} />;
  },
});
