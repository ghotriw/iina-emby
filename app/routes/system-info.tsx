import { useNavigate } from "react-router";
import { PageHeader } from "~/components/PageHeader";
import { SystemInfo } from "~/components/SystemInfo";
import styles from "./system-info.module.css";

export function meta() {
  return [{ title: "System Info - IINA Emby" }];
}

export default function SystemInfoRoute() {
  const navigate = useNavigate();

  const onBack = () => {
    navigate("/");
  };

  return (
    <>
      <PageHeader onBack={onBack} backTitle="Back" className={styles.pageHeader} title="System Info" />

      <div className={styles.container}>
        <SystemInfo />
      </div>
    </>
  );
}
