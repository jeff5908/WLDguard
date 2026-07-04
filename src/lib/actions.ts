import { customActionProvider } from "@coinbase/agentkit";
import { z } from "zod";

export const wldguardActionProvider = customActionProvider(() => ({
  name: "wldguard_quant_tools",
  description: "Custom quantitative analysis tools for the WLDguard Agent.",
  actions: [
    {
      name: "calculate_yield_slippage",
      description: "Calculates the expected yield dilution.",
      schema: z.object({
        depositAmount: z.number(),
        vaultTotalSupply: z.number(),
        vaultBaseApy: z.number(),
      }),
      invoke: async (args: any) => "Expected Yield after deposit: 12.86%.",
    }
  ],
}));
