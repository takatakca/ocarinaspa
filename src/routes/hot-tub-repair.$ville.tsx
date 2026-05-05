import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/hot-tub-repair/$ville")({
  head: ({ params }) => cityServiceHead("hot-tub-repair", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="hot-tub-repair" villeSlug={ville} />;
  },
});
