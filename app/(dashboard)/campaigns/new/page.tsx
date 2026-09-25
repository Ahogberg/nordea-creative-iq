import { redirect } from "next/navigation";

// Keep old bookmarks working while directing every new campaign into
// the brief → channel/format → creative flow.
export default function NewCampaignPage() {
  redirect("/create/brief");
}
