export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 mt-6 max-w-2xl">
      <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#667944]">
        {eyebrow}
      </p>
      <h1 className="text-3xl leading-snug font-bold sm:text-4xl">{title}</h1>
      <div className="mt-4 text-sm leading-7 text-[#546757]">{children}</div>
    </div>
  );
}
