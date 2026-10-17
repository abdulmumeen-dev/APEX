import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { clearLocalSessionCookie, getAuthMode, getAuthModeInfo, localLogin } from "./_core/local-auth";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { apexRouter } from "./agent/router";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  apex: apexRouter,
  auth: router({
    mode: publicProcedure.query(() => getAuthModeInfo()),
    me: publicProcedure.query(opts => opts.ctx.user),
    localLogin: publicProcedure
      .input(
        z.object({
          username: z.string().min(3).max(128),
          password: z.string().min(12).max(4096),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await localLogin(ctx.req, ctx.res, input.username, input.password);
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error(
            "[Auth] Local sign-in failed",
            error instanceof Error ? error.message : "unknown error"
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Local sign-in failed. Check the server configuration and database.",
          });
        }
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      if (getAuthMode() === "local") {
        clearLocalSessionCookie(ctx.res);
      } else {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      }
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
