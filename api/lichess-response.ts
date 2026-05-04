import {
  type BackendErrorResponse,
  validateAndNormalizeRequest,
} from '../src/server/lichessResponseCore.js';
import { LichessExplorerService } from '../src/server/lichessResponseService.js';

const explorerService = new LichessExplorerService({
  token: process.env.LICHESS_TOKEN,
  baseUrl: process.env.LICHESS_EXPLORER_BASE_URL || 'https://explorer.lichess.org',
});

function sendJson(res: any, status: number, body: unknown) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
}

function parseBody(req: any) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }

  return req.body ?? null;
}

function mapErrorStatus(reason: BackendErrorResponse['reason']) {
  switch (reason) {
    case 'invalid_position':
      return 400;
    case 'missing_token':
      return 500;
    case 'lichess_unauthorised':
      return 502;
    case 'lichess_rate_limited':
      return 429;
    case 'lichess_unavailable':
      return 503;
    case 'out_of_database':
    case 'no_moves':
      return 200;
    default:
      return 500;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      ok: false,
      reason: 'invalid_position',
      message: 'Use POST for this endpoint.',
    } satisfies BackendErrorResponse);
  }

  const body = parseBody(req);
  const normalized = validateAndNormalizeRequest(body ?? {});
  if (!normalized.ok) {
    return sendJson(res, 400, {
      ok: false,
      reason: 'invalid_position',
      message: normalized.message,
    } satisfies BackendErrorResponse);
  }

  try {
    const result = await explorerService.getResponse(normalized.value);
    return sendJson(res, result.ok ? 200 : mapErrorStatus(result.reason), result);
  } catch {
    return sendJson(res, 500, {
      ok: false,
      reason: 'lichess_unavailable',
      message: 'Opening database unavailable.',
    } satisfies BackendErrorResponse);
  }
}
