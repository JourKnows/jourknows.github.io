import { slugifyStr } from "@utils/slugify";
import Datetime from "./Datetime";
import type { CollectionEntry } from "astro:content";

export interface Props {
  href?: string;
  frontmatter: CollectionEntry<"blog">["data"];
  secHeading?: boolean;
}

export default function Card({ href, frontmatter, secHeading = true }: Props) {
  const { title, pubDatetime, modDatetime, description } = frontmatter;

  const headerProps = {
    style: { viewTransitionName: slugifyStr(title) },
    className:
      "font-display font-bold text-[20px] text-[#1e1e1e] group-hover:text-[#0007d3] transition-colors leading-[1.3] mb-2 line-clamp-2",
  };

  return (
    <li className="mb-4 list-none">
      <a
        href={href}
        className="block bg-white p-5 sm:p-6 rounded-[16px] border border-black/5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_32px_rgba(0,0,60,0.06)] hover:-translate-y-1 transition-all duration-300 group outline-none no-underline"
      >
        {secHeading ? (
          <h2 {...headerProps}>{title}</h2>
        ) : (
          <h3 {...headerProps}>{title}</h3>
        )}
        {frontmatter.author && (
          <p className="font-display font-medium text-[13px] italic text-[#1e1e1e]/80 mb-1">
            By {frontmatter.author}
          </p>
        )}
        <div className="mb-2">
          <Datetime pubDatetime={pubDatetime} modDatetime={modDatetime} />
        </div>
        <p className="font-display text-[14px] leading-[1.6] text-[#555] line-clamp-2">
          {description}
        </p>
      </a>
    </li>
  );
}
