import { useState } from "react";
import {
  REACT_LIKE,
  REACT_DISLIKE,
  REACT_HEART,
  REACT_LAUGH,
  REACT_WOW,
  REACT_SAD,
  REACT_ANGRY,
} from "../utils/constants";
import useBreakpoint from "../utils/useBreakpoint";

const REACTIONS = [
  { icon: REACT_LIKE, label: "Like" },
  { icon: REACT_DISLIKE, label: "Dislike" },
  { icon: REACT_HEART, label: "Heart" },
  { icon: REACT_LAUGH, label: "Laugh" },
  { icon: REACT_WOW, label: "Wow" },
  { icon: REACT_SAD, label: "Sad" },
  { icon: REACT_ANGRY, label: "Angry" },
];

export default function ArticleReactions() {
  const { isMobile } = useBreakpoint();
  const [reactions, setReactions] = useState(REACTIONS.map(() => 0));
  const [points, setPoints] = useState(0);

  return (
    <>
      {/* Points */}
      <div
        className={`flex justify-center items-center gap-[18px] ${isMobile ? "my-5" : "my-7"}`}
      >
        <button
          onClick={() => setPoints(p => p - 1)}
          className="jk-btn bg-jk-btn-grad border-none rounded-xl py-2 px-[18px] cursor-pointer text-[#fafafa] font-display font-bold text-xl min-w-[44px]"
        >
          −
        </button>
        <div className="text-center min-w-[72px]">
          <p className="font-display font-bold text-2xl text-jk-primary leading-none">
            {points}
          </p>
          <p className="font-display font-semibold text-[13px] text-[#1e1e1e]">
            POINTS
          </p>
        </div>
        <button
          onClick={() => setPoints(p => p + 1)}
          className="jk-btn bg-jk-btn-grad border-none rounded-xl py-2 px-[18px] cursor-pointer text-[#fafafa] font-display font-bold text-xl min-w-[44px]"
        >
          +
        </button>
      </div>

      {/* Reactions */}
      <div
        className={`bg-[#f9f9f9] rounded-[10px] sm:rounded-[14px] ${isMobile ? "p-2.5 py-3.5" : "py-[18px] px-6"} mb-8`}
      >
        <div
          className={`grid grid-cols-7 ${isMobile ? "gap-[5px]" : "gap-2.5"}`}
        >
          {REACTIONS.map(({ icon, label }, i) => (
            <button
              key={label}
              onClick={() =>
                setReactions(r => r.map((v, j) => (j === i ? v + 1 : v)))
              }
              className={`jk-btn bg-[#d9d9d9] border-none rounded-[10px] ${isMobile ? "py-[7px] px-[3px]" : "py-[9px] px-1.5"} cursor-pointer flex flex-col items-center gap-[3px]`}
            >
              <img
                src={icon}
                alt={label}
                className={`object-contain ${isMobile ? "w-[22px] h-[22px]" : "w-[30px] h-[30px]"}`}
              />
              <span
                className={`font-sans font-medium text-[#222] ${isMobile ? "text-[10px]" : "text-[12px]"}`}
              >
                {reactions[i]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
