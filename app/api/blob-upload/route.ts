import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

type ClientPayload = {
  intentId?: string;
  authorization?: string;
  contentType?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = parseClientPayload(clientPayload);
        if (!payload.intentId || !payload.authorization || !payload.contentType) {
          throw new Error("Upload authorization payload is incomplete.");
        }

        const response = await fetch(`${API_BASE_URL}/documents/uploads/direct/authorize`, {
          method: "POST",
          headers: {
            Authorization: payload.authorization,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intent_id: payload.intentId,
            pathname,
            content_type: payload.contentType,
          }),
        });

        if (!response.ok) {
          throw new Error(await safeError(response));
        }

        const authorization = (await response.json()) as {
          allowed_content_types: string[];
          add_random_suffix: boolean;
          allow_overwrite: boolean;
          token_payload: Record<string, string>;
        };

        return {
          allowedContentTypes: authorization.allowed_content_types,
          addRandomSuffix: authorization.add_random_suffix,
          allowOverwrite: authorization.allow_overwrite,
          tokenPayload: JSON.stringify(authorization.token_payload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = parseClientPayload(tokenPayload);
        if (!payload.intentId) {
          throw new Error("Upload completion payload is missing intent ID.");
        }

        const response = await fetch(`${API_BASE_URL}/documents/uploads/direct/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Direct-Upload-Callback-Secret": process.env.DIRECT_UPLOAD_CALLBACK_SECRET ?? "",
          },
          body: JSON.stringify({
            intent_id: payload.intentId,
            pathname: blob.pathname,
            url: blob.url,
            download_url: blob.downloadUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(await safeError(response));
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload authorization failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function parseClientPayload(payload: string | null | undefined): ClientPayload {
  if (!payload) {
    return {};
  }
  try {
    return JSON.parse(payload) as ClientPayload;
  } catch {
    return {};
  }
}

async function safeError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string; error?: string };
    return payload.detail ?? payload.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}
