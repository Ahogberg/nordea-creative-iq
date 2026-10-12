import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { TemplateLibrary } from "@/components/library/template-library";
import { MediaLibrary } from "@/components/library/media-library";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab === "media" ? "media" : "templates";
  return <div className="bg-nordea-bg min-h-screen">
    <Topbar breadcrumb={["Bibliotek"]} right={<Link href="/create/video?new=1" className="nordea-btn nordea-btn-primary">Skapa ny mall</Link>} />
    <nav aria-label="Bibliotekets innehåll" className="flex gap-2 px-4 sm:px-8 pt-6">
      {[{ id: "templates", label: "Mallar" }, { id: "media", label: "Mediatillgångar" }].map(item =>
        <Link key={item.id} href={`/library?tab=${item.id}`} aria-current={tab === item.id ? "page" : undefined} className={`nordea-btn ${tab === item.id ? "nordea-btn-primary" : "nordea-btn-secondary"}`}>{item.label}</Link>)}
    </nav>
    {tab === "templates" ? <TemplateLibrary embedded /> : <MediaLibrary embedded />}
  </div>;
}
