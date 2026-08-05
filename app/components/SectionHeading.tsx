import type { ReactNode } from "react";

type SectionHeadingProps = { eyebrow?: string; title: string; description?: string; action?: ReactNode; align?: "left" | "center" };

export function SectionHeading({ eyebrow, title, description, action, align = "left" }: SectionHeadingProps) {
  const className = [
    "section-heading",
    action ? "has-action" : "",
    align === "center" ? "is-centered" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={className}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <div className="section-heading-row">
        <div className="section-heading-copy">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="section-heading-action">{action}</div> : null}
      </div>
    </div>
  );
}
