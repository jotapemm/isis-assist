import { z } from "zod";
import { cpfValido } from "@/lib/documentos";
import { somenteDigitos } from "@/lib/mascaras";

const texto = (maximo: number) => z.string().trim().max(maximo, "Texto longo demais.");
const cpfOpcional = z.string().trim().refine((v) => v === "" || cpfValido(v), "CPF inválido. Confira os números.");
const telefoneOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || [10, 11].includes(somenteDigitos(v).length), "Telefone incompleto. Inclua o DDD.");
const emailOpcional = z.union([z.literal(""), z.email("E-mail inválido.")]);

export const esquemaInquilino = z
  .object({
    nome: z.string().trim().min(3, "Digite o nome completo.").max(120, "Nome longo demais."),
    cpf: cpfOpcional,
    rg: texto(20),
    dataNascimento: z.string().refine((v) => {
      if (v === "") return true;
      const ano = Number(v.slice(0, 4));
      return /^\d{4}-\d{2}-\d{2}$/.test(v) && ano > 1900 && v < new Date().toISOString().slice(0, 10);
    }, "Data de nascimento inválida."),
    telefone: telefoneOpcional,
    email: emailOpcional,
    profissao: texto(80),
    rendaMensal: z.number().int().min(0).max(10_000_000_00, "Valor alto demais. Confira."),
    contatoEmergenciaNome: texto(120),
    contatoEmergenciaTelefone: telefoneOpcional,
    contatoEmergenciaParentesco: texto(40),
    aceitaWhatsapp: z.boolean(),
    observacoes: texto(2000),
    temFiador: z.boolean(),
    fiador: z.object({
      nome: texto(120),
      cpf: cpfOpcional,
      telefone: telefoneOpcional,
      email: emailOpcional,
      endereco: texto(200),
    }),
  })
  .superRefine((d, ctx) => {
    if (d.temFiador && d.fiador.nome.trim().length < 3) {
      ctx.addIssue({ code: "custom", path: ["fiador", "nome"], message: "Digite o nome completo do fiador." });
    }
  });

export type DadosInquilino = z.infer<typeof esquemaInquilino>;

export const INQUILINO_VAZIO: DadosInquilino = {
  nome: "",
  cpf: "",
  rg: "",
  dataNascimento: "",
  telefone: "",
  email: "",
  profissao: "",
  rendaMensal: 0,
  contatoEmergenciaNome: "",
  contatoEmergenciaTelefone: "",
  contatoEmergenciaParentesco: "",
  aceitaWhatsapp: false, // consentimento (LGPD) começa desmarcado: só marca se o inquilino disser sim
  observacoes: "",
  temFiador: false,
  fiador: { nome: "", cpf: "", telefone: "", email: "", endereco: "" },
};
