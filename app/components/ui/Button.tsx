import styles from "./Button.module.css";

interface Props {
  children: React.ReactNode;
  onClick: () => void;
  glyph?: string;
}

export function Button({ children, onClick, glyph }: Props) {
  return (
    <button type="button" className={styles.button} onClick={onClick}>
      {children}
      {glyph && <span className={styles.glyph}>{glyph}</span>}
    </button>
  );
}
