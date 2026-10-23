import type { Metadata } from "next";
import { CONTATO_PRIVACIDADE, RESPONSAVEL } from "@/modulos/legal/responsavel";

export const metadata: Metadata = { title: "Política de Privacidade" };

// Rascunho fiel ao que o sistema faz hoje — revisar com um advogado antes de usar com dados reais
// (docs/DEPLOY.md). Mudou o texto? Troque VERSAO_TERMOS em src/modulos/legal/versao.ts.
export default function PaginaPrivacidade() {
  return (
    <>
      <h1 className="font-heading text-[2rem] leading-tight">Política de Privacidade</h1>
      <p className="text-muted-foreground">
        Como o Isis-Assist trata os dados pessoais de quem usa o sistema e dos inquilinos, fiadores e contatos cadastrados
        nele, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018, a LGPD).
      </p>

      <h2>1. Quem decide sobre os dados</h2>
      <ul>
        <li>
          O Isis-Assist, oferecido por {RESPONSAVEL}, é um sistema para administrar aluguéis residenciais. Quem contrata
          (o proprietário ou a administradora, aqui chamado de <strong>você</strong>) cadastra imóveis, inquilinos,
          contratos e pagamentos.
        </li>
        <li>
          Sobre os dados de <strong>inquilinos, fiadores e contatos de emergência</strong>, quem decide para que e como
          usar é você: você é o <strong>controlador</strong>. O Isis-Assist é o <strong>operador</strong>: trata esses dados
          só para o sistema funcionar para você, conforme as suas instruções.
        </li>
        <li>
          Sobre os dados da <strong>sua conta</strong> (nome, e-mail e senha), o Isis-Assist é o controlador.
        </li>
      </ul>

      <h2>2. Que dados ficam guardados</h2>
      <ul>
        <li>
          <strong>Sua conta:</strong> nome, e-mail, senha (guardada só de forma irreversível, nunca o texto dela), os
          registros de acesso (data, endereço IP e navegador de cada sessão) e o aceite destes documentos.
        </li>
        <li>
          <strong>Seu residencial:</strong> nome, endereço, imóveis e fotos; os dados que saem no recibo (nome, CPF ou
          CNPJ, telefone, e-mail e chave PIX); as regras de cobrança.
        </li>
        <li>
          <strong>Inquilinos:</strong> nome, CPF, RG, data de nascimento, telefone, e-mail, profissão, renda, contato de
          emergência (nome, telefone e parentesco), observações, documentos enviados e se aceitam avisos pelo WhatsApp.
          Só o nome é obrigatório.
        </li>
        <li>
          <strong>Fiadores:</strong> nome, CPF, telefone, e-mail e endereço.
        </li>
        <li>
          <strong>Contratos e financeiro:</strong> datas, valores, reajustes, cobranças, pagamentos, recibos,
          comprovantes e despesas.
        </li>
        <li>
          Não pedimos dados sensíveis (saúde, religião, origem racial, biometria e afins) e não usamos cookies de propaganda
          ou de rastreamento. O único cookie é o da sessão, necessário para manter você conectado.
        </li>
      </ul>

      <h2>3. Para que os dados são usados</h2>
      <ul>
        <li>
          Fazer o sistema funcionar para você (cadastros, cobranças, recibos, avisos e relatórios): execução do contrato
          com você (LGPD, art. 7º, V).
        </li>
        <li>
          Dados de inquilinos e fiadores: o controlador os usa para a locação e a fiança (execução de contrato), para
          cumprir obrigações legais, como o imposto de renda (art. 7º, II), e para cobrar o aluguel (exercício regular de
          direitos e proteção do crédito, art. 7º, VI e X).
        </li>
        <li>
          Avisos pelo WhatsApp: só para quem aceitou. Para quem não aceitou, o sistema não oferece essa opção.
        </li>
        <li>
          Segurança (limite de tentativas de login, registro de sessões, investigação de abuso): legítimo interesse e
          dever de segurança (art. 7º, IX, e art. 46).
        </li>
        <li>Não vendemos dados, não usamos para propaganda e não tomamos decisões automáticas sobre pessoas.</li>
      </ul>

      <h2>4. Com quem os dados são compartilhados</h2>
      <p>Só com fornecedores necessários para o sistema funcionar, que tratam os dados em nome do Isis-Assist:</p>
      <ul>
        <li>
          <strong>Vercel</strong>: hospedagem do sistema, com processamento na região de São Paulo.
        </li>
        <li>
          <strong>Supabase</strong>: banco de dados e arquivos, guardados na região de São Paulo.
        </li>
        <li>
          <strong>Resend</strong>: envio de e-mails do sistema (como o de redefinir a senha), quando ativado.
        </li>
        <li>
          <strong>Banco Central do Brasil</strong>: o sistema consulta os índices IGP-M e IPCA. Nenhum dado pessoal é
          enviado.
        </li>
        <li>
          <strong>WhatsApp</strong>: ao tocar em um botão de WhatsApp, o aplicativo do seu aparelho abre com a mensagem
          pronta. Quem envia é você, pela sua conta.
        </li>
      </ul>
      <p>
        Esses fornecedores são empresas com sede no exterior. Mesmo com os dados guardados no Brasil, isso pode configurar
        transferência internacional (art. 33), feita com as garantias de proteção de dados que eles oferecem. Os dados
        também podem ser entregues por ordem judicial ou de autoridade competente.
      </p>

      <h2>5. Por quanto tempo</h2>
      <ul>
        <li>
          Enquanto a sua conta existir. Ao excluir a conta (Configurações → Privacidade e conta), tudo é apagado na hora:
          banco de dados e arquivos.
        </li>
        <li>
          Quando um inquilino pede para apagar os dados: contatos, documentos, renda, contato de emergência, fiador e
          observações saem na hora. Nome e CPF ficam até 31 de dezembro do 6º ano depois do último pagamento, porque
          estão nos recibos e no imposto de renda do controlador e a Receita Federal pode conferir a declaração nesse
          período (art. 16, I). Depois disso são apagados sozinhos, junto com o contrato assinado e os comprovantes.
        </li>
      </ul>

      <h2>6. Direitos de quem tem dados no sistema</h2>
      <p>
        A LGPD (art. 18) garante: confirmar se há dados, acessá-los, corrigi-los, pedir que sejam anonimizados, bloqueados
        ou apagados, receber uma cópia (portabilidade), saber com quem foram compartilhados e retirar o consentimento.
      </p>
      <ul>
        <li>
          <strong>Você, dono da conta:</strong> corrige seus dados em Configurações e exclui a conta em Configurações →
          Privacidade e conta.
        </li>
        <li>
          <strong>Inquilinos, fiadores e contatos:</strong> o pedido vai para o proprietário ou a administradora do imóvel
          (o controlador). Pelo sistema, ele baixa uma cópia dos dados e os apaga na página de cada inquilino. Se não
          conseguir falar com ele, use o canal abaixo e nós encaminhamos o pedido.
        </li>
        <li>
          Também é possível reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.
        </li>
      </ul>

      <h2>7. Segurança</h2>
      <p>
        Conexão sempre criptografada (HTTPS); senhas guardadas de forma irreversível; cada conta só acessa os próprios
        dados; arquivos em armazenamento privado, que só abrem para quem está logado na conta dona deles; limite de
        tentativas de login; dados guardados no Brasil. Se acontecer um incidente de segurança que possa causar risco ou
        dano relevante, avisaremos os afetados e a ANPD nos prazos da lei.
      </p>

      <h2>8. Menores de idade</h2>
      <p>O Isis-Assist é feito para maiores de 18 anos e não se destina a coletar dados de crianças.</p>

      <h2>9. Mudanças nesta política</h2>
      <p>Quando o texto mudar, a data da versão muda e o sistema pede um novo aceite no próximo acesso.</p>

      <h2>10. Contato</h2>
      <p>
        {CONTATO_PRIVACIDADE ? (
          <>
            Assuntos de privacidade e pedidos de titulares:{" "}
            <a href={`mailto:${CONTATO_PRIVACIDADE}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {CONTATO_PRIVACIDADE}
            </a>
            .
          </>
        ) : (
          "Assuntos de privacidade e pedidos de titulares: pelo canal de atendimento do Isis-Assist."
        )}
      </p>
    </>
  );
}
