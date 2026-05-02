import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/reparation-spa/$ville")({
  head: ({ params }) => cityServiceHead("reparation-spa", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="reparation-spa" villeSlug={ville} />;
  },
});
