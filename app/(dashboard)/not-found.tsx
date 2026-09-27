import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/states";

export default function DashboardNotFound() {
  return (
    <div className="nordea-card mt-8 max-w-xl mx-auto">
      <EmptyState
        icon={SearchX}
        title="Sidan finns inte"
        description="Länken kan vara gammal, eller så har innehållet tagits bort."
        action={
          <Link href="/dashboard" className="nordea-btn nordea-btn-primary">
            Till översikten
          </Link>
        }
      />
    </div>
  );
}
