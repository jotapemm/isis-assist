import { z } from "zod";
import { RECORRENCIAS } from "./regras";

export const esquemaLembrete = z
  .object({
    titulo: z.string().trim().min(2, "Escreva o que é para lembrar.").max(150, "Texto longo demais. Use os detalhes."),
    descricao: z.string().trim().max(2000, "Texto longo demais."),
    /** "" = anotação, sem data. */
    data: z.string().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida."),
    hora: z.string().refine((v) => v === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), "Hora inválida."),
    /** "" = do residencial todo. */
    apartamentoId: z.string(),
    importante: z.boolean(),
    recorrencia: z.enum(RECORRENCIAS),
  })
  .superRefine((d, ctx) => {
    if (d.recorrencia !== "NENHUMA" && !d.data) {
      ctx.addIssue({ code: "custom", path: ["data"], message: "Para repetir, escolha a data da primeira vez." });
    }
    if (d.hora && !d.data) ctx.addIssue({ code: "custom", path: ["data"], message: "Para usar a hora, escolha a data." });
  });

export type DadosLembrete = z.infer<typeof esquemaLembrete>;
