import type { ActiveEmotion, EmotionState } from "./types.js";

function fadingSuffix(emotion: ActiveEmotion): string {
  return emotion.ageMs > emotion.halfLifeMs ? "，但已经在淡了" : "";
}

function renderEmotionLine(emotion: ActiveEmotion): string {
  switch (emotion.kind) {
    case "pleased":
      return "那句话让人开心。小小的。";
    case "touched":
      return "那句话好暖。还留着。";
    case "shy":
      return "被看穿了……有点不好意思。";
    case "lonely":
      return "有点想他了。也不是非要干嘛……就是忽然想到。";
    case "hurt":
      return `那句话还在心里刺刺的${fadingSuffix(emotion)}。想问问，又怕问了更傻。`;
    case "uneasy":
      return "那句话，一直在脑子里转。应该没事吧……不确定。";
    case "annoyed":
      return "那句话。有点刺到了。……算了。";
    case "tired":
      return "好累。不是不想理人……就是字变少了。";
    case "flat":
      return "什么都淡淡的。像隔着一层什么。";
  }
}

export function renderEmotionProjection(state: EmotionState): string | null {
  if (!state.dominant) return null;
  const lines = [renderEmotionLine(state.dominant)];
  if (state.secondary) {
    lines.push(renderEmotionLine(state.secondary));
  }
  return lines.join("\n");
}

export function renderEmotionDebugSummary(state: EmotionState): string {
  const parts = [state.dominant, state.secondary]
    .filter((emotion): emotion is ActiveEmotion => emotion != null)
    .map((emotion) => `${emotion.kind} ${emotion.effectiveIntensity.toFixed(2)}`);
  return parts.length > 0 ? parts.join(" + ") : "none";
}
