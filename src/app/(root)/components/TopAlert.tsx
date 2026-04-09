export function TopAlert({ show = true }: { show?: boolean }) {
  if (!show) return null;
  
  return (
    <div className="bg-[var(--gray-700)] text-white py-2 px-4">
      <div className="container mx-auto flex items-center justify-center text-center">
        <p className="text-base font-extrabold">
          ❗️Время прибытия необходимо согласовать заранее❗️
        </p>
      </div>
    </div>
  );
}
