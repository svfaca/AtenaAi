export function Card(content) {
  return `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
      ${content}
    </div>
  `;
}
