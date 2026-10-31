import axios from "axios";

const defaultMessage = "Une erreur inattendue est survenue.";

/** Returns the most useful user-facing message available in an API error. */
export function getApiErrorMessage(
  error: unknown,
  fallback = defaultMessage,
): string {
  const responseMessage = extractResponseMessage(responseData(error));
  if (responseMessage) {
    return responseMessage;
  }

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Impossible de joindre le serveur.";
    }

    return fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

/** Also decodes error bodies returned as blobs, notably by PDF endpoints. */
export async function getApiErrorMessageAsync(
  error: unknown,
  fallback = defaultMessage,
): Promise<string> {
  const payload = responseData(error);
  if (!(payload instanceof Blob)) {
    return getApiErrorMessage(error, fallback);
  }

  try {
    const text = await payload.text();
    const parsed = parseJson(text);
    return extractResponseMessage(parsed ?? text) ?? fallback;
  } catch {
    return fallback;
  }
}

function responseData(error: unknown): unknown {
  if (!isRecord(error) || !isRecord(error.response)) {
    return undefined;
  }
  return error.response.data;
}

function extractResponseMessage(payload: unknown): string | null {
  if (typeof payload === "string") {
    return nonBlank(payload);
  }

  if (!isRecord(payload)) {
    return null;
  }

  return (
    extractValue(payload.detail) ??
    extractValue(payload.message) ??
    extractValue(payload.errors) ??
    extractValue(payload.violations) ??
    extractValue(payload.title)
  );
}

function parseJson(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function extractValue(value: unknown): string | null {
  if (typeof value === "string") {
    return nonBlank(value);
  }

  if (Array.isArray(value)) {
    const messages = value.flatMap((item) => {
      const message = extractValidationIssue(item);
      return message ? [message] : [];
    });
    return messages.length > 0 ? messages.join("\n") : null;
  }

  if (isRecord(value)) {
    const messages = Object.entries(value).flatMap(([field, issue]) => {
      const message = extractValue(issue);
      return message ? [`${field} : ${message}`] : [];
    });
    return messages.length > 0 ? messages.join("\n") : null;
  }

  return null;
}

function extractValidationIssue(issue: unknown): string | null {
  if (!isRecord(issue)) {
    return extractValue(issue);
  }

  const message =
    extractValue(issue.msg) ??
    extractValue(issue.message) ??
    extractValue(issue.defaultMessage);
  if (!message) {
    return extractValue(issue);
  }

  const field = Array.isArray(issue.loc)
    ? issue.loc
        .filter((part) => part !== "body" && part !== "query")
        .map(String)
        .join(".")
    : "";
  return field ? `${field} : ${message}` : message;
}

function nonBlank(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
