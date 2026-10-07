import { useEffect, useRef, useState } from "react";

const LADO_SAIDA = 800;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const QUALIDADE_JPEG = 0.9;

type RecorteImagemProps = {
  arquivo: File;
  origem: string;
  onCancelar: () => void;
  onConfirmar: (arquivoRecortado: File, preview: string) => void;
};

export default function RecorteImagem({
  arquivo,
  origem,
  onCancelar,
  onConfirmar,
}: RecorteImagemProps) {
  const [imagem, setImagem] = useState<HTMLImageElement | null>(null);
  const [ladoArea, setLadoArea] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [deslocamento, setDeslocamento] = useState({ x: 0, y: 0 });
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const areaRef = useRef<HTMLDivElement>(null);
  const arrasteRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const elemento = areaRef.current;
    if (!elemento) return;

    const medir = () => setLadoArea(elemento.clientWidth);
    medir();

    const observador = new ResizeObserver(medir);
    observador.observe(elemento);

    return () => observador.disconnect();
  }, []);

  const escalaBase =
    imagem && ladoArea
      ? ladoArea / Math.min(imagem.naturalWidth, imagem.naturalHeight)
      : 0;
  const escala = escalaBase * zoom;
  const larguraExibida = imagem ? imagem.naturalWidth * escala : 0;
  const alturaExibida = imagem ? imagem.naturalHeight * escala : 0;

  const limitar = (valor: number, tamanhoExibido: number) => {
    const minimo = Math.min(0, ladoArea - tamanhoExibido);
    return Math.min(0, Math.max(minimo, valor));
  };

  const deslocamentoVisivel = {
    x: limitar(deslocamento.x, larguraExibida),
    y: limitar(deslocamento.y, alturaExibida),
  };

  const aoCarregarImagem = (evento: React.SyntheticEvent<HTMLImageElement>) => {
    const elemento = evento.currentTarget;
    const lado = areaRef.current?.clientWidth ?? 0;
    const base = lado / Math.min(elemento.naturalWidth, elemento.naturalHeight);

    setImagem(elemento);
    setLadoArea(lado);
    setDeslocamento({
      x: (lado - elemento.naturalWidth * base) / 2,
      y: (lado - elemento.naturalHeight * base) / 2,
    });
  };

  const iniciarArraste = (evento: React.PointerEvent<HTMLDivElement>) => {
    if (!imagem) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    arrasteRef.current = {
      x: evento.clientX - deslocamento.x,
      y: evento.clientY - deslocamento.y,
    };
  };

  const arrastar = (evento: React.PointerEvent<HTMLDivElement>) => {
    const inicio = arrasteRef.current;
    if (!inicio) return;

    setDeslocamento({
      x: limitar(evento.clientX - inicio.x, larguraExibida),
      y: limitar(evento.clientY - inicio.y, alturaExibida),
    });
  };

  const encerrarArraste = () => {
    arrasteRef.current = null;
  };

  const confirmar = () => {
    if (!imagem || !ladoArea) return;

    setProcessando(true);
    setErro("");

    const canvas = document.createElement("canvas");
    canvas.width = LADO_SAIDA;
    canvas.height = LADO_SAIDA;

    const contexto = canvas.getContext("2d");
    if (!contexto) {
      setErro("Nao foi possivel preparar o recorte neste navegador.");
      setProcessando(false);
      return;
    }

    const proporcao = LADO_SAIDA / ladoArea;
    contexto.drawImage(
      imagem,
      deslocamentoVisivel.x * proporcao,
      deslocamentoVisivel.y * proporcao,
      larguraExibida * proporcao,
      alturaExibida * proporcao,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setErro("Nao foi possivel gerar a imagem recortada.");
          setProcessando(false);
          return;
        }

        const nomeBase = arquivo.name.replace(/\.[^.]+$/, "") || "imagem";
        const recortado = new File([blob], `${nomeBase}.jpg`, {
          type: "image/jpeg",
        });

        onConfirmar(recortado, canvas.toDataURL("image/jpeg", QUALIDADE_JPEG));
        setProcessando(false);
      },
      "image/jpeg",
      QUALIDADE_JPEG,
    );
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end bg-black/60 px-4 py-4 backdrop-blur-sm min-[640px]:items-center min-[640px]:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Ajustar imagem do item"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-md rounded-[5px] border border-[#DADEE3] bg-white p-5 text-[#121212] shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 className="font-barlow text-base font-bold leading-4 tracking-[-0.4px] text-[#121212]">
          Ajustar imagem
        </h2>
        <p className="mt-1 font-barlow-condensed text-sm font-normal leading-5 text-[#121212]">
          Arraste para posicionar e use o controle para aproximar. O que ficar
          dentro do quadro e o que sera salvo.
        </p>

        <div
          ref={areaRef}
          onPointerDown={iniciarArraste}
          onPointerMove={arrastar}
          onPointerUp={encerrarArraste}
          onPointerCancel={encerrarArraste}
          className="relative mt-4 aspect-square w-full cursor-grab touch-none select-none overflow-hidden rounded-[15px] bg-[#F4F4F4] active:cursor-grabbing"
        >
          {origem && (
            <img
              src={origem}
              alt="Pre-visualizacao do recorte"
              onLoad={aoCarregarImagem}
              draggable={false}
              className="max-w-none origin-top-left"
              style={{
                width: larguraExibida ? `${larguraExibida}px` : "auto",
                height: alturaExibida ? `${alturaExibida}px` : "auto",
                transform: `translate(${deslocamentoVisivel.x}px, ${deslocamentoVisivel.y}px)`,
              }}
            />
          )}
        </div>

        <label className="mt-4 block">
          <span className="font-barlow-condensed text-xl font-normal leading-5 text-[#121212]">
            Aproximacao
          </span>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.01}
            value={zoom}
            onChange={(evento) => setZoom(Number(evento.target.value))}
            className="mt-2 w-full accent-amarelo"
            aria-label="Aproximacao da imagem"
          />
        </label>

        {erro && (
          <p className="mt-3 font-barlow-condensed text-sm text-red-600">
            {erro}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 min-[520px]:flex-row min-[520px]:justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-[6px] border-2 border-[#CCCCCC] px-5 py-3 font-barlow-condensed text-xl font-semibold uppercase tracking-wide text-[#666666] transition-colors hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={!imagem || processando}
            className="rounded-[6px] bg-[#0A0A0A] px-5 py-3 font-barlow-condensed text-xl font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#2C2C2C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processando ? "Processando..." : "Usar imagem"}
          </button>
        </div>
      </div>
    </div>
  );
}
