import {
  DefaultInstance,
  EmptyRequestBody,
  FormDataRequestBody,
  HTTPError,
  SearchParamsRequestBody,
} from "@/models/api";
import { verifyCredentials } from "@/models/api/mastodon/account";
import { buildAuthorizeUrl, createApp } from "@/models/api/mastodon/apps";
import { getStatusesForAccount } from "@/models/api/mastodon/status";
import { homeTimeline, HomeTimelineRequestParamsZ } from "@/models/api/mastodon/timeline";
import { AppData } from "@/models/app";
import { getAuthorizationToken, setAuthorizationToken } from "@/models/auth";
import { inferAsyncReturnType, initTRPC, TRPCError } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import z from "zod";

export async function createContext(opts: CreateNextContextOptions) {
  return {
    getAuthorizedToken: () => getAuthorizationToken(opts.req),
    setAuthorizedToken: (newToken: string) => setAuthorizationToken(newToken)(opts.res),
    clearAuthorizedToken: () => setAuthorizationToken("")(opts.res),
  };
}

const t = initTRPC.context<inferAsyncReturnType<typeof createContext>>().create();
const requireAuthorized = t.middleware(async ({ ctx, next }) => {
  const token = ctx.getAuthorizedToken();
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED" });

  return await next({ ctx: { token } });
});
export const appRpcRouter = t.router({
  authorizedAccount: t.procedure.query(async ({ ctx }) => {
    const token = ctx.getAuthorizedToken();
    if (!token) return null;

    const instance = DefaultInstance.withAuthorizationToken(token);
    try {
      return await verifyCredentials.send(EmptyRequestBody.instance, instance);
    } catch (e) {
      if (
        e instanceof HTTPError.ForbiddenError ||
        e instanceof HTTPError.UnauthorizedError ||
        e instanceof HTTPError.UnprocessableEntityError
      ) {
        ctx.clearAuthorizedToken();
        return null;
      }

      // unprocessable
      throw e;
    }
  }),
  loginUrl: t.procedure.query(async () => {
    try {
      const app = await DefaultInstance.queryAppInfo((instance) =>
        createApp.send(new FormDataRequestBody(AppData), instance)
      );

      return buildAuthorizeUrl(DefaultInstance, {
        response_type: "code",
        client_id: app.client_id,
        redirect_uri: AppData.redirect_uris,
        scope: AppData.scopes,
      });
    } catch (e) {
      if (e instanceof HTTPError.HTTPErrorBase) {
        console.error(e, await e.readResponseJson());
      } else {
        console.error(e);
      }

      throw e;
    }
  }),
  account: t.router({
    statuses: t.procedure
      .input(z.object({ accountId: z.string(), max_id: z.string().optional(), limit: z.number().optional() }))
      .query(({ input, ctx }) => {
        const tok = ctx.getAuthorizedToken();
        const instance = tok ? DefaultInstance.withAuthorizationToken(tok) : DefaultInstance;

        return getStatusesForAccount(input.accountId).send(
          new SearchParamsRequestBody({
            max_id: input.max_id,
            limit: input.limit,
          }),
          instance
        );
      }),
  }),
  homeTimeline: t.procedure
    .use(requireAuthorized)
    .input(HomeTimelineRequestParamsZ)
    .query(({ input, ctx: { token } }) =>
      homeTimeline.send(new SearchParamsRequestBody(input), DefaultInstance.withAuthorizationToken(token))
    ),
});
export type AppRpcRouter = typeof appRpcRouter;
