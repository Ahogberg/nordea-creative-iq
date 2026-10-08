import { redirect } from "next/navigation";

// Den gamla kampanjguiden finns inte längre — nya kampanjer börjar i briefen
// (brief → strategi → kanaler och format → kampanj). Gamla bokmärken hamnar rätt.
export default function NewCampaignPage() {
  redirect("/create/brief");
}
