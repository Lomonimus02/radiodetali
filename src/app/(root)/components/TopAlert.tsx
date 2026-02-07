export function TopAlert() {
  return (
    <div className="bg-[var(--gray-700)] text-white pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 px-4">
      <div className="container mx-auto flex items-center justify-center text-center">
        <p className="text-base font-extrabold">
          ❗️Время прибытия необходимо согласовать заранее❗️
        </p>
      </div>
    </div>
  );
}
