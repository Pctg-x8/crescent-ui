"use client";

import { HomeTimelineRequestParams } from "@/models/api/mastodon/timeline";
import { TimelineMode } from "@/models/localPreferences";
import { Status } from "@/models/status";
import { DeleteEvent, Event, UpdateEvent, streamEvents } from "@/models/streaming";
import { rpcClient } from "@/rpc/client";
import Immutable from "immutable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWRInfinite from "swr/infinite";
import Timeline from "./Timeline";

export default function HomeStreamingTimeline({ mode }: { readonly mode: TimelineMode }) {
  const { data, isLoading, setSize, mutate } = useSWRInfinite(
    (_, prevPageData: Status[] | null): HomeTimelineRequestParams | null => {
      if (!prevPageData) return { limit: 50 };
      if (prevPageData.length === 0) return null;
      return { limit: 50, max_id: prevPageData[prevPageData.length - 1].timelineId };
    },
    req => rpcClient.homeTimeline.query(req).then(xs => xs.map(Status.fromApiData)),
    { revalidateFirstPage: false, revalidateAll: false }
  );
  const statuses = useMemo(() => data?.flat() ?? [], [data]);
  const [deletedIds, setDeletedIds] = useState(() => Immutable.Set<string>());

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;

    const io = new IntersectionObserver(
      e => {
        if (e.length < 1 || !e[0].isIntersecting) return;

        setSize(x => x + 1);
      },
      { threshold: 1.0 }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [isLoading, setSize]);

  const handleEvents = useCallback(
    (e: Event) => {
      if (e instanceof UpdateEvent) {
        mutate(xs => (!xs ? [[e.status]] : [[e.status], ...xs]));
      } else if (e instanceof DeleteEvent) {
        setDeletedIds(xs => xs.add(e.targetId));
      }
    },
    [mutate, setDeletedIds]
  );
  useEffect(() => {
    const sub = streamEvents(handleEvents);

    return () => {
      sub.unsubscribe();
    };
  }, [handleEvents]);

  if (isLoading) return <p>Loading...</p>;
  return (
    <>
      <Timeline statuses={statuses} deletedIds={deletedIds} mode={mode} />
      <div ref={sentinelRef} />
    </>
  );
}
