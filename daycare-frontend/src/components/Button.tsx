export default function Button({
  children,
  onClick,
  type = "button",
}: any) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      {children}
    </button>
  );
}