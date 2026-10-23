import type { Metadata } from "next";
import Link from "next/link";
import { CONTATO_PRIVACIDADE, RESPONSAVEL } from "@/modulos/legal/responsavel";

export const metadata: Metadata = { title: "Termos de Uso" };

// Rascunho fiel ao que o sistema faz hoje — revisar com um advogado antes de usar com dados reais
// (docs/DEPLOY.md). Mudou o texto? Troque VERSAO_TERMOS em src/modulos/legal/versao.ts.
export default function PaginaTermos() {
  return (
    <>
      <h1 className="font-heading text-[2rem] leading-tight">Termos de Uso</h1>
      <p className="text-muted-foreground">
        As regras para usar o Isis-Assist, oferecido por {RESPONSAVEL}. Ao criar a conta, você concorda com estes termos e
        com a{" "}
        <Link href="/privacidade" className="font-medium text-primary underline-offset-4 hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>

      <h2>1. O serviço</h2>
      <p>
        O Isis-Assist é um sistema na internet para administrar aluguéis residenciais: imóveis, inquilinos, contratos,
        cobranças, recibos, despesas e manutenções. Ele organiza e calcula; as decisões sobre a locação são
        sempre suas.
      </p>

      <h2>2. Sua conta</h2>
      <ul>
        <li>É preciso ter 18 anos ou mais e informar dados verdadeiros.</li>
        <li>A senha é pessoal. Não a compartilhe; se suspeitar de uso indevido, troque-a em Configurações.</li>
        <li>Você responde pelo que for feito com a sua conta.</li>
      </ul>

      <h2>3. Os dados dos seus inquilinos</h2>
      <p>
        Você é o <strong>controlador</strong> dos dados de inquilinos, fiadores e contatos que cadastrar (LGPD). Por isso,
        cabe a você:
      </p>
      <ul>
        <li>ter um motivo legítimo para cada dado (a locação, a fiança, o imposto de renda, a cobrança);</li>
        <li>avisar inquilinos e fiadores de que os dados deles ficam no Isis-Assist e para quê;</li>
        <li>cadastrar só o necessário e marcar &ldquo;aceita avisos pelo WhatsApp&rdquo; apenas quando a pessoa disser sim;</li>
        <li>
          atender os pedidos dos titulares (cópia ou apagamento dos dados), usando as ferramentas da página de cada
          inquilino.
        </li>
      </ul>
      <p>
        O Isis-Assist é o <strong>operador</strong>: trata esses dados só para prestar o serviço, seguindo as suas
        instruções, com medidas de segurança, sem usá-los para outro fim, e avisa você de incidentes de segurança que
        possam afetá-los.
      </p>

      <h2>4. Uso permitido</h2>
      <p>
        Não é permitido usar o Isis-Assist para fins ilegais, tentar acessar contas ou dados de outras pessoas, enviar
        arquivos com vírus ou sobrecarregar o sistema de propósito.
      </p>

      <h2>5. Funcionamento</h2>
      <ul>
        <li>
          Fazemos o possível para o sistema ficar no ar o tempo todo, mas pode haver paradas para manutenção ou por falha de
          fornecedores. Guarde os recibos e relatórios importantes também fora do sistema.
        </li>
        <li>
          Multa, juros e reajustes seguem as regras e os índices que você configura. Confira os valores antes de cobrar: o
          Isis-Assist não substitui orientação jurídica ou contábil.
        </li>
      </ul>

      <h2>6. Preço</h2>
      <p>As condições comerciais (plano, preço e forma de pagamento) são combinadas à parte com quem contrata.</p>

      <h2>7. Encerramento</h2>
      <ul>
        <li>
          Você pode excluir a conta quando quiser, em Configurações → Privacidade e conta. Tudo é apagado; baixe antes o que
          precisar guardar.
        </li>
        <li>A conta pode ser suspensa se estes termos forem descumpridos.</li>
      </ul>

      <h2>8. Mudanças</h2>
      <p>Quando estes termos mudarem, a data da versão muda e o sistema pede um novo aceite no próximo acesso.</p>

      <h2>9. Lei aplicável e contato</h2>
      <p>
        Estes termos seguem as leis do Brasil.{" "}
        {CONTATO_PRIVACIDADE ? (
          <>
            Dúvidas:{" "}
            <a href={`mailto:${CONTATO_PRIVACIDADE}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {CONTATO_PRIVACIDADE}
            </a>
            .
          </>
        ) : (
          "Dúvidas: pelo canal de atendimento do Isis-Assist."
        )}
      </p>
    </>
  );
}
