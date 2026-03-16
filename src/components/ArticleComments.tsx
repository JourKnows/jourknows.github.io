import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import useBreakpoint from "../utils/useBreakpoint";

const REACTION_TYPES = [
  { type: "like", icon: "/assets/react-like.svg", label: "Like" },
  { type: "dislike", icon: "/assets/react-dislike.svg", label: "Dislike" },
  { type: "heart", icon: "/assets/react-heart.svg", label: "Heart" },
  { type: "laugh", icon: "/assets/react-laugh.svg", label: "Laugh" },
  { type: "wow", icon: "/assets/react-wow.svg", label: "Wow" },
  { type: "sad", icon: "/assets/react-sad.svg", label: "Sad" },
  { type: "angry", icon: "/assets/react-angry.svg", label: "Angry" },
];

interface Comment {
  id: number;
  name: string;
  body: string;
  created_at: string;
}

export default function ArticleComments({ slug }: { slug: string }) {
  const { isMobile, isTablet } = useBreakpoint();
  const compact = isMobile || isTablet;

  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Fetch reactions
  const fetchReactions = useCallback(async () => {
    const { data } = await supabase
      .from("reactions")
      .select("type")
      .eq("slug", slug);
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((r: { type: string }) => {
        counts[r.type] = (counts[r.type] || 0) + 1;
      });
      setReactions(counts);
    }
  }, [slug]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("slug", slug)
      .order("created_at", { ascending: false });
    if (data) setComments(data);
    setLoadingComments(false);
  }, [slug]);

  useEffect(() => {
    fetchReactions();
    fetchComments();
  }, [fetchReactions, fetchComments]);

  // Add a reaction
  const addReaction = async (type: string) => {
    await supabase.from("reactions").insert({ slug, type });
    setReactions(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
  };

  // Submit a comment
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      slug,
      name: form.name.trim(),
      email: form.email.trim() || null,
      body: form.body.trim(),
    });
    if (!error) {
      setSubmitted(true);
      setForm({ name: "", email: "", body: "" });
      fetchComments();
      setTimeout(() => setSubmitted(false), 3000);
    }
    setSubmitting(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const visibleComments = showAll ? comments : comments.slice(0, 4);

  return (
    <div className="border-t-2 border-[#0007d3] pt-6 mb-8">
      {/* Reactions */}
      <h2
        className={`font-display font-extrabold ${isMobile ? "text-[17px]" : "text-[22px]"} text-[#000055] mb-4`}
      >
        React to this article
      </h2>
      <div className="flex flex-wrap gap-2 mb-8">
        {REACTION_TYPES.map(r => (
          <button
            key={r.type}
            onClick={() => addReaction(r.type)}
            className="jk-btn flex items-center gap-1.5 bg-[#f4f4f4] border border-[#ddd] rounded-full px-3 py-1.5 cursor-pointer hover:bg-[#e8e8f8] transition-colors"
            title={r.label}
          >
            <img src={r.icon} alt={r.label} className="w-5 h-5" />
            <span className="font-display font-bold text-[12px] text-[#333] min-w-[14px] text-center">
              {reactions[r.type] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Comments */}
      <h2
        className={`font-display font-extrabold ${isMobile ? "text-[17px]" : "text-[22px]"} text-[#000055] mb-[5px]`}
      >
        Let us know your thoughts!
      </h2>
      <p className="font-display italic text-[12px] text-[#1e1e1e] mb-[22px]">
        Leave a comment below. Required fields are marked{" "}
        <span className="text-[#ff4646]">*</span>.
      </p>

      <div
        className={`grid ${compact ? "grid-cols-1 gap-[22px]" : "grid-cols-2 gap-[36px]"}`}
      >
        {/* Comments list */}
        <div>
          <h3
            className={`font-display font-extrabold ${isMobile ? "text-[15px]" : "text-[18px]"} text-[#1e1e1e] mb-3.5`}
          >
            Comments {!loadingComments && `(${comments.length})`}
          </h3>
          {loadingComments ? (
            <p className="font-display text-[12px] text-[#888]">
              Loading comments…
            </p>
          ) : comments.length === 0 ? (
            <p className="font-display text-[12px] text-[#888]">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            <>
              {visibleComments.map(c => (
                <div
                  key={c.id}
                  className="flex gap-2.5 mb-3.5 pb-3.5 border-b border-[#eee]"
                >
                  <div className="w-10 h-10 bg-[#0007d3]/15 rounded-[7px] shrink-0 flex items-center justify-center">
                    <span className="font-display font-bold text-[14px] text-[#0007d3]">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className="font-display font-semibold text-[12px] text-[#1e1e1e]/70">
                        {c.name}
                      </span>
                      <span className="font-display text-[9px] text-[#1e1e1e]/45 whitespace-nowrap shrink-0">
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p className="font-display text-[11px] text-[#1e1e1e]/85 leading-[1.6] m-0">
                      {c.body}
                    </p>
                  </div>
                </div>
              ))}
              {comments.length > 4 && !showAll && (
                <div className="mt-1.5">
                  <button
                    onClick={() => setShowAll(true)}
                    className="jk-btn bg-[#00046D] border-none rounded-[20px] py-[9px] px-[26px] cursor-pointer font-display font-extrabold text-white text-[13px]"
                  >
                    VIEW ALL ({comments.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Comment form */}
        <div
          className={`bg-[#fafafa] border border-[#00046d]/60 rounded-xl sm:rounded-2xl ${isMobile ? "p-3.5" : "p-[22px]"}`}
        >
          <form onSubmit={submitComment}>
            {[
              { k: "body", lb: "COMMENT", ml: true },
              { k: "name", lb: "NAME", ml: false },
              { k: "email", lb: "EMAIL (optional)", ml: false, req: false },
            ].map(({ k, lb, ml, req }) => (
              <div key={k} className="mb-3">
                <label className="font-display font-semibold text-[12px] text-[#1e1e1e]/85 block mb-1">
                  {lb}{" "}
                  {req !== false && <span className="text-[#ff4646]">*</span>}
                </label>
                {ml ? (
                  <textarea
                    rows={4}
                    value={form[k as keyof typeof form]}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                    required
                    className="w-full bg-[#d9d9d9]/25 border-none rounded-lg py-2 px-3 font-display text-[13px] resize-y outline-none block"
                  />
                ) : (
                  <input
                    type={k === "email" ? "email" : "text"}
                    value={form[k as keyof typeof form]}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                    required={req !== false}
                    className="w-full bg-[#d9d9d9]/25 border-none rounded-lg py-2 px-3 font-display text-[13px] outline-none block"
                  />
                )}
              </div>
            ))}
            <button
              type="submit"
              disabled={submitting}
              className="jk-btn bg-[#00046D] rounded-[30px] border-none py-2.5 w-full cursor-pointer font-display font-bold text-white text-[14px] mt-1 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Leave a reply"}
            </button>
            {submitted && (
              <p className="font-display text-[12px] text-green-600 mt-2 text-center">
                ✓ Comment submitted successfully!
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
