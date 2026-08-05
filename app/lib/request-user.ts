export type RequestUser = {
  userId: string;
  displayName: string;
  email: string;
};

export function getRequestUser(request: Request): RequestUser | null {
  const userId = request.headers.get("oai-authenticated-user-id");
  const email = request.headers.get("oai-authenticated-user-email");
  if (userId && email) {
    const fullName = decodeFullName(request.headers);
    return { userId, email, displayName: fullName ?? "PM Reps learner" };
  }

  const hostname = new URL(request.url).hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return {
      userId: "local-dogfood-user",
      email: "local@pm-reps.test",
      displayName: "Local PM Reps learner",
    };
  }

  return null;
}

export function requireRequestUser(request: Request) {
  const user = getRequestUser(request);
  if (!user) {
    return {
      user: null,
      response: Response.json(
        { error: "Sign in with ChatGPT to continue." },
        { status: 401 },
      ),
    } as const;
  }
  return { user, response: null } as const;
}

export function rejectCrossOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (origin !== new URL(request.url).origin) {
    return Response.json({ error: "Cross-origin write rejected." }, { status: 403 });
  }
  return null;
}

function decodeFullName(headers: Headers) {
  if (
    headers.get("oai-authenticated-user-full-name-encoding") !==
    "percent-encoded-utf-8"
  ) {
    return null;
  }
  const encoded = headers.get("oai-authenticated-user-full-name");
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}
