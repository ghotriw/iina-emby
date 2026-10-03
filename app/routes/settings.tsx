import { useNavigate } from "react-router";
import { PageHeader } from "~/components/PageHeader";
import { SystemInfo } from "~/components/SystemInfo";
import styles from "./settings.module.css";

export function meta() {
  return [{ title: "Settings - IINA Emby" }];
}

export default function SettingsRoute() {
  const navigate = useNavigate();

  const onBack = () => {
    navigate("/");
  };

  return (
    <>
      <PageHeader onBack={onBack} backTitle="Back" className={styles.pageHeader} title="Settings" />

      <div className={styles.container}>
        <SystemInfo />
      </div>
    </>
  );
}
