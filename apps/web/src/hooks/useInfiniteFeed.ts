import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface UseInfiniteFeedOptions<T> {
  items: T[];
  pageSize?: number;
  resetDeps?: React.DependencyList;
  isError?: boolean;
}

export interface UseInfiniteFeedResult<T> {
  visibleItems: T[];
  hasMore: boolean;
  isLoadingMore: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
  loadMore: () => void;
  totalCount: number;
  visibleCount: number;
}

/**
 * Mobile-app-style infinite scrolling hook.
 * Progressively renders items in batches as the user scrolls near the bottom.
 * Guarantees zero duplicate items and preserves scroll position.
 */
export function useInfiniteFeed<T extends { id?: string | number }>({
  items,
  pageSize = 15,
  resetDeps = [],
  isError = false,
}: UseInfiniteFeedOptions<T>): UseInfiniteFeedResult<T> {
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelNodeRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reset batch count to initial pageSize whenever search, tab filter, or dependencies change
  useEffect(() => {
    setVisibleCount(pageSize);
    setIsLoadingMore(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, ...resetDeps]);

  const totalCount = items.length;
  const hasMore = !isError && visibleCount < totalCount;

  // Deduplicate items by ID while slicing to visibleCount
  const visibleItems = useMemo(() => {
    const sliced = items.slice(0, visibleCount);
    const seen = new Set<string | number>();
    const deduplicated: T[] = [];

    for (const item of sliced) {
      if (item && item.id !== undefined) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduplicated.push(item);
        }
      } else {
        deduplicated.push(item);
      }
    }

    return deduplicated;
  }, [items, visibleCount]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isError) return;
    setIsLoadingMore(true);

    // Brief subtle delay simulating native fluid fetch and smooth frame delivery
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + pageSize, totalCount));
      setIsLoadingMore(false);
    }, 120);
  }, [hasMore, isLoadingMore, isError, pageSize, totalCount]);

  // Callback ref for sentinel to attach IntersectionObserver reliably
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      sentinelNodeRef.current = node;

      if (!node || !hasMore || isError) return;

      // Observe when sentinel enters within 250px of bottom
      if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            const first = entries[0];
            if (first && first.isIntersecting) {
              loadMore();
            }
          },
          { rootMargin: '250px 0px 250px 0px', threshold: 0.01 }
        );

        observer.observe(node);
        observerRef.current = observer;
      }
    },
    [hasMore, isError, loadMore]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return {
    visibleItems,
    hasMore,
    isLoadingMore,
    sentinelRef,
    loadMore,
    totalCount,
    visibleCount,
  };
}
