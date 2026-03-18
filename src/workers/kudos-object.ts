export class KudosObject implements DurableObject {
  private storage: DurableObjectStorage;

  constructor(state: DurableObjectState, _env: Env) {
    this.storage = state.storage;
  }

  private async getTotal(): Promise<number> {
    return (await this.storage.get<number>("total")) ?? 0;
  }

  private async getByFingerprint(): Promise<Record<string, number>> {
    return (
      (await this.storage.get<Record<string, number>>("byFingerprint")) ?? {}
    );
  }

  private async getByIp(): Promise<Record<string, number>> {
    return (await this.storage.get<Record<string, number>>("byIp")) ?? {};
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "POST" && path === "/increment") {
      let body: { fingerprint?: string; ip?: string } = {};
      try {
        body = await request.json();
      } catch {
        // Invalid JSON
      }

      const fingerprint = String(body?.fingerprint || "").slice(0, 256);
      if (!fingerprint) {
        return json({ ok: false, error: "missing_fingerprint" }, 400);
      }

      const ip = String(body?.ip || "").slice(0, 64);

      const [total, byFingerprint, byIp] = await Promise.all([
        this.getTotal(),
        this.getByFingerprint(),
        this.getByIp(),
      ]);

      const used = byFingerprint[fingerprint] || 0;

      if (used >= 50) {
        return json({ ok: false, reason: "limit" }, 429);
      }

      // Optional: track IP usage for additional spam detection
      if (ip) {
        const ipUsed = byIp[ip] || 0;
        if (ipUsed >= 250) {
          // Allow more per IP since multiple users could share an IP
          return json({ ok: false, reason: "ip_limit" }, 429);
        }
        byIp[ip] = ipUsed + 1;
      }

      byFingerprint[fingerprint] = used + 1;
      const newTotal = total + 1;

      await Promise.all([
        this.storage.put("byFingerprint", byFingerprint),
        this.storage.put("total", newTotal),
        ip ? this.storage.put("byIp", byIp) : Promise.resolve(),
      ]);

      return json({
        ok: true,
        total: newTotal,
        you: byFingerprint[fingerprint],
      });
    }

    if (request.method === "GET" && path === "/count") {
      const total = await this.getTotal();
      return json({ total });
    }

    if (request.method === "POST" && path === "/user-count") {
      let body: { fingerprint?: string } = {};
      try {
        body = await request.json();
      } catch {
        // Invalid JSON
      }

      const fingerprint = String(body?.fingerprint || "").slice(0, 256);
      if (!fingerprint) {
        return json({ you: 0 });
      }

      const byFingerprint = await this.getByFingerprint();
      const you = byFingerprint[fingerprint] || 0;

      return json({ you });
    }

    return new Response("not_found", { status: 404 });
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
