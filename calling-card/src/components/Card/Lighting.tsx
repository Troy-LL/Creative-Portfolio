/** Soft directional ambient + contact shadow — not a UI drop shadow stack. */
export function Lighting() {
  return (
    <>
      <div className="physical-card__light" aria-hidden="true" />
      <div className="physical-card__contact-shadow" aria-hidden="true" />
    </>
  );
}
