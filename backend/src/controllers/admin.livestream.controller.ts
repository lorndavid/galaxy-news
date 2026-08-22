import { Request, Response } from "express";
import * as liveStreamService from "../services/livestream.service";
import { asyncHandler } from "../utils/asyncHandler";
import { created, noContent, ok } from "../utils/respond";

export const list = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await liveStreamService.listAdmin(req.query as any));
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await liveStreamService.getAdmin(Number(req.params.id)));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: liveStreamService.LiveStreamInput };
  created(
    res,
    await liveStreamService.create(body, req.user!.id, req.ip),
    "Live Stream created"
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { body } = req.validated as { body: liveStreamService.LiveStreamInput };
  ok(
    res,
    await liveStreamService.update(
      Number(req.params.id),
      body,
      req.user!.id,
      req.ip
    ),
    "Live Stream updated"
  );
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await liveStreamService.remove(Number(req.params.id), req.user!.id, req.ip);
  noContent(res);
});

export const updateStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { body } = req.validated as { body: { status: string } };
    ok(
      res,
      await liveStreamService.updateStatus(
        Number(req.params.id),
        body.status,
        req.user!.id,
        req.ip
      ),
      "Status updated"
    );
  }
);

export const updateHomepage = asyncHandler(
  async (req: Request, res: Response) => {
    const { body } = req.validated as { body: { isHomepage: boolean } };
    ok(
      res,
      await liveStreamService.updateHomepage(
        Number(req.params.id),
        body.isHomepage,
        req.user!.id,
        req.ip
      ),
      "Homepage visibility updated"
    );
  }
);
