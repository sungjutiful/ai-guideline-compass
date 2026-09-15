import type { AiPolicyLevel } from "../types";

const POLICY_META: Record<
  AiPolicyLevel,
  { label: string; className: string; description: string }
> = {
  prohibited: {
    label: "AI 활용 금지",
    className: "banner-red",
    description: "이 과제에서는 AI 도구 활용이 전면 금지됩니다.",
  },
  limited: {
    label: "AI 활용 제한적 허용",
    className: "banner-yellow",
    description: "정해진 범위 내에서만 AI 도구 활용이 허용됩니다.",
  },
  full: {
    label: "AI 활용 전면 허용",
    className: "banner-green",
    description: "이 과제에서는 AI 도구를 자유롭게 활용할 수 있습니다.",
  },
};

export function policyMeta(level: AiPolicyLevel) {
  return POLICY_META[level];
}

export function PolicyBanner({
  level,
  title,
  subtitle,
}: {
  level: AiPolicyLevel;
  title: string;
  subtitle?: string;
}) {
  const meta = POLICY_META[level];
  return (
    <div className={`policy-banner ${meta.className}`}>
      <div className="policy-banner-label">{meta.label}</div>
      <div className="policy-banner-title">{title}</div>
      {subtitle && <div className="policy-banner-subtitle">{subtitle}</div>}
      <div className="policy-banner-description">{meta.description}</div>
    </div>
  );
}
