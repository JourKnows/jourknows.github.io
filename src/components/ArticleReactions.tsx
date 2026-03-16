import { useState, useEffect, useCallback } from "react";
import {
  REACT_LIKE,
  REACT_DISLIKE,
  REACT_HEART,
  REACT_LAUGH,
  REACT_WOW,
  REACT_SAD,
  REACT_ANGRY,
} from "../utils/constants";

const LYKET_API_KEY = import.meta.env.PUBLIC_LYKET_API_KEY;
const LYKET_BASE_URL = "https://api.lyket.dev/v1";

const REACTION_TYPES = [
  { type: "like", icon: REACT_LIKE, label: "Like" },
  { type: "dislike", icon: REACT_DISLIKE, label: "Dislike" },
  { type: "heart", icon: REACT_HEART, label: "Heart" },
  { type: "laugh", icon: REACT_LAUGH, label: "Laugh" },
  { type: "wow", icon: REACT_WOW, label: "Wow" },
  { type: "sad", icon: REACT_SAD, label: "Sad" },
  { type: "angry", icon: REACT_ANGRY, label: "Angry" },
];

interface ReactionState {
  count: number;
  liked: boolean;
}

export default function ArticleReactions({ slug }: { slug: string }) {
  const [reactions, setReactions] = useState<Record<string, ReactionState>>({});

  // Fetch current counts for all reactions
  const fetchReaction = useCallback(
    async (type: string) => {
      try {
        const res = await fetch(
          `${LYKET_BASE_URL}/like-buttons/jourknows-reactions/${slug}-${type}`,
          {
            headers: { Authorization: `Bearer ${LYKET_API_KEY}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setReactions(prev => ({
            ...prev,
            [type]: {
              count: data.data?.attributes?.total_likes ?? 0,
              liked: data.data?.attributes?.user_has_liked ?? false,
            },
          }));
        }
      } catch {
        // Silently fail — reactions are non-critical
      }
    },
    [slug]
  );

  useEffect(() => {
    REACTION_TYPES.forEach(r => fetchReaction(r.type));
  }, [fetchReaction]);

  // Toggle a reaction
  const toggleReaction = async (type: string) => {
    const current = reactions[type];
    const isLiked = current?.liked ?? false;
    const endpoint = isLiked ? "unlike" : "like";

    // Optimistic update
    setReactions(prev => ({
      ...prev,
      [type]: {
        count: (prev[type]?.count ?? 0) + (isLiked ? -1 : 1),
        liked: !isLiked,
      },
    }));

    try {
      const res = await fetch(
        `${LYKET_BASE_URL}/like-buttons/jourknows-reactions/${slug}-${type}/${endpoint}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${LYKET_API_KEY}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setReactions(prev => ({
          ...prev,
          [type]: {
            count: data.data?.attributes?.total_likes ?? prev[type]?.count ?? 0,
            liked:
              data.data?.attributes?.user_has_liked ??
              prev[type]?.liked ??
              false,
          },
        }));
      }
    } catch {
      // Revert on error
      setReactions(prev => ({
        ...prev,
        [type]: {
          count: (prev[type]?.count ?? 0) + (isLiked ? 1 : -1),
          liked: isLiked,
        },
      }));
    }
  };

  return (
    <div className="border-t-2 border-[#0007d3] pt-6 mb-8">
      <h2 className="font-display font-extrabold text-[17px] sm:text-[22px] text-[#000055] mb-4">
        React to this article
      </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        {REACTION_TYPES.map(r => {
          const state = reactions[r.type];
          return (
            <button
              type="button"
              key={r.type}
              onClick={() => toggleReaction(r.type)}
              className={`jk-btn flex items-center gap-1.5 border rounded-full px-3 py-1.5 cursor-pointer transition-colors ${
                state?.liked
                  ? "bg-[#e8e8f8] border-[#0007d3]"
                  : "bg-[#f4f4f4] border-[#ddd] hover:bg-[#e8e8f8]"
              }`}
              title={r.label}
            >
              <img src={r.icon} alt={r.label} className="w-5 h-5" />
              <span className="font-display font-bold text-[12px] text-[#333] min-w-[14px] text-center">
                {state?.count ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
