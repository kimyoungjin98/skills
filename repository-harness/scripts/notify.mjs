#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";

export class NotifyError extends Error {}

const providers = {
  discord: { env: "DISCORD_WEBHOOK_URL", limit: 2000 },
  slack: { env: "SLACK_WEBHOOK_URL", limit: 4000 },
};

const help = `Discord / Slack Webhook 알림 (Node.js 20 이상)

node notify.mjs --provider discord|slack --message "메시지"
node notify.mjs --provider discord|slack --message-file message.txt
node notify.mjs --provider discord|slack --pr-file pr.json

--webhook-env NAME   URL이 저장된 환경변수 이름 (기본: DISCORD_WEBHOOK_URL / SLACK_WEBHOOK_URL)
--dry-run            설정과 본문 검사만 수행, 네트워크 요청 없음
--preview            본문만 출력, Webhook 설정 확인·네트워크 요청 없음
--timeout-ms N       요청 제한 시간 (기본 10000, 최대 60000)
--help              도움말

Webhook URL은 환경변수로만 전달합니다. 파일 - 는 표준 입력을 뜻합니다.
오류 시 자동 재시도하지 않습니다. 재전송 전에 채널의 수신 여부를 확인하세요.`;

export function formatPrMessage(report, { provider = "discord" } = {}) {
  if (!report || typeof report !== "object" || Array.isArray(report))
    throw new NotifyError("PR 알림은 JSON 객체로 작성하세요.");
  const text = (value, field, multiline = false) => {
    if (typeof value !== "string" || !value.trim())
      throw new NotifyError(`PR 알림의 ${field}을 확인하세요.`);
    const lines = value.trim().replace(/\r\n?/g, "\n").split("\n")
      .map(line => line.trim().replace(/[^\S\n]+/g, " "));
    return multiline ? lines.join("\n") : lines.join(" ").replace(/ +/g, " ");
  };
  const list = (value, field, allowEmpty = false) => {
    if (!Array.isArray(value) || (!allowEmpty && value.length === 0))
      throw new NotifyError(`PR 알림의 ${field} 배열을 확인하세요.`);
    return value.map(item => text(item, field, true));
  };
  const repository = text(report.repository, "repository");
  if (!/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+$/.test(repository))
    throw new NotifyError("repository는 소유자/저장소 형식으로 작성하세요.");
  const title = text(report.title, "title");
  const head = text(report.head, "head");
  const base = text(report.base, "base");
  let url;
  try { url = new URL(report.url); } catch {
    throw new NotifyError("PR URL을 확인하세요.");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      !url.pathname.startsWith(`/${repository}/`))
    throw new NotifyError("PR URL의 HTTPS·저장소 경로를 확인하세요.");
  if (!["created", "updated"].includes(report.action))
    throw new NotifyError("action은 created 또는 updated로 작성하세요.");
  const summary = list(report.summary, "summary");
  const review = list(report.review, "review");
  const remaining = list(report.remaining, "remaining", true);
  const labels = { passed: "통과", failed: "실패", not_run: "미실행", not_applicable: "비적용" };
  if (!Array.isArray(report.checks) || report.checks.length === 0)
    throw new NotifyError("PR 알림의 checks 배열을 확인하세요.");
  const checks = report.checks.map(check => {
    if (!check || !Object.hasOwn(labels, check.status))
      throw new NotifyError("검증 status는 passed·failed·not_run·not_applicable 중 하나여야 합니다.");
    return `[${labels[check.status]}] ${text(check.name, "checks.name")}\n${text(check.detail, "checks.detail", true)}`;
  });
  const emphasis = provider === "slack" ? "*" : "**";
  const bold = value => `${emphasis}${value}${emphasis}`;
  const bullet = item => item.split("\n").map((line, index) =>
    index === 0 ? `- ${line}` : line ? `  ${line}` : "").join("\n");
  const section = (name, items, separator = "\n") =>
    `${bold(name)}\n${items.map(bullet).join(separator)}`;
  const number = url.pathname.match(/\/(?:pull|merge_requests)\/(\d+)\/?$/)?.[1];
  return [
    `${bold(`[PR ${report.action === "created" ? "생성" : "갱신"}] ${repository}${number ? ` #${number}` : ""}`)}\n${title}`,
    `브랜치: ${head} → ${base}\nPR 링크: ${url.href}`,
    section("변경", summary),
    section("검증", checks, "\n\n"),
    section("리뷰할 부분", review),
    section("남은 작업", remaining.length ? remaining : ["없음"]),
  ].join("\n\n");
}

function messageConfig(provider, message) {
  const config = Object.hasOwn(providers, provider) ? providers[provider] : null;
  if (!config)
    throw new NotifyError("provider는 discord 또는 slack이어야 합니다.");
  if (typeof message !== "string" || !message.trim())
    throw new NotifyError("빈 메시지는 전송할 수 없습니다.");
  if (message.length > config.limit)
    throw new NotifyError(`${provider} 메시지는 ${config.limit}자 이내로 작성하세요.`);
  return config;
}

