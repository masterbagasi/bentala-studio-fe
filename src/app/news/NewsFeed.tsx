"use client";

import { useState, useMemo } from "react";
import { NewsPost } from "@/lib/types";
import AccountTabs from "@/components/news/AccountTabs";
import IgGrid from "@/components/news/IgGrid";

interface Props {
  posts: NewsPost[];
}

export default function NewsFeed({ posts }: Props) {
  const [account, setAccount] = useState("bpi_ig");

  const filtered = useMemo(
    () => posts.filter((p) => p.account === account),
    [posts, account]
  );

  return (
    <>
      <AccountTabs activeAccount={account} onSwitch={setAccount} />
      <div className="px-5 md:px-[52px]">
        <IgGrid posts={filtered} account={account} />
      </div>
    </>
  );
}
