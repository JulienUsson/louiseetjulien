import { Badge } from "@/components/ui/badge";

export function RsvpBadge({ attending }: { attending: boolean | null }) {
  if (attending === true) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
        Présent
      </Badge>
    );
  }
  if (attending === false) {
    return <Badge variant="outline">Absent</Badge>;
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Sans réponse
    </Badge>
  );
}
