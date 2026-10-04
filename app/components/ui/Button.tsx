import styles from "./Button.module.css";

interface Props {
  children: React.ReactNode;
  onClick?: () => void;
  glyph?: string;
  disabled?: boolean;
}

export function Button({ children, onClick, glyph, disabled }: Props) {
  return (
    <button type="button" className={styles.button} onClick={onClick} disabled={disabled}>
      {children}
      {glyph && <span className={styles.glyph}>{glyph}</span>}
    </button>
  );
}