function webhookUrl(provider, value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new NotifyError("Webhook URL 형식이 올바르지 않습니다.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.hash
  ) {
    throw new NotifyError(
      "Webhook은 인증정보·포트·fragment가 없는 HTTPS URL이어야 합니다.",
    );
  }
  const discord = [
    "discord.com",
    "canary.discord.com",
    "ptb.discord.com",
    "discordapp.com",
  ];
  const valid =
    provider === "discord"
      ? discord.includes(url.hostname) &&
        /^\/api\/(?:v\d+\/)?webhooks\/\d+\/[A-Za-z0-9._-]+\/?$/.test(
          url.pathname,
        )
      : ["hooks.slack.com", "hooks.slack-gov.com"].includes(url.hostname) &&
        /^\/services\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/?$/.test(
          url.pathname,
        ) &&
        !url.search;
  if (!valid)
    throw new NotifyError(
      "선택한 서비스의 공식 incoming Webhook URL을 확인하세요.",
    );
  if (provider === "discord") url.searchParams.set("wait", "true");
  return url;
}

export async function notify(
  { provider, message, webhookEnv, dryRun = false, timeoutMs = 10000 },
  { env = process.env, fetchImpl = globalThis.fetch } = {},
) {
  const config = messageConfig(provider, message);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) {
    throw new NotifyError("timeout-ms는 1~60000 사이 정수여야 합니다.");
  }
  const name = webhookEnv ?? config.env;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
    throw new NotifyError("환경변수 이름을 확인하세요.");
  if (!env[name]?.trim())
    throw new NotifyError("Webhook 환경변수가 설정되지 않았습니다.");
  const url = webhookUrl(provider, env[name].trim());
  const payload =
    provider === "discord"
      ? { content: message, allowed_mentions: { parse: [] } }
      : { text: message };
  if (dryRun) return { provider, dryRun: true, characters: message.length };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      await response.body?.cancel();
      const detail =
        response.status === 429
          ? "요청 제한이므로 수신 여부와 대기 시간을 확인하세요."
          : "설정과 수신 여부를 확인하세요.";
      throw new NotifyError(
        `전송 실패 (HTTP ${response.status}). ${detail} 자동 재시도하지 않았습니다.`,
      );
    }
    const body = await response.text();
    let confirmed = false;
    if (provider === "slack")
      confirmed = response.status === 200 && body.trim() === "ok";
    else {
      try {
        confirmed =
          response.status === 200 && typeof JSON.parse(body).id === "string";
      } catch {
        /* Unknown delivery state. */
      }
    }
    if (!confirmed)
      throw new NotifyError(
        "전송 확인 응답이 올바르지 않습니다. 재전송 전에 채널 수신 여부를 확인하세요.",
      );
    return { provider, sent: true };
  } catch (error) {
    if (error instanceof NotifyError) throw error;
    if (controller.signal.aborted)
      throw new NotifyError(
        "전송 시간 초과. 전송 여부가 미확정이므로 재전송 전에 채널을 확인하세요.",
      );
    throw new NotifyError(
      "네트워크 또는 응답 처리 오류. 전송 여부가 미확정이며 자동 재시도하지 않았습니다.",
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function run(argv, dependencies = {}) {
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        provider: { type: "string" },
        message: { type: "string" },
        "message-file": { type: "string" },
        "pr-file": { type: "string" },
        "webhook-env": { type: "string" },
        "timeout-ms": { type: "string" },
        "dry-run": { type: "boolean" },
        preview: { type: "boolean" },
        help: { type: "boolean" },
      },
    }));
  } catch {
    throw new NotifyError(
      "명령 옵션을 확인하세요. --help로 사용법을 확인할 수 있습니다.",
    );
  }
  if (values.help) return help;
  if ([values.message, values["message-file"], values["pr-file"]].filter(value => value !== undefined).length !== 1) {
    throw new NotifyError(
      "--message, --message-file, --pr-file 중 하나만 지정하세요.",
    );
  }
  let message = values.message;
  const file = values["message-file"] ?? values["pr-file"];
  if (file !== undefined) {
    try {
      if (file === "-") {
        message = "";
        process.stdin.setEncoding("utf8");
        for await (const chunk of process.stdin) message += chunk.toString();
      } else message = await readFile(file, "utf8");
    } catch {
      throw new NotifyError("메시지 파일 또는 표준 입력을 읽을 수 없습니다.");
    }
  }
  if (values["pr-file"] !== undefined) {
    let report;
    try { report = JSON.parse(message); } catch {
      throw new NotifyError("PR 알림 파일의 JSON 형식을 확인하세요.");
    }
    message = formatPrMessage(report, { provider: values.provider });
  }
  if (values.preview) {
    if (values["dry-run"]) throw new NotifyError("--preview와 --dry-run 중 하나만 지정하세요.");
    messageConfig(values.provider, message);
    return message;
  }
  return notify(
    {
      provider: values.provider,
      message,
      webhookEnv: values["webhook-env"],
      timeoutMs:
        values["timeout-ms"] === undefined
          ? 10000
          : Number(values["timeout-ms"]),
      dryRun: values["dry-run"] ?? false,
    },
    dependencies,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  run(process.argv.slice(2))
    .then((result) =>
      console.log(typeof result === "string" ? result : JSON.stringify(result)),
    )
    .catch((error) => {
      console.error(
        error instanceof NotifyError
          ? error.message
          : "알림 처리에 실패했습니다.",
      );
      process.exitCode = 1;
    });
}
