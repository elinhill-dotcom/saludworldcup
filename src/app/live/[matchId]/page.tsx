"use client";

import { LiveChatRoom } from "@/components/LiveChatRoom";
import { useParams } from "next/navigation";

export default function LiveMatchPage() {
  const params = useParams();
  const id = Number(params.matchId);
  if (!Number.isInteger(id)) {
    return <p className="text-[var(--danger)]">Invalid match.</p>;
  }
  return <LiveChatRoom matchId={id} />;
}
