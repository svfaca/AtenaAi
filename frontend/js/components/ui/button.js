export function Button({ label, variant = "primary", onClick }) {
  const base =
    "px-4 py-2 rounded-xl font-medium transition-all duration-200";

  const variants = {
    primary: "bg-primary text-white hover:opacity-90",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    ghost: "text-primary hover:bg-primary/10"
  };

  const button = document.createElement("button");
  button.className = `${base} ${variants[variant]}`;
  button.textContent = label;

  if (onClick) button.onclick = onClick;

  return button;
}
