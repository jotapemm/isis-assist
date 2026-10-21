export function TituloAcesso({ titulo, subtitulo }: { titulo: string; subtitulo?: React.ReactNode }) {
  return (
    <header className="mb-8">
      <h1 className="font-heading text-[2rem] leading-tight">{titulo}</h1>
      {subtitulo && <p className="mt-2 text-muted-foreground">{subtitulo}</p>}
    </header>
  );
}
