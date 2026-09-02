import { useRef, useState, type FormEvent } from "react";
import BarraDeNavegacao from "../../componentes/usuario/BarraDeNavegacaoUsuario";
import Botao from "../../componentes/usuario/inicio/Botao";
import Rodape from "../../componentes/usuario/Rodape";
import { consultarFidelidade } from "../../servicos/fidelidadeApi";

type ResultadoFidelidade =
  | {
      status: "encontrado";
      nome: string;
      pontos: number;
      totalParaPremio: number;
    }
  | {
      status: "nao-encontrado";
    }
  | null;

export default function CartaoFidelidade() {
  const [cadastro, setCadastro] = useState("");
  const [consultando, setConsultando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [resultado, setResultado] = useState<ResultadoFidelidade>(null);
  const consultaAtualRef = useRef(0);

  async function handleConsultarFidelidade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cadastroNormalizado = cadastro.trim();

    if (!cadastroNormalizado) {
      setMensagem(
        "Informe seu telefone ou e-mail para consultar sua fidelidade.",
      );
      setResultado(null);
      return;
    }

    setMensagem("");
    setResultado(null);
    setConsultando(true);
    const idConsulta = ++consultaAtualRef.current;

    try {
      const fidelidade = await consultarFidelidade(cadastroNormalizado);

      if (consultaAtualRef.current !== idConsulta) {
        return;
      }

      if (!fidelidade) {
        setResultado({ status: "nao-encontrado" });
        return;
      }

      setResultado({
        status: "encontrado",
        nome: fidelidade.nome,
        pontos: fidelidade.pontos,
        totalParaPremio: fidelidade.total_para_premio,
      });
    } catch (error) {
      if (consultaAtualRef.current !== idConsulta) {
        return;
      }

      console.error("Loyalty lookup error:", error);
      setMensagem(
        "Não foi possível consultar sua fidelidade agora. Tente novamente em instantes.",
      );
      setResultado(null);
    } finally {
      if (consultaAtualRef.current === idConsulta) {
        setConsultando(false);
      }
    }
  }

  function atualizarCadastro(valor: string) {
    setCadastro(valor);
    setMensagem("");
    setResultado(null);
  }

  if (resultado?.status === "encontrado") {
    const pontosExibidos = Math.min(
      resultado.pontos,
      resultado.totalParaPremio,
    );
    const faltam = Math.max(resultado.totalParaPremio - pontosExibidos, 0);
    const carimbos = Array.from(
      { length: resultado.totalParaPremio },
      (_, index) => index < pontosExibidos,
    );

    return (
      <>
        <BarraDeNavegacao />

        <main className="min-h-[calc(100vh-4rem)] bg-preto-v1 pt-16 text-branco">
          <section className="pagina-container flex min-h-[calc(100vh-4rem)] items-center py-10 min-[640px]:py-16">
            <div className="mx-auto w-full max-w-[36rem] text-center">
              <h1 className="font-barlow-condensed text-[clamp(2.2rem,7vw,4.5rem)] font-black uppercase leading-none text-branco">
                <span className="whitespace-nowrap">
                  OLÁ, <span className="text-amarelo">{resultado.nome}!</span>
                </span>
              </h1>

              <article
                className={`mx-auto mt-6 w-full max-w-[28rem] rounded-xl bg-[#1c1c1c] px-6 py-7 text-center shadow-[0_16px_40px_rgba(0,0,0,0.35)] min-[640px]:mt-7 min-[640px]:px-10 min-[640px]:py-8 ${
                  faltam === 0 ? "animate-pulse" : ""
                }`}
              >
                <h2 className="font-barlow-condensed text-[clamp(1.8rem,6vw,2.8rem)] font-black uppercase text-branco">
                  {faltam > 0 ? (
                    <>
                      Faltam <span className="text-amarelo">{faltam} dogs</span>
                    </>
                  ) : (
                    <span className="text-amarelo">Premio liberado!</span>
                  )}
                </h2>
                <p className="mt-3 font-barlow text-sm font-semibold text-branco/65 min-[640px]:text-[15px]">
                  Complete 10 e ganhe um Hot Dog gratis!
                </p>

                <div
                  className="mx-auto mt-6 grid max-w-[17.5rem] grid-cols-5 gap-x-3 gap-y-2.5"
                  aria-label={`${resultado.pontos} de ${resultado.totalParaPremio} carimbos`}
                >
                  {carimbos.map((preenchido, index) => (
                    <span
                      key={index}
                      aria-hidden
                      className={`flex items-center justify-center text-2xl transition-all ${
                        preenchido
                          ? "opacity-100"
                          : "opacity-30 grayscale"
                      }`}
                    >
                      🌭
                    </span>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </main>

        <Rodape />
      </>
    );
  }

  return (
    <>
      <BarraDeNavegacao />

      <main className="min-h-[calc(100vh-4rem)] bg-preto-v1 pt-16 text-branco">
        <section className="pagina-container flex min-h-[calc(100vh-4rem)] items-center py-10 min-[640px]:py-20">
          <div className="mx-auto w-full max-w-[39rem]">
            <h1 className="font-barlow-condensed text-[clamp(3.2rem,12vw,7.5rem)] font-black uppercase leading-[0.9] text-branco">
              Meus
              <br />
              <span className="text-amarelo">Pontos</span>
            </h1>

            <p className="mt-6 max-w-[32rem] font-barlow text-[clamp(1rem,3.5vw,1.2rem)] font-normal leading-snug text-branco/85 min-[640px]:mt-8 min-[640px]:font-barlow-condensed min-[640px]:text-[clamp(1.25rem,4vw,1.75rem)] min-[640px]:font-medium">
              Acumule pontos a cada pedido e ganhe um Hot Dog gratis ao{' '}
              <strong className="font-bold text-branco">completar 10 carimbos</strong>. Consulte seu saldo pelo telefone ou e-mail
              cadastrado.
            </p>

            <form
              onSubmit={handleConsultarFidelidade}
              className="mt-10 w-full max-w-[40rem] min-[640px]:mt-12"
            >
              <label
                htmlFor="cadastro-fidelidade"
                className="font-barlow text-base font-semibold text-branco min-[640px]:text-xl"
              >
                Confira seu cadastro:
              </label>

              <input
                id="cadastro-fidelidade"
                type="text"
                value={cadastro}
                onChange={(event) => atualizarCadastro(event.target.value)}
                placeholder="Digite seu telefone ou e-mail"
                disabled={consultando}
                className="mt-3 h-12 w-full rounded-xl border-2 border-branco/45 bg-branco/10 px-4 font-barlow text-base font-semibold text-branco outline-none transition-colors placeholder:text-branco/55 focus:border-amarelo focus:bg-branco/15 min-[640px]:mt-4 min-[640px]:h-14 min-[640px]:rounded-lg min-[640px]:px-5 min-[640px]:text-xl"
              />

              <Botao
                type="submit"
                disabled={consultando}
                className="mt-4 w-full"
              >
                {consultando ? "Consultando..." : "Consultar Fidelidade"}
              </Botao>

              {mensagem && (
                <p
                  className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-barlow text-sm text-branco/75"
                  role="status"
                >
                  {mensagem}
                </p>
              )}

              {resultado?.status === "nao-encontrado" && (
                <article className="mt-8 rounded-xl bg-[#1c1c1c] px-6 py-6 text-center shadow-[0_14px_34px_rgba(0,0,0,0.3)] min-[640px]:px-8 min-[640px]:py-7">
                  <h2 className="font-barlow text-lg font-black text-branco min-[640px]:text-xl">
                    Cadastro não encontrado
                  </h2>
                  <p className="mx-auto mt-3 max-w-[24rem] font-barlow text-sm leading-snug text-branco/70 min-[640px]:text-base">
                    Não encontramos seu cadastro. Confira se digitou
                    corretamente.
                  </p>
                  <p className="mx-auto mt-4 max-w-[28rem] font-barlow text-sm leading-snug text-branco/70 min-[640px]:text-base">
                    Se você já fez pedidos com outro contato, vale testar o
                    telefone ou e-mail usado no atendimento.
                  </p>
                </article>
              )}
            </form>
          </div>
        </section>
      </main>

      <Rodape />
    </>
  );
}
