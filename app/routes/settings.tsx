import { IconChevronRight, IconServer } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { LibraryScan } from "~/components/LibraryScan";
import { PageHeader } from "~/components/PageHeader";
import styles from "./settings.module.css";

export function meta() {
  return [{ title: "Settings - IINA Emby" }];
}

export default function SettingsRoute() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader onBack={() => navigate("/")} backTitle="Back" className={styles.pageHeader} title="Settings" />

      <div className={styles.container}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Server & Diagnostics</h2>
          <div className={styles.card}>
            <button type="button" className={styles.rowButton} onClick={() => navigate("/system-info")}>
              <div className={styles.rowLeft}>
                <span className={styles.rowIcon}>
                  <IconServer size={18} />
                </span>
                <div className={styles.textGroup}>
                  <span className={styles.rowTitle}>System Information</span>
                  <span className={styles.rowSubtitle}>View server version, network endpoints, and user permissions</span>
                </div>
              </div>
              <IconChevronRight size={16} className={styles.chevron} />
            </button>
          </div>
        </section>

        <LibraryScan />
      </div>
    </>
  );
}
