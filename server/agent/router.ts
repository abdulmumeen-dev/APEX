import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { submitTask } from "./engine";
import { runWorkflowNow } from "./workflows";
import { createApiToken, listApiTokens, revokeApiToken } from "./api-tokens";
import {
  createMemory,
  createSession,
  createWorkflowDraft,
  getOverview,
  getRunSteps,
  getSessionMessages,
  listApprovals,
  listMemories,
  listRuns,
  listSessions,
  listWorkspaceFiles,
  listFileVersions,
  listWorkflows,
  readWorkspaceFile,
  removeMemory,
} from "./data";
import {
  deleteProvider,
  getProviderSetupStatus,
  listProviders,
  saveProvider,
  setDefaultProvider,
  testProvider,
} from "../providers/service";
import {
  listBridges,
  removeBridge,
  saveBridge,
  testBridge,
} from "../bridges/service";
import { deleteSkill, listSkills, saveSkill, setSkillEnabled } from "./skills";
import {
  deletePlugin,
  listPlugins,
  savePlugin,
  setPluginEnabled,
  testPlugin,
} from "./plugins";

function asBadRequest(error: unknown): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message:
      error instanceof Error
        ? error.message
        : "The requested APEX operation failed.",
  });
}

export const apexRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) =>
    getOverview(ctx.user.id)
  ),

  cliTokens: router({
    list: protectedProcedure.query(async ({ ctx }) =>
      listApiTokens(ctx.user.id)
    ),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(120) }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await createApiToken(ctx.user.id, input.name);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    revoke: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) =>
        revokeApiToken(ctx.user.id, input.id)
      ),
  }),

  models: router({
    setupStatus: protectedProcedure.query(() => getProviderSetupStatus()),
    list: protectedProcedure.query(async ({ ctx }) =>
      listProviders(ctx.user.id)
    ),
    save: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid().optional(),
          name: z.string().trim().min(1).max(120),
          kind: z.enum(["api", "server", "local"]),
          baseUrl: z.string().url().max(2_048),
          modelId: z.string().trim().min(1).max(200),
          apiKey: z.string().max(16_000).optional(),
          removeApiKey: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await saveProvider(ctx.user.id, input);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    test: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await testProvider(ctx.user.id, input.id);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    setDefault: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await setDefaultProvider(ctx.user.id, input.id);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await deleteProvider(ctx.user.id, input.id);
        return { deleted: true } as const;
      }),
  }),

  bridges: router({
    list: protectedProcedure.query(async ({ ctx }) => listBridges(ctx.user.id)),
    save: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid().optional(),
          name: z.string().trim().min(1).max(120),
          endpoint: z.string().url().max(2_048),
          apiKey: z.string().max(16_000).optional(),
          removeApiKey: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await saveBridge(ctx.user.id, input);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    test: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await testBridge(ctx.user.id, input.id);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await removeBridge(ctx.user.id, input.id);
        return { deleted: true } as const;
      }),
  }),

  skills: router({
    list: protectedProcedure.query(async ({ ctx }) => listSkills(ctx.user.id)),
    save: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid().optional(),
          name: z.string().trim().min(1).max(120),
          description: z.string().trim().max(1_000).default(""),
          instructions: z.string().trim().min(1).max(24_000),
          enabled: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await saveSkill(ctx.user.id, input);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    setEnabled: protectedProcedure
      .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await setSkillEnabled(ctx.user.id, input.id, input.enabled);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await deleteSkill(ctx.user.id, input.id);
        return { deleted: true } as const;
      }),
  }),

  plugins: router({
    list: protectedProcedure.query(async ({ ctx }) => listPlugins(ctx.user.id)),
    save: protectedProcedure
      .input(
        z.object({
          id: z.string().uuid().optional(),
          name: z.string().trim().min(1).max(120),
          description: z.string().trim().min(1).max(2_000),
          baseUrl: z.string().url().max(2_048),
          path: z.string().trim().min(1).max(512),
          apiKey: z.string().max(16_000).optional(),
          removeApiKey: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await savePlugin(ctx.user.id, input);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    test: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await testPlugin(ctx.user.id, input.id);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    setEnabled: protectedProcedure
      .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await setPluginEnabled(ctx.user.id, input.id, input.enabled);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await deletePlugin(ctx.user.id, input.id);
        return { deleted: true } as const;
      }),
  }),

  agent: router({
    sessions: protectedProcedure.query(async ({ ctx }) =>
      listSessions(ctx.user.id)
    ),
    createSession: protectedProcedure
      .input(
        z.object({ title: z.string().trim().max(160).optional() }).optional()
      )
      .mutation(async ({ ctx, input }) =>
        createSession(ctx.user.id, input?.title)
      ),
    messages: protectedProcedure
      .input(z.object({ sessionId: z.string().uuid() }))
      .query(async ({ ctx, input }) =>
        getSessionMessages(ctx.user.id, input.sessionId)
      ),
    submitTask: protectedProcedure
      .input(
        z.object({
          sessionId: z.string().uuid().optional(),
          task: z.string().trim().min(1).max(12_000),
          allowBridges: z.boolean().default(false),
          allowPlugins: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          return await submitTask(ctx.user.id, input);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
    runs: protectedProcedure.query(async ({ ctx }) => listRuns(ctx.user.id)),
    runSteps: protectedProcedure
      .input(z.object({ runId: z.string().uuid() }))
      .query(async ({ ctx, input }) => getRunSteps(ctx.user.id, input.runId)),
  }),

  automations: router({
    list: protectedProcedure.query(async ({ ctx }) =>
      listWorkflows(ctx.user.id)
    ),
    createDraft: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(160),
          description: z.string().trim().min(1).max(2_000),
          triggerType: z.enum(["manual", "schedule", "webhook"]),
          taskPrompt: z.string().trim().min(1).max(8_000),
        })
      )
      .mutation(async ({ ctx, input }) =>
        createWorkflowDraft(ctx.user.id, input)
      ),
    runNow: protectedProcedure
      .input(z.object({ workflowId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await runWorkflowNow(ctx.user.id, input.workflowId);
        } catch (error) {
          return asBadRequest(error);
        }
      }),
  }),

  memory: router({
    list: protectedProcedure.query(async ({ ctx }) =>
      listMemories(ctx.user.id)
    ),
    create: protectedProcedure
      .input(
        z.object({
          label: z.string().trim().min(1).max(160),
          content: z.string().trim().min(1).max(12_000),
        })
      )
      .mutation(async ({ ctx, input }) => createMemory(ctx.user.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await removeMemory(ctx.user.id, input.id);
        return { deleted: true } as const;
      }),
  }),

  workspace: router({
    list: protectedProcedure.query(async ({ ctx }) =>
      listWorkspaceFiles(ctx.user.id)
    ),
    read: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) =>
        readWorkspaceFile(ctx.user.id, input.id)
      ),
    versions: protectedProcedure
      .input(z.object({ path: z.string().min(1).max(512) }))
      .query(async ({ ctx, input }) =>
        listFileVersions(ctx.user.id, input.path)
      ),
  }),

  approvals: router({
    list: protectedProcedure.query(async ({ ctx }) =>
      listApprovals(ctx.user.id)
    ),
  }),
});
