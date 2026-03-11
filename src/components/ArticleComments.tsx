import { useState } from "react";
import useBreakpoint from "../utils/useBreakpoint";

const COMMENTS = [
  {
    user: "anonymous",
    time: "11/11/25  5:00 PM",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    user: "anonymous",
    time: "11/11/25  5:00 PM",
    body: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  },
  {
    user: "anonymous",
    time: "11/11/25  5:30 PM",
    body: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  {
    user: "anonymous",
    time: "11/11/25  6:00 PM",
    body: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
];

export default function ArticleComments() {
  const { isMobile, isTablet } = useBreakpoint();
  const compact = isMobile || isTablet;
  const [form, setForm] = useState({ name: "", email: "", body: "" });

  return (
    <div className="border-t-2 border-[#0007d3] pt-6 mb-8">
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
        {/* List */}
        <div>
          <h3
            className={`font-display font-extrabold ${isMobile ? "text-[15px]" : "text-[18px]"} text-[#1e1e1e] mb-3.5`}
          >
            Comments
          </h3>
          {COMMENTS.map((c, i) => (
            <div
              key={i}
              className="flex gap-2.5 mb-3.5 pb-3.5 border-b border-[#eee]"
            >
              <div className="w-10 h-10 bg-[#c8c8c8]/50 rounded-[7px] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-1 mb-1">
                  <span className="font-display font-semibold text-[12px] text-[#1e1e1e]/70">
                    {c.user}
                  </span>
                  <span className="font-display text-[9px] text-[#1e1e1e]/45 whitespace-nowrap shrink-0">
                    {c.time}
                  </span>
                </div>
                <p className="font-display text-[11px] text-[#1e1e1e]/85 leading-[1.6] m-0">
                  {c.body}
                </p>
              </div>
            </div>
          ))}
          <div className="mt-1.5">
            <button className="jk-btn bg-[#00046D] border-none rounded-[20px] py-[9px] px-[26px] cursor-pointer font-display font-extrabold text-white text-[13px]">
              READ MORE
            </button>
          </div>
        </div>

        {/* Form */}
        <div
          className={`bg-[#fafafa] border border-[#00046d]/60 rounded-xl sm:rounded-2xl ${isMobile ? "p-3.5" : "p-[22px]"}`}
        >
          {[
            { k: "body", lb: "COMMENT", ml: true },
            { k: "name", lb: "NAME", ml: false },
            { k: "email", lb: "EMAIL", ml: false },
          ].map(({ k, lb, ml }) => (
            <div key={k} className="mb-3">
              <label className="font-display font-semibold text-[12px] text-[#1e1e1e]/85 block mb-1">
                {lb} <span className="text-[#ff4646]">*</span>
              </label>
              {ml ? (
                <textarea
                  rows={4}
                  value={form[k as keyof typeof form]}
                  onChange={e => setForm({ ...form, [k]: e.target.value })}
                  className="w-full bg-[#d9d9d9]/25 border-none rounded-lg py-2 px-3 font-display text-[13px] resize-y outline-none block"
                />
              ) : (
                <input
                  type={k === "email" ? "email" : "text"}
                  value={form[k as keyof typeof form]}
                  onChange={e => setForm({ ...form, [k]: e.target.value })}
                  className="w-full bg-[#d9d9d9]/25 border-none rounded-lg py-2 px-3 font-display text-[13px] outline-none block"
                />
              )}
            </div>
          ))}
          <button className="jk-btn bg-[#00046D] rounded-[30px] border-none py-2.5 w-full cursor-pointer font-display font-bold text-white text-[14px] mt-1">
            Leave a reply
          </button>
        </div>
      </div>
    </div>
  );
}
