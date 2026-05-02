import { createFileRoute } from "@tanstack/react-router";
import { CityServicePage, cityServiceHead } from "@/components/CityServicePage";

export const Route = createFileRoute("/installation-spa/$ville")({
  head: ({ params }) => cityServiceHead("installation-spa", params.ville),
  component: () => {
    const { ville } = Route.useParams();
    return <CityServicePage serviceSlug="installation-spa" villeSlug={ville} />;
  },
});
