import { mascararCpfCnpj, mascararTelefone } from "@/lib/mascaras";

export const formatarCpfCnpjOuVazio = (digitos?: string | null) => (digitos ? mascararCpfCnpj(digitos) : "");
export const formatarTelefoneOuVazio = (digitos?: string | null) => (digitos ? mascararTelefone(digitos) : "");
