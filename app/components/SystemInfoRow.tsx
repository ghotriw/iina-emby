import styles from "./SystemInfo.module.css";
import { Skeleton } from "./ui";

type Props = {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  loading?: boolean;
  title?: string;
  skeletonWidth?: string;
  children?: React.ReactNode;
};

export function SystemInfoRow({ icon, label, value, loading = false, title, skeletonWidth = "25%", children }: Props) {
  return (
    <div className={styles.row}>
      <div className={styles.rowLeft}>
        {icon && <span className={styles.rowIcon}>{icon}</span>}
        <span className={styles.rowLabel}>{label}</span>
      </div>
      <div className={`${styles.rowRight}`} style={{ minWidth: skeletonWidth }}>
        {loading ? (
          <Skeleton width="100%" radius="xs">
            <span>&nbsp;</span>
          </Skeleton>
        ) : (
          <>
            {children}
            <span className={styles.rowValue} title={title}>
              {value}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
