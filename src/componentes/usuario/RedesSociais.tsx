import iconeIfood from "../../imagens/social/ifood.svg";
import iconeInstagram from "../../imagens/social/instagram.svg";

type RedesSociaisProps = {
  className?: string;
  variant?: "plain" | "circulo" | "home";
  separador?: boolean;
  mostrar?: "todos" | "ifood" | "instagram";
};

export default function RedesSociais({
  className = "",
  variant = "plain",
  separador = false,
  mostrar = "todos",
}: RedesSociaisProps) {
  const isPlain = variant === "plain";
  const isHome = variant === "home";
  const mostrarIfood = mostrar === "todos" || mostrar === "ifood";
  const mostrarInstagram = mostrar === "todos" || mostrar === "instagram";
  const socialButtonShadow =
    "shadow-[0_0_0_1px_rgba(255,255,255,0.38),0_8px_18px_rgba(255,255,255,0.16),0_14px_30px_rgba(0,0,0,0.36)]";
  const socialButtonHover =
    "transition-all hover:scale-105 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.5),0_10px_22px_rgba(255,255,255,0.2),0_18px_36px_rgba(0,0,0,0.42)]";
  const homeButtonClass = `flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f3f3] min-[490px]:h-16 min-[490px]:w-16 ${socialButtonShadow} ${socialButtonHover}`;
  const circuloButtonClass = `flex h-14 w-14 items-center justify-center rounded-full bg-preto-v1 ${socialButtonShadow} ${socialButtonHover}`;
  const homeIconClass = "h-7 w-7 min-[490px]:h-8 min-[490px]:w-8";

  return (
    <div
      className={`flex shrink-0 items-center ${isPlain ? "gap-1" : "gap-2"} ${className}`}
    >
      {mostrarIfood ? (
      <a
        href="https://www.ifood.com.br/delivery/brasilia-df/paraiba-hot-dog-sul-aguas-claras/6b414c09-98ff-427f-9c06-1b00ad1438fe"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Pedir pelo iFood"
        className={
          isPlain
            ? "transition-opacity hover:opacity-70"
            : isHome
              ? homeButtonClass
              : circuloButtonClass
        }
      >
        <img
          src={iconeIfood}
          alt=""
          aria-hidden
          className={
            isPlain
              ? "h-6 w-auto"
              : isHome
                ? "h-7 w-auto min-[490px]:h-8"
                : "h-7 w-auto brightness-0 invert"
          }
        />
      </a>
      ) : null}
      {isPlain && separador && mostrarIfood && mostrarInstagram ? (
        <span className="font-barlow text-base text-cinza-base" aria-hidden>
          •
        </span>
      ) : null}
      {mostrarInstagram ? (
      <a
        href="https://www.instagram.com/paraibahotdog/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram da Paraíba Hot Dog"
        className={
          isPlain
            ? "transition-opacity hover:opacity-70"
            : isHome
              ? homeButtonClass
              : circuloButtonClass
        }
      >
        <img
          src={iconeInstagram}
          alt=""
          aria-hidden
          className={
            isPlain
              ? "h-5 w-5"
              : isHome
                ? homeIconClass
                : "h-7 w-7 brightness-0 invert"
          }
        />
      </a>
      ) : null}
    </div>
  );
}
