export default function FaqItem({ q, a }) {
  return (
    <details className="faq-item">
      <summary>
        {q}
        <span aria-hidden="true">+</span>
      </summary>
      <p>{a}</p>
    </details>
  );
}
